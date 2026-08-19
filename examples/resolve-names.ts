/**
 * Real usage: paste a name, get address + which module.
 * In-repo: npx tsx examples/resolve-names.ts
 * App:     import { UNRL } from "@maskarajr/unrl"
 */
import { UNRL } from "../src/index.ts";

const unrl = new UNRL({
  noCache: true,
  // udApiKey: process.env.UD_API_KEY,
});

const names = ["vitalik.eth", "toly.sol", "jesse.base", "brad.crypto"];

for (const name of names) {
  const { address, resolver } = await unrl.resolve(name);
  console.log(name, "→", resolver, address);
}

const reverse = await unrl.reverseResolve(
  "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
);
console.log("reverse", reverse);
