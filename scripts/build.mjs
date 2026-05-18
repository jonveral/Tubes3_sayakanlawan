import { cp, mkdir, rm } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(scriptsDir, "..");
const distDir = resolve(rootDir, "dist");
const publicDir = resolve(rootDir, "public");

if (!distDir.startsWith(`${rootDir}${sep}`)) {
  throw new Error("Refusing to clean a path outside the project root.");
}

await rm(distDir, { recursive: true, force: true });
await mkdir(distDir, { recursive: true });
await cp(publicDir, distDir, { recursive: true });

const commonOptions = {
  bundle: true,
  minify: false,
  sourcemap: true,
  target: "chrome114",
  platform: "browser",
  format: "iife",
  logLevel: "info"
};

await Promise.all([
  build({
    ...commonOptions,
    entryPoints: [resolve(rootDir, "src/content/index.ts")],
    outfile: resolve(distDir, "content.js")
  }),
  build({
    ...commonOptions,
    entryPoints: [resolve(rootDir, "src/popup/index.ts")],
    outfile: resolve(distDir, "popup.js")
  })
]);

await cp(resolve(rootDir, "src/popup/popup.html"), resolve(distDir, "popup.html"));
await cp(resolve(rootDir, "src/popup/popup.css"), resolve(distDir, "popup.css"));
