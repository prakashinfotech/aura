"use client";

import * as React from "react";
import Image from "next/image";
import {
  Plus, Search, Pencil, Trash2, Loader2, X, Upload,
  ChevronLeft, ChevronRight, Check, AlertCircle, LayoutGrid,
  List, Tag, Package, MoreVertical, ImageIcon,
  Zap, Copy, Eye, EyeOff, ShoppingBag,
  Shirt, Footprints, Baby, Gem, Sparkles, Dumbbell,
  Home as HomeIcon, Info, ArrowUpDown, Store, Rocket,
  FileText,
} from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { formatInr } from "@aura/ui/price-display";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Category { id: string; name: string; slug: string }
interface Brand    { id: string; name: string; seller_id: string | null }

interface Variant {
  id?: string;
  size: string; color: string; color_hex: string;
  sku: string; stock_qty: number; mrp: number; selling_price: number;
}

interface ProductImage {
  id?: string; url: string; is_primary: boolean; sort_order: number;
  color?: string; // undefined = General; color name = color-specific
  _file?: File; _preview?: string; _deleted?: boolean;
}

interface Product {
  id: string; title: string; slug: string;
  description: string | null; gender: string; status: string;
  category_id: string | null; brand_id: string | null;
  category_name: string | null; brand_name: string | null;
  category_slug: string | null;
  price: number; mrp: number; stock: number;
  primary_image: string | null;
  variant_count: number;
  created_at: string;
  updated_at: string;
}

// ── Category helpers ──────────────────────────────────────────────────────────

function getCatIcon(slug: string | null | undefined, name: string): React.ElementType {
  const s = (slug ?? name ?? "").toLowerCase();
  if (/shoe|foot|boot|sandal|sneaker|slipper/.test(s)) return Footprints;
  if (/kid|boy|girl|baby|infant|toddler/.test(s))       return Baby;
  if (/jewel|gem|ring|necklace|watch/.test(s))           return Gem;
  if (/bag|purse|wallet|belt|sunglasses|accessory/.test(s)) return ShoppingBag;
  if (/home|living|bedding|curtain|kitchen|decor/.test(s))  return HomeIcon;
  if (/beauty|cosmetic|skincare|makeup|fragrance/.test(s))  return Sparkles;
  if (/sport|gym|fitness|yoga|activewear/.test(s))          return Dumbbell;
  return Shirt;
}

const CATEGORY_ATTRS: Record<string, { label: string; options: string[] }[]> = {
  clothing: [
    { label: "Fabric",    options: ["Cotton", "Polyester", "Silk", "Linen", "Wool", "Denim", "Rayon", "Blend", "Viscose"] },
    { label: "Fit",       options: ["Slim Fit", "Regular Fit", "Loose Fit", "Oversized", "Relaxed Fit"] },
    { label: "Neck Type", options: ["Round Neck", "V-Neck", "Polo Collar", "Hooded", "Turtle Neck", "Boat Neck", "Off-Shoulder"] },
    { label: "Sleeve",    options: ["Full Sleeve", "Half Sleeve", "Sleeveless", "3/4 Sleeve", "Cap Sleeve"] },
    { label: "Pattern",   options: ["Solid", "Striped", "Checked", "Printed", "Embroidered", "Color Block"] },
    { label: "Wash Care", options: ["Machine Wash", "Hand Wash Only", "Dry Clean Only", "Do Not Wash"] },
  ],
  footwear: [
    { label: "Closure",   options: ["Lace-Up", "Slip-On", "Velcro", "Zipper", "Buckle", "Toggle"] },
    { label: "Occasion",  options: ["Casual", "Formal", "Sports", "Party", "Ethnic", "Outdoor", "Lounge"] },
    { label: "Sole",      options: ["Rubber", "EVA", "PU", "Leather", "Synthetic", "Crepe", "TPR"] },
    { label: "Toe Shape", options: ["Round", "Pointed", "Square", "Open", "Almond"] },
  ],
  accessories: [
    { label: "Material",  options: ["Leather", "Canvas", "Fabric", "Metal", "Plastic", "Synthetic", "Jute", "PU"] },
    { label: "Occasion",  options: ["Casual", "Formal", "Ethnic", "Party", "Office", "Sports", "Travel"] },
    { label: "Style",     options: ["Classic", "Contemporary", "Boho", "Minimal", "Statement"] },
  ],
  kids: [
    { label: "Age Group", options: ["0–3 Months", "3–6 Months", "6–12 Months", "1–2 Years", "2–4 Years", "4–6 Years", "6–8 Years", "8–10 Years", "10–12 Years"] },
    { label: "Fabric",    options: ["100% Cotton", "Cotton Blend", "Fleece", "Denim", "Polyester"] },
    { label: "Activity",  options: ["Casual Wear", "School", "Party Wear", "Sports", "Sleepwear"] },
  ],
  home: [
    { label: "Material",    options: ["Cotton", "Polyester", "Wood", "Metal", "Ceramic", "Bamboo", "Glass", "Jute"] },
    { label: "Care",        options: ["Machine Wash", "Hand Wash", "Dry Clean", "Spot Clean", "Wipe Clean"] },
    { label: "Set Includes",options: ["Single Piece", "2-Piece Set", "3-Piece Set", "4-Piece Set", "6-Piece Set"] },
  ],
  beauty: [
    { label: "Skin Type", options: ["All Skin Types", "Oily", "Dry", "Combination", "Sensitive", "Normal"] },
    { label: "Concern",   options: ["Anti-Aging", "Brightening", "Moisturizing", "Acne Control", "Sun Protection", "Hydrating"] },
    { label: "Finish",    options: ["Matte", "Dewy", "Satin", "Glossy", "Natural", "Sheer"] },
  ],
  sports: [
    { label: "Activity",    options: ["Running", "Gym/Fitness", "Yoga", "Cricket", "Football", "Basketball", "Cycling", "Swimming", "Badminton"] },
    { label: "Fabric Tech", options: ["Quick-Dry", "Moisture-Wicking", "UV Protection", "Anti-Odor", "4-Way Stretch", "Thermal"] },
  ],
};

function getCategoryAttrGroups(slug: string | null | undefined, name: string) {
  const s = (slug ?? name ?? "").toLowerCase();
  if (/shoe|foot|boot|sandal|sneaker|slipper/.test(s)) return CATEGORY_ATTRS.footwear ?? [];
  if (/kid|boy|girl|baby|infant|toddler/.test(s))       return CATEGORY_ATTRS.kids ?? [];
  if (/bag|purse|wallet|belt|sunglasses|accessory/.test(s)) return CATEGORY_ATTRS.accessories ?? [];
  if (/home|living|bedding|curtain|kitchen/.test(s))    return CATEGORY_ATTRS.home ?? [];
  if (/beauty|cosmetic|skincare|makeup/.test(s))        return CATEGORY_ATTRS.beauty ?? [];
  if (/sport|gym|fitness|yoga/.test(s))                 return CATEGORY_ATTRS.sports ?? [];
  return CATEGORY_ATTRS.clothing ?? [];
}

function getCategoryDescPlaceholder(slug: string | null | undefined): string {
  const s = (slug ?? "").toLowerCase();
  if (/shoe|foot/.test(s))   return "Describe the shoe: upper material, comfort tech (memory foam, arch support), ideal occasions, width fitting...";
  if (/kid/.test(s))          return "Describe: age-appropriateness, safety features, material softness, ease of dressing for kids...";
  if (/bag|wallet|accessory/.test(s)) return "Describe: material quality, compartments, dimensions (H×W×D), hardware finish, strap details...";
  if (/home/.test(s))         return "Describe: dimensions, material quality, finish details, what's included, care & maintenance...";
  if (/beauty|cosmetic/.test(s)) return "Describe: key ingredients, benefits, how to use, expected results, shelf life, certifications...";
  if (/sport/.test(s))        return "Describe: performance technology, ideal activity, moisture management, fit for athletic use...";
  return "Describe your product: fabric quality, design details, fit & sizing guide, care instructions, what makes it special...";
}

// ── Size presets ──────────────────────────────────────────────────────────────

const SIZE_PRESETS: Record<string, string[]> = {
  footwear:    ["UK 4", "UK 5", "UK 6", "UK 7", "UK 8", "UK 9", "UK 10", "UK 11", "UK 12"],
  kids:        ["2-3Y", "3-4Y", "4-5Y", "6-7Y", "8-9Y", "10-11Y", "12-13Y"],
  accessories: ["Free Size", "One Size"],
  home:        ["Standard"],
  clothing:    ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
};

function getSizePreset(categorySlug: string | null | undefined): string[] {
  const s = (categorySlug ?? "").toLowerCase();
  if (/shoe|foot|boot|sandal|sneaker|slipper/.test(s)) return SIZE_PRESETS.footwear ?? [];
  if (/kid|boy|girl|baby|infant|toddler/.test(s))       return SIZE_PRESETS.kids ?? [];
  if (/bag|jewel|watch|belt|accessory|wallet|sunglasses|cap|hat/.test(s)) return SIZE_PRESETS.accessories ?? [];
  if (/home|living|bedding|curtain|kitchen/.test(s))    return SIZE_PRESETS.home ?? [];
  return SIZE_PRESETS.clothing ?? ["XS", "S", "M", "L", "XL", "XXL"];
}

const COMMON_COLORS = [
  { name: "Black",  hex: "#000000" }, { name: "White",   hex: "#FFFFFF" },
  { name: "Navy",   hex: "#1B2A4A" }, { name: "Grey",    hex: "#9E9E9E" },
  { name: "Red",    hex: "#E53935" }, { name: "Pink",    hex: "#6366f1" },
  { name: "Blue",   hex: "#1976D2" }, { name: "Green",   hex: "#43A047" },
  { name: "Yellow", hex: "#FDD835" }, { name: "Orange",  hex: "#FF9800" },
  { name: "Brown",  hex: "#795548" }, { name: "Maroon",  hex: "#880E4F" },
  { name: "Purple", hex: "#7B1FA2" }, { name: "Beige",   hex: "#F5F0E8" },
  { name: "Olive",  hex: "#827717" }, { name: "Teal",    hex: "#00695C" },
];

