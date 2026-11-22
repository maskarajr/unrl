import { readFileSync, writeFileSync } from "node:fs";

const version = process.argv[2];
if (!version) {
  throw new Error("usage: node scripts/extract-changelog.mjs <version>");
}

const changelog = readFileSync("CHANGELOG.md", "utf8");
const heading = `## ${version} —`;
const start = changelog.indexOf(heading);
if (start < 0) {
  throw new Error(`CHANGELOG.md missing heading "${heading}"`);
}

const fromHeading = changelog.slice(start);
const next = fromHeading.indexOf("\n## ", 1);
const notes = `${(next === -1 ? fromHeading : fromHeading.slice(0, next)).trim()}\n`;
const body = notes.slice(notes.indexOf("\n") + 1).trim();
if (!body) {
  throw new Error(`CHANGELOG.md section for ${version} is empty`);
}

writeFileSync("RELEASE_NOTES.md", notes);
process.stdout.write(notes);
