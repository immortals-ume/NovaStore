// Generates the flat garment illustrations used as placeholder product images.
// Usage: node backend/scripts/generate-product-art.js
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { COLORS, PRODUCTS } from './catalogData.js';

const OUT_DIR = path.resolve(import.meta.dirname, '../../frontend/public/images/products');

// Each garment: `body` is filled with the colorway, `shade` with a darker tone,
// `lines` are detail strokes and `dots` are buttons. Drawn on a 400x500 canvas.
const GARMENTS = {
  tops: {
    body: 'M140 92 L172 80 Q200 104 228 80 L260 92 L332 134 L306 190 L270 174 L270 404 L130 404 L130 174 L94 190 L68 134 Z',
    lines: ['M172 80 Q200 118 228 80', 'M130 390 L270 390', 'M94 190 L68 134'],
  },
  shirts: {
    body: 'M150 86 L176 76 L200 100 L224 76 L250 86 L300 110 L336 334 L306 342 L276 182 L276 412 L124 412 L124 182 L94 342 L64 334 L100 110 Z',
    shade: ['M176 76 L200 100 L186 122 L162 92 Z', 'M224 76 L200 100 L214 122 L238 92 Z', 'M64 334 L94 342 L97 324 L67 316 Z', 'M336 334 L306 342 L303 324 L333 316 Z'],
    lines: ['M200 100 L200 412', 'M222 150 L252 150 L252 186 L222 186 Z'],
    dots: [[200, 140], [200, 190], [200, 240], [200, 290], [200, 340]],
  },
  knitwear: {
    body: 'M146 96 Q200 126 254 96 L300 116 L336 342 L302 350 L272 192 L272 402 L128 402 L128 192 L98 350 L64 342 L100 116 Z',
    shade: ['M150 99 Q148 40 200 36 Q252 40 250 99 Q200 128 150 99 Z', 'M128 384 L272 384 L272 402 L128 402 Z', 'M64 342 L98 350 L101 332 L67 324 Z', 'M336 342 L302 350 L299 332 L333 324 Z'],
    lines: ['M160 302 L240 302 L256 360 L144 360 Z', 'M188 116 L186 168', 'M212 116 L214 168'],
  },
  outerwear: {
    body: 'M146 80 L200 96 L254 80 L306 106 L340 362 L308 370 L282 202 L286 442 L114 442 L118 202 L92 370 L60 362 L94 106 Z',
    shade: ['M146 80 L200 96 L200 226 L164 150 L172 108 Z', 'M254 80 L200 96 L200 226 L236 150 L228 108 Z'],
    lines: ['M200 226 L200 442', 'M134 330 L178 330', 'M222 330 L266 330', 'M60 362 L92 370'],
    dots: [[212, 262], [212, 310], [212, 358]],
  },
  jeans: {
    body: 'M128 70 L272 70 L288 442 L214 442 L200 172 L186 442 L112 442 Z',
    shade: ['M128 70 L272 70 L273 94 L127 94 Z'],
    lines: ['M200 94 L200 166', 'M140 98 Q160 126 182 98', 'M218 98 Q240 126 260 98', 'M112 424 L186 424', 'M214 424 L288 424'],
  },
  trousers: {
    body: 'M134 70 L266 70 L278 442 L214 442 L200 168 L186 442 L122 442 Z',
    shade: ['M134 70 L266 70 L267 92 L133 92 Z'],
    lines: ['M160 96 L152 442', 'M240 96 L248 442', 'M200 92 L200 160'],
  },
  shorts: {
    body: 'M124 120 L276 120 L292 332 L210 348 L200 232 L190 348 L108 332 Z',
    shade: ['M124 120 L276 120 L277 144 L123 144 Z'],
    lines: ['M200 144 L200 222', 'M136 150 Q156 176 178 150', 'M222 150 Q244 176 264 150', 'M110 316 L190 330', 'M210 330 L290 316'],
  },
  dresses: {
    body: 'M168 66 L182 66 Q200 92 218 66 L232 66 L242 152 Q230 190 236 212 L322 432 Q200 458 78 432 L164 212 Q170 190 158 152 Z',
    shade: ['M164 212 Q200 224 236 212 L238 228 Q200 240 162 228 Z'],
    lines: ['M190 240 L170 444', 'M210 240 L230 444'],
  },
  skirts: {
    body: 'M146 128 L254 128 L322 402 Q200 428 78 402 Z',
    shade: ['M146 128 L254 128 L257 154 L143 154 Z'],
    lines: ['M174 154 L146 410', 'M200 154 L200 416', 'M226 154 L254 410'],
  },
  activewear: {
    body: 'M140 70 L260 70 L252 442 L210 442 L200 164 L190 442 L148 442 Z',
    shade: ['M140 70 L260 70 L259 104 L141 104 Z'],
    accent: ['M146 104 L156 442 L164 442 L154 104 Z', 'M254 104 L244 442 L236 442 L246 104 Z'],
  },
};

/**
 * @param {string} hex - Color as `#rrggbb`.
 * @returns {number} Relative brightness from 0 (black) to 1 (white).
 */
const luminance = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/**
 * @param {string} hex - Color as `#rrggbb`.
 * @param {number} amount - How much to darken, from 0 to 1.
 * @returns {string} The darker color as `#rrggbb`.
 */
const darken = (hex, amount) =>
  `#${[1, 3, 5]
    .map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * (1 - amount)).toString(16).padStart(2, '0'))
    .join('')}`;

/**
 * Draws one garment as an SVG. Detail colors switch between dark and light so
 * they stay visible on the garment color.
 * @param {string} category - Category slug, picks the garment shape.
 * @param {string} hex - Garment color as `#rrggbb`.
 * @param {boolean} kids - Draw a smaller garment for kids products.
 * @returns {string} SVG markup.
 */
const render = (category, hex, kids) => {
  const g = GARMENTS[category];
  const light = luminance(hex) > 0.6;
  const detail = light ? 'rgba(0,0,0,0.22)' : 'rgba(255,255,255,0.22)';
  const outline = light ? 'rgba(0,0,0,0.18)' : 'none';
  const accent = light ? '#1f1f1f' : '#f6f4ef';
  const transform = kids ? 'translate(40 62) scale(0.8)' : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" role="img">
  <rect width="400" height="500" fill="#f2efea"/>
  <ellipse cx="200" cy="468" rx="130" ry="10" fill="#000" opacity="0.06"/>
  <g transform="${transform}" stroke-linejoin="round" stroke-linecap="round">
    <path d="${g.body}" fill="${hex}" stroke="${outline}" stroke-width="2"/>
    ${(g.shade ?? []).map((d) => `<path d="${d}" fill="${darken(hex, 0.18)}"/>`).join('\n    ')}
    ${(g.accent ?? []).map((d) => `<path d="${d}" fill="${accent}"/>`).join('\n    ')}
    ${(g.lines ?? []).map((d) => `<path d="${d}" fill="none" stroke="${detail}" stroke-width="3"/>`).join('\n    ')}
    ${(g.dots ?? []).map(([cx, cy]) => `<circle cx="${cx}" cy="${cy}" r="4.5" fill="${detail}"/>`).join('\n    ')}
  </g>
</svg>
`;
};

await mkdir(OUT_DIR, { recursive: true });
const written = new Set();
for (const { category, colorKey, department, image } of PRODUCTS) {
  if (written.has(image)) continue;
  written.add(image);
  await writeFile(path.join(OUT_DIR, path.basename(image)), render(category, COLORS[colorKey].hex, department === 'kids'));
}
console.log(`Wrote ${written.size} illustrations to ${path.relative(process.cwd(), OUT_DIR)}`);
