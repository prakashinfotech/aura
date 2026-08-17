import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const admin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

function generateTrackingId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "MNT";
  for (let i = 0; i < 8; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

/** POST /api/dispatch
 * body: { orderItemId: string, action: "accept" | "dispatch" }
 * accept  → placed → processing (seller confirmed the order)
 * dispatch → processing → shipped  (parcel handed to courier)
 */
export async function POST(req: NextRequest) {
  try {
    // ✅ SECURITY: CSRF protection - verify request origin
    const origin = req.headers.get("origin");
    const referer = req.headers.get("referer");
    const expectedOrigin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";

    if (origin && !origin.startsWith(expectedOrigin)) {
      return NextResponse.json(
        { error: "CSRF validation failed" },
        { status: 403 }
      );
    }

    if (referer && !referer.startsWith(expectedOrigin)) {
      return NextResponse.json(
        { error: "Invalid referer" },
        { status: 403 }
      );
    }

    const { orderItemId, action } = (await req.json()) as {
      orderItemId: string;
      action: "accept" | "dispatch";
    };

    if (!orderItemId || !action) {
      return NextResponse.json({ error: "orderItemId and action required" }, { status: 400 });
    }

    const db = admin();
    const now = new Date().toISOString();

    // ✅ SECURITY: Get authenticated user and verify seller ownership
    const userResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/user`,
      { headers: { Authorization: req.headers.get("Authorization") || "" } }
    );

    if (!userResponse.ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await userResponse.json();

    // Get seller_id for authenticated user
    const { data: seller, error: sellerError } = await db
      .from("sellers")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (sellerError || !seller) {
      return NextResponse.json({ error: "Seller not found" }, { status: 403 });
    }

    // ✅ SECURITY: Verify seller owns this order_item
    const { data: orderItem, error: orderItemError } = await db
      .from("order_items")
      .select("seller_id, status")
      .eq("id", orderItemId)
      .single();

    if (orderItemError || !orderItem) {
      return NextResponse.json({ error: "Order item not found" }, { status: 404 });
    }

    if (orderItem.seller_id !== seller.id) {
      return NextResponse.json(
        { error: "Unauthorized: This order does not belong to your store" },
        { status: 403 }
      );
    }

    if (action === "accept") {
      // ✅ SECURITY: Double-check seller_id in WHERE clause (defense in depth)
      const { error } = await db
        .from("order_items")
        .update({ status: "processing", updated_at: now })
        .eq("id", orderItemId)
        .eq("seller_id", seller.id)
        .eq("status", "placed");
      if (error) throw error;

      await db.from("order_tracking_events").insert({
        order_item_id: orderItemId,
        status: "processing",
        description: "Seller confirmed the order and is preparing your package",
        ts: now,
      });

      return NextResponse.json({ success: true, newStatus: "processing" });
    }

    if (action === "dispatch") {
      const trackingNumber = generateTrackingId();
      const dispatchedAt  = now;
      // EDD = dispatch date + 4 days (shows as Day 4 end-of-day)
      const edd = new Date(new Date(now).getTime() + 4 * 24 * 60 * 60 * 1000);
      edd.setHours(23, 59, 59, 0);

      // ✅ SECURITY: Double-check seller_id in WHERE clause (defense in depth)
      const { error } = await db
        .from("order_items")
        .update({
          status: "shipped",
          tracking_number: trackingNumber,
          courier: "Aura Logistics",
          dispatched_at: dispatchedAt,
          updated_at: now,
        })
        .eq("id", orderItemId)
        .eq("seller_id", seller.id);
      if (error) throw error;

      await db.from("order_tracking_events").insert({
        order_item_id: orderItemId,
        status: "shipped",
        description: `Package dispatched · Tracking ID: ${trackingNumber}`,
        ts: now,
      });

      // Promote parent order status if all items are now shipped
      const { data: item } = await db
        .from("order_items")
        .select("order_id")
        .eq("id", orderItemId)
        .single();

      if (item?.order_id) {
        const { data: siblings } = await db
          .from("order_items")
          .select("status")
          .eq("order_id", item.order_id);

        const allShipped = (siblings ?? []).every(
          (s: { status: string }) => !["placed", "processing"].includes(s.status)
        );
        if (allShipped) {
          await db.from("orders").update({ status: "shipped", updated_at: now }).eq("id", item.order_id);
        }
      }

      return NextResponse.json({
        success: true,
        newStatus: "shipped",
        trackingNumber,
        estimatedDelivery: edd.toISOString(),
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("[dispatch]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
