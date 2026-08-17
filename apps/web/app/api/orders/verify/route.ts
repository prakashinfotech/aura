import { type NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { Resend } from "resend";
import { createClient, createAdminClient } from "@aura/db/server";
import { buildOrderConfirmationEmail } from "@/lib/order-email";
import { rateLimit } from "@/lib/rate-limit";

interface OrderItemInput {
  productId: string;
  variantId: string;
  qty: number;
  mrp: number;
  price: number;
  name?: string;
  brand?: string;
  size?: string;
  color?: string;
}

interface VerifyPayload {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature?: string;
  payment_failed?: boolean;
  address_id: string;
  subtotal: number;
  delivery_charge: number;
  total: number;
  items: OrderItemInput[];
}

export async function POST(request: NextRequest) {
  try {
    // ✅ SECURITY: Rate limit payment verification (100 per user per hour)
    const authHeader = request.headers.get("Authorization") || "";
    const userIdMatch = authHeader.match(/Bearer ([^.]+)/);
    const userId = userIdMatch ? userIdMatch[1] : request.ip || "anonymous";

    const { success: rateLimitSuccess, resetTime } = rateLimit(
      `order_verify:${userId}`,
      100, // 100 verifications per hour (generous for retries)
      60 * 60 * 1000 // 1 hour window
    );

    if (!rateLimitSuccess) {
      return NextResponse.json(
        { error: "Too many verification attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((resetTime - Date.now()) / 1000)) } }
      );
    }

    const body = await request.json() as VerifyPayload;
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      payment_failed = false,
      address_id,
      subtotal,
      delivery_charge,
      total,
      items = [],
    } = body;

    const secret = process.env["RAZORPAY_KEY_SECRET"];
    if (!secret) {
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    const paymentStatus: "paid" | "failed" = payment_failed ? "failed" : "paid";

    if (!payment_failed) {
      if (!razorpay_signature) {
        return NextResponse.json({ error: "Missing signature" }, { status: 400 });
      }
      const expectedSignature = createHmac("sha256", secret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");
      if (expectedSignature !== razorpay_signature) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
      }
    }

    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Look up seller_id for each product (admin client — products may be filtered by RLS on buyer session)
    const productIds = [...new Set(items.map((i) => i.productId))];
    const sellerMap = new Map<string, string>();
    if (productIds.length > 0) {
      const { data: products } = await adminSupabase
        .from("products")
        .select("id, seller_id")
        .in("id", productIds);
      (products ?? []).forEach((p) => {
        if (p.seller_id) sellerMap.set(p.id, p.seller_id);
      });

      // ✅ SECURITY: Verify all sellers exist before creating order_items
      const sellerIds = Array.from(new Set(products?.map(p => p.seller_id).filter(Boolean) ?? []));
      if (sellerIds.length > 0) {
        const { data: sellers, error: sellersError } = await adminSupabase
          .from("sellers")
          .select("id")
          .in("id", sellerIds);

        if (sellersError || !sellers || sellers.length !== sellerIds.length) {
          const missingSellerIds = sellerIds.filter(
            sid => !sellers?.some(s => s.id === sid)
          );
          console.error("[seller_validation_failed]", { missingSellerIds });
          return NextResponse.json(
            { error: "Some sellers are not available. Please try your order again." },
            { status: 400 }
          );
        }
      }
    }

    // Create order record (buyer session — RLS "Orders insert own" policy allows this)
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        address_id,
        status: "placed",
        subtotal,
        delivery_charge,
        total,
        payment_method: null,
        payment_status: paymentStatus,
        razorpay_order_id,
        razorpay_payment_id: paymentStatus === "paid" ? razorpay_payment_id : null,
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error("Order insert failed:", orderError);
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }

    // Create order_items using admin client — order_items has RLS enabled but no buyer INSERT policy.
    // Payment signature is already verified above so this is safe.
    if (paymentStatus === "paid" && items.length > 0) {
      const orderItems = items
        .filter((item) => sellerMap.has(item.productId))
        .map((item) => ({
          order_id: order.id,
          product_id: item.productId,
          variant_id: item.variantId,
          seller_id: sellerMap.get(item.productId)!,
          qty: item.qty,
          mrp: item.mrp,
          selling_price: item.price,
          status: "placed",
        }));

      if (orderItems.length > 0) {
        const { error: itemsError } = await adminSupabase
          .from("order_items")
          .insert(orderItems);
        if (itemsError) {
          // ✅ SECURITY: Don't log sensitive seller/order IDs
          console.error("[order_items insert failed]", {
            code: itemsError.code,
            itemCount: orderItems.length,
            // Removed: message, details, sellerIds (sensitive)
          });
        }
      } else {
        // ✅ SECURITY: Don't log product IDs in logs
        console.warn("No order_items created — products have no seller_id");
      }
    }

    // Send confirmation email (fire-and-forget — never block the response)
    if (paymentStatus === "paid" && user.email) {
      void sendConfirmationEmail({
        supabase,
        userEmail: user.email,
        userId: user.id,
        orderId: order.id,
        addressId: address_id,
        items,
        subtotal,
        deliveryCharge: delivery_charge,
        total,
        createdAt: order.created_at ?? new Date().toISOString(),
      });
    }

    return NextResponse.json({ success: true, orderId: order.id, paymentStatus });
  } catch (err) {
    console.error("Payment verify error:", err);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}

// ── Email helper (runs after response is returned) ───────────────────────────

async function sendConfirmationEmail({
  supabase,
  userEmail,
  userId,
  orderId,
  addressId,
  items,
  subtotal,
  deliveryCharge,
  total,
  createdAt,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any;
  userEmail: string;
  userId: string;
  orderId: string;
  addressId: string;
  items: OrderItemInput[];
  subtotal: number;
  deliveryCharge: number;
  total: number;
  createdAt: string;
}) {
  try {
    const resendKey = process.env["RESEND_API_KEY"];
    if (!resendKey) return; // email not configured — skip silently

    // Fetch profile name and delivery address in parallel
    const [profileResult, addressResult] = await Promise.all([
      supabase.from("profiles").select("name").eq("id", userId).single(),
      supabase
        .from("addresses")
        .select("name, line1, line2, city, state, pincode, phone")
        .eq("id", addressId)
        .single(),
    ]);

    const customerName: string =
      (profileResult.data?.name as string | null) ??
      userEmail.split("@")[0] ??
      "Customer";

    const address = addressResult.data as {
      name: string;
      line1: string;
      line2: string | null;
      city: string;
      state: string;
      pincode: string;
      phone: string;
    } | null;

    const appUrl =
      process.env["NEXT_PUBLIC_APP_URL"] ?? "http://localhost:3000";

    const html = buildOrderConfirmationEmail({
      orderId,
      customerName,
      orderDate: createdAt,
      items,
      subtotal,
      deliveryCharge,
      total,
      address,
      appUrl,
    });

    const resend = new Resend(resendKey);
    const fromAddress =
      process.env["RESEND_FROM_EMAIL"] ?? "Aura <onboarding@resend.dev>";

    const { error } = await resend.emails.send({
      from: fromAddress,
      to: userEmail,
      subject: `Order Confirmed! #${orderId.slice(0, 8).toUpperCase()} 🎉`,
      html,
    });

    if (error) {
      // ✅ SECURITY: Don't log email error details
      console.error("[email_send_failed]", { operation: "confirmation_email" });
    }
  } catch (err) {
    // ✅ SECURITY: Log operation only, not full error
    console.error("[email_send_exception]", { operation: "confirmation_email" });
  }
}
