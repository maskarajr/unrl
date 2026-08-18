import type { SupportedTLD } from "../types";

/**
 * Extracts the TLD from a name.
 * e.g. "vitalik.eth" → "eth"
 *      "jesse.base.eth" → "base"
 */
export function extractTLD(name: string): string {
  const normalized = name.toLowerCase().trim();
  if (normalized.endsWith(".base.eth") || normalized === "base.eth") {
    return "base";
  }
  const parts = normalized.split(".");
  return parts[parts.length - 1] ?? "";
}

/**
 * Validates that a name has a supported TLD.
 */
export function isSupportedTLD(tld: string): tld is SupportedTLD {
  const supported: SupportedTLD[] = [
    "eth", "sol", "base",
    "crypto", "wallet", "nft", "x",
    "polygon", "dao", "888", "blockchain",
  ];
  return supported.includes(tld as SupportedTLD);
}

/** True when the name has a label and a TLD (`vitalik.eth`), not a bare suffix (`eth`). */
export function hasNameAndTld(name: string): boolean {
  const normalized = name.toLowerCase().trim();
  const dot = normalized.lastIndexOf(".");
  return dot > 0 && dot < normalized.length - 1;
}

export type NameTypecheck =
  | { ok: true; tld: SupportedTLD }
  | { ok: false; reason: "invalid"; message: "not a valid name" };

/** Runtime check: empty, `.et`, mistyped TLD, bare suffix → not a valid name. */
export function typecheckName(name: string): NameTypecheck {
  const normalized = name.toLowerCase().trim();
  if (!normalized) {
    return { ok: false, reason: "invalid", message: "not a valid name" };
  }
  const tld = extractTLD(normalized);
  if (!hasNameAndTld(normalized) || !isSupportedTLD(tld)) {
    return { ok: false, reason: "invalid", message: "not a valid name" };
  }
  return { ok: true, tld };
}
