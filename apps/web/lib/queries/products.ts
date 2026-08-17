import { createClient } from "@aura/db";
import type { ProductCardData } from "@aura/ui/product-card";

// Deterministic Unsplash fashion fallback — avoids random picsum images
const FASHION_IDS = [
  "1506794778202-cad84cf45f1d", "1542272604-787c3835535d",
  "1542291026-7eec264c27ff",    "1515372039744-b8f02a3ae446",
  "1591047139829-d91aecb6caea", "1596462502278-27bfdc403348",
  "1583744946564-b52ac1c389c8", "1576566588028-4147f3842f27",
  "1521572163474-6864f9cf17ab", "1571945153237-4929e783af4a",
  "1566206091558-7f218b696731", "1620916566398-39f1143ab7be",
  "1529139574466-a303027ade4e", "1490578474895-06ad3a1f81ec",
  "1539109136881-3be0616acf4b", "1607522370275-f1a6e68dde06",
];

function fashionFallback(slug: string): string {
  let h = 0;
  for (const c of slug) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
  const id = FASHION_IDS[Math.abs(h) % FASHION_IDS.length]!;
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=400&h=533&q=80`;
}

export interface GetProductsParams {
  categorySlug?: string | null;
  search?: string | null;
  brandIds?: string[] | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  minDiscount?: number | null;
  sizes?: string[] | null;
  colors?: string[] | null;
  minRating?: number | null;
  gender?: string | null;
  sort?: string;
  page?: number;
  limit?: number;
}

export interface ProductsResult {
  products: ProductCardData[];
  totalCount: number;
}

export async function getProductsFiltered(params: GetProductsParams = {}): Promise<ProductsResult> {
  const supabase = createClient();

  // @ts-expect-error — supabase-js v2.105 rpc() generic inference regresses with optional Args
  const { data, error } = await supabase.rpc("get_products_filtered", {
    p_category_slug: params.categorySlug ?? null,
    p_search: params.search ?? null,
    p_brand_ids: (params.brandIds ?? null) as string[] | null,
    p_min_price: params.minPrice ?? null,
    p_max_price: params.maxPrice ?? null,
    p_min_discount: params.minDiscount ?? null,
    p_sizes: (params.sizes ?? null) as string[] | null,
    p_colors: (params.colors ?? null) as string[] | null,
    p_min_rating: params.minRating ?? null,
    p_gender: params.gender ?? null,
    p_sort: params.sort ?? "relevance",
    p_page: params.page ?? 1,
    p_limit: params.limit ?? 24,
  });

  if (error) throw new Error(error.message);

  const rows = data ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalCount = (rows as any[])[0]?.total_count ?? 0;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let products: ProductCardData[] = (rows as any[]).map((row) => ({
    id: row.id as string,
    slug: row.slug as string,
    title: row.title as string,
    brand_name: row.brand_name as string,
    selling_price: Number(row.selling_price),
    mrp: Number(row.mrp),
    discount_pct: Number(row.discount_pct),
    rating_avg: Number(row.rating_avg),
    rating_count: Number(row.rating_count),
    primary_image_url:
      (row.primary_image_url as string | null) ??
      fashionFallback(row.slug as string),
    blur_data_url: row.blur_data_url as string | null,
    in_stock: row.in_stock as boolean,
    tag: null,
  }));

  // Expand products into one card per unique color, each with its color-specific image
  if (products.length > 0) {
    const ids = products.map((p) => p.id);

    // Fetch variants (with IDs for image lookup) and images in parallel
    const [{ data: variantRows }, { data: imageRows }] = await Promise.all([
      supabase
        .from("product_variants")
        .select("id, product_id, color, color_hex")
        .in("product_id", ids),
      supabase
        .from("product_images")
        .select("product_id, variant_id, url, is_primary, sort_order")
        .in("product_id", ids),
    ]);

    if (variantRows && variantRows.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const vRows = variantRows as any[];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const iRows = (imageRows ?? []) as any[];

      // variantId → color
      const variantColorMap = new Map<string, string>();
      // productId → [{ color, color_hex, variantIds[] }]
      const colorMap = new Map<string, { color: string; color_hex: string | null; variantIds: string[] }[]>();

      for (const v of vRows) {
        variantColorMap.set(v.id as string, v.color as string);
        if (!colorMap.has(v.product_id)) colorMap.set(v.product_id, []);
        const list = colorMap.get(v.product_id)!;
        const entry = list.find((c) => c.color === v.color);
        if (entry) entry.variantIds.push(v.id);
        else list.push({ color: v.color, color_hex: v.color_hex, variantIds: [v.id] });
      }

      // `{productId}_{color}` → all image urls for that color, primary first
      // Sort so is_primary images come first, then by sort_order
      iRows.sort((a: any, b: any) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0) || a.sort_order - b.sort_order);
      const colorImagesMap = new Map<string, string[]>();
      for (const img of iRows) {
        if (!img.variant_id) continue;
        const color = variantColorMap.get(img.variant_id as string);
        if (!color) continue;
        const key = `${img.product_id as string}_${color}`;
        if (!colorImagesMap.has(key)) colorImagesMap.set(key, []);
        colorImagesMap.get(key)!.push(img.url as string);
      }

      const expanded: ProductCardData[] = [];
      for (const product of products) {
        const colors = colorMap.get(product.id) ?? [];
        if (colors.length === 0) {
          expanded.push(product);
        } else {
          for (const c of colors) {
            const colorImages = colorImagesMap.get(`${product.id}_${c.color}`) ?? [];
            expanded.push({
              ...product,
              color: c.color,
              color_hex: c.color_hex,
              primary_image_url: colorImages[0] ?? product.primary_image_url,
              images: colorImages.length > 0 ? colorImages : undefined,
              card_key: `${product.id}_${c.color}`,
            });
          }
        }
      }
      products = expanded;
    }
  }

  return { products, totalCount };
}

export interface ProductDetail {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  brand_name: string;
  brand_id: string;
  category_id: string;
  gender: string | null;
  rating_avg: number;
  rating_count: number;
  status: string;
  images: Array<{ url: string; sort_order: number; is_primary: boolean; variant_id: string | null }>;
  variants: Array<{
    id: string;
    size: string;
    color: string;
    color_hex: string | null;
    sku: string;
    stock_qty: number;
    mrp: number;
    selling_price: number;
  }>;
}

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  const supabase = createClient();

  const { data: product, error } = await supabase
    .from("products")
    .select(`
      id, slug, title, description, brand_id, category_id, gender,
      rating_avg, rating_count, status,
      brands ( name ),
      product_images ( url, sort_order, is_primary, variant_id ),
      product_variants ( id, size, color, color_hex, sku, stock_qty, mrp, selling_price )
    `)
    .eq("slug", slug)
    .eq("status", "active")
    .is("deleted_at", null)
    .single();

  if (error || !product) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = product as any;

  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    description: p.description ?? null,
    brand_name: p.brands?.name ?? "",
    brand_id: p.brand_id ?? "",
    category_id: p.category_id ?? "",
    gender: p.gender ?? null,
    rating_avg: Number(p.rating_avg),
    rating_count: Number(p.rating_count),
    status: p.status ?? "active",
    images: ((p.product_images ?? []) as Array<{ url: string; sort_order: number; is_primary: boolean; variant_id: string | null }>)
      .sort((a, b) => a.sort_order - b.sort_order),
    variants: ((p.product_variants ?? []) as Array<{
      id: string; size: string; color: string; color_hex: string | null;
      sku: string; stock_qty: number; mrp: number; selling_price: number;
    }>).map((v) => ({
      ...v,
      mrp: Number(v.mrp),
      selling_price: Number(v.selling_price),
    })),
  };
}

export interface FilterOptions {
  brands: { id: string; name: string }[];
  sizes: string[];
}

export async function getFilterOptions(categorySlug?: string | null): Promise<FilterOptions> {
  const supabase = createClient();

  // Resolve slug → category_id
  let categoryId: string | null = null;
  if (categorySlug) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", categorySlug)
      .maybeSingle();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    categoryId = (cat as any)?.id ?? null;
  }

  // Fetch products (with brand) scoped to category
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q = (supabase as any)
    .from("products")
    .select("id, brand_id, brands(id, name)")
    .eq("status", "active")
    .is("deleted_at", null);
  if (categoryId) q = q.eq("category_id", categoryId);
  const { data: productRows } = await q;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (productRows ?? []) as any[];

  // Deduplicate brands
  const brandMap = new Map<string, string>();
  for (const row of rows) {
    if (row.brand_id && row.brands?.id) {
      brandMap.set(row.brand_id as string, row.brands.name as string);
    }
  }
  const brands = [...brandMap.entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Fetch distinct sizes from variants of those products
  const productIds: string[] = rows.map((r) => r.id as string);
  let sizes: string[] = [];
  if (productIds.length > 0) {
    const { data: variantRows } = await supabase
      .from("product_variants")
      .select("size")
      .in("product_id", productIds);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sizes = [...new Set((variantRows ?? []).map((v: any) => v.size as string))].sort();
  }

  return { brands, sizes };
}

export async function getProductsByIds(cardKeys: string[]): Promise<ProductCardData[]> {
  if (cardKeys.length === 0) return [];
  const { products } = await getProductsFiltered({ limit: 200 });
  const keySet = new Set(cardKeys);
  return products.filter((p) => keySet.has(p.card_key ?? p.id));
}

export interface ReviewRow {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  created_at: string | null;
  user_id: string;
  photos: string[];
}

export async function getProductReviews(productId: string): Promise<ReviewRow[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("reviews")
    .select("id, rating, title, body, created_at, user_id, review_photos(url, sort_order)")
    .eq("product_id", productId)
    .order("created_at", { ascending: false })
    .limit(20);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data ?? []) as any[]).map((r) => ({
    id: r.id as string,
    rating: r.rating as number,
    title: r.title as string | null,
    body: r.body as string | null,
    created_at: r.created_at as string | null,
    user_id: r.user_id as string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    photos: ((r.review_photos ?? []) as any[])
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((p) => p.url as string),
  }));
}

export async function getUserReview(
  productId: string,
  userId: string
): Promise<ReviewRow | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("reviews")
    .select("id, rating, title, body, created_at, user_id, review_photos(url, sort_order)")
    .eq("product_id", productId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = data as any;
  return {
    id: r.id as string,
    rating: r.rating as number,
    title: r.title as string | null,
    body: r.body as string | null,
    created_at: r.created_at as string | null,
    user_id: r.user_id as string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    photos: ((r.review_photos ?? []) as any[])
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((p) => p.url as string),
  };
}

export async function uploadReviewPhoto(
  file: File,
  userId: string
): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage
    .from("review-photos")
    .upload(path, file, { upsert: false });
  if (error) throw new Error(`Photo upload failed: ${error.message}`);
  return supabase.storage.from("review-photos").getPublicUrl(path).data.publicUrl;
}

export async function submitReview(
  productId: string,
  userId: string,
  rating: number,
  title: string,
  body: string,
  photoUrls: string[] = [],
  existingReviewId?: string
): Promise<{ error: string | null; reviewId?: string }> {
  const supabase = createClient();
  let reviewId = existingReviewId;

  if (existingReviewId) {
    const { error } = await supabase
      .from("reviews")
      .update({ rating, title: title || null, body: body || null })
      .eq("id", existingReviewId)
      .eq("user_id", userId);
    if (error) return { error: error.message };
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from("reviews") as any)
      .insert({ product_id: productId, user_id: userId, rating, title: title || null, body: body || null })
      .select("id")
      .single();
    if (error) return { error: error.message };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    reviewId = (data as any)?.id as string | undefined;
  }

  if (reviewId) {
    const { error: delErr } = await supabase
      .from("review_photos")
      .delete()
      .eq("review_id", reviewId);
    if (delErr) return { error: `Photo sync failed: ${delErr.message}` };

    if (photoUrls.length > 0) {
      const { error: insErr } = await supabase
        .from("review_photos")
        .insert(photoUrls.map((url, i) => ({ review_id: reviewId, url, sort_order: i })));
      if (insErr) return { error: `Photo sync failed: ${insErr.message}` };
    }
  }

  return { error: null, reviewId };
}
