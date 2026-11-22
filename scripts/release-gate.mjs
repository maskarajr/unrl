import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const version = process.argv[2] ?? pkg.version;
const tag = `v${version}`;
const spec = `${pkg.name}@${version}`;

function run(cmd, args, opts = {}) {
  return spawnSync(cmd, args, { encoding: "utf8", ...opts });
}

function fail(label, r) {
  const err = `${r.stderr || ""}${r.stdout || ""}`.trim();
  throw new Error(`${label} failed (${r.status}): ${err}`);
}

const tagR = run("git", [
  "ls-remote",
  "--exit-code",
  "--tags",
  "origin",
  `refs/tags/${tag}`,
]);
let tag_exists;
// git ls-remote --exit-code: 0 match, 2 no match, 1 other error
if (tagR.status === 0) tag_exists = true;
else if (tagR.status === 2) tag_exists = false;
else fail("git ls-remote", tagR);

const npmR = run("npm", ["view", spec, "version"]);
let npm_exists;
if (npmR.status === 0) npm_exists = npmR.stdout.trim() === version;
else if ((npmR.stderr || "").includes("E404")) npm_exists = false;
else fail("npm view npmjs", npmR);

let ghpkg_exists = false;
let ghpkg_checked = false;
const ghToken = process.env.NODE_AUTH_TOKEN || process.env.GITHUB_TOKEN || "";
if (ghToken) {
  ghpkg_checked = true;
  const dir = mkdtempSync(join(tmpdir(), "ghpkg-"));
  const cfg = join(dir, "npmrc");
  writeFileSync(
    cfg,
    `//npm.pkg.github.com/:_authToken=${ghToken}\n@maskarajr:registry=https://npm.pkg.github.com\n`
  );
  const g = run("npm", ["view", spec, "version", "--registry=https://npm.pkg.github.com"], {
    env: { ...process.env, NPM_CONFIG_USERCONFIG: cfg },
  });
  if (g.status === 0) ghpkg_exists = g.stdout.trim() === version;
  else if ((g.stderr || "").includes("E404")) ghpkg_exists = false;
  else fail("npm view github packages", g);
}

let release_exists = false;
const gh = run("gh", ["release", "view", tag, "--json", "name"]);
if (gh.status === 0) release_exists = true;
else {
  const blob = `${gh.stderr || ""}${gh.stdout || ""}`.toLowerCase();
  if (
    blob.includes("not found") ||
    blob.includes("could not find") ||
    blob.includes("not exist")
  ) {
    release_exists = false;
  } else if (gh.error?.code === "ENOENT") {
    release_exists = false;
  } else {
    fail("gh release view", gh);
  }
}

const need_tag = !tag_exists;
const need_release = !release_exists;
const need_npm = !npm_exists;
const need_ghpkg = ghpkg_checked ? !ghpkg_exists : !npm_exists;
const skip_all = !need_tag && !need_release && !need_npm && !need_ghpkg;

const rows = {
  version,
  tag,
  tag_exists,
  npm_exists,
  ghpkg_exists,
  ghpkg_checked,
  release_exists,
  need_tag,
  need_release,
  need_npm,
  need_ghpkg,
  skip_all,
};

for (const [k, v] of Object.entries(rows)) {
  const val = typeof v === "boolean" ? (v ? "true" : "false") : String(v);
  process.stdout.write(`${k}=${val}\n`);
  if (process.env.GITHUB_OUTPUT) {
    writeFileSync(process.env.GITHUB_OUTPUT, `${k}=${val}\n`, { flag: "a" });
  }
}
