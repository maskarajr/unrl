import type { IResolver, ResolverForwardResult, ResolverReverseResult } from "../types";
import { nonempty, isSolanaAddress } from "../utils/address";

const SNS_API = "https://sdk-proxy-v2.sns.id";

interface SnsPrimary {
  reverse?: string;
}

interface SnsEnvelope {
  s?: string;
  result?: string | SnsPrimary | null;
}

function snsPrimaryLabel(result: SnsEnvelope["result"]): string | null {
  if (typeof result === "string") return nonempty(result);
  if (result && typeof result === "object") return nonempty(result.reverse);
  return null;
}

export class SNSResolver implements IResolver {
  name = "sns" as const;
  supportedTLDs = ["sol"] as const;

  private rpcUrl?: string;

  constructor(rpcUrl?: string) {
    this.rpcUrl = rpcUrl;
  }

  private endpoint(path: string): string {
    const url = new URL(path, `${SNS_API}/`);
    if (this.rpcUrl) url.searchParams.set("rpc", this.rpcUrl);
    return url.toString();
  }

  async resolve(name: string): Promise<ResolverForwardResult> {
    try {
      const res = await fetch(this.endpoint(`resolve/${encodeURIComponent(name)}`));
      if (!res.ok) throw new Error("SNS resolve failed");

      const data = (await res.json()) as SnsEnvelope;
      if (data.s !== "ok") throw new Error("SNS resolve error");

      const address =
        typeof data.result === "string" && isSolanaAddress(data.result)
          ? data.result.trim()
          : null;
      return {
        name,
        address,
        resolver: "sns",
        ttl: address ? 5 * 60 * 1000 : 0,
      };
    } catch {
      return { name, address: null, resolver: "sns", ttl: 0 };
    }
  }

  async reverseResolve(address: string): Promise<ResolverReverseResult> {
    try {
      const res = await fetch(
        this.endpoint(`primary-domain/${encodeURIComponent(address)}`)
      );
      if (!res.ok) throw new Error("SNS reverse lookup failed");

      const data = (await res.json()) as SnsEnvelope;
      if (data.s !== "ok") throw new Error("SNS reverse error");

      const rawName = snsPrimaryLabel(data.result);
      return {
        address,
        name: rawName
          ? rawName.endsWith(".sol")
            ? rawName
            : `${rawName}.sol`
          : null,
        resolver: "sns",
      };
    } catch {
      return { address, name: null, resolver: "sns" };
    }
  }
}
