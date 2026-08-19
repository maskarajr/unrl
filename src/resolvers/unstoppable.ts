import { createPublicClient, http, namehash } from "viem";
import { mainnet, polygon } from "viem/chains";
import type {
  IResolver,
  ResolverForwardResult,
  ResolverReverseResult,
  SupportedTLD,
} from "../types";
import { firstUsableEvmAddress, nonempty } from "../utils/address";
import { extractTLD, hasNameAndTld } from "../utils/tld";
import { firstSuccessful } from "../utils/first-successful";

const UD_API = "https://api.unstoppabledomains.com/resolve";

export function unstoppableDomainUrl(name: string): string {
  return `${UD_API}/domains/${encodeURIComponent(name)}`;
}

export function unstoppableReverseUrl(address: string): string {
  return `${UD_API}/reverse/${encodeURIComponent(address)}`;
}

const UD_PROFILE = "https://api.unstoppabledomains.com/profile/resolve";

/** Public profile reverse — no API key. Resolution `/reverse` needs a key. */
export function unstoppableProfileReverseUrl(address: string): string {
  return `${UD_PROFILE}/${encodeURIComponent(address)}`;
}

export function parseUdReverseDomain(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const obj = data as Record<string, unknown>;

  if (typeof obj.domain === "string") return nonempty(obj.domain);
  if (typeof obj.name === "string") return nonempty(obj.name);

  const meta = obj.meta;
  if (meta && typeof meta === "object") {
    const domain = (meta as Record<string, unknown>).domain;
    if (typeof domain === "string") return nonempty(domain);
  }

  const inner = obj.data;
  if (Array.isArray(inner)) {
    for (const item of inner) {
      const found = parseUdReverseDomain(item);
      if (found) return found;
    }
  } else if (inner && typeof inner === "object") {
    return parseUdReverseDomain(inner);
  }

  return null;
}

export function isUnstoppableName(name: string): boolean {
  const tld = extractTLD(name);
  return hasNameAndTld(name) && UD_TLDS.includes(tld as SupportedTLD);
}

export function udApiNameMatches(
  requested: string,
  claimed: string | null | undefined
): boolean {
  if (!claimed) return false;
  return claimed.toLowerCase().trim() === requested.toLowerCase().trim();
}
const ZERO = "0x0000000000000000000000000000000000000000";

const POLYGON_PROXY_READER =
  "0xa3f32c8cd786dc089bd1fc175f2707223aee5d00" as const;
const ETH_PROXY_READER =
  "0x1BDc0fD4fbABeed3E611fd6195fCd5d41dcEF393" as const;

const RECORD_KEYS = ["crypto.ETH.address", "crypto.MATIC.address"] as const;

const proxyReaderAbi = [
  {
    name: "getData",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "keys", type: "string[]" },
      { name: "tokenId", type: "uint256" },
    ],
    outputs: [
      { name: "resolver", type: "address" },
      { name: "owner", type: "address" },
      { name: "values", type: "string[]" },
    ],
  },
] as const;

const UD_TLDS: SupportedTLD[] = [
  "crypto",
  "wallet",
  "nft",
  "x",
  "polygon",
  "dao",
  "888",
  "blockchain",
];

interface UDResolveResponse {
  records: Record<string, string>;
  meta: {
    domain: string;
    owner: string | null;
  };
}

export class UnstoppableResolver implements IResolver {
  name = "unstoppable" as const;
  supportedTLDs = UD_TLDS;

  private apiKey?: string;
  private polygonClient;
  private ethClient;

  constructor(apiKey?: string, rpcUrl?: string) {
    this.apiKey = apiKey;
    this.polygonClient = createPublicClient({
      chain: polygon,
      transport: http(),
    });
    this.ethClient = createPublicClient({
      chain: mainnet,
      transport: rpcUrl ? http(rpcUrl) : http(),
    });
  }

  async resolve(name: string): Promise<ResolverForwardResult> {
    if (this.apiKey) {
      const fromApi = await this.resolveViaApi(name);
      if (fromApi) {
        return {
          name,
          address: fromApi,
          resolver: "unstoppable",
          ttl: 10 * 60 * 1000,
        };
      }
    }

    try {
      const address = await this.resolveOnChain(name);
      return {
        name,
        address,
        resolver: "unstoppable",
        ttl: address ? 10 * 60 * 1000 : 0,
      };
    } catch {
      return { name, address: null, resolver: "unstoppable", ttl: 0 };
    }
  }

  async reverseResolve(address: string): Promise<ResolverReverseResult> {
    const empty: ResolverReverseResult = {
      address,
      name: null,
      resolver: "unstoppable",
    };

    const fromProfile = await this.reverseViaProfile(address);
    if (fromProfile) return { address, name: fromProfile, resolver: "unstoppable" };

    if (!this.apiKey) return empty;

    try {
      const res = await fetch(unstoppableReverseUrl(address), {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
      });
      if (!res.ok) return empty;
      const data: unknown = await res.json();
      const domain = parseUdReverseDomain(data);
      if (!domain || !isUnstoppableName(domain)) return empty;
      return { address, name: domain, resolver: "unstoppable" };
    } catch {
      return empty;
    }
  }

  private async reverseViaProfile(address: string): Promise<string | null> {
    try {
      const res = await fetch(unstoppableProfileReverseUrl(address), {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) return null;
      const data: unknown = await res.json();
      const domain = parseUdReverseDomain(data);
      if (!domain || !isUnstoppableName(domain)) return null;
      return domain;
    } catch {
      return null;
    }
  }

  private async resolveViaApi(name: string): Promise<string | null | undefined> {
    try {
      const res = await fetch(unstoppableDomainUrl(name), {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
      });
      if (!res.ok) return undefined;

      const data = (await res.json()) as UDResolveResponse;
      if (!udApiNameMatches(name, data.meta?.domain)) return undefined;

      return firstUsableEvmAddress(
        data.records["crypto.ETH.address"],
        data.records["crypto.MATIC.address"]
      );
    } catch {
      return undefined;
    }
  }

  private async resolveOnChain(name: string): Promise<string | null> {
    const tokenId = BigInt(namehash(name));
    return firstSuccessful([
      () => this.readProxy(this.polygonClient, POLYGON_PROXY_READER, tokenId),
      () => this.readProxy(this.ethClient, ETH_PROXY_READER, tokenId),
    ]);
  }

  private async readProxy(
    client: typeof this.polygonClient | typeof this.ethClient,
    address: `0x${string}`,
    tokenId: bigint
  ): Promise<string | null> {
    const [, owner, values] = await client.readContract({
      address,
      abi: proxyReaderAbi,
      functionName: "getData",
      args: [[...RECORD_KEYS], tokenId],
    });

    if (owner.toLowerCase() === ZERO) return null;

    return firstUsableEvmAddress(values[0], values[1]);
  }
}
