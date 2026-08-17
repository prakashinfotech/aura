import { z } from "zod";

export const gstinSchema = z
  .string()
  .length(15, "GSTIN must be exactly 15 characters")
  .regex(
    /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
    "Invalid GSTIN format"
  );

export const ifscSchema = z
  .string()
  .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC code");

export const sellerRegistrationStep1Schema = z.object({
  legal_name: z.string().min(3, "Legal business name is required"),
  brand_name: z.string().min(2, "Brand name is required"),
  business_type: z.enum([
    "proprietorship",
    "partnership",
    "llp",
    "private_limited",
    "public_limited",
  ]),
});

export const sellerRegistrationStep2Schema = z.object({
  gstin: gstinSchema,
  pan: z
    .string()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN format"),
  business_address: z.object({
    line1: z.string().min(5),
    city: z.string().min(1),
    state: z.string().min(1),
    pincode: z.string().regex(/^\d{6}$/),
  }),
});

export const sellerRegistrationStep3Schema = z.object({
  contact_name: z.string().min(2),
  contact_designation: z.string().min(2),
  contact_phone: z.string().regex(/^[6-9]\d{9}$/),
  contact_email: z.string().email(),
});

export const sellerBankSchema = z.object({
  account_holder_name: z.string().min(2),
  account_number: z.string().min(9).max(18),
  ifsc: ifscSchema,
  account_type: z.literal("current"),
});

export type SellerStep1Input = z.infer<typeof sellerRegistrationStep1Schema>;
export type SellerStep2Input = z.infer<typeof sellerRegistrationStep2Schema>;
export type SellerStep3Input = z.infer<typeof sellerRegistrationStep3Schema>;
export type SellerBankInput = z.infer<typeof sellerBankSchema>;
