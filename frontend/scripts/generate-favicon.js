const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

// 1. High-Resolution SVG Favicon Content
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <defs>
    <linearGradient id="hf-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0284c7" />
      <stop offset="60%" stop-color="#0369a1" />
      <stop offset="100%" stop-color="#090d16" />
    </linearGradient>
    <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="50%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>
    <linearGradient id="white-sheen" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.35" />
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.05" />
    </linearGradient>
  </defs>

  <!-- Squircle Base with smooth rounded corners -->
  <rect width="64" height="64" rx="16" fill="url(#hf-bg)" />
  <rect x="1" y="1" width="62" height="62" rx="15" fill="none" stroke="url(#white-sheen)" stroke-width="1.5" />

  <!-- 5-Star Luxury Star on Top -->
  <path d="M32 9 L34.2 13.6 L39.2 14.3 L35.6 17.8 L36.5 22.8 L32 20.4 L27.5 22.8 L28.4 17.8 L24.8 14.3 L29.8 13.6 Z" fill="url(#gold-grad)" />

  <!-- Grand Hotel Architecture Body (Pure Crisp White) -->
  <path d="M16 26 H48 A2 2 0 0 1 50 28 V51 H14 V28 A2 2 0 0 1 16 26 Z" fill="#ffffff" />

  <!-- Hotel Upper Floor Windows (Sky Blue) -->
  <rect x="19" y="30" width="6" height="5" rx="1.2" fill="#0284c7" />
  <rect x="29" y="30" width="6" height="5" rx="1.2" fill="#0284c7" />
  <rect x="39" y="30" width="6" height="5" rx="1.2" fill="#0284c7" />

  <rect x="19" y="37" width="6" height="5" rx="1.2" fill="#0284c7" />
  <rect x="29" y="37" width="6" height="5" rx="1.2" fill="#0284c7" />
  <rect x="39" y="37" width="6" height="5" rx="1.2" fill="#0284c7" />

  <!-- Ground Floor Grand Arch Portal (Warm Golden Archway) -->
  <path d="M26 51 V45 A6 6 0 0 1 38 45 V51 Z" fill="#090d16" />
  <path d="M28 51 V45.5 A4 4 0 0 1 36 45.5 V51 Z" fill="url(#gold-grad)" />

  <!-- Base plinth -->
  <rect x="12" y="51" width="40" height="3" rx="1.5" fill="url(#gold-grad)" />
