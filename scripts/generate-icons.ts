import sharp from 'sharp';
import { join } from 'path';

const publicDir = join(import.meta.dirname, '..', 'public');
const svgPath = join(publicDir, 'icon.svg');

async function generate() {
  await sharp(svgPath).resize(192, 192).png().toFile(join(publicDir, 'icon-192.png'));
  await sharp(svgPath).resize(512, 512).png().toFile(join(publicDir, 'icon-512.png'));
  console.log('Generated icon-192.png and icon-512.png');
}

generate().catch(console.error);
