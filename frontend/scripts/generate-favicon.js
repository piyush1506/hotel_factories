const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

// 1. SVG Favicon Content
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <defs>
    <linearGradient id="hf-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0284c7" />
      <stop offset="100%" stop-color="#001f4d" />
    </linearGradient>
    <linearGradient id="gold-crown" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fde047" />
      <stop offset="100%" stop-color="#f59e0b" />
    </linearGradient>
  </defs>

  <!-- Squircle Base with smooth rounded corners -->
  <rect width="64" height="64" rx="16" fill="url(#hf-bg)" />
  <rect x="1" y="1" width="62" height="62" rx="15" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="1.5" />

  <!-- 5-Star Luxury Crown on Top -->
  <path d="M22 19 L27 14 L32 17 L37 14 L42 19 Z" fill="url(#gold-crown)" />
  <circle cx="32" cy="11" r="2.2" fill="#fbbf24" />

  <!-- Grand Hotel Architecture Body (Pure White) -->
  <path d="M16 22 H48 A2 2 0 0 1 50 24 V49 H14 V24 A2 2 0 0 1 16 22 Z" fill="#ffffff" />

  <!-- Hotel Upper Floor Windows (Sky Blue) -->
  <rect x="19" y="26" width="5.5" height="5.5" rx="1.2" fill="#0284c7" />
  <rect x="29.2" y="26" width="5.5" height="5.5" rx="1.2" fill="#0284c7" />
  <rect x="39.5" y="26" width="5.5" height="5.5" rx="1.2" fill="#0284c7" />

  <rect x="19" y="34.5" width="5.5" height="5.5" rx="1.2" fill="#0284c7" />
  <rect x="29.2" y="34.5" width="5.5" height="5.5" rx="1.2" fill="#0284c7" />
  <rect x="39.5" y="34.5" width="5.5" height="5.5" rx="1.2" fill="#0284c7" />

  <!-- Ground Floor Grand Arch Portal -->
  <path d="M25 49 V41 A7 7 0 0 1 39 41 V49 Z" fill="#001f4d" />
  <path d="M27.5 49 V42 A4.5 4.5 0 0 1 36.5 42 V49 Z" fill="#f59e0b" opacity="0.95" />

  <!-- Base plinth -->
  <rect x="12" y="49" width="40" height="3" rx="1.5" fill="#f59e0b" />
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
  const bgR2 = 0, bgG2 = 31, bgB2 = 77;   // #001f4d

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

      // Crown / Star at top (y: 10 to 19, x: 22 to 42)
      if (ny >= 10 && ny <= 19 && nx >= 20 && nx <= 44) {
        const starDist = Math.hypot(nx - 32, ny - 11.5);
        if (starDist <= 2.5) {
          r = 251; g = 191; b = 36; // Amber gold
        } else if (ny >= 14 && ny <= 19) {
          const dy = ny - 14;
          if (nx >= 22 + dy * 0.5 && nx <= 42 - dy * 0.5) {
            r = 245; g = 158; b = 11;
          }
        }
      }

      // Hotel Main Body (White)
      if (nx >= 15 && nx <= 49 && ny >= 22 && ny <= 49) {
        r = 255; g = 255; b = 255;

        // Windows row 1 (y: 26 to 31.5)
        const inRow1 = ny >= 26 && ny <= 31.5;
        const inRow2 = ny >= 34.5 && ny <= 40;
        const inCol1 = nx >= 19 && nx <= 24.5;
        const inCol2 = nx >= 29.2 && nx <= 34.8;
        const inCol3 = nx >= 39.5 && nx <= 45;

        if ((inRow1 || inRow2) && (inCol1 || inCol2 || inCol3)) {
          r = 2; g = 132; b = 199; // Sky blue windows
        }

        // Grand Arch Portal (y: 41 to 49, x: 25 to 39)
        if (ny >= 41 && nx >= 25 && nx <= 39) {
          const archCenterDist = Math.hypot(nx - 32, ny - 41);
          if (ny >= 41 && archCenterDist <= 7) {
            r = 0; g = 31; b = 77; // Dark navy portal
            if (archCenterDist <= 4.5) {
              r = 245; g = 158; b = 11; // Gold inner glow
            }
          }
        }
      }

      // Base plinth
      if (ny >= 49 && ny <= 52 && nx >= 12 && nx <= 52) {
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

