const ZERO = "0x0000000000000000000000000000000000000000";

export function isUsableEvmAddress(
  value: string | null | undefined
): value is string {
  if (!value) return false;
  const trimmed = value.trim();
  if (!/^0x[0-9a-fA-F]{40}$/.test(trimmed)) return false;
  return trimmed.toLowerCase() !== ZERO;
}

export function firstUsableEvmAddress(
  ...candidates: (string | null | undefined)[]
): string | null {
  for (const candidate of candidates) {
    if (isUsableEvmAddress(candidate)) return candidate.trim();
  }
  return null;
}

export function nonempty(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

const BASE58 = /^[1-9A-HJ-NP-Za-km-z]+$/;

/** Solana ed25519 pubkeys encode to 32–44 base58 characters. */
export function isSolanaAddress(value: string | null | undefined): value is string {
  const trimmed = nonempty(value);
  if (!trimmed) return false;
  if (trimmed.length < 32 || trimmed.length > 44) return false;
  return BASE58.test(trimmed);
}
