/** Shared domain types for the catalog. */

export type Brand = "Apple" | "Samsung" | "Xiaomi" | "Motorola" | "Acessórios";

export type Category = "smartphones" | "acessorios";

/**
 * Describes how a device is drawn by `<DeviceRender>` when no real
 * photography exists yet. Once `photos` is populated on a product, the
 * renderer steps aside and the photograph is used instead.
 */
export type DeviceRender = {
  /** Back-panel finish, from the top-left of the light to the bottom-right. */
  body: [string, string];
  /** Rail / frame metal. */
  frame: [string, string];
  /** Screen wallpaper gradient, used for the front-facing view. */
  screen: [string, string];
  cameraLayout: "square" | "vertical" | "pill" | "circle";
  cameraCount: 1 | 2 | 3 | 4;
  /** Front cutout style. */
  cutout: "island" | "punch" | "none";
  /** True for a light-coloured body — flips internal contrast. */
  light?: boolean;
};

export type ColorOption = {
  name: string;
  /** Swatch fill. Two stops read as a metal; one reads as a flat paint. */
  swatch: [string, string];
  render?: Partial<DeviceRender>;
};

export type StorageOption = {
  label: string;
  /** Added to the base price, in BRL. */
  priceDelta: number;
};

export type Highlight = {
  label: string;
  value: string;
  detail: string;
};

export type SpecGroup = {
  group: string;
  items: { label: string; value: string }[];
};

export type Product = {
  slug: string;
  name: string;
  brand: Brand;
  category: Category;
  /** One line, used on cards and as the PDP subheading. */
  tagline: string;
  description: string;
  /** Base price in BRL, for the first storage option. */
  price: number;
  /** Struck-through reference price. Omit when there is no discount. */
  compareAtPrice?: number;
  /** Max interest-free instalments offered on this product. */
  installments: number;
  colors: ColorOption[];
  storage: StorageOption[];
  highlights: Highlight[];
  specs: SpecGroup[];
  render: DeviceRender;
  /**
   * Real product photography, in display order. EMPTY for every product:
   * no photography was available to this build. Drop optimised files in
   * `/public/produtos/<slug>/` and list them here — `<ProductImage>` will
   * prefer them over the vector render automatically, no other change needed.
   */
  photos: string[];
  /** Units on hand. 0 renders the out-of-stock state. */
  stock: number;
  /** Ranking weight for the "destaques" rail. Higher floats to the top. */
  featured?: number;
};

export type CartLine = {
  id: string;
  slug: string;
  name: string;
  color: string;
  storage: string;
  unitPrice: number;
  quantity: number;
};
