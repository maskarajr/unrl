# Changelog

All notable changes to `@maskarajr/unrl` are listed here.
GitHub Releases use the same sections per tag (`vX.Y.Z`).

## Unreleased

## 0.1.2 — 2026-11-22

### Fixed

- `.sol` forward resolve via SNS v2 (`/resolve/{name}.sns`); v2 rejects `.sol` after the SRS slot cutoff

## 0.1.1 — 2026-11-22

### Added

- `UNRL.reverseResolve` Solana wallets via SNS primary domain (`{ name, resolver: "sns" }`)

### Fixed

- Full MIT license text in `LICENSE` (replaces placeholder `LICENSE.md`)

## 0.1.0 — 2026-08-18

First public preview. Package name is `@maskarajr/unrl` (unscoped `unrl` rejected by npm as too similar to existing names).

### Added

- `UNRL.resolve` / `resolveMany` — TLD routes to ENS (`.eth`), SNS (`.sol`), Base Names (`.base` / `*.base.eth`), Unstoppable (`.crypto` `.wallet` `.nft` `.x` `.polygon` `.dao` `.888` `.blockchain`)
- `UNRL.reverseResolve` — parallel ENS L1, Basenames L2 reverse registrar, Unstoppable profile API; names and resolvers joined with `", "`
- `UNRL.whichResolver` / `clearCache`
- `CheckName` / `typecheckName` — invalid literals and runtime names fail as "not a valid name"
- Optional config: `rpcUrl`, `solanaRpcUrl`, `udApiKey`, `cacheTtl`, `noCache`
- Offline Vitest + `test:live`; GitHub Actions CI

### Changed

- Public bodies only: forward `{ address, resolver }`, reverse `{ name, resolver }` (input echo and `ttl` stay internal)

### Fixed

- Empty forward hits use `ttl: 0` (not cached)
- Unstoppable reverse without API key (profile endpoint)
- Basename reverse via Base L2 registrar, not L1 `getEnsName`
