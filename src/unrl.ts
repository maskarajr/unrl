import { TTLCache } from "./cache";
import { ENSResolver } from "./resolvers/ens";
import { SNSResolver } from "./resolvers/sns";
import { BaseNamesResolver } from "./resolvers/basenames";
import { UnstoppableResolver } from "./resolvers/unstoppable";
import type {
  CheckName,
  IResolver,
  ResolvedName,
  ReverseResolvedName,
  ResolverConfig,
  ResolverName,
  SupportedTLD,
} from "./types";
import { joinReverseHits } from "./utils/reverse";
import { extractTLD, hasNameAndTld, isSupportedTLD } from "./utils/tld";

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

export class UNRL {
  private resolvers: Map<SupportedTLD, IResolver> = new Map();
  private cache: TTLCache<ResolvedName>;
  private reverseCache: TTLCache<ReverseResolvedName>;
  private noCache: boolean;
  private cacheTtl: number;

  constructor(config: ResolverConfig = {}) {
    this.noCache = config.noCache ?? false;
    this.cacheTtl = config.cacheTtl ?? DEFAULT_TTL;
    this.cache = new TTLCache<ResolvedName>(1024);
    this.reverseCache = new TTLCache<ReverseResolvedName>(1024);

    // Register all resolvers
    const resolvers: IResolver[] = [
      new ENSResolver(config.rpcUrl),
      new SNSResolver(config.solanaRpcUrl),
      new BaseNamesResolver(config.rpcUrl),
      new UnstoppableResolver(config.udApiKey, config.rpcUrl),
    ];

    for (const resolver of resolvers) {
      for (const tld of resolver.supportedTLDs) {
        this.resolvers.set(tld as SupportedTLD, resolver);
      }
    }
  }

  /**
   * Resolve a human-readable name to a wallet address.
   *
   * @example
   * const unrl = new UNRL();
   * await unrl.resolve("vitalik.eth");   // → { address: "0xd8dA...", resolver: "ens" }
   * await unrl.resolve("toly.sol");      // → { address: "7...", resolver: "sns" }
   * await unrl.resolve("jesse.base");    // → { address: "0x...", resolver: "basenames" }
   * await unrl.resolve("brad.crypto");   // → { address: "0x...", resolver: "unstoppable" }
   */
  async resolve<T extends string>(name: CheckName<T>): Promise<ResolvedName> {
    const normalized = String(name).toLowerCase().trim();
    const cacheKey = `fwd:${normalized}`;

    if (!this.noCache) {
      const cached = this.cache.get(cacheKey);
      if (cached) return cached;
    }

    const tld = extractTLD(normalized);

    if (!hasNameAndTld(normalized) || !isSupportedTLD(tld)) {
      return {
        name: normalized,
        address: null,
        resolver: null,
        ttl: 0,
      };
    }

    const resolver = this.resolvers.get(tld);

    if (!resolver) {
      return { name: normalized, address: null, resolver: null, ttl: 0 };
    }

    const result = await resolver.resolve(normalized);

    if (!this.noCache && result.ttl > 0) {
      this.cache.set(cacheKey, result, Math.min(result.ttl, this.cacheTtl));
    }

    return result;
  }

  /**
   * Reverse resolve a wallet address to human-readable names.
   * Queries ENS, Base Names, and Unstoppable in parallel.
   *
   * @example
   * await unrl.reverseResolve("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045");
   * // → { name: "vitalik.eth", resolver: "ens" }
   * // several hits → "foo.eth, foo.base.eth", "ens, basenames"
   */
  async reverseResolve(
    address: string
  ): Promise<ReverseResolvedName> {
    const normalized = address.toLowerCase().trim();
    const cacheKey = `rev:${normalized}`;

    if (!this.noCache) {
      const cached = this.reverseCache.get(cacheKey);
      if (cached) return cached;
    }

    const empty: ReverseResolvedName = {
      address,
      name: null,
      resolver: null,
    };

    if (!/^0x[0-9a-fA-F]{40}$/.test(normalized)) {
      return empty;
    }

    const byName = new Map<ResolverName, IResolver>();
    for (const resolver of this.resolvers.values()) {
      byName.set(resolver.name, resolver);
    }

    const evmOrder = ["ens", "basenames", "unstoppable"] as const;
    const hits = await Promise.all(
      evmOrder.map(async (resolverName) => {
        const resolver = byName.get(resolverName);
        if (!resolver?.reverseResolve) {
          return { address, name: null, resolver: resolverName };
        }
        return resolver.reverseResolve(address);
      })
    );

    const joined = joinReverseHits(address, hits, (name) =>
      this.whichResolver(name)
    );

    if (!joined.name) return empty;

    if (!this.noCache) {
      this.reverseCache.set(cacheKey, joined, this.cacheTtl);
    }
    return joined;
  }

  /**
   * Resolve multiple names in parallel.
   */
  async resolveMany<T extends string>(
    names: CheckName<T>[]
  ): Promise<ResolvedName[]> {
    return Promise.all(names.map((n) => this.resolve(n)));
  }

  /**
   * Check which resolver will handle a given name.
   */
  whichResolver(name: string): ResolverName | null {
    const normalized = name.toLowerCase().trim();
    const tld = extractTLD(normalized);
    if (!hasNameAndTld(normalized) || !isSupportedTLD(tld)) return null;
    return this.resolvers.get(tld)?.name ?? null;
  }

  /** Clear the resolution cache. */
  clearCache(): void {
    this.cache.clear();
    this.reverseCache.clear();
  }
}
