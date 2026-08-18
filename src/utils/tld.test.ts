import { describe, expect, it } from "vitest";
import { extractTLD, hasNameAndTld, isSupportedTLD, typecheckName } from "./tld";

describe("extractTLD", () => {
  it("returns suffix after last dot", () => {
    expect(extractTLD("vitalik.eth")).toBe("eth");
    expect(extractTLD("toly.sol")).toBe("sol");
    expect(extractTLD("sub.jesse.base")).toBe("base");
    expect(extractTLD("jesse.base.eth")).toBe("base");
    expect(extractTLD("base.eth")).toBe("base");
  });

  it("lowercases and trims", () => {
    expect(extractTLD("  Vitalik.ETH  ")).toBe("eth");
  });

  it("returns whole string when no dot", () => {
    expect(extractTLD("eth")).toBe("eth");
    expect(extractTLD("")).toBe("");
  });
});

describe("isSupportedTLD", () => {
  it("accepts known TLDs", () => {
    expect(isSupportedTLD("eth")).toBe(true);
    expect(isSupportedTLD("sol")).toBe(true);
    expect(isSupportedTLD("base")).toBe(true);
    expect(isSupportedTLD("crypto")).toBe(true);
    expect(isSupportedTLD("wallet")).toBe(true);
    expect(isSupportedTLD("nft")).toBe(true);
    expect(isSupportedTLD("x")).toBe(true);
    expect(isSupportedTLD("polygon")).toBe(true);
    expect(isSupportedTLD("dao")).toBe(true);
    expect(isSupportedTLD("888")).toBe(true);
    expect(isSupportedTLD("blockchain")).toBe(true);
  });

  it("rejects unknown TLDs", () => {
    expect(isSupportedTLD("xyz")).toBe(false);
    expect(isSupportedTLD("com")).toBe(false);
    expect(isSupportedTLD("")).toBe(false);
  });
});

describe("hasNameAndTld", () => {
  it("requires a label before the TLD", () => {
    expect(hasNameAndTld("vitalik.eth")).toBe(true);
    expect(hasNameAndTld("jesse.base.eth")).toBe(true);
    expect(hasNameAndTld("eth")).toBe(false);
    expect(hasNameAndTld("base")).toBe(false);
    expect(hasNameAndTld(".eth")).toBe(false);
  });
});

describe("typecheckName", () => {
  it("accepts a labeled supported TLD", () => {
    expect(typecheckName("vitalik.eth")).toEqual({ ok: true, tld: "eth" });
    expect(typecheckName("jesse.base.eth")).toEqual({ ok: true, tld: "base" });
  });

  it("rejects empty, bare suffix, and mistyped TLD", () => {
    const invalid = {
      ok: false,
      reason: "invalid",
      message: "not a valid name",
    } as const;
    expect(typecheckName("")).toEqual(invalid);
    expect(typecheckName(".et")).toEqual(invalid);
    expect(typecheckName("eth")).toEqual(invalid);
    expect(typecheckName("vitalik.eh")).toEqual(invalid);
    expect(typecheckName("alice.com")).toEqual(invalid);
  });
});
