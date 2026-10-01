#!/usr/bin/env node
/**
 * Process a range of generated miner assets into public/images/miners.
 *
 * Usage:
 *   node scripts/process-miner-batch.js 81 100
 */
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const [startArg, endArg] = process.argv.slice(2);
const start = Number(startArg);
const end = Number(endArg);

if (!Number.isInteger(start) || !Number.isInteger(end)) {
  console.error("Usage: node scripts/process-miner-batch.js <start> <end>");
  process.exit(1);
}

const ASSETS_DIR = path.join(
  process.env.USERPROFILE || "",
  ".cursor",
  "projects",
  "c-repo-TheProjectSoapy-soapy-miners-nft",
  "assets"
);

const ROOT = path.join(__dirname, "..");
const prepareScript = path.join(__dirname, "prepare-miners.js");

let processed = 0;
let missing = 0;

for (let id = start; id <= end; id++) {
  const base = `soapy-miner-${String(id).padStart(2, "0")}`;
  const source = path.join(ASSETS_DIR, `${base}.png`);
  const output = path.join(
    ROOT,
    "public",
    "images",
    "miners",
    `${base}.png`
  );

  if (!fs.existsSync(source)) {
    console.warn(`Missing source: ${base}.png`);
    missing += 1;
    continue;
  }

  execSync(
    `node "${prepareScript}" "${source}" "${output}"`,
    { stdio: "inherit" }
  );

  processed += 1;
}

console.log(`Batch ${start}-${end}: processed ${processed}, missing ${missing}`);
