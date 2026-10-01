#!/usr/bin/env node
/**
 * Prepares miner variant PNGs: 600x600, transparent background.
 *
 * Usage:
 *   node scripts/prepare-miners.js
 *   node scripts/prepare-miners.js path/to/source.png path/to/output.png
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const SIZE = 600;

const MINERS_DIR = path.join(
  __dirname,
  "..",
  "public",
  "images",
  "miners"
);

const ASSETS_DIR = path.join(
  process.env.USERPROFILE || "",
  ".cursor",
  "projects",
  "c-repo-TheProjectSoapy",
  "assets"
);

const VARIANTS = Array.from({ length: 256 }, (_, index) =>
  `soapy-miner-${String(index + 1).padStart(2, "0")}`
);

function isBackgroundPixel(r, g, b, a) {
  if (a < 16) {
    return true;
  }

  if (r < 28 && g < 28 && b < 28) {
    return true;
  }

  if (
    r < 72 &&
    g < 58 &&
    b < 48 &&
    r >= g - 8 &&
    g >= b - 6
  ) {
    return true;
  }

  return false;
}

async function prepareMiner(inputPath, outputPath) {
  const { data, info } = await sharp(inputPath)
    .resize(SIZE, SIZE, {
      kernel: sharp.kernel.nearest,
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = Buffer.from(data);

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];

    if (isBackgroundPixel(r, g, b, pixels[i + 3])) {
      pixels[i + 3] = 0;
    }
  }

  await sharp(pixels, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4,
    },
  })
    .png({ compressionLevel: 9 })
    .toFile(outputPath);

  const stats = fs.statSync(outputPath);

  console.log(
    `Wrote ${path.basename(outputPath)} (${SIZE}x${SIZE}, ${stats.size} bytes)`
  );
}

function resolveSource(baseName) {
  const candidates = [
    path.join(ASSETS_DIR, `${baseName}-600.png`),
    path.join(MINERS_DIR, `${baseName}-600.png`),
    path.join(MINERS_DIR, `${baseName}.png`),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length >= 2) {
    await prepareMiner(args[0], args[1]);
    return;
  }

  fs.mkdirSync(MINERS_DIR, { recursive: true });

  for (const baseName of VARIANTS) {
    const source = resolveSource(baseName);

    if (!source) {
      console.warn(`Skipping ${baseName}: no source found`);
      continue;
    }

    const outputPath = path.join(
      MINERS_DIR,
      `${baseName}.png`
    );

    await prepareMiner(source, outputPath);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
