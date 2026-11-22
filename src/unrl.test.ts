import { afterEach, describe, expect, it, vi } from "vitest";
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

const BONFIDA_OWNER = "Fw1ETanDZafof7xEULsnq9UY6o71Tpds89tNwPkWLb1v";
const NO_PRIMARY = "11111111111111111111111111111111";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("UNRL.reverseResolve Solana", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns the SNS primary domain", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        s: "ok",
        result: {
          domain: "AgJujvNQgYESUwBPitq2VUrfTaT2bvueHbgvsxqZ2sHg",
          reverse: "couponvault",
          stale: false,
        },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const unrl = new UNRL({ noCache: true });
    await expect(unrl.reverseResolve(BONFIDA_OWNER)).resolves.toEqual({
      name: "couponvault.sol",
      resolver: "sns",
    });

    const url = String(fetchMock.mock.calls[0]?.[0]);
    expect(url).toContain(`primary-domain/${BONFIDA_OWNER}`);
    expect(url).not.toContain("reverse-lookup");
  });

  it("returns nulls when the wallet has no primary domain", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ s: "ok", result: null }))
    );

    const unrl = new UNRL({ noCache: true });
    await expect(unrl.reverseResolve(NO_PRIMARY)).resolves.toEqual({
      name: null,
      resolver: null,
    });
  });

  it("passes a mixed-case Solana address to SNS unmodified", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes(`primary-domain/${BONFIDA_OWNER}`)) {
        return jsonResponse({ s: "ok", result: { reverse: "couponvault" } });
      }
      return jsonResponse({ s: "error", result: "wrong address" }, 400);
    });
    vi.stubGlobal("fetch", fetchMock);

    const unrl = new UNRL({ noCache: true });
    await expect(unrl.reverseResolve(BONFIDA_OWNER)).resolves.toEqual({
      name: "couponvault.sol",
      resolver: "sns",
    });

    const url = String(fetchMock.mock.calls[0]?.[0]);
    expect(url).toContain(BONFIDA_OWNER);
    expect(url).not.toContain(BONFIDA_OWNER.toLowerCase());
  });

  it("returns nulls for invalid input", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const unrl = new UNRL({ noCache: true });
    await expect(unrl.reverseResolve("not-a-wallet")).resolves.toEqual({
      name: null,
      resolver: null,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
