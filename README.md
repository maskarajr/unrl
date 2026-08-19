# UNRL — Universal Naming Resolution Layer

[![CI](https://github.com/maskarajr/unrl/actions/workflows/ci.yml/badge.svg)](https://github.com/maskarajr/unrl/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@maskarajr/unrl.svg)](https://www.npmjs.com/package/@maskarajr/unrl)

> One call. Name → address. TLD picks the module.

**Status: `0.1.x` preview.** Thin TypeScript SDK — not a full identity/profile layer. Paste a name, get `{ address, resolver }`. Missing on-chain records → `address: null`. Unknown TLD / reverse miss → `resolver: null`.

Install: [`@maskarajr/unrl`](https://www.npmjs.com/package/@maskarajr/unrl) (unscoped `unrl` is blocked on npm as too similar to existing names).

## Supported namespaces

| TLD | Module | Address family |
|-----|--------|----------------|
| `.eth` | ENS (viem, Ethereum L1) | EVM |
| `.sol` | SNS / Bonfida (proxy v2) | Solana |
| `.base` | Base Names as `*.base.eth` on L1 | EVM |
| `.crypto` `.wallet` `.nft` `.x` `.polygon` `.dao` `.888` `.blockchain` | Unstoppable (on-chain ProxyReader; optional API key) | EVM |

## Install

```bash
npm install @maskarajr/unrl
```

Package is preview. Pin a version. Do not treat this as production identity infrastructure.

## Quick start

```typescript
import { UNRL } from "@maskarajr/unrl";

const unrl = new UNRL();

await unrl.resolve("vitalik.eth");
// { address: "0xd8dA…", resolver: "ens" }

await unrl.resolve("toly.sol");   // resolver: "sns"
await unrl.resolve("jesse.base"); // resolver: "basenames"
await unrl.resolve("brad.crypto"); // resolver: "unstoppable"
// await unrl.resolve("vitalik.eh") // type error: not a valid name

await unrl.reverseResolve("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045");
// { name: "vitalik.eth", resolver: "ens" }
// extra hits: "foo.eth, foo.base.eth" / "ens, basenames"

await unrl.resolveMany(["vitalik.eth", "toly.sol"]);
unrl.whichResolver("toly.sol"); // "sns"
unrl.clearCache();
```

## Config

```typescript
const unrl = new UNRL({
  // EVM JSON-RPC. Default: viem public transport (not Cloudflare).
  rpcUrl: "https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY",

  // Optional SNS proxy `rpc` query param.
  solanaRpcUrl: "https://api.mainnet-beta.solana.com",

  // Optional Unstoppable REST key. Without it, Polygon then Ethereum ProxyReader.
  udApiKey: "YOUR_UD_API_KEY",

  // Cache entry cap (ms). Default 5 minutes. Misses with ttl 0 are not cached.
  cacheTtl: 10 * 60 * 1000,

  noCache: false,
});
```

## Scripts

```bash
npm test          # offline unit tests
npm run test:live # live names (RPC; flaky)
npm run build
```

## Why this stays small

Wallets and dApps should not integrate every naming SDK. UNRL is TLD routing only. No text records, avatars, IPFS, or L2 network picker — send UIs still choose Arbitrum vs Base when the address is EVM.

## License

MIT

## More

- [example](examples/resolve-names.ts)
- [changelog](CHANGELOG.md) — per-version notes; GitHub Releases copy the same
- [contributing](CONTRIBUTING.md) — PRs target `develop`; test with `gh pr checkout` before merge to `main`
