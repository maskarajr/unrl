import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";
import { normalize } from "viem/ens";
import type { IResolver, ResolverForwardResult, ResolverReverseResult } from "../types";

export class ENSResolver implements IResolver {
  name = "ens" as const;
  supportedTLDs = ["eth"] as const;

  private client;

  constructor(rpcUrl?: string) {
    this.client = createPublicClient({
      chain: mainnet,
      transport: rpcUrl ? http(rpcUrl) : http(),
    });
  }

  async resolve(name: string): Promise<ResolverForwardResult> {
    try {
      const address = await this.client.getEnsAddress({
        name: normalize(name),
      });
      return {
        name,
        address: address ?? null,
        resolver: "ens",
        ttl: address ? 5 * 60 * 1000 : 0,
      };
    } catch {
      return { name, address: null, resolver: "ens", ttl: 0 };
    }
  }

  async reverseResolve(address: string): Promise<ResolverReverseResult> {
    try {
      const resolved = await this.client.getEnsName({
        address: address as `0x${string}`,
      });
      return { address, name: resolved ?? null, resolver: "ens" };
    } catch {
      return { address, name: null, resolver: "ens" };
    }
  }
}
