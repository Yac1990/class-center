---
name: Corrupted native binaries after interrupted npm install
description: How to diagnose "next dev exits silently" or "Module not found" errors caused by truncated node_modules files from an interrupted/killed npm install.
---

## Symptom
- `next dev` (or any Node process using native addons) prints "Ready" then exits cleanly with no error, OR crashes with a "Bus error" (SIGBUS, exit code 135) very early, before any app code runs.
- Alternatively, the dev server stays up but throws "Module not found" for a package that is clearly listed in `package.json` and present in `node_modules` (e.g. `framer-motion`, `motion-dom`) — because only part of its dual CJS/ESM build was written to disk.

## Root cause
An `npm install` that gets interrupted (bash tool timeout, SIGTERM, sandbox restart, etc.) can leave some extracted files truncated/corrupted rather than failing loudly. Native `.node` binaries end up with a valid ELF header but "missing section headers at <offset>" (check with `file`), and JS packages end up missing files like `dist/es/index.mjs`.

## How to confirm
```
find node_modules -iname "*.node" | xargs file | grep -i "missing section\|truncated"
```
Also check any "Module not found" error against the actual file on disk (`ls node_modules/<pkg>/<path-from-error>`).

## Fix
Remove the affected package directories specifically (not necessarily the whole node_modules) and reinstall:
```
rm -rf node_modules/<affected-pkg-dirs>
npm install --legacy-peer-deps
```
If corruption recurs across multiple install attempts for the same packages, clear the npm cache (`npm cache clean --force`) before reinstalling — even though `npm cache verify` may report the cache as fine, a fresh cache pull can still resolve it.

**Why:** In this sandbox, `npm install` run via the bash tool can be interrupted by tool timeouts (120s bash timeout) without visibly failing — the shell shows exit code -1/no output, but a background npm process may still be mid-extraction and get killed later, leaving partial files. Always verify the install actually completed (large `added N packages` summary, exit 0) rather than assuming success from a truncated/empty bash tool response.

**How to apply:** After any dev server exits silently, crashes with SIGBUS, or throws "Module not found" for a package that's supposedly installed, suspect binary corruption before debugging application code, Next.js config, or Node version compatibility.
