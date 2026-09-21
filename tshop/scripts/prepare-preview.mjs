/**
 * Post-processes `out/` (from `STATIC_EXPORT=1 npm run build`) so the export
 * can be served by a host that reserves top-level paths beginning with "_"
 * and rejects files containing the Unicode replacement character.
 *
 * None of this is needed for a normal deployment — it exists only to publish
 * a shareable preview of the static export.
 *
 *   node scripts/prepare-preview.mjs
 */
import { readdirSync, renameSync, rmSync, mkdirSync, statSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const OUT = "out";

/* 1 — Move the build assets under `assets/`, matching `assetPrefix` in
       next.config.ts, so no top-level path starts with "_". */
mkdirSync(join(OUT, "assets"), { recursive: true });
renameSync(join(OUT, "_next"), join(OUT, "assets", "_next"));

/* 2 — Drop the root-level segment-prefetch payloads and the `_not-found`
       route: both live at reserved paths. Their absence only costs link
       prefetching — Next falls back to a normal navigation — and `404.html`
       still covers unknown routes. */
let dropped = 0;
for (const entry of readdirSync(OUT)) {
  if (!entry.startsWith("_")) continue;
  rmSync(join(OUT, entry), { recursive: true, force: true });
  dropped++;
}

/* 3 — Escape literal U+FFFD characters in emitted JavaScript.
       Next's URL-decoding polyfill contains them deliberately (it is what
       `decodeURIComponent` yields for a malformed sequence), but a raw
       replacement character is indistinguishable from mojibake to a
       publishing pipeline. Inside a JS string literal "�" is exactly
       the same value, so this is a lossless rewrite. */
const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });

let escaped = 0;
for (const path of walk(OUT)) {
  if (!/\.(js|css)$/.test(path)) continue;
  const source = readFileSync(path, "utf8");
  if (!source.includes("�")) continue;
  writeFileSync(path, source.replaceAll("�", "\\uFFFD"));
  escaped++;
}

console.log(
  `preview pronto: assets movidos, ${dropped} entrada(s) reservada(s) removida(s), ` +
    `U+FFFD escapado em ${escaped} arquivo(s)`,
);
