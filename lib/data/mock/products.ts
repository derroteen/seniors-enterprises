import type {
  Category,
  Product,
  ProductVariant,
} from "@/lib/data/types";

const shoesCategoryId = "00000000-0000-4000-8000-000000000001";
const clothingCategoryId = "00000000-0000-4000-8000-000000000002";
const createdAt = "2026-11-01T00:00:00.000Z";

export const mockCategories: Category[] = [
  {
    id: shoesCategoryId,
    name: "Shoes",
    slug: "shoes",
    parent_id: null,
    image_url: "/placeholders/shoes.svg",
    created_at: createdAt,
  },
  {
    id: clothingCategoryId,
    name: "Clothing",
    slug: "clothing",
    parent_id: null,
    image_url: "/placeholders/clothing.svg",
    created_at: createdAt,
  },
];

type MockProductSeed = {
  categoryId: string;
  colors: string[];
  compareAtPrice?: number;
  description: string;
  featured?: boolean;
  imageKind: string;
  name: string;
  price: number;
  sizes: string[];
  slug: string;
};

const shoeSizes = ["38", "39", "40", "41", "42", "43", "44", "45"];
const clothingSizes = ["S", "M", "L", "XL", "XXL"];

const seeds: MockProductSeed[] = [
  {
    name: "Mara Everyday Sneaker",
    slug: "mara-everyday-sneaker",
    categoryId: shoesCategoryId,
    imageKind: "sneaker",
    price: 5200,
    compareAtPrice: 6400,
    description: "A lightweight everyday sneaker with a cushioned sole and clean profile.",
    colors: ["Cloud White", "Navy", "Stone"],
    sizes: shoeSizes,
    featured: true,
  },
  {
    name: "Kito Court Sneaker",
    slug: "kito-court-sneaker",
    categoryId: shoesCategoryId,
    imageKind: "sneaker",
    price: 4800,
    description: "A versatile court-inspired pair designed for all-day comfort.",
    colors: ["White", "Forest", "Black"],
    sizes: shoeSizes,
  },
  {
    name: "Safi Knit Runner",
    slug: "safi-knit-runner",
    categoryId: shoesCategoryId,
    imageKind: "sneaker",
    price: 6100,
    compareAtPrice: 7200,
    description: "Breathable knit uppers and a supportive sole for active days.",
    colors: ["Charcoal", "Blue", "Sand"],
    sizes: shoeSizes,
  },
  {
    name: "Imani Leather Loafer",
    slug: "imani-leather-loafer",
    categoryId: shoesCategoryId,
    imageKind: "loafer",
    price: 7400,
    description: "A polished leather loafer that moves easily from work to weekend.",
    colors: ["Cognac", "Black"],
    sizes: shoeSizes,
    featured: true,
  },
  {
    name: "Jabari Penny Loafer",
    slug: "jabari-penny-loafer",
    categoryId: shoesCategoryId,
    imageKind: "loafer",
    price: 7900,
    compareAtPrice: 9200,
    description: "A classic penny detail with a flexible, comfortable construction.",
    colors: ["Dark Brown", "Black", "Burgundy"],
    sizes: shoeSizes,
  },
  {
    name: "Zuri Suede Loafer",
    slug: "zuri-suede-loafer",
    categoryId: shoesCategoryId,
    imageKind: "loafer",
    price: 6800,
    description: "Soft suede texture and a refined silhouette for everyday dressing.",
    colors: ["Taupe", "Navy"],
    sizes: shoeSizes,
  },
  {
    name: "Amani City Sandal",
    slug: "amani-city-sandal",
    categoryId: shoesCategoryId,
    imageKind: "sandal",
    price: 3400,
    compareAtPrice: 4100,
    description: "A supportive, easy-to-wear sandal with adjustable straps.",
    colors: ["Tan", "Black", "Olive"],
    sizes: shoeSizes,
    featured: true,
  },
  {
    name: "Nia Comfort Slide",
    slug: "nia-comfort-slide",
    categoryId: shoesCategoryId,
    imageKind: "sandal",
    price: 2200,
    description: "A soft contoured footbed makes this slide a daily favorite.",
    colors: ["Cream", "Rose", "Black"],
    sizes: shoeSizes,
  },
  {
    name: "Taji Braided Sandal",
    slug: "taji-braided-sandal",
    categoryId: shoesCategoryId,
    imageKind: "sandal",
    price: 3900,
    description: "An understated braided upper paired with a cushioned footbed.",
    colors: ["Natural", "Cocoa"],
    sizes: shoeSizes,
  },
  {
    name: "Baraka Trail Boot",
    slug: "baraka-trail-boot",
    categoryId: shoesCategoryId,
    imageKind: "boot",
    price: 8600,
    compareAtPrice: 9900,
    description: "A sturdy, weather-ready boot with dependable traction.",
    colors: ["Dark Brown", "Black"],
    sizes: shoeSizes,
  },
  {
    name: "Kendi Chelsea Boot",
    slug: "kendi-chelsea-boot",
    categoryId: shoesCategoryId,
    imageKind: "boot",
    price: 9100,
    description: "A clean Chelsea shape with elastic side panels and a comfortable fit.",
    colors: ["Black", "Chestnut", "Taupe"],
    sizes: shoeSizes,
    featured: true,
  },
  {
    name: "Mosi Desert Boot",
    slug: "mosi-desert-boot",
    categoryId: shoesCategoryId,
    imageKind: "boot",
    price: 7800,
    compareAtPrice: 8500,
    description: "A relaxed suede desert boot with a flexible crepe-style sole.",
    colors: ["Sand", "Olive"],
    sizes: shoeSizes,
  },
  {
    name: "Essential Cotton Tee",
    slug: "essential-cotton-tee",
    categoryId: clothingCategoryId,
    imageKind: "tee",
    price: 1500,
    description: "A soft, breathable cotton tee with a reliable everyday fit.",
    colors: ["White", "Navy", "Black"],
    sizes: clothingSizes,
    featured: true,
  },
  {
    name: "Ribbed Crew Tee",
    slug: "ribbed-crew-tee",
    categoryId: clothingCategoryId,
    imageKind: "tee",
    price: 1800,
    compareAtPrice: 2200,
    description: "A ribbed crew-neck tee with a neat, easy-to-layer profile.",
    colors: ["Ivory", "Sage"],
    sizes: clothingSizes,
  },
  {
    name: "Weekend Pocket Tee",
    slug: "weekend-pocket-tee",
    categoryId: clothingCategoryId,
    imageKind: "tee",
    price: 1700,
    description: "A relaxed cotton tee finished with a subtle chest pocket.",
    colors: ["Stone", "Blue", "White"],
    sizes: clothingSizes,
  },
  {
    name: "Cloud Fleece Hoodie",
    slug: "cloud-fleece-hoodie",
    categoryId: clothingCategoryId,
    imageKind: "hoodie",
    price: 3900,
    compareAtPrice: 4600,
    description: "A soft fleece layer with a roomy hood and practical front pocket.",
    colors: ["Heather Grey", "Navy", "Forest"],
    sizes: clothingSizes,
    featured: true,
  },
  {
    name: "Everyday Zip Hoodie",
    slug: "everyday-zip-hoodie",
    categoryId: clothingCategoryId,
    imageKind: "hoodie",
    price: 4400,
    description: "An easy zip-through hoodie for comfortable layering.",
    colors: ["Charcoal", "Oat"],
    sizes: clothingSizes,
  },
  {
    name: "Classic Straight Jean",
    slug: "classic-straight-jean",
    categoryId: clothingCategoryId,
    imageKind: "jeans",
    price: 4200,
    description: "A versatile straight-leg jean in durable, comfortable denim.",
    colors: ["Indigo", "Washed Black"],
    sizes: clothingSizes,
  },
  {
    name: "Relaxed Taper Jean",
    slug: "relaxed-taper-jean",
    categoryId: clothingCategoryId,
    imageKind: "jeans",
    price: 4500,
    compareAtPrice: 5200,
    description: "A relaxed fit through the leg with a clean tapered finish.",
    colors: ["Mid Blue", "Deep Indigo", "Black"],
    sizes: clothingSizes,
    featured: true,
  },
  {
    name: "Indigo Everyday Jean",
    slug: "indigo-everyday-jean",
    categoryId: clothingCategoryId,
    imageKind: "jeans",
    price: 3900,
    description: "An easy everyday jean made for comfort and repeat wear.",
    colors: ["Indigo", "Light Wash"],
    sizes: clothingSizes,
  },
  {
    name: "Asha Day Dress",
    slug: "asha-day-dress",
    categoryId: clothingCategoryId,
    imageKind: "dress",
    price: 3600,
    compareAtPrice: 4300,
    description: "A breathable day dress with a softly defined waist and easy drape.",
    colors: ["Navy Floral", "Terracotta"],
    sizes: clothingSizes,
    featured: true,
  },
  {
    name: "Nuru Shirt Dress",
    slug: "nuru-shirt-dress",
    categoryId: clothingCategoryId,
    imageKind: "dress",
    price: 4100,
    description: "A versatile shirt dress with a relaxed shape and useful side pockets.",
    colors: ["Olive", "Blue Stripe", "Sand"],
    sizes: clothingSizes,
  },
  {
    name: "Linen Blend Shirt",
    slug: "linen-blend-shirt",
    categoryId: clothingCategoryId,
    imageKind: "shirt",
    price: 3200,
    description: "A breathable linen-blend shirt with a clean button-front finish.",
    colors: ["White", "Sky Blue", "Stone"],
    sizes: clothingSizes,
    featured: true,
  },
  {
    name: "Oxford Everyday Shirt",
    slug: "oxford-everyday-shirt",
    categoryId: clothingCategoryId,
    imageKind: "shirt",
    price: 3500,
    compareAtPrice: 4200,
    description: "A versatile Oxford shirt with a comfortable, polished everyday fit.",
    colors: ["White", "Blue", "Soft Pink"],
    sizes: clothingSizes,
  },
];

