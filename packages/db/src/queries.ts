import { createClient } from "./client";
import type { Database } from "./types";

export type ProductRow =
  Database["public"]["Functions"]["get_products_filtered"]["Returns"][number];

export type ProductDetail = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  gender: string | null;
  rating_avg: number | null;
  rating_count: number | null;
  status: string;
  brand: { name: string; slug: string } | null;
  category: { name: string; slug: string } | null;
  images: { url: string; blur_data_url: string | null; is_primary: boolean; sort_order: number }[];
  variants: {
    id: string;
    size: string | null;
    color: string | null;
    color_hex: string | null;
    sku: string;
    stock_qty: number;
    mrp: number;
    selling_price: number;
  }[];
};

export interface GetProductsArgs {
  categorySlug?: string;
  search?: string;
  brandIds?: string[];
  minPrice?: number;
  maxPrice?: number;
  minDiscount?: number;
  sizes?: string[];
  colors?: string[];
  minRating?: number;
  gender?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export async function getProducts(args: GetProductsArgs = {}): Promise<{
  products: ProductRow[];
  totalCount: number;
}> {
  const supabase = createClient();
  // @ts-expect-error — supabase-js v2.105 rpc() generic inference regresses with optional Args
  const { data, error } = await supabase.rpc("get_products_filtered", {
    p_category_slug: args.categorySlug ?? null,
    p_search: args.search ?? null,
    p_brand_ids: args.brandIds ?? null,
    p_min_price: args.minPrice ?? null,
    p_max_price: args.maxPrice ?? null,
    p_min_discount: args.minDiscount ?? null,
    p_sizes: args.sizes ?? null,
    p_colors: args.colors ?? null,
    p_min_rating: args.minRating ?? null,
    p_gender: args.gender ?? null,
    p_sort: args.sort ?? "relevance",
    p_page: args.page ?? 1,
    p_limit: args.limit ?? 40,
  });

  if (error) throw error;
  const rows = (data as ProductRow[]) ?? [];
  return { products: rows, totalCount: rows[0]?.total_count ?? 0 };
}

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("products")
    .select(`
      id, title, slug, description, gender, rating_avg, rating_count, status,
      brand:brands(name, slug),
      category:categories(name, slug),
      images:product_images(url, blur_data_url, is_primary, sort_order),
      variants:product_variants(id, size, color, color_hex, sku, stock_qty, mrp, selling_price)
    `)
    .eq("slug", slug)
    .eq("status", "active")
    .is("deleted_at", null)
    .single();

  if (error || !data) return null;
  return data as unknown as ProductDetail;
}

export async function getProductsByIds(ids: string[]): Promise<ProductRow[]> {
  if (ids.length === 0) return [];
  const supabase = createClient();
  // @ts-expect-error — supabase-js v2.105 rpc() generic inference regresses with optional Args
  const { data, error } = await supabase.rpc("get_products_filtered", {
    p_category_slug: null, p_search: null, p_brand_ids: null,
    p_min_price: null, p_max_price: null, p_min_discount: null,
    p_sizes: null, p_colors: null, p_min_rating: null, p_gender: null,
    p_sort: "relevance", p_page: 1, p_limit: 200,
  });
  if (error) throw error;
  const rows = (data as ProductRow[]) ?? [];
  const idSet = new Set(ids);
  return rows.filter((r) => idSet.has(r.id));
}

export async function getBrands() {
  const supabase = createClient();
  const { data } = await supabase.from("brands").select("id, name, slug").order("name");
  return data ?? [];
}

export interface BannerRow {
  id: string;
  image_url_desktop: string;
  image_url_mobile: string;
  target_url: string | null;
  sort_order: number | null;
}

export async function getBanners(position = "hero"): Promise<BannerRow[]> {
  const supabase = createClient();
  const now = new Date().toISOString();
  const { data } = await supabase
    .from("banners")
    .select("id, image_url_desktop, image_url_mobile, target_url, sort_order")
    .eq("position", position)
    .eq("active", true)
    .or(`start_date.is.null,start_date.lte.${now}`)
    .or(`end_date.is.null,end_date.gte.${now}`)
    .order("sort_order", { ascending: true });
  return (data as BannerRow[]) ?? [];
}
