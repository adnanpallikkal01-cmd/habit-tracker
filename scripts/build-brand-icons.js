import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function buildIcons() {
  try {
    const root = path.resolve(__dirname, '..');
    const svgPath = path.join(root, 'public', 'favicon.svg');
    const iconsDir = path.join(root, 'public', 'icons');
    const sizes = [16, 32, 48, 180, 192, 512];

    // Ensure icons directory exists
    if (!fs.existsSync(iconsDir)) {
      fs.mkdirSync(iconsDir, { recursive: true });
    }

    // Read SVG once
    const svg = fs.readFileSync(svgPath);

    // Generate all sizes
    await Promise.all(
      sizes.map((size) =>
        sharp(svg)
          .resize(size, size, {
            fit: 'contain',
            background: { r: 4, g: 4, b: 5, alpha: 1 },
          })
          .png()
          .toFile(path.join(iconsDir, `icon-${size}.png`))
          .then(() => console.log(`✓ Generated icon-${size}.png`))
          .catch((err) => {
            console.error(`✗ Failed to generate icon-${size}.png:`, err.message);
            throw err;
          })
      )
    );

    console.log('\n✓ All brand icons generated successfully!');
  } catch (error) {
    console.error('Icon generation failed:', error);
    process.exit(1);
  }
}

buildIcons();

