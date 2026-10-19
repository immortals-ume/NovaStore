// The store's clothing taxonomy. Slugs are stored on products and used in URLs.
export const DEPARTMENTS = [
  { slug: 'women', name: 'Women' },
  { slug: 'men', name: 'Men' },
  { slug: 'kids', name: 'Kids' },
];

const ALL = DEPARTMENTS.map((d) => d.slug);

export const CATEGORIES = [
  { slug: 'tops', name: 'T-Shirts & Tops', departments: ALL },
  { slug: 'shirts', name: 'Shirts', departments: ALL },
  { slug: 'knitwear', name: 'Sweaters & Hoodies', departments: ALL },
  { slug: 'outerwear', name: 'Jackets & Coats', departments: ALL },
  { slug: 'jeans', name: 'Jeans', departments: ALL },
  { slug: 'trousers', name: 'Trousers', departments: ALL },
  { slug: 'shorts', name: 'Shorts', departments: ALL },
  { slug: 'dresses', name: 'Dresses', departments: ['women', 'kids'] },
  { slug: 'skirts', name: 'Skirts', departments: ['women', 'kids'] },
  { slug: 'activewear', name: 'Activewear', departments: ALL },
];

export const ADULT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
export const KIDS_SIZES = ['2-3Y', '4-5Y', '6-7Y', '8-9Y', '10-11Y', '12-13Y'];
export const SIZES = [...ADULT_SIZES, ...KIDS_SIZES];

export const DEPARTMENT_SLUGS = DEPARTMENTS.map((d) => d.slug);
export const CATEGORY_SLUGS = CATEGORIES.map((c) => c.slug);

/**
 * Checks whether a clothing category is sold in a department (e.g. dresses are not sold in men).
 * @param {string} category - Category slug, e.g. `dresses`.
 * @param {string} department - Department slug, e.g. `men`.
 * @returns {boolean} True when the category belongs to the department.
 */
export const categoryAllowedIn = (category, department) =>
  CATEGORIES.find((c) => c.slug === category)?.departments.includes(department) ?? false;
