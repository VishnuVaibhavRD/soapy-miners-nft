#!/usr/bin/env node
/**
 * Prepares pickaxe cursor PNGs for browser use.
 * Browsers ignore cursor images that are too large (often >128px).
 *
 * Place full-size art at:
 *   public/images/cursors/pickaxe-cursor-source.png
 *   public/images/cursors/pickaxe-hit-cursor-source.png
 *
 * Or run after dropping large files directly as pickaxe-cursor.png —
 * sources are auto-saved on first run.
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const CURSOR_DIR = path.join(
  __dirname,
  "..",
  "public",
  "images",
  "cursors"
);

const CURSOR_SIZE = 64;

const TARGETS = [
  {
    source: "pickaxe-cursor-source.png",
    output: "pickaxe-cursor.png",
    fallback: "pickaxe-cursor.png",
  },
  {
    source: "pickaxe-hit-cursor-source.png",
    output: "pickaxe-hit-cursor.png",
    fallback: "pickaxe-hit-cursor.png",
  },
];

function ensureSource(sourcePath, fallbackPath) {
  if (fs.existsSync(sourcePath)) {
    return sourcePath;
  }

  if (
    fs.existsSync(fallbackPath) &&
    fallbackPath !== sourcePath
  ) {
    fs.copyFileSync(
      fallbackPath,
      sourcePath
    );

    console.log(
      `Saved source copy: ${path.basename(sourcePath)}`
    );

    return sourcePath;
  }

  return null;
}

async function makeCursor(
  inputPath,
  outputPath
) {
  const { data, info } =
    await sharp(inputPath)
      .resize(
        CURSOR_SIZE,
        CURSOR_SIZE,
        {
          kernel: sharp.kernel.nearest,
          fit: "contain",
          background: {
            r: 0,
            g: 0,
            b: 0,
            alpha: 0,
          },
        }
      )
      .ensureAlpha()
      .raw()
      .toBuffer({
        resolveWithObject: true,
      });

  const pixels =
    Buffer.from(data);

  for (
    let i = 0;
    i < pixels.length;
    i += 4
  ) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];

    if (
      r < 24 &&
      g < 24 &&
      b < 24
    ) {
      pixels[i + 3] = 0;
    }
  }

  await sharp(
    pixels,
    {
      raw: {
        width: info.width,
        height: info.height,
        channels: 4,
      },
    }
  )
    .png({
      compressionLevel: 9,
    })
    .toFile(outputPath);

  const stats =
    fs.statSync(outputPath);

  console.log(
    `Wrote ${path.basename(outputPath)} (${info.width}x${info.height}, ${stats.size} bytes)`
  );
}

async function main() {
  fs.mkdirSync(
    CURSOR_DIR,
    { recursive: true }
  );

  for (const target of TARGETS) {
    const sourcePath = path.join(
      CURSOR_DIR,
      target.source
    );

    const fallbackPath = path.join(
      CURSOR_DIR,
      target.fallback
    );

    const outputPath = path.join(
      CURSOR_DIR,
      target.output
    );

    const input =
      ensureSource(
        sourcePath,
        fallbackPath
      );

    if (!input) {
      console.warn(
        `Skipping ${target.output}: no source found`
      );
      continue;
    }

    await makeCursor(
      input,
      outputPath
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
