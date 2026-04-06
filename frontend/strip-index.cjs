// strip-modern.js
// Removes Vite modern <script type="module"> blocks from dist/index.html
// Keeps only legacy (nomodule + SystemJS) scripts for LG webOS

const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'dist', 'index.html');

if (!fs.existsSync(indexPath)) {
  console.error('❌ dist/index.html not found. Did you run vite build?');
  process.exit(1);
}

let html = fs.readFileSync(indexPath, 'utf8');

// 1. Remove ALL <script type="module">...</script>
html = html.replace(
  /<script\s+type="module"[\s\S]*?<\/script>\s*/gi,
  ''
);

// 2. Remove Vite's nomodule compatibility detection shim
html = html.replace(
  /<script\s+nomodule>[\s\S]*?<\/script>\s*/gi,
  ''
);

// 3. Sanity check: ensure legacy entry still exists
if (!html.includes('vite-legacy-entry')) {
  console.error('❌ Legacy entry script not found. Build is not legacy-compatible.');
  process.exit(1);
}

fs.writeFileSync(indexPath.replace("index.html", "lg.html"), html, 'utf8');

console.log('✅ Modern scripts stripped. lg.html is now legacy-only.');