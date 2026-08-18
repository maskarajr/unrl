import { describe, expect, it } from "vitest";
import {
  firstUsableEvmAddress,
  isSolanaAddress,
  isUsableEvmAddress,
  nonempty,
} from "./address";

const ZERO = "0x0000000000000000000000000000000000000000";
const VITALIK = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";

describe("isUsableEvmAddress", () => {
  it("accepts a 20-byte hex address", () => {
    expect(isUsableEvmAddress(VITALIK)).toBe(true);
  });

  it("rejects zero, empty, and non-hex", () => {
    expect(isUsableEvmAddress(ZERO)).toBe(false);
    expect(isUsableEvmAddress("")).toBe(false);
    expect(isUsableEvmAddress("  ")).toBe(false);
    expect(isUsableEvmAddress(null)).toBe(false);
    expect(isUsableEvmAddress("not-an-address")).toBe(false);
  });
});

describe("firstUsableEvmAddress", () => {
  it("skips zero and empty then returns the first real address", () => {
    expect(firstUsableEvmAddress(ZERO, "", VITALIK)).toBe(VITALIK);
  });

  it("does not use a leftover owner when records are empty", () => {
    expect(firstUsableEvmAddress("", "", ZERO)).toBeNull();
  });
});

describe("nonempty", () => {
  it("turns blank strings into null", () => {
    expect(nonempty("")).toBeNull();
    expect(nonempty("  ")).toBeNull();
    expect(nonempty("86xC")).toBe("86xC");
  });
});

describe("isSolanaAddress", () => {
  it("accepts a known SNS pubkey", () => {
    expect(
      isSolanaAddress("86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY")
    ).toBe(true);
  });

  it("rejects blank, EVM, and non-base58", () => {
    expect(isSolanaAddress("")).toBe(false);
    expect(isSolanaAddress("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045")).toBe(
      false
    );
    expect(isSolanaAddress("not-a-wallet")).toBe(false);
  });
});
