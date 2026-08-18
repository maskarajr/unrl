export type SupportedTLD =
  | "eth"       // ENS
  | "sol"       // SNS / Bonfida
  | "base"      // Base Names
  | "crypto"    // Unstoppable Domains
  | "wallet"    // Unstoppable Domains
  | "nft"       // Unstoppable Domains
  | "x"         // Unstoppable Domains
  | "polygon"   // Unstoppable Domains
  | "dao"       // Unstoppable Domains
  | "888"       // Unstoppable Domains
  | "blockchain"; // Unstoppable Domains

export type ResolverName = "ens" | "sns" | "basenames" | "unstoppable";

/** Literal names UNRL accepts (last label is a supported TLD). `foo.base.eth` matches `.eth`. */
export type SupportedName =
  | `${string}.eth`
  | `${string}.sol`
  | `${string}.base`
  | `${string}.crypto`
  | `${string}.wallet`
  | `${string}.nft`
  | `${string}.x`
  | `${string}.polygon`
  | `${string}.dao`
  | `${string}.888`
  | `${string}.blockchain`;

/**
 * Compile-time TLD check for string literals. Opaque `string` (user input) still allowed.
 * Mistyped suffix becomes `Not a valid name: …` so `resolve("vitalik.eh")` fails typecheck.
 */
export type CheckName<T extends string> = string extends T
  ? T
  : T extends SupportedName
    ? T
    : `Not a valid name: ${T}`;

export interface ResolvedName {
  /** The input name that was resolved */
  name: string;
  /** The resolved wallet address */
  address: string | null;
  /** Which resolver handled this. Null when no module ran. */
  resolver: ResolverName | null;
  /** How long to cache this result (ms) */
  ttl: number;
}

export interface ReverseResolvedName {
  /** The input address that was reverse-resolved */
  address: string;
  /** Primary name(s), comma-separated when several namespaces hit */
  name: string | null;
  /** Matching resolver(s), comma-separated in the same order as name */
  resolver: string | null;
}

export interface ResolverConfig {
  /** RPC URL for EVM chains */
  rpcUrl?: string;
  /** Solana RPC URL */
  solanaRpcUrl?: string;
  /** Unstoppable Domains API key (optional — falls back to on-chain) */
  udApiKey?: string;
  /** Cache TTL in ms. Default: 5 minutes */
  cacheTtl?: number;
  /** Disable cache entirely */
  noCache?: boolean;
}

export interface IResolver {
  name: ResolverName;
  supportedTLDs: readonly SupportedTLD[];
  resolve(name: string): Promise<ResolvedName>;
  reverseResolve?(address: string): Promise<ReverseResolvedName>;
}
