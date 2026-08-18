import { describe, expect, it } from "vitest";
import { firstSuccessful } from "./first-successful";

describe("firstSuccessful", () => {
  it("skips thrown attempts and uses the next value", async () => {
    const result = await firstSuccessful([
      async () => {
        throw new Error("polygon down");
      },
      async () => "0xabc",
    ]);
    expect(result).toBe("0xabc");
  });

  it("skips null and uses the next value", async () => {
    const result = await firstSuccessful([async () => null, async () => "ok"]);
    expect(result).toBe("ok");
  });
});
