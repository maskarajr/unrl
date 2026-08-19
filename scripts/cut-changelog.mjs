import { readFileSync, writeFileSync } from "node:fs";

const version = process.argv[2];
if (!version) {
  throw new Error("usage: node scripts/cut-changelog.mjs <version>");
}

const date = new Date().toISOString().slice(0, 10);
const changelogPath = "CHANGELOG.md";
let changelog = readFileSync(changelogPath, "utf8");

if (!changelog.includes("## Unreleased")) {
  throw new Error("CHANGELOG.md missing ## Unreleased");
}

changelog = changelog.replace(
  "## Unreleased\n",
  `## Unreleased\n\n## ${version} — ${date}\n`
);
writeFileSync(changelogPath, changelog);

const heading = `## ${version} —`;
const start = changelog.indexOf(heading);
if (start < 0) throw new Error(`no changelog heading for ${version}`);
const fromHeading = changelog.slice(start);
const next = fromHeading.indexOf("\n## ", 1);
const notes = `${(next === -1 ? fromHeading : fromHeading.slice(0, next)).trim()}\n`;
writeFileSync("RELEASE_NOTES.md", notes);
