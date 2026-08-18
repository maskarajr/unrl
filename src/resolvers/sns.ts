import type { IResolver, ResolvedName, ReverseResolvedName } from "../types";
import { nonempty, isSolanaAddress } from "../utils/address";

const SNS_API = "https://sdk-proxy-v2.sns.id";

interface SnsEnvelope {
  s?: string;
  result?: string;
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

  async resolve(name: string): Promise<ResolvedName> {
    try {
      const res = await fetch(this.endpoint(`resolve/${encodeURIComponent(name)}`));
      if (!res.ok) throw new Error("SNS resolve failed");

      const data = (await res.json()) as SnsEnvelope;
      if (data.s !== "ok") throw new Error("SNS resolve error");

      const address = isSolanaAddress(data.result) ? data.result.trim() : null;
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

  async reverseResolve(address: string): Promise<ReverseResolvedName> {
    try {
      const res = await fetch(
        this.endpoint(`reverse-lookup/${encodeURIComponent(address)}`)
      );
      if (!res.ok) throw new Error("SNS reverse lookup failed");

      const data = (await res.json()) as SnsEnvelope;
      if (data.s !== "ok") throw new Error("SNS reverse error");

      const rawName = nonempty(data.result);
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
