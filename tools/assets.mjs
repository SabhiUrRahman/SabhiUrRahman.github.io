// Builds the site images from the design sources: avatar poses (WebP, two sizes), the chat bust, and the grain tile.
// Sources are the 4x AI-upscaled cut-outs in ../avatar-2d/hires (about 4400 px tall), so every size here is a downscale.
// usage: node tools/assets.mjs
import sharp from "sharp";
import { existsSync, mkdirSync, rmSync } from "node:fs";

const SRC = "../avatar-2d/hires";
const OUT = "public/img";
mkdirSync(`${OUT}/avatar`, { recursive: true });

// 1800 px covers the largest desktop slot (790 CSS px) on 2x screens; 900 px covers phones
const SIZES = [1800, 900];
for (const pose of ["wave", "fold", "laptop", "sit", "point", "phone"]) {
  const file = `${SRC}/c1-${pose}-4x.png`;
  if (!existsSync(file)) { console.log("skip", pose, "(no source yet)"); continue; }
  for (const h of SIZES) {
    const info = await sharp(file).resize({ height: h, kernel: "lanczos3" }).sharpen({ sigma: 0.5 }).webp({ quality: 86, alphaQuality: 95, effort: 6, smartSubsample: true }).toFile(`${OUT}/avatar/${pose}-${h}.webp`);
    console.log(pose, h, info.width + "x" + info.height, Math.round(info.size / 1024) + " KB");
  }
}
for (const old of ["wave", "fold", "laptop"]) for (const s of ["", "-sm"]) rmSync(`${OUT}/avatar/${old}${s}.webp`, { force: true });

// chat bust: head and shoulders of the wave pose, on beige, 2x of the 160 px display size
const bust = await sharp(`${SRC}/c1-wave-4x.png`).extract({ left: 500, top: 0, width: 960, height: 960 }).resize(320, 320, { kernel: "lanczos3" }).toBuffer();
await sharp({ create: { width: 320, height: 320, channels: 4, background: "#E9E2D5" } }).composite([{ input: bust }]).webp({ quality: 88 }).toFile(`${OUT}/avatar/bust.webp`);

// grain: 128 x 128 grey noise, tiled at low opacity on the dark panel
const N = 128, px = Buffer.alloc(N * N);
let seed = 7;
const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
for (let i = 0; i < N * N; i++) px[i] = Math.round(rnd() * 255);
await sharp(px, { raw: { width: N, height: N, channels: 1 } }).png({ compressionLevel: 9 }).toFile(`${OUT}/grain.png`);
console.log("done");