function makeUuid(prefix: string, value: number) {
  return `${prefix}-0000-4000-8000-${String(value).padStart(12, "0")}`;
}

function makeDate(index: number) {
  return new Date(Date.UTC(2026, 10, 21 - index)).toISOString();
}

function createVariants(
  productId: string,
  seed: MockProductSeed,
  productIndex: number,
): ProductVariant[] {
  let variantIndex = 0;

  return seed.sizes.flatMap((size, sizeIndex) =>
    seed.colors.map((color, colorIndex) => {
      variantIndex += 1;
      const stock = (productIndex + sizeIndex + colorIndex) % 9 === 0
        ? 0
        : 2 + ((productIndex + sizeIndex + colorIndex) % 8);

      return {
        id: makeUuid("20000000", productIndex * 100 + variantIndex),
        product_id: productId,
        size,
        color,
        sku: `SE-MOCK-${String(productIndex * 100 + variantIndex).padStart(4, "0")}`,
        stock_quantity: stock,
        price_override_kes:
          (productIndex + sizeIndex + colorIndex) % 13 === 0
            ? seed.price + 300
            : null,
      };
    }),
  );
}

export const mockProducts: Product[] = seeds.map((seed, index) => {
  const productId = makeUuid("10000000", index + 1);
  const created_at = makeDate(index);

  return {
    id: productId,
    name: seed.name,
    slug: seed.slug,
    description: seed.description,
    category_id: seed.categoryId,
    base_price_kes: seed.price,
    compare_at_price_kes: seed.compareAtPrice ?? null,
    is_active: true,
    is_featured: Boolean(seed.featured),
    created_at,
    updated_at: created_at,
    images: [
      {
        id: makeUuid("30000000", index + 1),
        product_id: productId,
        url: `/placeholders/${seed.imageKind}.svg`,
        alt_text: `${seed.name} product placeholder`,
        sort_order: 0,
      },
    ],
    variants: createVariants(productId, seed, index + 1),
  };
});

export const MOCK_SHOE_SIZES = shoeSizes;
export const MOCK_CLOTHING_SIZES = clothingSizes;
