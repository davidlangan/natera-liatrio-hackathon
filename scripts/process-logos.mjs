// One-shot conversion: drop the baked-in solid-black background out of the
// "PNG" exports (which are actually JPEGs) and write true PNGs with alpha.
// Run with: node scripts/process-logos.mjs
import sharp from "sharp";
import { promises as fs } from "node:fs";
import path from "node:path";

const PUBLIC_LOGOS = path.resolve("public/logos");

// Pixels darker than this (channel-sum) become transparent.
// Keeps dark-but-saturated brand strokes (none expected here) intact.
const BLACK_CUTOFF = 36;
// Soft anti-alias band: pixels between CUTOFF and FADE get partial alpha so
// the edges don't look chunky against any dark background.
const FADE_END = 80;

async function chromaKey(srcPath, dstPath) {
  const img = sharp(srcPath).ensureAlpha();
  const meta = await img.metadata();
  const { data, info } = await img
    .raw()
    .toBuffer({ resolveWithObject: true });

  const px = new Uint8ClampedArray(data); // copy so we can mutate
  for (let i = 0; i < px.length; i += 4) {
    const r = px[i];
    const g = px[i + 1];
    const b = px[i + 2];
    const sum = r + g + b;
    if (sum <= BLACK_CUTOFF) {
      px[i + 3] = 0;
    } else if (sum < FADE_END) {
      const t = (sum - BLACK_CUTOFF) / (FADE_END - BLACK_CUTOFF);
      px[i + 3] = Math.round(255 * t);
    }
  }

  await sharp(Buffer.from(px), {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4,
    },
  })
    .png({ compressionLevel: 9 })
    .toFile(dstPath);

  const stat = await fs.stat(dstPath);
  console.log(
    `✓ ${path.basename(dstPath)}  ${info.width}×${info.height}  ${(
      stat.size / 1024
    ).toFixed(1)} KiB  (in ${meta.format})`,
  );
}

await chromaKey(
  path.join(PUBLIC_LOGOS, "natera.png"),
  path.join(PUBLIC_LOGOS, "natera.png"),
);
await chromaKey(
  path.join(PUBLIC_LOGOS, "liatrio.png"),
  path.join(PUBLIC_LOGOS, "liatrio.png"),
);
console.log("Done.");
