#!/usr/bin/env node
// ADR 0004: our documentation points at vendor docs inside node_modules instead of copying them.
// A pointer that does not resolve is worse than no pointer — the agent reads "the docs are there",
// finds nothing, and falls back to training data that predates this stack.
//
// pnpm does not hoist to the root node_modules, so the same spelling is valid in a package's own
// AGENTS.md and broken in a root-level doc. That mistake has already been made here (7 times, in one
// sitting), which is why this is a script and not a paragraph.
import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

const SKIP_DIRS = new Set(["node_modules", ".git", ".next", ".turbo", "dist", "generated"]);
const POINTER = /`([^`\s]*node_modules\/[A-Za-z0-9@/._-]+)`/g;

async function markdownFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") && entry.name.length > 1) continue;
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await markdownFiles(full)));
    else if (entry.name.endsWith(".md")) out.push(full);
  }
  return out;
}

const root = resolve(process.argv[2] ?? ".");
let resolved = 0;
const broken = [];

for (const file of await markdownFiles(root)) {
  const text = await readFile(file, "utf8");
  for (const [, pointer] of text.matchAll(POINTER)) {
    if (pointer.includes("...")) continue; // prose ellipsis, not a path
    // A path may be spelled relative to the file's own package (the Next.js convention) or to the
    // repo root. Either resolving counts.
    const candidates = [join(dirname(file), pointer), join(root, pointer)];
    if (candidates.some((c) => existsSync(c))) resolved += 1;
    else broken.push({ file: file.slice(root.length + 1), pointer });
  }
}

for (const { file, pointer } of broken) {
  console.error(`broken pointer  ${file}  ->  ${pointer}`);
}
console.log(`doc pointers: ${resolved} resolved, ${broken.length} broken`);

if (broken.length > 0) {
  console.error(
    "\nFix the path, or run `pnpm install` if a dependency is simply missing locally.\n" +
      "See docs/guides/agents.md.",
  );
  process.exit(1);
}
