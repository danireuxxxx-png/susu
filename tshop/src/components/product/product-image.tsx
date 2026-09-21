import Image from "next/image";
import type { Product, DeviceRender as DeviceRenderSpec } from "@/lib/types";
import { DeviceRender } from "./device-render";
import { cn } from "@/lib/utils";

type Props = {
  product: Product;
  /** Index into `product.photos` when real photography exists. */
  index?: number;
  face?: "front" | "back";
  /** Applied to the render's spec — used to preview a selected colour. */
  overrides?: Partial<DeviceRenderSpec>;
  className?: string;
  sizes?: string;
  priority?: boolean;
  shadow?: boolean;
  label?: string;
};

/**
 * The single seam between real photography and the vector stand-in.
 *
 * Every surface that shows a product goes through here, so switching the
 * whole site over to real studio shots is one data change — populate
 * `photos` on a product and this component picks them up.
 */
export function ProductImage({
  product,
  index = 0,
  face = "front",
  overrides,
  className,
  sizes = "(max-width: 768px) 60vw, 33vw",
  priority = false,
  shadow = true,
  label,
}: Props) {
  const photo = product.photos[index];

  if (photo) {
    return (
      <Image
        src={photo}
        alt={label ?? `${product.name} — ${product.tagline}`}
        fill
        sizes={sizes}
        priority={priority}
        className={cn("object-contain", className)}
      />
    );
  }

  return (
    <DeviceRender
      spec={{ ...product.render, ...overrides }}
      face={face}
      shadow={shadow}
      className={className}
      label={label ?? `${product.name} — ${product.tagline}`}
    />
  );
}
