import { mkdir, readdir } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import sharp from "sharp";

const SIZE = 1280;
const TILE = SIZE / 2;

export async function assembleAtlas(tiles, dest) {
  if (tiles.length !== 4) throw new Error(`Expected 4 tiles, got ${tiles.length}`);
  const resized = await Promise.all(tiles.map((tile) => sharp(tile).resize(TILE, TILE, { fit: "cover", position: "attention" }).toBuffer()));
  await sharp({ create: { width: SIZE, height: SIZE, channels: 3, background: "#f4f1ea" } })
    .composite([
      { input: resized[0], left: 0, top: 0 },
      { input: resized[1], left: TILE, top: 0 },
      { input: resized[2], left: 0, top: TILE },
      { input: resized[3], left: TILE, top: TILE },
    ])
    .webp({ quality: 82 })
    .toFile(dest);
}

export async function normalizeAtlas(source, dest) {
  await sharp(source).resize(SIZE, SIZE, { fit: "cover", position: "centre" }).webp({ quality: 82 }).toFile(dest);
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("assemble-relationship-atlas.mjs")) {
  const mode = process.argv[2];
  if (mode === "normalize" && process.argv[3] && process.argv[4]) {
    await normalizeAtlas(process.argv[3], process.argv[4]);
  } else if (mode === "folder" && process.argv[3] && process.argv[4]) {
    const files = (await readdir(process.argv[3]))
      .filter((name) => [".png", ".webp", ".jpg", ".jpeg"].includes(extname(name)))
      .sort();
    await mkdir(process.argv[4], { recursive: true });
    for (const file of files) {
      await normalizeAtlas(join(process.argv[3], file), join(process.argv[4], basename(file, extname(file)) + ".webp"));
    }
  } else {
    console.log("Usage: assemble-relationship-atlas.mjs normalize <src> <dest.webp>");
    console.log("       assemble-relationship-atlas.mjs folder <srcDir> <destDir>");
  }
}
