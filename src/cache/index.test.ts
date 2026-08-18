import { afterEach, describe, expect, it, vi } from "vitest";
import { TTLCache } from "./index";

describe("TTLCache", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns stored value before expiry", () => {
    const cache = new TTLCache<string>();
    cache.set("k", "v", 1000);
    expect(cache.get("k")).toBe("v");
    expect(cache.size).toBe(1);
  });

  it("returns null for missing key", () => {
    const cache = new TTLCache<string>();
    expect(cache.get("missing")).toBeNull();
  });

  it("expires entries after ttl", () => {
    vi.useFakeTimers();
    const cache = new TTLCache<string>();
    cache.set("k", "v", 1000);
    vi.advanceTimersByTime(1001);
    expect(cache.get("k")).toBeNull();
    expect(cache.size).toBe(0);
  });

  it("delete and clear remove entries", () => {
    const cache = new TTLCache<number>();
    cache.set("a", 1, 60_000);
    cache.set("b", 2, 60_000);
    cache.delete("a");
    expect(cache.get("a")).toBeNull();
    expect(cache.get("b")).toBe(2);
    cache.clear();
    expect(cache.get("b")).toBeNull();
    expect(cache.size).toBe(0);
  });

  it("evicts the oldest entry when over maxSize", () => {
    const cache = new TTLCache<string>(2);
    cache.set("a", "1", 60_000);
    cache.set("b", "2", 60_000);
    cache.set("c", "3", 60_000);
    expect(cache.get("a")).toBeNull();
    expect(cache.get("b")).toBe("2");
    expect(cache.get("c")).toBe("3");
    expect(cache.size).toBe(2);
  });
});
