import { access, copyFile, lstat, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const site = join(root, "site");
const dist = join(root, "dist");
const files = [
  "index.html", "assets/brand.png", "assets/demo.css", "assets/demo.js",
  "assets/fixtures.js", "assets/learner-state.js", "assets/replays.js",
];
const allowedOutputs = new Set([...files, ".nojekyll"]);

async function checkContents(folder, prefix = "") {
  for (const name of await readdir(folder, { withFileTypes: true })) {
    const rel = prefix + name.name;
    if (rel === "assets" && name.isDirectory()) {
      await checkContents(join(folder, name.name), "assets/");
    } else if (!name.isFile() || !allowedOutputs.has(rel)) {
      throw new Error("Unexpected file in public build output: " + rel);
    }
  }
}

try {
  await access(dist);
  if (!(await lstat(dist)).isDirectory()) throw new Error("Unexpected dist path");
  await checkContents(dist);
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

const html = await readFile(join(site, "index.html"), "utf8");
if (!html.includes("connect-src 'none'") || !html.includes("form-action 'none'") || /<form\b/i.test(html)) {
  throw new Error("Public demo must use the static content policy with no forms");
}
for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
  const url = match[1];
  const asset = url.replace(/^\.\//, "").replace(/\?v=[a-z0-9-]+$/, "");
  if (!url.startsWith("#") && !files.includes(asset)) {
    throw new Error("Nonportable or unexpected asset: " + url);
  }
}
await mkdir(join(dist, "assets"), { recursive: true });
for (const asset of files) {
  const origin = join(site, asset);
  if (!(await lstat(origin)).isFile()) throw new Error("Not a regular asset: " + asset);
  await copyFile(origin, join(dist, asset));
}
await writeFile(join(dist, ".nojekyll"), "");
await checkContents(dist);
console.log("Verified and built " + files.length + " public files in dist/");
