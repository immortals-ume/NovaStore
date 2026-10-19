import { ADULT_SIZES, KIDS_SIZES } from '../lib/catalog.js';

// Colorways used for product illustrations; keys are used in image file names.
export const COLORS = {
  black: { name: 'Black', hex: '#1f1f1f' },
  white: { name: 'White', hex: '#f6f4ef' },
  navy: { name: 'Navy', hex: '#1f2a44' },
  olive: { name: 'Olive', hex: '#6b6f3a' },
  sand: { name: 'Sand', hex: '#d8c3a0' },
  rust: { name: 'Rust', hex: '#b5562e' },
  sky: { name: 'Sky Blue', hex: '#8fb8de' },
  sage: { name: 'Sage', hex: '#9caf88' },
  blush: { name: 'Blush', hex: '#e8b4b0' },
  charcoal: { name: 'Charcoal', hex: '#3d3d3d' },
  indigo: { name: 'Indigo', hex: '#2f4b7c' },
  lightwash: { name: 'Light Wash', hex: '#8aa6c1' },
  cream: { name: 'Cream', hex: '#efe6d2' },
  burgundy: { name: 'Burgundy', hex: '#6e2233' },
  mustard: { name: 'Mustard', hex: '#d4a237' },
  forest: { name: 'Forest', hex: '#2f5d46' },
  grey: { name: 'Heather Grey', hex: '#a3a3a3' },
};

const p = (department, category, color, name, brand, price, countInStock, description) => ({
  department,
  category,
  color: COLORS[color].name,
  colorKey: color,
  name,
  brand,
  price,
  countInStock,
  description,
  sizes: department === 'kids' ? KIDS_SIZES : ADULT_SIZES,
  image: `/images/products/${category}-${color}${department === 'kids' ? '-kids' : ''}.svg`,
});

