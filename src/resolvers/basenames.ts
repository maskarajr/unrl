import { createPublicClient, http } from "viem";
import { base, mainnet } from "viem/chains";
import { normalize } from "viem/ens";
import type { IResolver, ResolvedName, ReverseResolvedName } from "../types";
import { nonempty } from "../utils/address";

/** User-facing `.base` names are ENS names `*.base.eth` on L1. */
function toBaseEnsName(name: string): string {
  if (name.endsWith(".base.eth")) return name;
  if (name.endsWith(".base")) return `${name}.eth`;
  return name;
}

/** Base L2 reverse registrar + L2Resolver (Basenames primary, not L1 getEnsName). */
const L2_REVERSE_REGISTRAR =
  "0x79ea96012eea67a83431f1701b3dff7e37f9e282" as const;
const L2_RESOLVER = "0xC6d566A56A1aFf6508b41f6c90ff131615583BCD" as const;

const reverseRegistrarAbi = [
  {
    name: "node",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "addr", type: "address" }],
    outputs: [{ type: "bytes32" }],
  },
] as const;

const l2ResolverAbi = [
  {
    name: "name",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "node", type: "bytes32" }],
    outputs: [{ type: "string" }],
  },
] as const;

export class BaseNamesResolver implements IResolver {
  name = "basenames" as const;
  supportedTLDs = ["base"] as const;

  private l1Client;
  private baseClient;

  constructor(rpcUrl?: string) {
    this.l1Client = createPublicClient({
      chain: mainnet,
      transport: rpcUrl ? http(rpcUrl) : http(),
    });
    this.baseClient = createPublicClient({
      chain: base,
      transport: http(),
    });
  }

  async resolve(name: string): Promise<ResolvedName> {
    try {
      const address = await this.l1Client.getEnsAddress({
        name: normalize(toBaseEnsName(name)),
      });

      return {
        name,
        address: address ?? null,
        resolver: "basenames",
        ttl: address ? 5 * 60 * 1000 : 0,
      };
    } catch {
      return { name, address: null, resolver: "basenames", ttl: 0 };
    }
  }

  async reverseResolve(address: string): Promise<ReverseResolvedName> {
    const empty: ReverseResolvedName = {
      address,
      name: null,
      resolver: "basenames",
    };
    try {
      const node = await this.baseClient.readContract({
        address: L2_REVERSE_REGISTRAR,
        abi: reverseRegistrarAbi,
        functionName: "node",
        args: [address as `0x${string}`],
      });
      const resolved = await this.baseClient.readContract({
        address: L2_RESOLVER,
        abi: l2ResolverAbi,
        functionName: "name",
        args: [node],
      });
      return { address, name: nonempty(resolved), resolver: "basenames" };
    } catch {
      return empty;
    }
  }
}