// ── Zod schemas ───────────────────────────────────────────────────────────────

const variantSchema = z.object({
  size:          z.string().min(1, "Size required"),
  color:         z.string().min(1, "Color required"),
  color_hex:     z.string().min(1),
  mrp:           z.coerce.number().min(1, "MRP required"),
  selling_price: z.coerce.number().min(1, "Selling price required"),
  stock_qty:     z.coerce.number().min(0),
  sku:           z.string().min(1, "SKU required"),
});

const productSchema = z.object({
  title:       z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  category_id: z.string().min(1, "Select a category"),
  brand_id:    z.string().min(1, "Select a brand"),
  gender:      z.enum(["men", "women", "boys", "girls", "unisex"]),
  hsn_code:    z.string().optional(),
  country_of_origin: z.string().optional(),
  variants:    z.array(variantSchema).min(1, "Add at least one variant"),
});
type ProductForm = z.infer<typeof productSchema>;

// ── Helpers ───────────────────────────────────────────────────────────────────

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") +
    "-" + Date.now().toString(36);
}
function discount(mrp: number, price: number) {
  if (!mrp || mrp <= price) return 0;
  return Math.round(((mrp - price) / mrp) * 100);
}
function stockColor(qty: number) {
  if (qty === 0) return "text-[#F32F2F] bg-[#FFF0F0]";
  if (qty < 10)  return "text-[#FF9800] bg-[#FFF8E1]";
  return "text-[#03A685] bg-[#E6F8F5]";
}

// ── UI atoms ──────────────────────────────────────────────────────────────────

function Inp({ className = "", ...p }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input {...p}
      className={`h-10 w-full rounded-xl border border-[#E9E9EB] bg-white px-3.5 text-sm text-[#282C3F] placeholder:text-[#94969F] focus:border-[#6366f1] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/15 transition-all ${className}`}
    />
  );
}
function Sel({ className = "", ...p }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...p}
      className={`h-10 w-full rounded-xl border border-[#E9E9EB] bg-white px-3.5 text-sm text-[#282C3F] focus:border-[#6366f1] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/15 transition-all ${className}`}
    />
  );
}
function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-[#696B79]">{children}</label>;
}
function FieldErr({ msg }: { msg?: string }) {
  return msg ? <p className="mt-1 flex items-center gap-1 text-xs text-[#F32F2F]"><AlertCircle size={11} />{msg}</p> : null;
}

// ── Step progress bar ─────────────────────────────────────────────────────────

const STEPS = [
  { label: "Category & Info",    short: "Info" },
  { label: "Variants & Pricing", short: "Variants" },
  { label: "Photos",             short: "Photos" },
  { label: "Review & Publish",   short: "Review" },
];

