import { z } from "zod";

export const pincodeSchema = z
  .string()
  .regex(/^\d{6}$/, "Enter a valid 6-digit pincode");

export const addressSchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  line1: z.string().min(5, "Address is required"),
  line2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  pincode: pincodeSchema,
  type: z.enum(["home", "work", "other"]).default("home"),
  is_default: z.boolean().default(false),
});

export type AddressInput = z.infer<typeof addressSchema>;
