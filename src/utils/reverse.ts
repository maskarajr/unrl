import type { ResolverReverseResult, ResolverName } from "../types";

const JOIN = ", ";

export function joinReverseHits(
  address: string,
  hits: ResolverReverseResult[],
  label: (name: string) => ResolverName | null
): ResolverReverseResult {
  const names: string[] = [];
  const resolvers: string[] = [];
  const seen = new Set<string>();

  for (const hit of hits) {
    const name = hit.name?.trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    names.push(name);
    resolvers.push(label(name) ?? hit.resolver ?? "unknown");
  }

  if (names.length === 0) {
    return { address, name: null, resolver: null };
  }

  return {
    address,
    name: names.join(JOIN),
    resolver: resolvers.join(JOIN),
  };
}
