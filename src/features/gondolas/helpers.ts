// src/features/gondolas/helpers.ts
// ─── Helpers de retrocompatibilidad: producto maestro vs legacy ────────────

import type { GondolaProducto, GondolaOrdenItem, Product } from "./types";

function isProduct(item: unknown): item is Product {
  return item !== null && typeof item === "object" && "name" in item;
}


/**
 * Obtiene el nombre de visualización de un producto.
 * Prefiere producto maestro, fallback a legacy.
 */
export function getProductDisplayName(item: GondolaProducto | GondolaOrdenItem | Product | null | undefined): string {
  if (!item) return "Sin nombre";
  if (isProduct(item)) return item.name;
  if (item.product?.name) return item.product.name;
  if ("nombre" in item && item.nombre) return item.nombre;
  return "Sin nombre";
}

/**
 * Obtiene la foto de un producto.
 * Prefiere producto maestro, fallback a legacy.
 */
export function getProductPhoto(item: GondolaProducto | GondolaOrdenItem | Product | null | undefined): string | null {
  if (!item) return null;
  if (isProduct(item)) return item.photo_url;
  if (item.product?.photo_url) return item.product.photo_url;
  if ("foto_url" in item && item.foto_url) return item.foto_url;
  return null;
}

/**
 * Obtiene el SKU/clave de un producto.
 * Prefiere producto maestro, fallback a legacy.
 */
export function getProductSku(item: GondolaProducto | GondolaOrdenItem | Product | null | undefined): string | null {
  if (!item) return null;
  if (isProduct(item)) return item.sku;
  if (item.product?.sku) return item.product.sku;
  if ("clave" in item && item.clave) return item.clave;
  return null;
}

/**
 * Obtiene la unidad de un producto.
 * Prefiere producto maestro, fallback a legacy.
 */
export function getProductUnit(item: GondolaProducto | GondolaOrdenItem | Product | null | undefined): string {
  if (!item) return "pz";
  if (isProduct(item)) return item.default_unit;
  if (item.product?.default_unit) return item.product.default_unit;
  if ("unidad" in item && item.unidad) return item.unidad;
  return "pz";
}

/**
 * Verifica si un producto de góndola es legacy (sin vinculación al catálogo maestro).
 */
export function isLegacyProduct(item: GondolaProducto | null | undefined): boolean {
  if (!item) return true;
  return !item.product_id && !item.product;
}

/**
 * Obtiene el ID del producto maestro vinculado, o null si es legacy.
 */
export function getProductMasterId(item: GondolaProducto | null | undefined): string | null {
  if (!item) return null;
  return item.product_id ?? item.product?.id ?? null;
}