</svg>`;

const appDir = path.resolve(__dirname, '../src/app');
const publicDir = path.resolve(__dirname, '../public');

fs.writeFileSync(path.join(appDir, 'icon.svg'), svgContent, 'utf8');
fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent, 'utf8');
console.log('✓ icon.svg written to src/app/icon.svg and public/icon.svg');

// 2. Generate Pixel-Perfect Raster PNGs using pngjs
function renderIconPNG(size) {
  const png = new PNG({ width: size, height: size });
  const scale = size / 64;

  const bgR1 = 2, bgG1 = 132, bgB1 = 199; // #0284c7
  const bgR2 = 9, bgG2 = 13, bgB2 = 22;   // #090d16

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (size * y + x) << 2;
      const nx = x / scale;
      const ny = y / scale;

      // Squircle distance formula
      const cornerR = 14;
      let inside = true;
      if (nx < cornerR && ny < cornerR) {
        inside = Math.hypot(nx - cornerR, ny - cornerR) <= cornerR;
      } else if (nx > 64 - cornerR && ny < cornerR) {
        inside = Math.hypot(nx - (64 - cornerR), ny - cornerR) <= cornerR;
      } else if (nx < cornerR && ny > 64 - cornerR) {
        inside = Math.hypot(nx - cornerR, ny - (64 - cornerR)) <= cornerR;
      } else if (nx > 64 - cornerR && ny > 64 - cornerR) {
        inside = Math.hypot(nx - (64 - cornerR), ny - (64 - cornerR)) <= cornerR;
      }

      if (!inside) {
        png.data[idx + 3] = 0; // Transparent
        continue;
      }

      // Background gradient
      const t = (nx + ny) / 128;
      let r = Math.round(bgR1 + (bgR2 - bgR1) * t);
      let g = Math.round(bgG1 + (bgG2 - bgG1) * t);
      let b = Math.round(bgB1 + (bgB2 - bgB1) * t);
      let a = 255;

      // Golden Star at top (y: 9 to 23, x: 24 to 40)
      if (ny >= 9 && ny <= 23 && nx >= 24 && nx <= 40) {
        const starDist = Math.hypot(nx - 32, ny - 16);
        if (starDist <= 5.5) {
          r = 245; g = 158; b = 11; // Amber gold
        }
      }

      // Hotel Main Body (White)
      if (nx >= 15 && nx <= 49 && ny >= 26 && ny <= 51) {
        r = 255; g = 255; b = 255;

        // Windows row 1 (y: 30 to 35)
        const inRow1 = ny >= 30 && ny <= 35;
        const inRow2 = ny >= 37 && ny <= 42;
        const inCol1 = nx >= 19 && nx <= 25;
        const inCol2 = nx >= 29 && nx <= 35;
        const inCol3 = nx >= 39 && nx <= 45;

        if ((inRow1 || inRow2) && (inCol1 || inCol2 || inCol3)) {
          r = 2; g = 132; b = 199; // Sky blue windows
        }

        // Grand Arch Portal (y: 45 to 51, x: 26 to 38)
        if (ny >= 45 && nx >= 26 && nx <= 38) {
          const archCenterDist = Math.hypot(nx - 32, ny - 45);
          if (ny >= 45 && archCenterDist <= 6) {
            r = 9; g = 13; b = 22; // Dark portal
            if (archCenterDist <= 4) {
              r = 245; g = 158; b = 11; // Gold inner glow
            }
          }
        }
      }

      // Base plinth
      if (ny >= 51 && ny <= 54 && nx >= 12 && nx <= 52) {
        r = 245; g = 158; b = 11;
      }

      png.data[idx] = r;
      png.data[idx + 1] = g;
      png.data[idx + 2] = b;
      png.data[idx + 3] = a;
    }
  }

  return PNG.sync.write(png);
}

// 3. Build Multi-Resolution ICO File
function createICO(buffers) {
  const count = buffers.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  const dirSize = count * dirEntrySize;
  let offset = headerSize + dirSize;

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // ICO type
  header.writeUInt16LE(count, 4);

  const entries = [];
  for (const item of buffers) {
    const entry = Buffer.alloc(dirEntrySize);
    entry.writeUInt8(item.size >= 256 ? 0 : item.size, 0); // Width
    entry.writeUInt8(item.size >= 256 ? 0 : item.size, 1); // Height
    entry.writeUInt8(0, 2); // Colors
    entry.writeUInt8(0, 3); // Reserved
    entry.writeUInt16LE(1, 4); // Planes
    entry.writeUInt16LE(32, 6); // Bit count
    entry.writeUInt32LE(item.buffer.length, 8); // Size
    entry.writeUInt32LE(offset, 12); // Offset
    entries.push(entry);
    offset += item.buffer.length;
  }

  return Buffer.concat([header, ...entries, ...buffers.map(b => b.buffer)]);
}

const png16 = renderIconPNG(16);
const png32 = renderIconPNG(32);
const png48 = renderIconPNG(48);
const png180 = renderIconPNG(180);

const icoBuffer = createICO([
  { size: 16, buffer: png16 },
  { size: 32, buffer: png32 },
  { size: 48, buffer: png48 }
]);

fs.writeFileSync(path.join(appDir, 'favicon.ico'), icoBuffer);
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);
fs.writeFileSync(path.join(appDir, 'apple-icon.png'), png180);
fs.writeFileSync(path.join(publicDir, 'apple-icon.png'), png180);
console.log('✓ favicon.ico (16/32/48) & apple-icon.png (180x180) created successfully!');