function StepBar({ step }: { step: number }) {
  const pct = Math.round((step / (STEPS.length - 1)) * 100);
  return (
    <div className="space-y-2.5">
      <div className="relative h-1.5 overflow-hidden rounded-full bg-[#F5F5F6]">
        <div className="absolute left-0 top-0 h-full rounded-full bg-[#6366f1] transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }} />
      </div>
      <div className="flex justify-between">
        {STEPS.map((s, i) => {
          const done = i < step; const active = i === step;
          return (
            <div key={s.label} className="flex flex-col items-center gap-1">
              <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition-all duration-200 ${
                done   ? "bg-[#03A685] text-white" :
                active ? "bg-[#6366f1] text-white ring-4 ring-[#6366f1]/20" :
                         "bg-[#F5F5F6] text-[#94969F]"
              }`}>
                {done ? <Check size={10} /> : i + 1}
              </div>
              <span className={`hidden text-[9px] font-bold uppercase tracking-wide sm:block ${
                active ? "text-[#6366f1]" : done ? "text-[#03A685]" : "text-[#94969F]"
              }`}>{s.short}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Confirm dialog ────────────────────────────────────────────────────────────

function ConfirmDialog({ title, body, onConfirm, onCancel }: {
  title: string; body: string; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#FFF0F0]">
          <Trash2 size={20} className="text-[#F32F2F]" />
        </div>
        <h3 className="mb-2 text-base font-bold text-[#282C3F]">{title}</h3>
        <p className="mb-5 text-sm text-[#696B79]">{body}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 rounded-xl border border-[#E9E9EB] py-2.5 text-sm font-semibold text-[#282C3F] hover:bg-[#F5F5F6]">Cancel</button>
          <button onClick={onConfirm} className="flex-1 rounded-xl bg-[#F32F2F] py-2.5 text-sm font-bold text-white hover:bg-red-700">Delete</button>
        </div>
      </div>
    </div>
  );
}

// ── Product form modal ────────────────────────────────────────────────────────

interface ProductModalProps {
  mode: "create" | "edit";
  sellerId: string;
  editProductId?: string;
  categories: Category[];
  initialBrands: Brand[];
  onClose: () => void;
  onSuccess: () => void;
}

function ProductModal({ mode, sellerId, editProductId, categories, initialBrands, onClose, onSuccess }: ProductModalProps) {
  const [step, setStep]               = React.useState(0);
  const [images, setImages]           = React.useState<ProductImage[]>([]);
  const [submitting, setSubmitting]   = React.useState(false);
  const [loadingEdit, setLoadingEdit] = React.useState(mode === "edit");
  const [existingVariantIds, setExistingVariantIds] = React.useState<string[]>([]);
  const [deletedVariantIds, setDeletedVariantIds]   = React.useState<string[]>([]);
  const [selectedAttrs, setSelectedAttrs] = React.useState<Record<string, string>>({});
  const [activeColorTab, setActiveColorTab] = React.useState<string>("");
  const fileInputRef   = React.useRef<HTMLInputElement>(null);
  const pendingColorRef = React.useRef<string>("");

  // Local brands list — can grow when seller creates a new brand
  const [brands, setBrands]           = React.useState<Brand[]>(initialBrands);
  const [creatingBrand, setCreatingBrand] = React.useState(false);
  const [newBrandName, setNewBrandName]   = React.useState("");
  const [savingBrand, setSavingBrand]    = React.useState(false);

  // Tags state
  const [selectedTags, setSelectedTags] = React.useState<string[]>([]);
  const [tagInput, setTagInput]          = React.useState("");

  const { register, control, handleSubmit, watch, trigger, reset, setValue,
    formState: { errors } } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      gender:   "unisex",
      variants: [{ size: "", color: "", color_hex: "#000000", mrp: 0, selling_price: 0, stock_qty: 0, sku: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "variants" });
  const selectedCategory = categories.find((c) => c.id === watch("category_id"));
  const sizePreset       = getSizePreset(selectedCategory?.slug);
  const catAttrGroups    = getCategoryAttrGroups(selectedCategory?.slug, selectedCategory?.name ?? "");

  const myBrands       = brands.filter((b) => b.seller_id !== null);
  const platformBrands = brands.filter((b) => b.seller_id === null);

  // ── Attribute chip handler ─────────────────────────────────────────────────
  function handleAttrChip(label: string, value: string) {
    setSelectedAttrs((prev) => {
      const next = { ...prev };
      if (next[label] === value) delete next[label]; else next[label] = value;
      return next;
    });
  }

  // ── Tag handlers ──────────────────────────────────────────────────────────
  function addTag(raw: string) {
    const tag = raw.trim().toLowerCase().replace(/[^a-z0-9\s-]/g, "").slice(0, 30);
    if (!tag || selectedTags.includes(tag) || selectedTags.length >= 12) return;
    setSelectedTags((prev) => [...prev, tag]);
    setTagInput("");
  }
  function removeTag(tag: string) {
    setSelectedTags((prev) => prev.filter((t) => t !== tag));
  }

  // ── Create brand inline ────────────────────────────────────────────────────
  async function handleCreateBrand() {
    const name = newBrandName.trim();
    if (!name) return;
    setSavingBrand(true);
    try {
      const supabase = createClient();
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") +
        "-" + Date.now().toString(36);
      const { data, error } = await (supabase as any).from("brands").insert({
        name, slug, seller_id: sellerId, active: true,
      }).select("id, name, seller_id").single();
      if (error) throw new Error(error.message);
      const newBrand: Brand = { id: data.id, name: data.name, seller_id: data.seller_id };
      setBrands((prev) => [newBrand, ...prev]);
      setValue("brand_id", data.id);
      setCreatingBrand(false);
      setNewBrandName("");
      toast.success(`Brand "${name}" created`);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to create brand");
    } finally {
      setSavingBrand(false);
    }
  }

  // ── Load product for edit ──────────────────────────────────────────────────
  React.useEffect(() => {
    if (mode !== "edit" || !editProductId) return;
    (async () => {
      const supabase = createClient();

      // Core query: product + variants + images (always available)
      const { data, error } = await (supabase as any)
        .from("products")
        .select("*, variants:product_variants(*), images:product_images(*)")
        .eq("id", editProductId)
        .single();

      if (error || !data) {
        toast.error(error?.message ?? "Failed to load product");
        setLoadingEdit(false);
        return;
      }

      // Attributes and tags are in a separate migration — fetch independently
      // so a missing table never blocks the core form from loading
      const [{ data: attrsData, error: attrsErr }, { data: tagsData }] = await Promise.all([
        (supabase as any).from("product_attributes").select("attribute_name,attribute_value").eq("product_id", editProductId),
        (supabase as any).from("product_tags").select("tag").eq("product_id", editProductId),
      ]);
      if (attrsErr) console.error("[edit load] product_attributes fetch failed:", attrsErr.message);
      else console.log("[edit load] attrsData:", attrsData);

      // Build attrs map; strip compliance keys that now live on the products row
      const attrs: Record<string, string> = {};
      (attrsData ?? []).forEach((a: any) => { attrs[a.attribute_name] = a.attribute_value; });

      // Prefer products table columns (written by onSubmit); fall back to product_attributes
      // for drafts created before the 20250518000001 migration was applied
      const hsnCode       = data.hsn_code          ?? attrs["HSN Code"]          ?? "";
      const countryOrigin = data.country_of_origin ?? attrs["Country of Origin"] ?? "";
      delete attrs["HSN Code"];
      delete attrs["Country of Origin"];

      reset({
        title:       data.title,
        description: data.description ?? "",
        category_id: data.category_id ?? "",
        brand_id:    data.brand_id ?? "",
        gender:      data.gender ?? "unisex",
        hsn_code:    hsnCode,
        country_of_origin: countryOrigin,
        variants:    (data.variants ?? []).map((v: any) => ({
          size: v.size, color: v.color, color_hex: v.color_hex ?? "#000000",
          sku: v.sku, stock_qty: v.stock_qty, mrp: Number(v.mrp), selling_price: Number(v.selling_price),
        })),
      });
      setSelectedAttrs(attrs);
      setSelectedTags((tagsData ?? []).map((t: any) => t.tag));
      setExistingVariantIds((data.variants ?? []).map((v: any) => v.id));
      // Build variantId → color so images can be restored to their color tab
      const variantColorMap = new Map<string, string>();
      for (const v of (data.variants ?? [])) variantColorMap.set(v.id, v.color);
      setImages((data.images ?? []).map((img: any) => ({
        id: img.id, url: img.url, is_primary: img.is_primary, sort_order: img.sort_order,
        color: img.variant_id ? (variantColorMap.get(img.variant_id) ?? undefined) : undefined,
      })));
      setLoadingEdit(false);
    })();
  }, [mode, editProductId, reset]);

  // ── Image handlers ─────────────────────────────────────────────────────────
  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const color = pendingColorRef.current; // "" = General
    const files = Array.from(e.target.files ?? []);
    const colorActive = images.filter((i) => !i._deleted && (i.color ?? "") === color);
    if (colorActive.length + files.length > 5) { toast.error("Max 5 images per section"); return; }
    files.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) { toast.warning(`${file.name} exceeds 5 MB`); return; }
      const reader = new FileReader();
      reader.onload = (ev) => setImages((prev) => {
        const isFirst = prev.filter((i) => !i._deleted).length === 0;
        return [...prev, {
          url: "", is_primary: isFirst,
          sort_order: prev.filter((i) => !i._deleted && (i.color ?? "") === color).length,
          color: color || undefined,
          _file: file, _preview: ev.target?.result as string,
        }];
      });
      reader.readAsDataURL(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }
  function removeImage(idx: number) {
    setImages((prev) => prev.map((img, i) =>
      i === idx ? (img.id ? { ...img, _deleted: true } : undefined!) : img
    ).filter(Boolean));
  }
  function setPrimary(idx: number) {
    setImages((prev) => prev.map((img, i) => ({ ...img, is_primary: i === idx && !img._deleted })));
  }
  function removeVariant(i: number) {
    const id = existingVariantIds[i];
    if (id) setDeletedVariantIds((prev) => [...prev, id]);
    remove(i);
    setExistingVariantIds((prev) => prev.filter((_, idx) => idx !== i));
  }

  // ── Navigation ─────────────────────────────────────────────────────────────
  async function goNext() {
    let valid = false;
    if (step === 0) valid = await trigger(["title", "category_id", "brand_id", "gender"]);
    else if (step === 1) valid = await trigger("variants");
    else valid = true;
    if (valid) setStep((s) => s + 1);
  }

  // ── Upload images ──────────────────────────────────────────────────────────
  async function uploadImages(productId: string) {
    const supabase = createClient();

    // Build color → first variant_id map so images can be linked to their color
    const { data: savedVariants } = await (supabase as any)
      .from("product_variants").select("id, color").eq("product_id", productId);
    const colorToVariantId = new Map<string, string>();
    for (const v of (savedVariants ?? [])) {
      if (v.color && !colorToVariantId.has(v.color)) colorToVariantId.set(v.color, v.id);
    }

    const newImages: ProductImage[] = [];
    for (const img of images) {
      if (img._deleted) {
        if (img.id) await (supabase as any).from("product_images").delete().eq("id", img.id);
        continue;
      }
      if (img._file) {
        const ext  = img._file.name.split(".").pop();
        const path = `${productId}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from("product-images")
          .upload(path, img._file, { contentType: img._file.type, upsert: false });
        if (error) { toast.warning(`Upload failed: ${error.message}`); continue; }
        const { data: { publicUrl } } = supabase.storage.from("product-images").getPublicUrl(path);
        newImages.push({ ...img, url: publicUrl });
      } else if (img.id) {
        await (supabase as any).from("product_images")
          .update({ is_primary: img.is_primary, sort_order: img.sort_order }).eq("id", img.id);
      }
    }
    if (newImages.length > 0) {
      await (supabase as any).from("product_images").insert(
        newImages.map((img, i) => ({
          product_id: productId, url: img.url,
          is_primary: img.is_primary, sort_order: img.sort_order + i,
          variant_id: img.color ? (colorToVariantId.get(img.color) ?? null) : null,
        }))
      );
    }
  }

  // ── Save attributes ────────────────────────────────────────────────────────
  async function saveAttributes(productId: string) {
    const supabase = createClient();
    const { error: delErr } = await (supabase as any)
      .from("product_attributes").delete().eq("product_id", productId);
    if (delErr) console.error("[saveAttributes] delete failed:", delErr.message);

    const attrRows = Object.entries(selectedAttrs)
      .filter(([, v]) => v)
      .map(([attribute_name, attribute_value]) => ({ product_id: productId, attribute_name, attribute_value }));
    if (attrRows.length > 0) {
      const { error: insErr } = await (supabase as any)
        .from("product_attributes").insert(attrRows);
      if (insErr) {
        console.error("[saveAttributes] insert failed:", insErr.message);
        toast.warning("Specs not saved — check DB permissions (product_attributes RLS)");
      }
    }
  }

  // ── Save tags ──────────────────────────────────────────────────────────────
  async function saveTags(productId: string) {
    if (selectedTags.length === 0) return;
    const supabase = createClient();
    await (supabase as any).from("product_tags").delete().eq("product_id", productId);
    await (supabase as any).from("product_tags").insert(
      selectedTags.map((tag) => ({ product_id: productId, tag }))
    );
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  async function onSubmit(data: ProductForm, publishStatus: "draft" | "active") {
    setSubmitting(true);
    try {
      const supabase = createClient();
      if (mode === "create") {
        const productId = crypto.randomUUID();
        const { error: pErr } = await (supabase as any).from("products").insert({
          id: productId, title: data.title, slug: slugify(data.title),
          description: data.description || null,
          category_id: data.category_id, brand_id: data.brand_id,
          seller_id: sellerId, gender: data.gender, status: publishStatus,
          hsn_code: data.hsn_code?.trim() || null,
          country_of_origin: data.country_of_origin?.trim() || null,
        });
        if (pErr) throw new Error(pErr.message);
        const { error: vErr } = await (supabase as any).from("product_variants").insert(
          data.variants.map((v) => ({
            product_id: productId, size: v.size, color: v.color,
            color_hex: v.color_hex || null, sku: v.sku,
            stock_qty: v.stock_qty, mrp: v.mrp, selling_price: v.selling_price,
          }))
        );
        if (vErr) throw new Error(vErr.message);
        await uploadImages(productId);
        await saveAttributes(productId);
        await saveTags(productId);
        toast.success(publishStatus === "active" ? "Product published — now live on Aura!" : "Product saved as draft");
      } else if (editProductId) {
        const { error: pErr } = await (supabase as any).from("products").update({
          title: data.title, description: data.description || null,
          category_id: data.category_id, brand_id: data.brand_id,
          gender: data.gender, status: publishStatus,
          hsn_code: data.hsn_code?.trim() || null,
          country_of_origin: data.country_of_origin?.trim() || null,
          updated_at: new Date().toISOString(),
        }).eq("id", editProductId);
        if (pErr) throw new Error(pErr.message);
        if (deletedVariantIds.length > 0)
          await (supabase as any).from("product_variants").delete().in("id", deletedVariantIds);
        for (let i = 0; i < data.variants.length; i++) {
          const v = data.variants[i]!;
          const existingId = existingVariantIds[i];
          if (existingId) {
            await (supabase as any).from("product_variants").update({
              size: v.size, color: v.color, color_hex: v.color_hex || null,
              sku: v.sku, stock_qty: v.stock_qty, mrp: v.mrp, selling_price: v.selling_price,
              updated_at: new Date().toISOString(),
            }).eq("id", existingId);
          } else {
            await (supabase as any).from("product_variants").insert({
              product_id: editProductId, size: v.size, color: v.color,
              color_hex: v.color_hex || null, sku: v.sku,
              stock_qty: v.stock_qty, mrp: v.mrp, selling_price: v.selling_price,
            });
          }
        }
        await uploadImages(editProductId);
        await saveAttributes(editProductId);
        await saveTags(editProductId);
        toast.success(publishStatus === "active" ? "Product updated and live" : "Changes saved as draft");
      }
      onSuccess();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to save product");
    } finally {
      setSubmitting(false);
    }
  }

  const titleVal     = watch("title");
  const catVal       = watch("category_id");
  const brandVal     = watch("brand_id");
  const activeImages = images.filter((i) => !i._deleted);

  if (loadingEdit) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={28} className="animate-spin text-white" />
          <p className="text-sm text-white/70">Loading product…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="flex h-[95vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:h-[92vh] sm:rounded-2xl">

        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-[#F5F5F6] bg-white px-6 py-4">
          <div>
            <h2 className="text-base font-extrabold text-[#282C3F]">
              {mode === "create" ? "List a New Product" : "Edit Product"}
            </h2>
            <p className="text-xs text-[#696B79]">
              {STEPS[step]?.label}
              {selectedCategory ? ` · ${selectedCategory.name}` : step === 0 ? " · Choose a category to start" : ""}
            </p>
          </div>
          <button onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E9E9EB] text-[#696B79] hover:bg-[#FFF0F0] hover:text-[#F32F2F] transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Step bar */}
        <div className="shrink-0 border-b border-[#F5F5F6] px-6 py-4">
          <StepBar step={step} />
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-6">

            {/* ── STEP 0: Category & Info ── */}
            {step === 0 && (
              <div className="space-y-6">

                {/* Visual category picker */}
                <div>
                  <FieldLabel>Product Category *</FieldLabel>
                  <p className="mb-3 text-xs text-[#94969F]">Pick the category that best describes your product — the form will adapt to show relevant fields</p>
                  {categories.length === 0 ? (
                    <div className="flex items-center gap-2 text-sm text-[#696B79]">
                      <Loader2 size={14} className="animate-spin" /> Loading categories…
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
                      {categories.map((cat) => {
                        const Icon     = getCatIcon(cat.slug, cat.name);
                        const selected = watch("category_id") === cat.id;
                        return (
                          <label key={cat.id} className="cursor-pointer">
                            <input type="radio" {...register("category_id")} value={cat.id} className="sr-only" />
                            <div className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-3 text-center transition-all duration-150 select-none ${
                              selected
                                ? "border-[#6366f1] bg-[#f0f4ff] shadow-[0_0_0_3px_#6366f112]"
                                : "border-[#E9E9EB] bg-white hover:border-[#6366f1]/40 hover:bg-[#f0f4ff]/30"
                            }`}>
                              <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                                selected ? "bg-[#6366f1] shadow-md" : "bg-[#F5F5F6]"
                              }`}>
                                <Icon size={18} className={selected ? "text-white" : "text-[#696B79]"} />
                              </div>
                              <span className={`text-[10px] font-bold leading-tight ${
                                selected ? "text-[#6366f1]" : "text-[#282C3F]"
                              }`}>{cat.name}</span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                  <FieldErr msg={errors.category_id?.message} />
                </div>

                {/* Brand + Gender */}
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Brand with inline create */}
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-[#696B79]">Brand *</label>
                      <button type="button" onClick={() => setCreatingBrand((v) => !v)}
                        className="flex items-center gap-1 text-[10px] font-semibold text-[#6366f1] hover:underline">
                        <Plus size={10} />
                        {creatingBrand ? "Cancel" : "Create Brand"}
                      </button>
                    </div>
                    <Sel {...register("brand_id")}>
                      <option value="">Select a brand</option>
                      {myBrands.length > 0 && (
                        <optgroup label="── My Brands">
                          {myBrands.map((b) => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                          ))}
                        </optgroup>
                      )}
                      {platformBrands.length > 0 && (
                        <optgroup label="── Platform Brands">
                          {platformBrands.map((b) => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                          ))}
                        </optgroup>
                      )}
                    </Sel>
                    <FieldErr msg={errors.brand_id?.message} />

                    {/* Inline brand creator */}
                    {creatingBrand && (
                      <div className="mt-2 overflow-hidden rounded-xl border border-[#6366f1]/30 bg-[#f0f4ff]/40">
                        <div className="flex items-center gap-2 border-b border-[#6366f1]/10 bg-[#f0f4ff]/60 px-3 py-2">
                          <Store size={12} className="text-[#6366f1]" />
                          <span className="text-[10px] font-bold text-[#6366f1]">Register a new brand</span>
                        </div>
                        <div className="p-3">
                          <p className="mb-2 text-[10px] text-[#696B79]">This brand will be private to your store and appear under "My Brands"</p>
                          <div className="flex gap-2">
                            <Inp
                              value={newBrandName}
                              onChange={(e) => setNewBrandName(e.target.value)}
                              placeholder="e.g. Urban Threads, Desi Luxe…"
                              className="flex-1"
                              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void handleCreateBrand(); } }}
                            />
                            <button type="button" onClick={handleCreateBrand} disabled={savingBrand || !newBrandName.trim()}
                              className="flex items-center gap-1.5 rounded-xl bg-[#6366f1] px-3.5 py-2 text-xs font-bold text-white disabled:opacity-50 hover:bg-[#4f46e5] transition-colors">
                              {savingBrand ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                              {savingBrand ? "Saving…" : "Save"}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Gender */}
                  <div>
                    <FieldLabel>For *</FieldLabel>
                    <div className="flex flex-wrap gap-1.5">
                      {(["men", "women", "boys", "girls", "unisex"] as const).map((g) => (
                        <label key={g} className="cursor-pointer">
                          <input type="radio" value={g} {...register("gender")} className="sr-only" />
                          <div className={`rounded-xl border px-3 py-2 text-xs font-semibold capitalize transition-all ${
                            watch("gender") === g
                              ? "border-[#6366f1] bg-[#6366f1] text-white shadow-sm"
                              : "border-[#E9E9EB] bg-white text-[#282C3F] hover:border-[#6366f1]/40"
                          }`}>{g}</div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <FieldLabel>Product Title *</FieldLabel>
                  <Inp {...register("title")}
                    placeholder={selectedCategory
                      ? `e.g. ${selectedCategory.name} — describe style, key feature, material`
                      : "Give your product a clear, descriptive title"
                    }
                  />
                  <p className="mt-1 text-[11px] text-[#94969F]">
                    {watch("title")?.length ?? 0}/120 — include brand, key feature &amp; material for better discoverability
                  </p>
                  <FieldErr msg={errors.title?.message} />
                </div>

                {/* Description */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-[#696B79]">Description</label>
                    {selectedCategory && (
                      <span className="text-[10px] text-[#94969F] italic">Tailored for {selectedCategory.name}</span>
                    )}
                  </div>
                  <textarea {...register("description")} rows={4}
                    placeholder={getCategoryDescPlaceholder(selectedCategory?.slug)}
                    className="w-full resize-none rounded-xl border border-[#E9E9EB] bg-white px-3.5 py-3 text-sm text-[#282C3F] placeholder:text-[#94969F] focus:border-[#6366f1] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/15 transition-all"
                  />
                </div>

                {/* Tags */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-[#696B79]">
                      Search Tags
                      <span className="ml-1.5 font-normal normal-case text-[#94969F]">(optional, max 12)</span>
                    </label>
                    {selectedTags.length > 0 && (
                      <span className="text-[10px] text-[#94969F]">{selectedTags.length}/12</span>
                    )}
                  </div>
                  <div className={`flex min-h-[42px] flex-wrap items-center gap-1.5 rounded-xl border bg-white px-3 py-2 transition-all ${
                    tagInput ? "border-[#6366f1] ring-2 ring-[#6366f1]/15" : "border-[#E9E9EB]"
                  }`}>
                    {selectedTags.map((tag) => (
                      <span key={tag} className="flex items-center gap-1 rounded-lg bg-[#F5F5F6] px-2.5 py-1 text-[11px] font-semibold text-[#282C3F]">
                        #{tag}
                        <button type="button" onClick={() => removeTag(tag)}
                          className="text-[#94969F] hover:text-[#F32F2F] transition-colors">
                          <X size={9} />
                        </button>
                      </span>
                    ))}
                    {selectedTags.length < 12 && (
                      <input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(tagInput); }
                          if (e.key === "Backspace" && !tagInput && selectedTags.length > 0) {
                            removeTag(selectedTags[selectedTags.length - 1]!);
                          }
                        }}
                        placeholder={selectedTags.length === 0 ? "Type a tag and press Enter (e.g. casual, summer, floral)" : "Add more…"}
                        className="flex-1 min-w-[140px] bg-transparent text-sm text-[#282C3F] placeholder:text-[#C8C9CF] outline-none"
                      />
                    )}
                  </div>
                  <p className="mt-1 text-[11px] text-[#94969F]">Tags help buyers discover your product in search. Press Enter or comma to add each tag.</p>
                </div>

                {/* Compliance */}
                <div className="overflow-hidden rounded-2xl border border-[#E9E9EB]">
                  <div className="flex items-center gap-2 border-b border-[#F5F5F6] bg-[#FAFAFA] px-4 py-3">
                    <FileText size={13} className="text-[#696B79]" />
                    <p className="text-[11px] font-bold text-[#282C3F]">Compliance &amp; Logistics</p>
                    <span className="ml-1 text-[10px] text-[#94969F]">(optional but recommended for GST &amp; shipping)</span>
                  </div>
                  <div className="grid gap-4 p-4 sm:grid-cols-2">
                    <div>
                      <FieldLabel>HSN Code</FieldLabel>
                      <Inp {...register("hsn_code")} placeholder="e.g. 61051000 (6-digit code)" />
                      <p className="mt-1 text-[10px] text-[#94969F]">Harmonized System of Nomenclature for GST</p>
                    </div>
                    <div>
                      <FieldLabel>Country of Origin</FieldLabel>
                      <Sel {...register("country_of_origin")}>
                        <option value="">Select country</option>
                        <option value="India">India</option>
                        <option value="China">China</option>
                        <option value="Bangladesh">Bangladesh</option>
                        <option value="Vietnam">Vietnam</option>
                        <option value="Sri Lanka">Sri Lanka</option>
                        <option value="Pakistan">Pakistan</option>
                        <option value="Turkey">Turkey</option>
                        <option value="USA">USA</option>
                        <option value="UK">UK</option>
                        <option value="Italy">Italy</option>
                        <option value="Germany">Germany</option>
                        <option value="France">France</option>
                        <option value="Other">Other</option>
                      </Sel>
                    </div>
                  </div>
                </div>

                {/* Category-specific attribute chips */}
                {selectedCategory && catAttrGroups.length > 0 && (
                  <div className="overflow-hidden rounded-2xl border border-[#E9E9EB]">
                    <div className="flex items-center gap-2 border-b border-[#F5F5F6] bg-[#FAFAFA] px-4 py-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#E8F0FD]">
                        <Info size={12} className="text-[#2874F0]" />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-[#282C3F]">
                          Key Specifications · {selectedCategory.name}
                        </p>
                        <p className="text-[10px] text-[#94969F]">Optional — helps buyers filter and find your product</p>
                      </div>
                      {Object.keys(selectedAttrs).length > 0 && (
                        <span className="ml-auto rounded-full bg-[#6366f1] px-2 py-0.5 text-[10px] font-bold text-white">
                          {Object.keys(selectedAttrs).length} added
                        </span>
                      )}
                    </div>
                    <div className="divide-y divide-[#F5F5F6]">
                      {catAttrGroups.map((group) => (
                        <div key={group.label} className="px-4 py-3.5">
                          <p className="mb-2.5 text-[10px] font-extrabold uppercase tracking-widest text-[#94969F]">
                            {group.label}
                            {selectedAttrs[group.label] && (
                              <span className="ml-2 font-semibold normal-case text-[#6366f1]">→ {selectedAttrs[group.label]}</span>
                            )}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {group.options.map((opt) => {
                              const active = selectedAttrs[group.label] === opt;
                              return (
                                <button key={opt} type="button"
                                  onClick={() => handleAttrChip(group.label, opt)}
                                  className={`flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-150 ${
                                    active
                                      ? "border-[#6366f1] bg-[#6366f1] text-white shadow-sm"
                                      : "border-[#E9E9EB] bg-white text-[#282C3F] hover:border-[#6366f1]/50 hover:text-[#6366f1]"
                                  }`}>
                                  {active && <Check size={9} />}
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── STEP 1: Variants & Pricing ── */}
            {step === 1 && (
              <div>
                {/* Category hint */}
                {selectedCategory && (
                  <div className="mb-5 flex items-center gap-3 rounded-xl bg-[#E8F0FD] px-4 py-3">
                    {React.createElement(getCatIcon(selectedCategory.slug, selectedCategory.name), {
                      size: 14, className: "text-[#2874F0] shrink-0",
                    })}
                    <p className="text-xs font-medium text-[#2874F0]">
                      <span className="font-bold">{selectedCategory.name}</span>
                      {sizePreset.length > 0
                        ? ` — tap the size chips below to quick-add variants`
                        : ` — enter custom sizes for your product`}
                    </p>
                  </div>
                )}

                {/* Quick-add size chips */}
                {sizePreset.length > 0 && (
                  <div className="mb-5 rounded-xl border border-[#E9E9EB] bg-[#FAFAFA] p-4">
                    <p className="mb-3 text-[10px] font-extrabold uppercase tracking-widest text-[#696B79]">
                      Quick-add by size — {selectedCategory?.name ?? "Standard"}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {sizePreset.map((sz) => {
                        const exists = fields.some((_, i) => watch(`variants.${i}.size`) === sz);
                        return (
                          <button key={sz} type="button"
                            onClick={() => {
                              if (!exists) append({ size: sz, color: "", color_hex: "#000000", mrp: 0, selling_price: 0, stock_qty: 0, sku: `SKU-${sz.replace(/\s/g, "")}-${Date.now().toString(36).toUpperCase()}` });
                            }}
                            className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all ${
                              exists
                                ? "border-[#6366f1] bg-[#6366f1] text-white shadow-sm"
                                : "border-[#E9E9EB] bg-white text-[#282C3F] hover:border-[#6366f1] hover:text-[#6366f1]"
                            }`}>
                            {exists && <Check size={10} />}
                            {sz}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Variant cards */}
                <div className="space-y-4">
                  {fields.map((field, i) => {
                    const mVal = watch(`variants.${i}.mrp`);
                    const pVal = watch(`variants.${i}.selling_price`);
                    const d    = discount(Number(mVal), Number(pVal));
                    const colorName = watch(`variants.${i}.color`);
                    const colorHex  = watch(`variants.${i}.color_hex`);
                    const sizeName  = watch(`variants.${i}.size`);
                    return (
                      <div key={field.id} className="overflow-hidden rounded-2xl border border-[#E9E9EB] bg-white shadow-sm">
                        {/* Variant header */}
                        <div className="flex items-center justify-between border-b border-[#F5F5F6] bg-[#FAFAFA] px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#6366f1] text-[9px] font-extrabold text-white">{i + 1}</span>
                            <span className="text-xs font-bold text-[#282C3F]">Variant {i + 1}</span>
                            {(colorName || sizeName) && (
                              <span className="flex items-center gap-1.5 rounded-full bg-[#F5F5F6] px-2.5 py-0.5 text-[10px] font-medium text-[#696B79]">
                                {colorHex && (
                                  <span className="h-3 w-3 rounded-full border border-black/10 shadow-sm" style={{ background: colorHex }} />
                                )}
                                {[sizeName, colorName].filter(Boolean).join(" · ")}
                              </span>
                            )}
                          </div>
                          {fields.length > 1 && (
                            <button type="button" onClick={() => removeVariant(i)}
                              className="flex h-6 w-6 items-center justify-center rounded-full text-[#94969F] hover:bg-[#FFF0F0] hover:text-[#F32F2F] transition-colors">
                              <X size={12} />
                            </button>
                          )}
                        </div>

                        <div className="p-4">
                          <div className="grid gap-3 sm:grid-cols-2">
                            {/* Size */}
                            <div>
                              <FieldLabel>Size *</FieldLabel>
                              <Inp {...register(`variants.${i}.size`)} placeholder={sizePreset[0] ?? "S, M, L, UK 8…"} />
                              <FieldErr msg={errors.variants?.[i]?.size?.message} />
                            </div>

                            {/* Color */}
                            <div>
                              <FieldLabel>Color *</FieldLabel>
                              <div className="flex gap-2">
                                <Inp {...register(`variants.${i}.color`)} placeholder="e.g. Navy Blue" className="flex-1" />
                                <input type="color" {...register(`variants.${i}.color_hex`)} title="Pick hex"
                                  className="h-10 w-12 shrink-0 cursor-pointer rounded-xl border border-[#E9E9EB] px-1.5 py-1" />
                              </div>
                              {/* Color swatches */}
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {COMMON_COLORS.map((c) => (
                                  <button key={c.hex} type="button"
                                    onClick={() => { setValue(`variants.${i}.color`, c.name); setValue(`variants.${i}.color_hex`, c.hex); }}
                                    title={c.name}
                                    className={`h-5 w-5 rounded-full transition-transform hover:scale-125 ${
                                      watch(`variants.${i}.color`) === c.name
                                        ? "scale-125 ring-2 ring-[#6366f1] ring-offset-1"
                                        : "border-2 border-white shadow-sm"
                                    }`}
                                    style={{ background: c.hex }}
                                  />
                                ))}
                              </div>
                              <FieldErr msg={errors.variants?.[i]?.color?.message} />
                            </div>

                            {/* MRP */}
                            <div>
                              <FieldLabel>MRP (₹) *</FieldLabel>
                              <Inp type="number" min={1} {...register(`variants.${i}.mrp`)} placeholder="1999" />
                              <FieldErr msg={errors.variants?.[i]?.mrp?.message} />
                            </div>

                            {/* Selling price */}
                            <div>
                              <FieldLabel>Selling Price (₹) *</FieldLabel>
                              <Inp type="number" min={1} {...register(`variants.${i}.selling_price`)} placeholder="1299" />
                              {d > 0 && (
                                <p className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-[#E6F8F5] px-2 py-0.5 text-[11px] font-bold text-[#03A685]">
                                  <Zap size={9} /> {d}% off MRP
                                </p>
                              )}
                              <FieldErr msg={errors.variants?.[i]?.selling_price?.message} />
                            </div>

                            {/* Stock */}
                            <div>
                              <FieldLabel>Stock Qty</FieldLabel>
                              <Inp type="number" min={0} {...register(`variants.${i}.stock_qty`)} placeholder="100" />
                            </div>

                            {/* SKU */}
                            <div>
                              <FieldLabel>SKU *</FieldLabel>
                              <Inp {...register(`variants.${i}.sku`)} placeholder="BRAND-SIZE-COLOR" />
                              <FieldErr msg={errors.variants?.[i]?.sku?.message} />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button type="button"
                  onClick={() => append({ size: "", color: "", color_hex: "#000000", mrp: 0, selling_price: 0, stock_qty: 0, sku: `SKU-${Date.now().toString(36).toUpperCase()}` })}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#6366f1]/40 py-4 text-sm font-semibold text-[#6366f1] hover:border-[#6366f1] hover:bg-[#f0f4ff] transition-all">
                  <Plus size={15} /> Add Another Variant
                </button>
              </div>
            )}

            {/* ── STEP 2: Photos ── */}
            {step === 2 && (() => {
              const allVariants = watch("variants") ?? [];
              const uniqueColors: { name: string; hex: string }[] = [];
              const seenColors = new Set<string>();
              for (const v of allVariants) {
                if (v.color && !seenColors.has(v.color)) {
                  seenColors.add(v.color);
                  uniqueColors.push({ name: v.color, hex: v.color_hex ?? "#888888" });
                }
              }
              const tabColor = activeColorTab; // "" = General
              const tabImages = images.filter((i) => !i._deleted && (i.color ?? "") === tabColor);
              const canUpload = tabImages.length < 5;

              return (
                <div>
                  <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-[#E8F0FD] px-4 py-3 text-xs text-[#2874F0]">
                    <Info size={13} className="mt-0.5 shrink-0" />
                    <span>Upload photos per color — each section holds up to 5 images. Click any image to set it as the cover photo.</span>
                  </div>

                  {/* Color tabs */}
                  <div className="mb-4 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {[{ name: "", hex: "" }, ...uniqueColors].map((c) => {
                      const label    = c.name || "General";
                      const isActive = activeColorTab === c.name;
                      const count    = images.filter((i) => !i._deleted && (i.color ?? "") === c.name).length;
                      return (
                        <button key={c.name || "__general__"} type="button"
                          onClick={() => setActiveColorTab(c.name)}
                          className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                            isActive
                              ? "bg-[#282C3F] text-white shadow-sm"
                              : "border border-[#E9E9EB] bg-white text-[#282C3F] hover:border-[#282C3F]"
                          }`}>
                          {c.hex && (
                            <span className="h-3 w-3 shrink-0 rounded-full border border-black/10 shadow-sm"
                              style={{ background: c.hex }} />
                          )}
                          {label}
                          {count > 0 && (
                            <span className={`rounded-full px-1.5 py-px text-[9px] font-extrabold ${
                              isActive ? "bg-white/20 text-white" : "bg-[#F5F5F6] text-[#696B79]"
                            }`}>{count}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Upload zone */}
                  {canUpload && (
                    <div onClick={() => { pendingColorRef.current = tabColor; fileInputRef.current?.click(); }}
                      className="mb-4 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[#6366f1]/30 bg-[#f0f4ff]/20 py-10 transition-all hover:border-[#6366f1] hover:bg-[#f0f4ff]/50 active:scale-[0.99]">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f0f4ff] shadow-sm">
                        <Upload size={22} className="text-[#6366f1]" />
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-[#282C3F]">
                          Upload {activeColorTab ? `${activeColorTab} photos` : "general photos"}
                        </p>
                        <p className="mt-0.5 text-xs text-[#696B79]">
                          PNG, JPG, WEBP · up to 5 MB · {5 - tabImages.length} slot{5 - tabImages.length !== 1 ? "s" : ""} left
                        </p>
                      </div>
                    </div>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect} />

                  {/* Image grid for active tab */}
                  {tabImages.length > 0 && (
                    <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                      {images.map((img, i) => {
                        if (img._deleted || (img.color ?? "") !== tabColor) return null;
                        const preview = img._preview ?? img.url;
                        return (
                          <div key={i}
                            className={`group relative aspect-[3/4] cursor-pointer overflow-hidden rounded-2xl border-2 transition-all ${
                              img.is_primary
                                ? "border-[#6366f1] shadow-[0_0_0_3px_#6366f120]"
                                : "border-[#E9E9EB] hover:border-[#6366f1]/60"
                            }`}
                            onClick={() => setPrimary(i)}>
                            {preview
                              ? <img src={preview} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                              : <div className="flex h-full items-center justify-center bg-[#F5F5F6]"><ImageIcon size={24} className="text-[#94969F]" /></div>
                            }
                            {img.is_primary && (
                              <div className="absolute bottom-0 left-0 right-0 bg-[#6366f1] py-1 text-center text-[9px] font-extrabold uppercase tracking-wider text-white">
                                ★ Cover
                              </div>
                            )}
                            <button type="button" onClick={(e) => { e.stopPropagation(); removeImage(i); }}
                              className="absolute right-1.5 top-1.5 hidden h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white group-hover:flex hover:bg-[#F32F2F] transition-colors">
                              <X size={11} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {tabImages.length === 0 && (
                    <div className="mt-2 flex items-start gap-2 rounded-xl border border-[#FF9800]/40 bg-[#FFF8E1] px-4 py-3 text-xs text-[#FF9800]">
                      <AlertCircle size={13} className="mt-0.5 shrink-0" />
                      No photos in this section yet. Products without images get significantly lower visibility.
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ── STEP 3: Review ── */}
            {step === 3 && (
              <div className="space-y-4">

                {/* Product summary */}
                <div className="flex gap-4 rounded-2xl border border-[#E9E9EB] bg-white p-4 shadow-sm">
                  {activeImages[0] ? (
                    <img src={activeImages[0]._preview ?? activeImages[0].url} alt=""
                      className="h-20 w-16 shrink-0 rounded-xl object-cover shadow-sm" />
                  ) : (
                    <div className="flex h-20 w-16 shrink-0 items-center justify-center rounded-xl bg-[#F5F5F6]">
                      <ImageIcon size={22} className="text-[#C8C9CF]" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-extrabold leading-snug text-[#282C3F]">{titleVal || "Untitled product"}</p>
                    <p className="mt-1 text-xs text-[#696B79]">
                      {categories.find((c) => c.id === catVal)?.name ?? "—"}
                      {" · "}{brands.find((b) => b.id === brandVal)?.name ?? "—"}
                      {" · "}{watch("gender")}
                    </p>
                    {selectedTags.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {selectedTags.map((t) => (
                          <span key={t} className="rounded-full bg-[#F5F5F6] px-2 py-0.5 text-[10px] text-[#696B79]">#{t}</span>
                        ))}
                      </div>
                    )}
                    {Object.keys(selectedAttrs).length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {Object.entries(selectedAttrs).map(([k, v]) => (
                          <span key={k} className="rounded-full bg-[#E8F0FD] px-2 py-0.5 text-[10px] font-medium text-[#2874F0]">
                            {k}: {v}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Variants summary */}
                <div className="overflow-hidden rounded-2xl border border-[#E9E9EB]">
                  <div className="flex items-center gap-2 bg-[#F5F5F6] px-4 py-3">
                    <Tag size={12} className="text-[#6366f1]" />
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#696B79]">
                      {fields.length} Variant{fields.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="divide-y divide-[#F5F5F6]">
                    {fields.map((f, i) => {
                      const v = watch(`variants.${i}`) ?? { size: "", color: "", color_hex: "#000000", mrp: 0, selling_price: 0, stock_qty: 0, sku: "" };
                      const d = discount(Number(v.mrp), Number(v.selling_price));
                      return (
                        <div key={f.id} className="flex items-center justify-between px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-5 w-5 rounded-full border-2 border-white shadow-sm" style={{ background: v.color_hex || "#000" }} />
                            <div>
                              <p className="text-sm font-semibold text-[#282C3F]">{v.size || "—"} · {v.color || "—"}</p>
                              <p className="text-[11px] text-[#696B79]">SKU: {v.sku || "—"} · Stock: {v.stock_qty ?? 0}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-[#282C3F]">{formatInr(Number(v.selling_price))}</p>
                            {d > 0 && <p className="text-[11px] font-semibold text-[#03A685]">{d}% off</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Images */}
                <div className="flex items-center gap-3 rounded-xl border border-[#E9E9EB] px-4 py-3">
                  <ImageIcon size={15} className="text-[#696B79]" />
                  <p className="text-sm text-[#282C3F]">
                    {activeImages.length > 0
                      ? <><span className="font-semibold">{activeImages.length} photo{activeImages.length > 1 ? "s" : ""}</span> ready to upload</>
                      : <span className="text-[#FF9800]">No photos — will be listed without images</span>
                    }
                  </p>
                </div>

                {/* Publish notice */}
                <div className="overflow-hidden rounded-2xl border border-[#E9E9EB]">
                  <div className="grid divide-y divide-[#E9E9EB] sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                    <div className="flex items-start gap-3 p-4">
                      <FileText size={14} className="mt-0.5 shrink-0 text-[#696B79]" />
                      <div>
                        <p className="text-xs font-bold text-[#282C3F]">Save as Draft</p>
                        <p className="mt-0.5 text-[11px] leading-relaxed text-[#696B79]">Product is saved privately. Buyers cannot see it. You can edit and publish later.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 bg-[#f0f4ff]/30 p-4">
                      <Rocket size={14} className="mt-0.5 shrink-0 text-[#6366f1]" />
                      <div>
                        <p className="text-xs font-bold text-[#6366f1]">Publish Now</p>
                        <p className="mt-0.5 text-[11px] leading-relaxed text-[#696B79]">Product goes <strong>live on Aura immediately</strong>. You can deactivate or edit it any time.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 flex items-center justify-between border-t border-[#F5F5F6] bg-white px-6 py-4">
          <button type="button"
            onClick={step === 0 ? onClose : () => setStep((s) => s - 1)}
            className="flex items-center gap-2 rounded-xl border border-[#E9E9EB] px-4 py-2.5 text-sm font-semibold text-[#282C3F] hover:bg-[#F5F5F6] transition-colors">
            <ChevronLeft size={15} />{step === 0 ? "Cancel" : "Back"}
          </button>
          <div className="flex items-center gap-2">
            <span className="hidden text-[11px] font-medium text-[#94969F] sm:block">{step + 1} of {STEPS.length}</span>
            {step < STEPS.length - 1 ? (
              <button type="button" onClick={goNext}
                className="flex items-center gap-2 rounded-xl bg-[#282C3F] px-5 py-2.5 text-sm font-bold text-white hover:bg-black transition-colors active:scale-95">
                Continue <ChevronRight size={15} />
              </button>
            ) : (
              <>
                <button type="button"
                  onClick={handleSubmit((d) => onSubmit(d, "draft"))}
                  disabled={submitting}
                  className="flex items-center gap-2 rounded-xl border border-[#E9E9EB] px-4 py-2.5 text-sm font-semibold text-[#282C3F] hover:bg-[#F5F5F6] disabled:opacity-50 transition-all">
                  {submitting ? <Loader2 size={13} className="animate-spin" /> : <FileText size={13} />}
                  Save Draft
                </button>
                <button type="button"
                  onClick={handleSubmit((d) => onSubmit(d, "active"))}
                  disabled={submitting}
                  className="flex items-center gap-2 rounded-xl bg-[#6366f1] px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-[#4f46e5] disabled:opacity-60 transition-all active:scale-95">
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : <Rocket size={14} />}
                  {submitting ? "Saving…" : mode === "create" ? "Publish Now" : "Save & Publish"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CFG: Record<string, { label: string; cls: string; dot: string }> = {
  active:       { label: "Active",       cls: "text-[#03A685] bg-[#E6F8F5]", dot: "bg-[#03A685]" },
  inactive:     { label: "Inactive",     cls: "text-[#696B79] bg-[#F5F5F6]", dot: "bg-[#696B79]" },
  draft:        { label: "Draft",        cls: "text-[#FF9800] bg-[#FFF8E1]", dot: "bg-[#FF9800]" },
  out_of_stock: { label: "Out of Stock", cls: "text-[#F32F2F] bg-[#FFF0F0]", dot: "bg-[#F32F2F]" },
  archived:     { label: "Archived",     cls: "text-[#696B79] bg-[#F5F5F6]", dot: "bg-[#696B79]" },
};

const FILTER_TABS = [
  { key: "all",          label: "All" },
  { key: "active",       label: "Active" },
  { key: "draft",        label: "Drafts" },
  { key: "out_of_stock", label: "Out of Stock" },
  { key: "inactive",     label: "Inactive" },
];

// ── Product Card ──────────────────────────────────────────────────────────────

function ProductCard({ product, onEdit, onDelete, onToggleStatus, onPublish }: {
  product: Product; onEdit: () => void; onDelete: () => void;
  onToggleStatus: () => void; onPublish: () => void;
}) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const isDraft = product.status === "draft";
  const eff = product.stock === 0 && !isDraft ? "out_of_stock" : product.status;
  const cfg = STATUS_CFG[eff] ?? { label: "Inactive", cls: "text-[#696B79] bg-[#F5F5F6]", dot: "bg-[#696B79]" };
  const d   = discount(product.mrp, product.price);

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-[#E9E9EB] bg-white shadow-sm transition-all hover:shadow-md hover:border-[#6366f1]/30">
      {/* Image */}
      <div className="relative aspect-[3/4] overflow-hidden bg-[#F5F5F6]">
        {product.primary_image ? (
          <Image src={product.primary_image} alt={product.title} fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width:640px)50vw,(max-width:1024px)33vw,20vw" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-[#C8C9CF]">
            <ImageIcon size={32} strokeWidth={1.5} />
            <span className="text-[11px]">No image</span>
          </div>
        )}
        {d > 0 && !isDraft && (
          <div className="absolute left-2 top-2 rounded-lg bg-[#6366f1] px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
            {d}% OFF
          </div>
        )}
        {isDraft && (
          <div className="absolute left-2 top-2 rounded-lg bg-[#FF9800] px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
            DRAFT
          </div>
        )}
        {/* Hover overlay */}
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
          <button onClick={onEdit}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#282C3F] shadow-lg hover:bg-[#6366f1] hover:text-white transition-colors">
            <Pencil size={15} />
          </button>
          <button onClick={onDelete}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#282C3F] shadow-lg hover:bg-[#F32F2F] hover:text-white transition-colors">
            <Trash2 size={15} />
          </button>
        </div>
        {/* 3-dot menu */}
        <div className="absolute right-2 top-2">
          <button onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-[#282C3F] shadow-sm hover:bg-white">
            <MoreVertical size={13} />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-8 z-20 min-w-[170px] rounded-xl border border-[#E9E9EB] bg-white py-1 shadow-xl">
                <button onClick={() => { setMenuOpen(false); onEdit(); }}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2 text-sm text-[#282C3F] hover:bg-[#F5F5F6]">
                  <Pencil size={13} className="text-[#696B79]" /> Edit Product
                </button>
                {isDraft ? (
                  <button onClick={() => { setMenuOpen(false); onPublish(); }}
                    className="flex w-full items-center gap-2.5 px-3.5 py-2 text-sm text-[#6366f1] hover:bg-[#FFF0F0]">
                    <Rocket size={13} /> Publish Now
                  </button>
                ) : (
                  <button onClick={() => { setMenuOpen(false); onToggleStatus(); }}
                    className="flex w-full items-center gap-2.5 px-3.5 py-2 text-sm text-[#282C3F] hover:bg-[#F5F5F6]">
                    {product.status === "inactive"
                      ? <><Eye size={13} className="text-[#696B79]" /> Set Active</>
                      : <><EyeOff size={13} className="text-[#696B79]" /> Set Inactive</>}
                  </button>
                )}
                <button onClick={() => { navigator.clipboard.writeText(product.id); toast.success("Product ID copied"); setMenuOpen(false); }}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2 text-sm text-[#282C3F] hover:bg-[#F5F5F6]">
                  <Copy size={13} className="text-[#696B79]" /> Copy ID
                </button>
                <div className="my-1 border-t border-[#E9E9EB]" />
                <button onClick={() => { setMenuOpen(false); onDelete(); }}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2 text-sm text-[#F32F2F] hover:bg-[#FFF0F0]">
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      {/* Info */}
      <div className="flex flex-1 flex-col p-3">
        <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#6366f1]">{product.brand_name ?? ""}</p>
        <p className="mb-2 line-clamp-2 text-sm font-medium leading-snug text-[#282C3F]">{product.title}</p>
        <div className="mt-auto space-y-2">
          {!isDraft && (
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-bold text-[#282C3F]">{formatInr(product.price)}</span>
              {product.mrp > product.price && (
                <span className="text-xs text-[#94969F] line-through">{formatInr(product.mrp)}</span>
              )}
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${cfg.cls}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />{cfg.label}
            </span>
            {isDraft ? (
              <button onClick={onPublish}
                className="flex items-center gap-1 rounded-lg bg-[#6366f1] px-2 py-1 text-[10px] font-bold text-white hover:bg-[#4f46e5] transition-colors">
                <Rocket size={9} /> Publish
              </button>
            ) : (
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${stockColor(product.stock)}`}>
                {product.stock} units
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 border-t border-[#F5F5F6] pt-2">
            <span className="text-[10px] text-[#94969F]">{product.variant_count} variant{product.variant_count !== 1 ? "s" : ""}</span>
            <span className="text-[#E9E9EB]">·</span>
            <span className="text-[10px] capitalize text-[#94969F]">{product.category_name ?? "—"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Table row ─────────────────────────────────────────────────────────────────

function ProductRow({ product, onEdit, onDelete, onToggleStatus, onPublish }: {
  product: Product; onEdit: () => void; onDelete: () => void;
  onToggleStatus: () => void; onPublish: () => void;
}) {
  const isDraft = product.status === "draft";
  const eff = product.stock === 0 && !isDraft ? "out_of_stock" : product.status;
  const cfg = STATUS_CFG[eff] ?? { label: "Inactive", cls: "text-[#696B79] bg-[#F5F5F6]", dot: "bg-[#696B79]" };
  const d   = discount(product.mrp, product.price);
  return (
    <tr className="group border-b border-[#E9E9EB] last:border-0 hover:bg-[#f0f4ff]/20 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-10 shrink-0 overflow-hidden rounded-xl bg-[#F5F5F6]">
            {product.primary_image
              ? <Image src={product.primary_image} alt={product.title} fill className="object-cover" sizes="40px" />
              : <div className="flex h-full items-center justify-center"><ImageIcon size={14} className="text-[#C8C9CF]" /></div>
            }
          </div>
          <div className="min-w-0">
            <p className="line-clamp-1 text-sm font-semibold text-[#282C3F]">{product.title}</p>
            <p className="text-[11px] font-medium text-[#6366f1]">{product.brand_name ?? "—"}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-xs text-[#696B79]">{product.category_name ?? "—"}</td>
      <td className="px-4 py-3">
        {isDraft ? (
          <span className="text-xs text-[#94969F]">—</span>
        ) : (
          <>
            <p className="text-sm font-bold text-[#282C3F]">{formatInr(product.price)}</p>
            {d > 0 && <p className="text-[10px] font-semibold text-[#03A685]">{d}% off</p>}
          </>
        )}
      </td>
      <td className="px-4 py-3">
        {isDraft ? (
          <span className="text-xs text-[#94969F]">—</span>
        ) : (
          <span className={`text-xs font-semibold ${product.stock === 0 ? "text-[#F32F2F]" : product.stock < 10 ? "text-[#FF9800]" : "text-[#282C3F]"}`}>
            {product.stock}
          </span>
        )}
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${cfg.cls}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />{cfg.label}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-[#94969F]">
        {new Date(product.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button onClick={onEdit} className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#E9E9EB] text-[#696B79] hover:border-[#6366f1] hover:text-[#6366f1]">
            <Pencil size={13} />
          </button>
          {isDraft ? (
            <button onClick={onPublish} title="Publish" className="flex h-7 items-center gap-1 rounded-lg border border-[#6366f1] bg-[#6366f1] px-2 text-[10px] font-bold text-white hover:bg-[#4f46e5]">
              <Rocket size={11} /> Publish
            </button>
          ) : (
            <button onClick={onToggleStatus} className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#E9E9EB] text-[#696B79] hover:border-[#2874F0] hover:text-[#2874F0]">
              {product.status === "inactive" ? <Eye size={13} /> : <EyeOff size={13} />}
            </button>
          )}
          <button onClick={onDelete} className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#E9E9EB] text-[#696B79] hover:border-[#F32F2F] hover:text-[#F32F2F]">
            <Trash2 size={13} />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ── Main Products Page ────────────────────────────────────────────────────────

export default function ProductsPage() {
  const [products, setProducts]     = React.useState<Product[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [brands, setBrands]         = React.useState<Brand[]>([]);
  const [loading, setLoading]       = React.useState(true);
  const [sellerId, setSellerId]     = React.useState<string | null>(null);
  const [noSeller, setNoSeller]     = React.useState(false);

  const [search, setSearch]         = React.useState("");
  const [filterTab, setFilterTab]   = React.useState("all");
  const [filterCat, setFilterCat]   = React.useState("");
  const [viewMode, setViewMode]     = React.useState<"grid" | "list">("grid");
  const [sortBy, setSortBy]         = React.useState("newest");

  const [modalMode, setModalMode]   = React.useState<"create" | "edit" | null>(null);
  const [editId, setEditId]         = React.useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Product | null>(null);

  async function fetchProducts(sid: string) {
    setLoading(true);
    const supabase = createClient();
    const { data: prods, error } = await (supabase as any)
      .from("products")
      .select(`
        id, title, slug, status, description, gender, created_at, updated_at,
        category_id, brand_id,
        category:categories(id, name, slug),
        brand:brands(name),
        images:product_images(url, is_primary),
        variants:product_variants(mrp, selling_price, stock_qty)
      `)
      .eq("seller_id", sid)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) { toast.error("Could not load products"); setLoading(false); return; }

    const mapped: Product[] = (prods ?? []).map((p: any) => {
      const primary    = (p.images ?? []).find((i: any) => i.is_primary) ?? p.images?.[0];
      const cheapest   = [...(p.variants ?? [])].sort((a: any, b: any) => a.selling_price - b.selling_price)[0];
      const totalStock = (p.variants ?? []).reduce((s: number, v: any) => s + (v.stock_qty ?? 0), 0);
      return {
        id: p.id, title: p.title, slug: p.slug,
        description: p.description, gender: p.gender, status: p.status,
        category_id:   p.category_id, brand_id: p.brand_id,
        category_name: p.category?.name ?? null,
        brand_name:    p.brand?.name ?? null,
        category_slug: p.category?.slug ?? null,
        price:         Number(cheapest?.selling_price ?? 0),
        mrp:           Number(cheapest?.mrp ?? 0),
        stock:         totalStock,
        primary_image: primary?.url ?? null,
        variant_count: (p.variants ?? []).length,
        created_at:    p.created_at,
        updated_at:    p.updated_at,
      };
    });
    setProducts(mapped);
    setLoading(false);
  }

  React.useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }
      const { data: seller } = await (supabase as any)
        .from("sellers").select("id").eq("user_id", session.user.id).single();
      if (!seller) { setLoading(false); setNoSeller(true); return; }
      setSellerId(seller.id);
      // Brands: RLS automatically returns global (seller_id IS NULL) + seller's own brands
      const [{ data: cats }, { data: brnds }] = await Promise.all([
        supabase.from("categories").select("id, name, slug").eq("active", true).order("display_order"),
        (supabase as any).from("brands").select("id, name, seller_id").eq("active", true).order("name"),
      ]);
      setCategories((cats as Category[]) ?? []);
      setBrands((brnds as Brand[]) ?? []);
      await fetchProducts(seller.id);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDelete(product: Product) {
    const supabase = createClient();
    await (supabase as any).from("products").update({
      status: "archived", deleted_at: new Date().toISOString(),
    }).eq("id", product.id);
    toast.success("Product archived");
    setDeleteTarget(null);
    setProducts((prev) => prev.filter((p) => p.id !== product.id));
  }

  async function handleToggleStatus(product: Product) {
    const next = product.status === "inactive" ? "active" : "inactive";
    const supabase = createClient();
    await (supabase as any).from("products").update({ status: next }).eq("id", product.id);
    setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, status: next } : p));
    toast.success(`Product set to ${next}`);
  }

  async function handlePublish(product: Product) {
    const supabase = createClient();
    await (supabase as any).from("products").update({ status: "active" }).eq("id", product.id);
    setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, status: "active" } : p));
    toast.success(`"${product.title}" is now live on Aura!`);
  }

  const filtered = React.useMemo(() => {
    let list = [...products];
    if (filterTab !== "all") {
      list = list.filter((p) => {
        const eff = p.stock === 0 && p.status !== "draft" ? "out_of_stock" : p.status;
        return eff === filterTab;
      });
    }
    if (filterCat) list = list.filter((p) => p.category_id === filterCat);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((p) =>
        p.title.toLowerCase().includes(q) ||
        (p.brand_name ?? "").toLowerCase().includes(q) ||
        (p.category_name ?? "").toLowerCase().includes(q)
      );
    }
    if (sortBy === "newest")     list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    if (sortBy === "oldest")     list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    if (sortBy === "modified")   list.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    if (sortBy === "price_asc")  list.sort((a, b) => a.price - b.price);
    if (sortBy === "price_desc") list.sort((a, b) => b.price - a.price);
    if (sortBy === "stock_asc")  list.sort((a, b) => a.stock - b.stock);
    return list;
  }, [products, filterTab, filterCat, search, sortBy]);

  const tabCounts = React.useMemo(() => {
    const c: Record<string, number> = { all: products.length };
    products.forEach((p) => {
      const key = p.stock === 0 && p.status !== "draft" ? "out_of_stock" : p.status;
      c[key] = (c[key] ?? 0) + 1;
    });
    return c;
  }, [products]);

  const draftCount = tabCounts["draft"] ?? 0;

  return (
    <div>
      {/* Modals */}
      {modalMode && sellerId && (
        <ProductModal
          mode={modalMode}
          sellerId={sellerId}
          editProductId={editId ?? undefined}
          categories={categories}
          initialBrands={brands}
          onClose={() => { setModalMode(null); setEditId(null); }}
          onSuccess={() => {
            setModalMode(null); setEditId(null);
            if (sellerId) void fetchProducts(sellerId);
          }}
        />
      )}
      {deleteTarget && (
        <ConfirmDialog
          title="Archive Product"
          body={`"${deleteTarget.title}" will be archived and hidden from customers.`}
          onConfirm={() => handleDelete(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Page header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#282C3F]">Products</h1>
          <p className="mt-0.5 text-sm text-[#696B79]">
            {loading ? "Loading…" : `${products.length} product${products.length !== 1 ? "s" : ""} in your catalogue`}
            {draftCount > 0 && (
              <button onClick={() => setFilterTab("draft")}
                className="ml-2 inline-flex items-center gap-1 rounded-full bg-[#FFF8E1] px-2 py-0.5 text-[10px] font-bold text-[#FF9800] hover:bg-[#FF9800] hover:text-white transition-colors">
                {draftCount} unpublished
              </button>
            )}
          </p>
        </div>
        <button
          onClick={() => { setModalMode("create"); setEditId(null); }}
          disabled={!sellerId || loading}
          className="flex items-center gap-2 rounded-xl bg-[#6366f1] px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-[#4f46e5] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
          {loading && !sellerId ? <Loader2 size={15} className="animate-spin" /> : <Plus size={16} />}
          Add Product
        </button>
      </div>

      {/* No seller warning */}
      {noSeller && (
        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-[#FF9800]/40 bg-[#FFF8E1] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="mt-0.5 shrink-0 text-[#FF9800]" />
            <div>
              <p className="text-sm font-bold text-[#282C3F]">Seller profile incomplete</p>
              <p className="mt-0.5 text-xs text-[#696B79]">
                Your seller registration isn't finished yet. Complete it to start listing products and access all dashboard features.
              </p>
            </div>
          </div>
          <a href="/register"
            className="flex shrink-0 items-center gap-2 rounded-xl bg-[#FF9800] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#e68a00] transition-colors">
            Complete Registration
          </a>
        </div>
      )}

      {/* Filter bar */}
      {!noSeller && (
        <div className="mb-4 rounded-2xl border border-[#E9E9EB] bg-white p-4 shadow-sm">
          {/* Status tabs */}
          <div className="mb-3 flex gap-1 overflow-x-auto border-b border-[#E9E9EB] pb-3 scrollbar-none">
            {FILTER_TABS.map((t) => {
              const count  = tabCounts[t.key] ?? 0;
              const active = filterTab === t.key;
              return (
                <button key={t.key} onClick={() => setFilterTab(t.key)}
                  className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-semibold transition-colors ${
                    active ? "border-[#6366f1] text-[#6366f1]" : "border-transparent text-[#696B79] hover:text-[#282C3F]"
                  }`}>
                  {t.label}
                  {count > 0 && (
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      active ? "bg-[#6366f1] text-white" : "bg-[#F5F5F6] text-[#696B79]"
                    }`}>{count}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search + filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-[#E9E9EB] bg-[#F5F5F6] px-3 py-2">
              <Search size={14} className="shrink-0 text-[#94969F]" />
              <input type="search" placeholder="Search by name, brand, or category…"
                value={search} onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#94969F]" />
            </div>

            <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)}
              className="h-9 rounded-xl border border-[#E9E9EB] bg-white px-3 text-xs font-medium text-[#282C3F] focus:border-[#6366f1] focus:outline-none">
              <option value="">All Categories</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
              className="h-9 rounded-xl border border-[#E9E9EB] bg-white px-3 text-xs font-medium text-[#282C3F] focus:border-[#6366f1] focus:outline-none">
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="modified">Recently Modified</option>
              <option value="price_asc">Price ↑</option>
              <option value="price_desc">Price ↓</option>
              <option value="stock_asc">Low Stock</option>
            </select>

            <div className="flex overflow-hidden rounded-xl border border-[#E9E9EB]">
              <button onClick={() => setViewMode("grid")}
                className={`flex h-9 w-9 items-center justify-center transition-colors ${viewMode === "grid" ? "bg-[#6366f1] text-white" : "bg-white text-[#696B79] hover:bg-[#F5F5F6]"}`}>
                <LayoutGrid size={14} />
              </button>
              <button onClick={() => setViewMode("list")}
                className={`flex h-9 w-9 items-center justify-center transition-colors ${viewMode === "list" ? "bg-[#6366f1] text-white" : "bg-white text-[#696B79] hover:bg-[#F5F5F6]"}`}>
                <List size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Products */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 size={24} className="animate-spin text-[#6366f1]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-[#E9E9EB] bg-white py-20 text-center shadow-sm">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#F5F5F6]">
            <Package size={28} className="text-[#C8C9CF]" strokeWidth={1.5} />
          </div>
          <p className="font-bold text-[#282C3F]">{search || filterTab !== "all" || filterCat ? "No products match your filters" : "No products yet"}</p>
          <p className="mt-1 text-sm text-[#696B79]">
            {search || filterTab !== "all" || filterCat
              ? "Try clearing your filters"
              : "Add your first product to start selling on Aura"}
          </p>
          {!search && filterTab === "all" && !filterCat && sellerId && (
            <button
              onClick={() => { setModalMode("create"); setEditId(null); }}
              className="mt-5 flex items-center gap-2 rounded-xl bg-[#6366f1] px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-[#4f46e5] transition-all active:scale-95">
              <Plus size={15} /> Add Your First Product
            </button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p}
              onEdit={() => { setEditId(p.id); setModalMode("edit"); }}
              onDelete={() => setDeleteTarget(p)}
              onToggleStatus={() => handleToggleStatus(p)}
              onPublish={() => handlePublish(p)}
            />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#E9E9EB] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E9E9EB] bg-[#FAFAFA]">
                  {["Product", "Category", "Price", "Stock", "Status", "Listed", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-extrabold uppercase tracking-widest text-[#696B79]">
                      <span className="flex items-center gap-1">{h}{h === "Price" && <ArrowUpDown size={9} />}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <ProductRow key={p.id} product={p}
                    onEdit={() => { setEditId(p.id); setModalMode("edit"); }}
                    onDelete={() => setDeleteTarget(p)}
                    onToggleStatus={() => handleToggleStatus(p)}
                    onPublish={() => handlePublish(p)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
