import { describe, expectTypeOf, it } from "vitest";
import type { CheckName } from "../types";

describe("CheckName", () => {
  it("allows supported TLD literals", () => {
    expectTypeOf<CheckName<"vitalik.eth">>().toEqualTypeOf<"vitalik.eth">();
    expectTypeOf<CheckName<"jesse.base.eth">>().toEqualTypeOf<"jesse.base.eth">();
    expectTypeOf<CheckName<"toly.sol">>().toEqualTypeOf<"toly.sol">();
  });

  it("flags mistyped or unsupported TLD literals", () => {
    expectTypeOf<CheckName<"vitalik.eh">>().toEqualTypeOf<"Not a valid name: vitalik.eh">();
    expectTypeOf<CheckName<"alice.com">>().toEqualTypeOf<"Not a valid name: alice.com">();
    expectTypeOf<CheckName<".et">>().toEqualTypeOf<"Not a valid name: .et">();
  });

  it("lets opaque strings through for runtime input", () => {
    expectTypeOf<CheckName<string>>().toEqualTypeOf<string>();
  });
});
