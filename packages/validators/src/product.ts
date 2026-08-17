import { z } from "zod";

export const productVariantSchema = z.object({
  size: z.string().min(1, "Size is required"),
  color: z.string().min(1, "Color is required"),
  color_hex: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color")
    .optional(),
  sku: z.string().min(1, "SKU is required"),
  stock_qty: z.number().int().min(0),
  mrp: z.number().positive("MRP must be greater than 0"),
  selling_price: z.number().positive("Selling price must be greater than 0"),
}).refine((d) => d.selling_price < d.mrp, {
  message: "Selling price must be less than MRP",
  path: ["selling_price"],
});

export const createProductSchema = z.object({
  title: z
    .string()
    .min(10, "Title must be at least 10 characters")
    .max(200, "Title must be under 200 characters"),
  category_id: z.string().uuid("Select a category"),
  brand_id: z.string().uuid("Select a brand").optional(),
  gender: z.enum(["men", "women", "boys", "girls", "unisex"]),
  description: z.string().min(50, "Description must be at least 50 characters"),
  variants: z
    .array(productVariantSchema)
    .min(1, "At least one variant is required"),
});

export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().max(100).optional(),
  body: z.string().max(1000).optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type ProductVariantInput = z.infer<typeof productVariantSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
