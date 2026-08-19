import { describe, expect, it } from "vitest";
import { UNRL } from "./unrl";

describe("UNRL.whichResolver", () => {
  const unrl = new UNRL({ noCache: true });

  it("routes by TLD", () => {
    expect(unrl.whichResolver("vitalik.eth")).toBe("ens");
    expect(unrl.whichResolver("toly.sol")).toBe("sns");
    expect(unrl.whichResolver("jesse.base")).toBe("basenames");
    expect(unrl.whichResolver("jesse.base.eth")).toBe("basenames");
    expect(unrl.whichResolver("brad.crypto")).toBe("unstoppable");
    expect(unrl.whichResolver("alice.wallet")).toBe("unstoppable");
  });

  it("normalizes case and whitespace", () => {
    expect(unrl.whichResolver("  Toly.SOL  ")).toBe("sns");
  });

  it("returns null for unsupported TLD", () => {
    expect(unrl.whichResolver("vitalik.xyz" as string)).toBeNull();
    expect(unrl.whichResolver("no-tld" as string)).toBeNull();
    expect(unrl.whichResolver("eth" as string)).toBeNull();
    expect(unrl.whichResolver("base" as string)).toBeNull();
  });
});

describe("UNRL.resolve unsupported names", () => {
  const unrl = new UNRL({ noCache: true });

  it("does not call a chain resolver", async () => {
    const result = await unrl.resolve("unknown.xyz" as string);
    expect(result).toEqual({
      address: null,
      resolver: null,
    });
  });

  it("normalizes name on miss", async () => {
    const result = await unrl.resolve("  Foo.COM  " as string);
    expect(result).toEqual({ address: null, resolver: null });
  });

  it("does not treat a bare TLD as a name", async () => {
    const result = await unrl.resolve("eth" as string);
    expect(result).toEqual({ address: null, resolver: null });
  });
});

describe("UNRL.reverseResolve misses", () => {
  const unrl = new UNRL({ noCache: true });

  it("does not label a miss as ens", async () => {
    const result = await unrl.reverseResolve("not-a-wallet");
    expect(result).toEqual({ name: null, resolver: null });
  });
});
