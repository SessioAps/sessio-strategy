// Seed the private KV store from local .data/*.json (which is gitignored).
// Run locally with the production KV creds in your env, e.g.:
//   KV_REST_API_URL=... KV_REST_API_TOKEN=... node scripts/seed-kv.mjs
// Pulls content from .data/ (board, ladder, milestones) and writes it to KV.
// No content lives in this script — it only moves the private files into KV.

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const token =
  process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

if (!url || !token) {
  console.error(
    "Missing KV creds. Set KV_REST_API_URL + KV_REST_API_TOKEN (or the UPSTASH_* equivalents).",
  );
  process.exit(1);
}

const dataDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", ".data");

for (const name of ["board", "ladder", "milestones"]) {
  const raw = await readFile(path.join(dataDir, `${name}.json`), "utf8");
  const value = JSON.stringify(JSON.parse(raw)); // validate + normalize
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(["SET", `sessio:roadmap:${name}`, value]),
  });
  console.log(`${name}: ${res.ok ? "ok" : "FAILED " + res.status}`);
}
