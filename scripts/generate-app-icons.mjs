/**
 * Builds iOS AppIcon + Android mipmaps from your master artwork.
 *
 * Source (first match wins):
 *   src/assets/AppIcons/source/icon.png  (optional manual override)
 *   src/assets/AppIcons/source/icon.svg
 *   src/assets/AppIcons/playstore.png  (default store / launcher master)
 *   src/assets/AppIcons/appstore.png
 *   src/assets/svgs/originals/best_bond.svg
 *
 * Then copies into native targets via sync (same as npm run sync:app-icons).
 *
 * Run: npm run generate:app-icons
 */
import sharp from 'sharp';
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { syncAppIconsFromAssets } from './sync-app-icons.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const defaultSvg = join(root, 'src/assets/svgs/originals/best_bond.svg');
const sourceDir = join(root, 'src/assets/AppIcons/source');
const sourcePng = join(sourceDir, 'icon.png');
const sourceSvg = join(sourceDir, 'icon.svg');
const playstorePng = join(root, 'src/assets/AppIcons/playstore.png');
const appstorePng = join(root, 'src/assets/AppIcons/appstore.png');

const bg = { r: 255, g: 255, b: 255, alpha: 1 };
/** Squircle / anti-alias edges on store PNGs — flatten so iOS marketing icon has no alpha. */
const playstoreFlattenBg = { r: 248, g: 120, b: 24, alpha: 1 };
/**
 * Fraction of each output square used for artwork (rest is solid orange padding).
 * ~0.78 matches Android adaptive “safe zone” better than edge-to-edge cover.
 */
const RASTER_ICON_CONTENT_SCALE = 0.78;

function resolveMasterPath() {
  if (existsSync(sourcePng)) return sourcePng;
  if (existsSync(sourceSvg)) return sourceSvg;
  if (existsSync(playstorePng)) return playstorePng;
  if (existsSync(appstorePng)) return appstorePng;
  return defaultSvg;
}

async function rasterizeIcon(masterPath, size, outPath) {
  const isSvg = masterPath.toLowerCase().endsWith('.svg');
  if (isSvg) {
    await sharp(masterPath)
      .resize(size, size, { fit: 'contain', background: bg })
      .png()
      .toFile(outPath);
    return;
  }

  const inner = Math.max(1, Math.round(size * RASTER_ICON_CONTENT_SCALE));
  const padded = await sharp(masterPath)
    .flatten({ background: playstoreFlattenBg })
    .resize(inner, inner, {
      fit: 'contain',
      background: playstoreFlattenBg,
    })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: playstoreFlattenBg,
    },
  })
    .composite([{ input: padded, gravity: 'centre' }])
    .png()
    .toFile(outPath);
}

const iosSourceDir = join(
  root,
  'src/assets/AppIcons/Assets.xcassets/AppIcon.appiconset',
);

const androidMirror = join(root, 'src/assets/AppIcons/android');

/** Distinct PNGs; 120.png shared by 40@3x and 60@2x */
const iosFiles = {
  'Icon-40.png': 40,
  'Icon-60.png': 60,
  'Icon-58.png': 58,
  'Icon-87.png': 87,
  'Icon-80.png': 80,
  'Icon-120.png': 120,
  'Icon-180.png': 180,
  'Icon-1024.png': 1024,
};

const iosContents = {
  images: [
    {
      size: '20x20',
      idiom: 'iphone',
      scale: '2x',
      filename: 'Icon-40.png',
    },
    {
      size: '20x20',
      idiom: 'iphone',
      scale: '3x',
      filename: 'Icon-60.png',
    },
    {
      size: '29x29',
      idiom: 'iphone',
      scale: '2x',
      filename: 'Icon-58.png',
    },
    {
      size: '29x29',
      idiom: 'iphone',
      scale: '3x',
      filename: 'Icon-87.png',
    },
    {
      size: '40x40',
      idiom: 'iphone',
      scale: '2x',
      filename: 'Icon-80.png',
    },
    {
      size: '40x40',
      idiom: 'iphone',
      scale: '3x',
      filename: 'Icon-120.png',
    },
    {
      size: '60x60',
      idiom: 'iphone',
      scale: '2x',
      filename: 'Icon-120.png',
    },
    {
      size: '60x60',
      idiom: 'iphone',
      scale: '3x',
      filename: 'Icon-180.png',
    },
    {
      size: '1024x1024',
      idiom: 'ios-marketing',
      scale: '1x',
      filename: 'Icon-1024.png',
    },
  ],
  info: { author: 'xcode', version: 1 },
};

async function main() {
  const master = resolveMasterPath();
  console.log('App icon master:', master);

  mkdirSync(iosSourceDir, { recursive: true });

  for (const [name, size] of Object.entries(iosFiles)) {
    const out = join(iosSourceDir, name);
    await rasterizeIcon(master, size, out);
  }

  const iosContentsPath = join(iosSourceDir, 'Contents.json');
  writeFileSync(
    iosContentsPath,
    JSON.stringify(iosContents, null, 2) + '\n',
    'utf8',
  );

  const androidMap = [
    ['mipmap-mdpi', 48],
    ['mipmap-hdpi', 72],
    ['mipmap-xhdpi', 96],
    ['mipmap-xxhdpi', 144],
    ['mipmap-xxxhdpi', 192],
  ];

  for (const [folder, size] of androidMap) {
    const mirrorDir = join(androidMirror, folder);
    mkdirSync(mirrorDir, { recursive: true });
    const square = join(mirrorDir, 'ic_launcher.png');
    await rasterizeIcon(master, size, square);
    copyFileSync(square, join(mirrorDir, 'ic_launcher_foreground.png'));
    await rasterizeIcon(master, size, join(mirrorDir, 'ic_launcher_round.png'));
  }

  syncAppIconsFromAssets(root);

  console.log(
    'OK: updated src/assets/AppIcons → synced to ios + android',
  );
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
