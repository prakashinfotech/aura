import { type NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    // ✅ SECURITY: Rate limit order creation (5 per user per hour)
    const authHeader = request.headers.get("Authorization") || "";
    const userIdMatch = authHeader.match(/Bearer ([^.]+)/);
    const userId = userIdMatch ? userIdMatch[1] : request.ip || "anonymous";

    const { success, remaining, resetTime } = rateLimit(
      `order_create:${userId}`,
      5, // 5 orders per hour
      60 * 60 * 1000 // 1 hour window
    );

    if (!success) {
      return NextResponse.json(
        { error: `Too many order creation attempts. Try again at ${new Date(resetTime).toISOString()}` },
        { status: 429, headers: { "Retry-After": String(Math.ceil((resetTime - Date.now()) / 1000)) } }
      );
    }

    const keyId = process.env["RAZORPAY_KEY_ID"];
    const keySecret = process.env["RAZORPAY_KEY_SECRET"];
    if (!keyId || !keySecret) {
      return NextResponse.json({ error: "Payment not configured" }, { status: 503 });
    }
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

    const body = await request.json() as { amount: number };

    if (!body.amount || body.amount < 1) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const order = await razorpay.orders.create({
      amount: Math.round(body.amount * 100),
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    });

    return NextResponse.json({ id: order.id, amount: order.amount, currency: order.currency });
  } catch (err) {
    console.error("Razorpay order creation failed:", err);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
