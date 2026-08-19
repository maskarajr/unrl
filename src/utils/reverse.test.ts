import { describe, expect, it } from "vitest";
import { joinReverseHits } from "./reverse";
import type { ResolverReverseResult, ResolverName } from "../types";

function hit(
  name: string | null,
  resolver: ResolverName | null
): ResolverReverseResult {
  return { address: "0xabc", name, resolver };
}

describe("joinReverseHits", () => {
  it("returns nulls when every module missed", () => {
    expect(joinReverseHits("0xabc", [hit(null, "ens")], () => null)).toEqual({
      address: "0xabc",
      name: null,
      resolver: null,
    });
  });

  it("joins names and resolvers with commas", () => {
    const result = joinReverseHits(
      "0xabc",
      [
        hit("maskarachico.eth", "ens"),
        hit("maskara.base.eth", "basenames"),
        hit("maskara.crypto", "unstoppable"),
      ],
      (name) => {
        if (name.endsWith(".base.eth")) return "basenames";
        if (name.endsWith(".eth")) return "ens";
        return "unstoppable";
      }
    );
    expect(result.name).toBe(
      "maskarachico.eth, maskara.base.eth, maskara.crypto"
    );
    expect(result.resolver).toBe("ens, basenames, unstoppable");
  });

  it("skips duplicate names", () => {
    const result = joinReverseHits(
      "0xabc",
      [hit("foo.eth", "ens"), hit("foo.eth", "basenames")],
      () => "ens"
    );
    expect(result.name).toBe("foo.eth");
    expect(result.resolver).toBe("ens");
  });
});
