import { describe, expect, it } from "vitest";
import { UNRL } from "./unrl";

const unrl = new UNRL({ noCache: true });

const VITALIK = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";

function isEvmAddress(value: string | null): value is string {
  return Boolean(value && /^0x[0-9a-fA-F]{40}$/.test(value));
}

describe("live forward resolve", () => {
  it("resolves vitalik.eth via ENS to the known address", async () => {
    const result = await unrl.resolve("vitalik.eth");
    expect(result.resolver).toBe("ens");
    expect(result.address?.toLowerCase()).toBe(VITALIK.toLowerCase());
  });

  it("resolves a .sol name via SNS to a non-EVM address", async () => {
    const result = await unrl.resolve("toly.sol");
    expect(result.resolver).toBe("sns");
    expect(result.address).toBeTruthy();
    expect(isEvmAddress(result.address)).toBe(false);
  });

  it("resolves a .base name via Base Names to an EVM address", async () => {
    const result = await unrl.resolve("jesse.base");
    expect(result.resolver).toBe("basenames");
    expect(isEvmAddress(result.address)).toBe(true);
  });

  it("resolves brad.crypto via Unstoppable to the known ETH address", async () => {
    const result = await unrl.resolve("brad.crypto");
    expect(result.resolver).toBe("unstoppable");
    expect(result.address?.toLowerCase()).toBe(
      "0x8aad44321a86b170879d7a244c1e8d360c99dda8"
    );
  });
});

describe("live reverse resolve", () => {
  it("reverse-resolves vitalik's address to vitalik.eth", async () => {
    const result = await unrl.reverseResolve(VITALIK);
    expect(result.name?.split(", ").includes("vitalik.eth")).toBe(true);
    expect(result.resolver?.split(", ").includes("ens")).toBe(true);
  });
});

describe("live batch", () => {
  it("resolveMany keeps TLD routing for mixed names", async () => {
    const results = await unrl.resolveMany(["vitalik.eth", "toly.sol"]);
    expect(results.map((r) => r.resolver)).toEqual(["ens", "sns"]);
    expect(results.every((r) => r.address)).toBe(true);
  });
});
