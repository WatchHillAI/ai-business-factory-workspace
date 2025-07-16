const fs = require('fs');

// Simple SVG template for icons
const createIcon = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#1e40af"/>
  <rect x="${size*0.1}" y="${size*0.1}" width="${size*0.8}" height="${size*0.8}" fill="white" rx="${size*0.05}"/>
  <rect x="${size*0.15}" y="${size*0.15}" width="${size*0.2}" height="${size*0.2}" fill="#1e40af" rx="${size*0.02}"/>
  <rect x="${size*0.4}" y="${size*0.15}" width="${size*0.2}" height="${size*0.2}" fill="#1e40af" rx="${size*0.02}"/>
  <rect x="${size*0.65}" y="${size*0.15}" width="${size*0.2}" height="${size*0.2}" fill="#1e40af" rx="${size*0.02}"/>
  <rect x="${size*0.15}" y="${size*0.4}" width="${size*0.2}" height="${size*0.2}" fill="#1e40af" rx="${size*0.02}"/>
  <rect x="${size*0.4}" y="${size*0.4}" width="${size*0.2}" height="${size*0.2}" fill="#1e40af" rx="${size*0.02}"/>
  <rect x="${size*0.65}" y="${size*0.4}" width="${size*0.2}" height="${size*0.2}" fill="#1e40af" rx="${size*0.02}"/>
  <rect x="${size*0.15}" y="${size*0.65}" width="${size*0.45}" height="${size*0.2}" fill="#1e40af" rx="${size*0.02}"/>
  <rect x="${size*0.65}" y="${size*0.65}" width="${size*0.2}" height="${size*0.2}" fill="#1e40af" rx="${size*0.02}"/>
</svg>`;

// Create icon files
const sizes = [192, 512];
sizes.forEach(size => {
  const svg = createIcon(size);
  fs.writeFileSync(`public/pwa-${size}x${size}.png.svg`, svg);
  console.log(`Created SVG for ${size}x${size}`);
});

// Create a simple favicon.ico placeholder
fs.writeFileSync('public/favicon.ico', '');
console.log('Created favicon.ico placeholder');

console.log('Icon creation complete!');