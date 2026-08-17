import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { createAdminClient } from "@aura/db/server";
import { rateLimit } from "@/lib/rate-limit";

/**
 * ✅ SECURITY: Razorpay Webhook Handler
 * Verifies signature to prevent forged payment confirmations
 *
 * Events handled:
 * - payment.authorized → Update order to paid
 * - payment.failed → Mark order as payment failed
 * - settlement.processed → Update settlement status
 */

export async function POST(request: NextRequest) {
  try {
    // ✅ SECURITY: Rate limit webhook endpoint to prevent DoS
    const ipAddress = request.headers.get("x-forwarded-for") || request.ip || "unknown";
    const { success } = rateLimit(`webhook_razorpay:${ipAddress}`, 1000, 60 * 1000); // 1000/min per IP

    if (!success) {
      return NextResponse.json({ error: "Rate limited" }, { status: 429 });
    }

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("[webhook] Razorpay webhook secret not configured");
      return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
    }

    // ✅ SECURITY: Read raw body for signature verification
    const body = await request.text();

    // ✅ SECURITY: Verify webhook signature
    const signature = request.headers.get("x-razorpay-signature");
    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    const expectedSignature = createHmac("sha256", webhookSecret)
      .update(body)
      .digest("hex");

    if (expectedSignature !== signature) {
      console.error("[webhook] Signature verification failed");
      return NextResponse.json({ error: "Signature mismatch" }, { status: 401 });
    }

    // Parse verified body
    const event = JSON.parse(body) as {
      event: string;
      payload?: {
        payment?: {
          id: string;
          order_id: string;
          status: string;
          entity?: unknown;
        };
        settlement?: {
          id: string;
          entity?: unknown;
        };
      };
    };

    const adminSupabase = createAdminClient();

    // Handle different event types
    switch (event.event) {
      case "payment.authorized": {
        const paymentId = event.payload?.payment?.id;
        const orderId = event.payload?.payment?.order_id;

        if (!paymentId || !orderId) {
          console.warn("[webhook] Missing payment or order ID");
          return NextResponse.json({ success: true }); // Ack to prevent retries
        }

        // Update order status to paid
        const { error } = await adminSupabase
          .from("orders")
          .update({
            payment_status: "paid",
            razorpay_payment_id: paymentId,
            updated_at: new Date().toISOString(),
          })
          .eq("razorpay_order_id", orderId);

        if (error) {
          console.error("[webhook] Failed to update order:", error);
          // Still ack to prevent infinite retries
          return NextResponse.json({ success: true });
        }

        break;
      }

      case "payment.failed": {
        const orderId = event.payload?.payment?.order_id;

        if (!orderId) {
          console.warn("[webhook] Missing order ID for failed payment");
          return NextResponse.json({ success: true });
        }

        // Update order status to failed
        await adminSupabase
          .from("orders")
          .update({
            payment_status: "failed",
            updated_at: new Date().toISOString(),
          })
          .eq("razorpay_order_id", orderId);

        break;
      }

      case "settlement.processed": {
        const settlementId = event.payload?.settlement?.id;

        if (!settlementId) {
          console.warn("[webhook] Missing settlement ID");
          return NextResponse.json({ success: true });
        }

        // Update settlement status
        await adminSupabase
          .from("settlements")
          .update({
            status: "completed",
            updated_at: new Date().toISOString(),
          })
          .eq("razorpay_payout_id", settlementId);

        break;
      }

      default:
        // Unknown event type, just ack
        console.debug(`[webhook] Unhandled event type: ${event.event}`);
    }

    // Always return 200 to acknowledge webhook
    // Razorpay will retry if we return error status
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[webhook] Error processing webhook:", err instanceof Error ? err.message : err);
    // Return 200 anyway to prevent infinite retries
    return NextResponse.json({ success: true });
  }
}