export const PRODUCTS = [
  // Women
  p('women', 'tops', 'white', 'Essential Crew Tee', 'Nova Basics', 22, 80, 'Midweight organic cotton tee with a clean crew neck and a relaxed, easy fit.'),
  p('women', 'tops', 'blush', 'Ribbed Fitted Tee', 'Atelier Nova', 28, 45, 'Stretch-rib cotton that hugs without clinging. Pairs with everything.'),
  p('women', 'shirts', 'cream', 'Relaxed Poplin Shirt', 'Atelier Nova', 64, 30, 'Crisp cotton poplin cut oversized, with a dropped shoulder and curved hem.'),
  p('women', 'shirts', 'sky', 'Washed Oxford Shirt', 'Coastline', 58, 26, 'Soft-washed oxford cloth with a button-down collar and chest pocket.'),
  p('women', 'knitwear', 'sand', 'Merino Crew Sweater', 'Atelier Nova', 89, 22, 'Fine-gauge extra-fine merino that layers neatly under a coat.'),
  p('women', 'knitwear', 'sage', 'Brushed Fleece Hoodie', 'Nova Basics', 59, 40, 'Heavyweight brushed-back fleece with a lined hood and kangaroo pocket.'),
  p('women', 'outerwear', 'sand', 'Classic Trench Coat', 'Northbound', 189, 12, 'Water-repellent cotton gabardine with storm flap, belt and horn buttons.'),
  p('women', 'outerwear', 'black', 'Wool-Blend Car Coat', 'Northbound', 169, 10, 'A clean, hip-length coat in a warm wool blend with a notch lapel.'),
  p('women', 'jeans', 'lightwash', 'High-Rise Straight Jeans', 'Indigo Mill', 79, 35, 'Rigid-look denim with a touch of stretch, high rise and a straight leg.'),
  p('women', 'jeans', 'indigo', 'Wide-Leg Jeans', 'Indigo Mill', 85, 28, 'Dark rinse denim with a full-length wide leg and a fitted waist.'),
  p('women', 'trousers', 'black', 'Tailored Wide Trousers', 'Atelier Nova', 79, 24, 'Fluid twill trousers with pressed creases and a high, flat-front waist.'),
  p('women', 'shorts', 'cream', 'Linen Pull-On Shorts', 'Coastline', 42, 30, 'Breezy linen with an elasticated waist and side pockets.'),
  p('women', 'dresses', 'black', 'Slip Midi Dress', 'Atelier Nova', 95, 18, 'Bias-cut satin midi with adjustable straps and a softly draped neckline.'),
  p('women', 'dresses', 'mustard', 'Linen Sundress', 'Coastline', 78, 20, 'Lightweight linen with thin straps, a fitted bodice and a full skirt.'),
  p('women', 'skirts', 'burgundy', 'Pleated Midi Skirt', 'Atelier Nova', 69, 16, 'Knife-pleated midi skirt with a smooth waistband and a hidden zip.'),
  p('women', 'activewear', 'charcoal', 'Sculpt High-Waist Leggings', 'Stride', 58, 50, 'Squat-proof, sweat-wicking leggings with a high, supportive waistband.'),

  // Men
  p('men', 'tops', 'black', 'Heavyweight Pocket Tee', 'Nova Basics', 26, 90, 'Dense 240gsm cotton with a boxy fit, chest pocket and a collar that keeps its shape.'),
  p('men', 'tops', 'grey', 'Everyday Crew Tee', 'Nova Basics', 20, 120, 'Soft heather jersey in a regular fit. The one you reach for first.'),
  p('men', 'shirts', 'white', 'Oxford Button-Down', 'Urban Thread', 59, 40, 'Classic oxford cloth with a button-down collar, perfect tucked or untucked.'),
  p('men', 'shirts', 'olive', 'Twill Overshirt', 'Northbound', 79, 25, 'Brushed cotton twill heavy enough to wear as a light jacket.'),
  p('men', 'knitwear', 'navy', 'Lambswool Crewneck', 'Urban Thread', 85, 20, 'Warm, soft lambswool in a classic fit with ribbed cuffs and hem.'),
  p('men', 'knitwear', 'charcoal', 'Loopback Hoodie', 'Nova Basics', 65, 45, 'Japanese-style loopback cotton with a double-layer hood.'),
  p('men', 'outerwear', 'olive', 'Field Jacket', 'Northbound', 149, 14, 'Waxed-cotton field jacket with four bellows pockets and a cord collar.'),
  p('men', 'outerwear', 'navy', 'Wool Overcoat', 'Northbound', 229, 8, 'Single-breasted overcoat in Italian wool, fully lined.'),
  p('men', 'jeans', 'indigo', 'Slim Selvedge Jeans', 'Indigo Mill', 98, 30, '13oz selvedge denim in a slim, tapered fit that breaks in beautifully.'),
  p('men', 'jeans', 'black', 'Straight Black Jeans', 'Indigo Mill', 82, 32, 'Stay-black denim with a straight leg and a mid rise.'),
  p('men', 'trousers', 'sand', 'Tapered Chinos', 'Urban Thread', 69, 40, 'Garment-dyed cotton twill with a little stretch and a tapered leg.'),
  p('men', 'shorts', 'navy', 'Chino Shorts', 'Coastline', 45, 35, 'Seven-inch inseam chino shorts with a flat front.'),
  p('men', 'activewear', 'forest', 'Training Joggers', 'Stride', 62, 38, 'Four-way stretch joggers with zip pockets and tapered cuffs.'),

  // Kids
  p('kids', 'tops', 'mustard', 'Kids Sunshine Tee', 'Little Nova', 16, 60, 'Soft, durable cotton tee built for playground days.'),
  p('kids', 'knitwear', 'rust', 'Kids Zip Hoodie', 'Little Nova', 32, 40, 'Cosy fleece hoodie with a full zip that little hands can manage.'),
  p('kids', 'outerwear', 'sky', 'Kids Puffer Jacket', 'Little Nova', 59, 25, 'Lightweight, warm and water-resistant, with a packable hood.'),
  p('kids', 'jeans', 'lightwash', 'Kids Easy-Fit Jeans', 'Little Nova', 34, 45, 'Stretch denim with an adjustable waist for a growing fit.'),
  p('kids', 'dresses', 'blush', 'Kids Twirl Dress', 'Little Nova', 38, 30, 'Cotton jersey dress with a full skirt made for spinning.'),
  p('kids', 'shorts', 'sage', 'Kids Play Shorts', 'Little Nova', 18, 50, 'Pull-on shorts with an elastic waist and reinforced seams.'),
  p('kids', 'activewear', 'navy', 'Kids Track Pants', 'Stride', 28, 40, 'Quick-dry track pants with a side stripe and soft lining.'),
];
