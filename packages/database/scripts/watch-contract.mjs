#!/usr/bin/env node
// There is no first-party Next.js plugin for `contract emit` — only Vite has one (see the shipped
// references/build.md, "What Prisma 8 doesn't do yet"). `prebuild` covers builds; this covers editing the
// contract while `next dev` is already running, which would otherwise silently serve stale types until
// someone remembers to re-emit.
import { spawn } from "node:child_process";
import { watch } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const contractDir = join(packageRoot, "prisma");

// Read the bin path out of the CLI's own manifest rather than hardcoding it, so a Prisma upgrade that
// moves the entry point does not silently break this watcher.
const require = createRequire(import.meta.url);
const prismaManifest = require.resolve("prisma/package.json");
const prismaBin = resolve(dirname(prismaManifest), require(prismaManifest).bin.prisma);

let pending;
let running = false;

function emit() {
  if (running) return;
  running = true;
  // Run the CLI's own entry point under this Node binary. Going through `pnpm exec` would need either
  // `shell: true` (deprecated for argument-bearing spawns, DEP0190) or the platform's .cmd shim, which
  // is not on PATH when pnpm is a workspace devDependency.
  const child = spawn(process.execPath, [prismaBin, "contract", "emit"], {
    cwd: packageRoot,
    stdio: "inherit",
  });
  child.on("exit", (code) => {
    running = false;
    console.log(code === 0 ? "contract re-emitted" : `contract emit failed (exit ${code})`);
  });
}

watch(contractDir, { recursive: true }, (_event, filename) => {
  if (!filename) return;
  if (!filename.endsWith(".prisma") && !filename.endsWith(".ts")) return;
  // Editors write in bursts; debounce so one save is one emit.
  clearTimeout(pending);
  pending = setTimeout(emit, 150);
});

console.log(`watching ${contractDir} — re-emitting the contract on change`);
emit();
