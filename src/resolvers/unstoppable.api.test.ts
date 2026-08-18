import { describe, expect, it } from "vitest";
import {
  isUnstoppableName,
  parseUdReverseDomain,
  udApiNameMatches,
  unstoppableDomainUrl,
  unstoppableProfileReverseUrl,
  unstoppableReverseUrl,
} from "../resolvers/unstoppable";

describe("unstoppableDomainUrl", () => {
  it("encodes the domain as a single path segment", () => {
    const url = unstoppableDomainUrl("foo?extra=ignored.crypto");
    expect(url).toContain("/domains/foo%3Fextra%3Dignored.crypto");
    expect(url.includes("/domains/foo?")).toBe(false);
  });
});

describe("udApiNameMatches", () => {
  it("requires claimed domain to equal the request", () => {
    expect(udApiNameMatches("brad.crypto", "brad.crypto")).toBe(true);
    expect(udApiNameMatches("Brad.Crypto", "brad.crypto")).toBe(true);
    expect(udApiNameMatches("evil.crypto", "brad.crypto")).toBe(false);
    expect(udApiNameMatches("brad.crypto", undefined)).toBe(false);
  });
});

describe("unstoppableReverseUrl", () => {
  it("encodes the address as one path segment", () => {
    const url = unstoppableReverseUrl("0xabc/../evil");
    expect(url).toContain("/reverse/0xabc%2F..%2Fevil");
    expect(url.includes("/reverse/0xabc/")).toBe(false);
  });
});

describe("unstoppableProfileReverseUrl", () => {
  it("encodes the address as one path segment", () => {
    const url = unstoppableProfileReverseUrl("0xabc/../evil");
    expect(url).toContain("/profile/resolve/0xabc%2F..%2Fevil");
  });
});

describe("parseUdReverseDomain", () => {
  it("reads domain from nested UD reverse payloads", () => {
    expect(parseUdReverseDomain({ domain: "brad.crypto" })).toBe("brad.crypto");
    expect(parseUdReverseDomain({ name: "maskarachico.nft" })).toBe(
      "maskarachico.nft"
    );
    expect(
      parseUdReverseDomain({ meta: { domain: "brad.crypto" } })
    ).toBe("brad.crypto");
    expect(
      parseUdReverseDomain({ data: { meta: { domain: "brad.crypto" } } })
    ).toBe("brad.crypto");
    expect(parseUdReverseDomain({ meta: {} })).toBeNull();
  });
});

describe("isUnstoppableName", () => {
  it("accepts UD TLDs and rejects ENS", () => {
    expect(isUnstoppableName("maskarachico.nft")).toBe(true);
    expect(isUnstoppableName("vitalik.eth")).toBe(false);
  });
});
