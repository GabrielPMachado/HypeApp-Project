/**
 * Gera PNGs sólidos de placeholder para os assets referenciados em app.json.
 * Substitua estes arquivos por artes reais assim que possível.
 *
 * Uso: node scripts/generate-placeholder-assets.js
 */
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

function crc32(buf) {
  let c;
  const table = crc32.table || (crc32.table = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      t[n] = c;
    }
    return t;
  })());
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function solidPng(width, height, [r, g, b, a = 255]) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type RGBA
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdr = chunk("IHDR", ihdrData);

  const rowLen = width * 4;
  const raw = Buffer.alloc((rowLen + 1) * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * (rowLen + 1);
    raw[rowStart] = 0; // filter: none
    for (let x = 0; x < width; x++) {
      const px = rowStart + 1 + x * 4;
      raw[px] = r;
      raw[px + 1] = g;
      raw[px + 2] = b;
      raw[px + 3] = a;
    }
  }
  const idat = chunk("IDAT", zlib.deflateSync(raw));
  const iend = chunk("IEND", Buffer.alloc(0));

  return Buffer.concat([sig, ihdr, idat, iend]);
}

const outDir = path.join(__dirname, "..", "assets", "images");
fs.mkdirSync(outDir, { recursive: true });

// Paleta placeholder alinhada ao tema escuro do app.json (#09090B) e um
// acento "hype" (roxo/rosa) só para diferenciar o ícone do fundo.
const BG = [9, 9, 11, 255]; // #09090B
const ACCENT = [168, 85, 247, 255]; // #A855F7

const targets = [
  { file: "icon.png", size: 1024, color: ACCENT },
  { file: "splash.png", size: 1024, color: BG },
  { file: "android-icon-foreground.png", size: 1024, color: ACCENT },
  { file: "android-icon-background.png", size: 1024, color: BG },
  { file: "android-icon-monochrome.png", size: 1024, color: [255, 255, 255, 255] },
  { file: "favicon.png", size: 48, color: ACCENT },
];

for (const { file, size, color } of targets) {
  const buf = solidPng(size, size, color);
  fs.writeFileSync(path.join(outDir, file), buf);
  console.log(`gerado: assets/images/${file} (${size}x${size})`);
}
