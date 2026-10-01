#!/usr/bin/env node
/**
 * Sync variants.json (81–256) and prepare-miners.js from miner-prompts.json.
 * Keeps existing entries #1–80 unchanged.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const PROMPTS_PATH = path.join(__dirname, "miner-prompts.json");
const VARIANTS_PATH = path.join(
  ROOT,
  "public",
  "images",
  "miners",
  "variants.json"
);
const PREPARE_PATH = path.join(__dirname, "prepare-miners.js");
const README_PATH = path.join(
  ROOT,
  "public",
  "images",
  "miners",
  "README.md"
);

const TRAIT_MAP = {
  Expression: "expression",
  Outfit: "outfit",
  Headwear: "hat",
  Pickaxe: "pickaxe",
  Gloves: "gloves",
  Boots: "boots",
  Accessory: "ring",
  Cape: "cape",
  Style: "style",
  Extra: "extra",
};

function parsePrompt(prompt) {
  const traits = {};

  for (const part of prompt.split(". ")) {
    for (const [label, field] of Object.entries(TRAIT_MAP)) {
      const prefix = `${label}:`;

      if (part.startsWith(prefix)) {
        traits[field] = part.slice(prefix.length).trim();
      }
    }
  }

  return traits;
}

function promptToVariant(entry) {
  const traits = parsePrompt(entry.prompt);
  const variant = {
    id: entry.id,
    file: entry.file,
    expression: traits.expression || null,
    outfit: traits.outfit || null,
    hat: traits.hat || null,
    pickaxe: traits.pickaxe || null,
    gloves: traits.gloves || null,
    boots: traits.boots || null,
    ring: traits.ring || null,
    cape: traits.cape || null,
  };

  if (traits.style) {
    variant.style = traits.style;
  }

  if (traits.extra) {
    variant.extra = traits.extra;
  }

  return variant;
}

function buildReadmeBatchSection(start, end, variants) {
  const lines = [
    "",
    `### Generated batch (${start}–${end})`,
    "",
    "| # | Expression | Standout combo |",
    "|---|------------|----------------|",
  ];

  for (const variant of variants) {
    if (variant.id < start || variant.id > end) {
      continue;
    }

    const expression = variant.expression || "—";
    const standout = [
      variant.hat,
      variant.pickaxe,
      variant.extra,
      variant.style,
    ]
      .filter(Boolean)
      .slice(0, 2)
      .join(", ");

    lines.push(
      `| ${String(variant.id).padStart(2, "0")} | ${expression} | ${standout || "—"} |`
    );
  }

  return lines.join("\n");
}

function updatePrepareMiners() {
  let source = fs.readFileSync(PREPARE_PATH, "utf8");

  const replacement = `const VARIANTS = Array.from({ length: 256 }, (_, index) =>
  \`soapy-miner-\${String(index + 1).padStart(2, "0")}\`
);`;

  source = source.replace(
    /const VARIANTS = \[[\s\S]*?\];/,
    replacement
  );

  fs.writeFileSync(PREPARE_PATH, source);
}

function updateReadme(generatedVariants) {
  let readme = fs.readFileSync(README_PATH, "utf8");

  const marker = "### Elemental & specialty batch (81–90)";
  const markerIndex = readme.indexOf(marker);

  if (markerIndex === -1) {
    throw new Error("README marker not found for generated batches");
  }

  const head = readme.slice(0, markerIndex).trimEnd();
  const batches = [
    [81, 100],
    [101, 120],
    [121, 140],
    [141, 160],
    [161, 180],
    [181, 200],
    [201, 220],
    [221, 240],
    [241, 256],
  ];

  const sections = batches.map(([start, end]) =>
    buildReadmeBatchSection(start, end, generatedVariants)
  );

  const tail = [
    ...sections,
    "",
    "Full trait data: `variants.json`",
    "",
    "Web path: `/images/miners/soapy-miner-01.png` … `soapy-miner-256.png`",
    "",
    "Re-process after regenerating art:",
    "",
    "```bash",
    "npm run prepare-miners",
    "```",
    "",
  ].join("\n");

  fs.writeFileSync(README_PATH, `${head}\n${tail}`);
}

function main() {
  const prompts = JSON.parse(fs.readFileSync(PROMPTS_PATH, "utf8"));
  const catalog = JSON.parse(fs.readFileSync(VARIANTS_PATH, "utf8"));
  const generatedVariants = prompts.map(promptToVariant);

  const kept = catalog.variants.filter(
    (variant) => variant.id <= 80
  );

  if (kept.length !== 80) {
    throw new Error(
      `Expected 80 base variants, found ${kept.length}`
    );
  }

  catalog.variants = [...kept, ...generatedVariants];
  catalog.description =
    "Mining-themed Soapy Miner sprite variants. 600x600 PNG, transparent background, SOAPY embossed on soap body. #1–80 curated; #81–256 synced from scripts/miner-prompts.json.";

  fs.writeFileSync(
    VARIANTS_PATH,
    `${JSON.stringify(catalog, null, 2)}\n`
  );

  updatePrepareMiners();
  updateReadme(generatedVariants);

  console.log(
    `Synced ${generatedVariants.length} variants (#81–256) into variants.json`
  );
  console.log("Updated prepare-miners.js (256 variants)");
  console.log("Updated README.md batch tables");
}

main();
