import { z } from "zod";

export const applyCouponSchema = z.object({
  code: z
    .string()
    .min(1, "Enter a coupon code")
    .max(30)
    .toUpperCase()
    .regex(/^[A-Z0-9]+$/, "Invalid coupon code format"),
  cart_total: z.number().positive(),
});

export const createCouponSchema = z.object({
  code: z.string().min(3).max(30).toUpperCase(),
  type: z.enum([
    "flat",
    "percent",
    "free_delivery",
    "category",
    "brand",
    "first_order",
    "bank",
  ]),
  value: z.number().positive(),
  max_discount: z.number().positive().optional(),
  min_order_amount: z.number().min(0).default(0),
  applicable_category_id: z.string().uuid().optional(),
  applicable_brand_id: z.string().uuid().optional(),
  max_uses: z.number().int().positive().optional(),
  valid_from: z.string().datetime(),
  valid_until: z.string().datetime(),
});

export type ApplyCouponInput = z.infer<typeof applyCouponSchema>;
export type CreateCouponInput = z.infer<typeof createCouponSchema>;
