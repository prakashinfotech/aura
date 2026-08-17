import type { ProductCardData } from "@aura/ui/product-card";
import { discountPct } from "@aura/ui/price-display";

const UNS = "https://images.unsplash.com/photo-";
const Q = "?auto=format&fit=crop&w=400&h=533&q=80";

function img(id: string) {
  return `${UNS}${id}${Q}`;
}

function makeProduct(
  id: string,
  slug: string,
  brand: string,
  title: string,
  price: number,
  mrp: number,
  imageId: string,
  tag?: ProductCardData["tag"]
): ProductCardData {
  return {
    id,
    slug,
    brand_name: brand,
    title,
    selling_price: price,
    mrp,
    discount_pct: discountPct(mrp, price),
    rating_avg: 0,
    rating_count: 0,
    primary_image_url: img(imageId),
    in_stock: true,
    tag: tag ?? null,
  };
}

export const TRENDING_PRODUCTS: ProductCardData[] = [
  makeProduct("p1", "roadster-slim-shirt", "Roadster", "Slim Fit Casual Shirt", 699, 1299, "1506794778202-cad84cf45f1d", "Bestseller"),
  makeProduct("p2", "here-now-polo", "HERE&NOW", "Classic Polo T-Shirt", 499, 999, "1583744946564-b52ac1c389c8"),
  makeProduct("p3", "mango-dress", "MANGO", "Floral Wrap Dress", 2499, 3999, "1515372039744-b8f02a3ae446", "New"),
  makeProduct("p4", "hm-chinos", "H&M", "Slim Chinos", 1299, 1799, "1521572163474-6864f9cf17ab"),
  makeProduct("p5", "puma-sneakers", "Puma", "Street Rider Sneakers", 2799, 3999, "1542291026-7eec264c27ff", "Sale"),
  makeProduct("p6", "levi-501", "Levi's", "501 Original Fit Jeans", 3499, 4999, "1542272604-787c3835535d"),
  makeProduct("p7", "nykaa-lip", "Nykaa Fashion", "Matte Lip Kit", 399, 799, "1596462502278-27bfdc403348", "Sale"),
  makeProduct("p8", "uspa-polo", "U.S. Polo Assn.", "Solid Polo T-Shirt", 899, 1799, "1576566588028-4147f3842f27"),
];

export const NEW_ARRIVALS: ProductCardData[] = [
  makeProduct("n1", "zara-blazer", "Zara", "Structured Blazer", 4999, 6999, "1591047139829-d91aecb6caea", "New"),
  makeProduct("n2", "biba-kurta", "Biba", "Floral Print Kurta", 1299, 2499, "1610030469983-98e550d6193c", "New"),
  makeProduct("n3", "adidas-trackpant", "Adidas", "Essentials 3-Stripes Track Pants", 2099, 2999, "1571945153237-4929e783af4a", "New"),
  makeProduct("n4", "only-jumpsuit", "ONLY", "Solid Ruffle Jumpsuit", 1799, 2999, "1566206091558-7f218b696731", "New"),
  makeProduct("n5", "mamaearth-serum", "Mamaearth", "Vitamin C Face Serum", 499, 899, "1620916566398-39f1143ab7be", "New"),
  makeProduct("n6", "nike-airmax", "Nike", "Air Max SC Sneakers", 5499, 6999, "1542291026-7eec264c27ff", "New"),
];
