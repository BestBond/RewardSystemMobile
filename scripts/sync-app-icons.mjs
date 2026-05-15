/**
 * Copies launcher assets from src/assets/AppIcons into native projects.
 * iOS:  Assets.xcassets/AppIcon.appiconset → ios/BestBond/Images.xcassets/AppIcon.appiconset
 * Android: android/mipmap-* → android/app/src/main/res/mipmap-*
 *
 * Run: npm run sync:app-icons
 */
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  statSync,
} from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

function copyRecursive(src, dest) {
  mkdirSync(dest, { recursive: true });
  for (const name of readdirSync(src)) {
    if (name === '.DS_Store') continue;
    const s = join(src, name);
    const d = join(dest, name);
    if (statSync(s).isDirectory()) copyRecursive(s, d);
    else cpSync(s, d);
  }
}

export function syncAppIconsFromAssets(root = projectRoot) {
  const iosSrc = join(
    root,
    'src/assets/AppIcons/Assets.xcassets/AppIcon.appiconset',
  );
  const iosDest = join(
    root,
    'ios/BestBond/Images.xcassets/AppIcon.appiconset',
  );
  const androidSrc = join(root, 'src/assets/AppIcons/android');
  const androidDest = join(root, 'android/app/src/main/res');

  if (!existsSync(iosSrc)) {
    throw new Error(`Missing ${iosSrc}`);
  }

  if (existsSync(iosDest)) {
    rmSync(iosDest, { recursive: true, force: true });
  }
  copyRecursive(iosSrc, iosDest);

  if (!existsSync(androidSrc)) {
    console.warn(`Skip Android: missing ${androidSrc}`);
    return;
  }

  for (const name of readdirSync(androidSrc)) {
    if (!name.startsWith('mipmap-')) continue;
    const s = join(androidSrc, name);
    if (!statSync(s).isDirectory()) continue;
    const d = join(androidDest, name);
    if (existsSync(d)) {
      rmSync(d, { recursive: true, force: true });
    }
    copyRecursive(s, d);
    const fg = join(d, 'ic_launcher_foreground.png');
    const base = join(d, 'ic_launcher.png');
    if (existsSync(base) && !existsSync(fg)) {
      cpSync(base, fg);
    }
  }
}

const isMain =
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  try {
    syncAppIconsFromAssets(projectRoot);
    console.log(
      'OK: AppIcons → ios/BestBond/Images.xcassets/AppIcon.appiconset, android/app/src/main/res/mipmap-*',
    );
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
