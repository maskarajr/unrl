import { afterEach, describe, expect, it, vi } from "vitest";
import { SNSResolver } from "./sns";

const BONFIDA_OWNER = "Fw1ETanDZafof7xEULsnq9UY6o71Tpds89tNwPkWLb1v";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("SNSResolver.resolve", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("hits v2 /resolve with .sns and parses an owner pubkey", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ s: "ok", result: BONFIDA_OWNER })
    );
    vi.stubGlobal("fetch", fetchMock);

    const sns = new SNSResolver();
    await expect(sns.resolve("bonfida.sol")).resolves.toEqual({
      name: "bonfida.sol",
      address: BONFIDA_OWNER,
      resolver: "sns",
      ttl: 5 * 60 * 1000,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
      "https://sdk-proxy-v2.sns.id/resolve/bonfida.sns"
    );
  });

  it("returns a miss when result is null", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ s: "ok", result: null }))
    );

    const sns = new SNSResolver();
    await expect(sns.resolve("ghost.sol")).resolves.toEqual({
      name: "ghost.sol",
      address: null,
      resolver: "sns",
      ttl: 0,
    });
  });

  it("returns a miss on Domain not found", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({ s: "error", result: "Domain not found" }, 404)
      )
    );

    const sns = new SNSResolver();
    await expect(sns.resolve("nope.sol")).resolves.toEqual({
      name: "nope.sol",
      address: null,
      resolver: "sns",
      ttl: 0,
    });
  });

  it("returns a miss on Unsupported TLD error envelope", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ s: "error", result: "Unsupported TLD" }, 400)
    );
    vi.stubGlobal("fetch", fetchMock);

    const sns = new SNSResolver();
    await expect(sns.resolve("bonfida.sol")).resolves.toEqual({
      name: "bonfida.sol",
      address: null,
      resolver: "sns",
      ttl: 0,
    });
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
      "https://sdk-proxy-v2.sns.id/resolve/bonfida.sns"
    );
  });

  it("appends rpc when configured", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ s: "ok", result: BONFIDA_OWNER })
    );
    vi.stubGlobal("fetch", fetchMock);

    const rpc = "https://api.mainnet-beta.solana.com";
    const sns = new SNSResolver(rpc);
    await sns.resolve("toly.sol");

    const url = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(url.origin + url.pathname).toBe(
      "https://sdk-proxy-v2.sns.id/resolve/toly.sns"
    );
    expect(url.searchParams.get("rpc")).toBe(rpc);
  });
});
