#!/usr/bin/env node
/**
 * Writes 64x64 pixel pickaxe cursor PNGs (no deps).
 */
const fs = require("fs");
const zlib = require("zlib");
const path = require("path");

const SIZE = 64;
const OUT_DIR = path.join(
  __dirname,
  "..",
  "public",
  "images",
  "cursors"
);

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(
    crc32(Buffer.concat([typeBuf, data]))
  );
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function writePng(filename, pixels) {
  const raw = Buffer.alloc((SIZE * 4 + 1) * SIZE);
  for (let y = 0; y < SIZE; y++) {
    const rowStart = y * (SIZE * 4 + 1);
    raw[rowStart] = 0;
    pixels[y].copy(raw, rowStart + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(SIZE, 0);
  ihdr.writeUInt32BE(SIZE, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const signature = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  ]);
  const png = Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, filename), png);
}

function rgba(r, g, b, a = 255) {
  return Buffer.from([r, g, b, a]);
}

function blankRow() {
  return Buffer.alloc(SIZE * 4, 0);
}

function drawPickaxe(rows, hit = false) {
  const T = rgba(150, 150, 165);
  const H = rgba(195, 150, 65);
  const W = rgba(120, 78, 40);
  const D = rgba(45, 34, 24);

  const set = (x, y, c) => {
    if (x < 0 || x >= SIZE || y < 0 || y >= SIZE) return;
    c.copy(rows[y], x * 4);
  };

  const block = (x, y, w, h, c) => {
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        set(x + dx, y + dy, c);
      }
    }
  };

  for (let y = 0; y < SIZE; y++) rows[y] = blankRow();

  if (hit) {
    for (let i = 0; i < 20; i++) {
      set(10 + i, 34 + i, W);
      set(11 + i, 34 + i, H);
    }
    for (let i = 0; i < 16; i++) {
      set(38 + i, 14 + i, T);
    }
    block(44, 28, 4, 4, T);
    block(18, 46, 3, 3, D);
    block(22, 50, 3, 3, D);
    block(26, 54, 3, 3, D);
  } else {
    for (let i = 0; i < 24; i++) {
      set(8 + i, 10 + i, W);
      set(9 + i, 10 + i, H);
    }
    for (let i = 0; i < 18; i++) {
      set(28 + i, 30 - i, T);
    }
    block(44, 14, 4, 4, T);
    block(12, 30, 3, 3, D);
    block(16, 34, 3, 3, D);
    block(20, 38, 3, 3, D);
    block(24, 42, 3, 3, D);
  }
}

const idle = Array.from({ length: SIZE }, () => blankRow());
drawPickaxe(idle, false);
writePng("pickaxe-cursor.png", idle);

const hit = Array.from({ length: SIZE }, () => blankRow());
drawPickaxe(hit, true);
writePng("pickaxe-hit-cursor.png", hit);

console.log("64x64 cursor PNGs written to", OUT_DIR);
