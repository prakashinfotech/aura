import { z } from "zod";

export const createOrderSchema = z.object({
  address_id: z.string().uuid("Select a delivery address"),
  cart_item_ids: z
    .array(z.string().uuid())
    .min(1, "Cart is empty"),
  coupon_code: z.string().optional(),
  credits_amount: z.number().min(0).default(0),
  gift_card_code: z.string().optional(),
  payment_method: z.enum([
    "upi",
    "card",
    "netbanking",
    "emi",
    "wallet",
    "cod",
  ]),
  razorpay_order_id: z.string().optional(),
});

export const cancelOrderSchema = z.object({
  order_item_id: z.string().uuid(),
  reason: z.enum([
    "ordered_by_mistake",
    "found_better_price",
    "changed_my_mind",
    "delivery_time",
    "other",
  ]),
  reason_text: z.string().max(500).optional(),
});

export const returnSchema = z.object({
  order_item_id: z.string().uuid(),
  type: z.enum(["return", "exchange"]),
  reason: z.enum([
    "size_too_small",
    "size_too_large",
    "wrong_item",
    "damaged_defective",
    "not_as_described",
    "changed_mind",
    "other",
  ]),
  sub_reason: z.string().max(500).optional(),
  exchange_variant_id: z.string().uuid().optional(),
  refund_method: z.enum(["original", "credits"]).default("original"),
  pickup_address_id: z.string().uuid(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;
export type ReturnInput = z.infer<typeof returnSchema>;
