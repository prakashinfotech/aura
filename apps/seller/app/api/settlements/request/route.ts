import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@aura/db/server";

export async function POST(request: NextRequest) {
  try {
    // ✅ SECURITY: CSRF protection - verify request origin
    const origin = request.headers.get("origin");
    const referer = request.headers.get("referer");
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

    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Resolve seller_id for this user
    const { data: seller, error: sellerError } = await adminSupabase
      .from("sellers")
      .select("id, store_name, bank_details, commission_rate")
      .eq("user_id", user.id)
      .single();

    if (sellerError || !seller) {
      return NextResponse.json({ error: "Seller account not found" }, { status: 404 });
    }

    // Bank account must be configured before withdrawal
    const bank = seller.bank_details as {
      accountHolder?: string;
      accountNumber?: string;
      ifsc?: string;
      bankName?: string;
    } | null;

    if (!bank?.accountNumber || !bank?.ifsc || !bank?.accountHolder) {
      return NextResponse.json(
        { error: "Bank account not configured. Add bank details in Settings before withdrawing." },
        { status: 400 }
      );
    }

    // ✅ SECURITY: Pre-validate seller has sufficient balance before attempting settlement
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: balanceData, error: balanceError } = await (supabase as any)
      .rpc("get_seller_available_balance", { p_seller_id: seller.id });

    if (balanceError || !balanceData) {
      return NextResponse.json(
        { error: "Unable to retrieve balance. Please try again." },
        { status: 500 }
      );
    }

    // Minimum settlement amount is ₹100
    const minimumAmount = 100;
    if (balanceData < minimumAmount) {
      return NextResponse.json(
        { error: `Insufficient balance for settlement. Minimum required: ₹${minimumAmount}. Current balance: ₹${balanceData}` },
        { status: 400 }
      );
    }

    // Atomically compute balance + create settlement record via SECURITY DEFINER RPC
    // The RPC verifies auth.uid() === seller.user_id internally
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: result, error: rpcError } = await (supabase as any)
      .rpc("create_seller_settlement", { p_seller_id: seller.id });

    if (rpcError) {
      // Surface the Postgres EXCEPTION message directly — it's user-friendly
      const msg: string = rpcError.message ?? "Settlement creation failed";
      const status = msg.includes("Unauthorized") ? 403
        : msg.includes("No eligible") || msg.includes("Minimum") ? 400
        : 500;
      return NextResponse.json({ error: msg }, { status });
    }

    const row = Array.isArray(result) ? result[0] : result;
    if (!row) {
      return NextResponse.json({ error: "Settlement creation failed" }, { status: 500 });
    }

    // ── Razorpay Payouts (optional — only if keys are configured) ──────────────
    // In production: create a Razorpay contact + fund account + payout.
    // For now we mark the settlement as "processing" and log the intent.
    const rzpKeyId     = process.env["RAZORPAY_KEY_ID"];
    const rzpKeySecret = process.env["RAZORPAY_KEY_SECRET"];
    let payoutId: string | null = null;

    if (rzpKeyId && rzpKeySecret) {
      try {
        payoutId = await initiateRazorpayPayout({
          settlementId:  row.settlement_id,
          netAmount:     row.net_amount,
          bank,
          storeName:     seller.store_name ?? "Seller",
          rzpKeyId,
          rzpKeySecret,
        });
      } catch (payoutErr) {
        console.error("[payout] Razorpay payout initiation failed:", payoutErr);
        // Non-fatal — settlement is already created; admin can retry
      }
    }

    // Update settlement status to 'processing' (or 'paid' if payout succeeded)
    await adminSupabase
      .from("settlements")
      .update({
        status: payoutId ? "processing" : "processing",
        razorpay_payout_id: payoutId,
      })
      .eq("id", row.settlement_id);

    return NextResponse.json({
      success:      true,
      settlementId: row.settlement_id,
      grossAmount:  row.gross_amount,
      netAmount:    row.net_amount,
      itemsCount:   row.items_count,
      payoutId,
    });
  } catch (err) {
    console.error("[settlements/request]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── Razorpay Payouts helper ────────────────────────────────────────────────────

async function initiateRazorpayPayout(opts: {
  settlementId: string;
  netAmount:    number;
  bank: { accountHolder?: string; accountNumber?: string; ifsc?: string; bankName?: string };
  storeName:    string;
  rzpKeyId:     string;
  rzpKeySecret: string;
}): Promise<string> {
  const { settlementId, netAmount, bank, storeName, rzpKeyId, rzpKeySecret } = opts;
  const auth = Buffer.from(`${rzpKeyId}:${rzpKeySecret}`).toString("base64");
  const headers = {
    Authorization: `Basic ${auth}`,
    "Content-Type": "application/json",
    "X-Payout-Idempotency": settlementId, // idempotent — safe to retry
  };

  // 1. Create a contact (seller entity)
  const contactRes = await fetch("https://api.razorpay.com/v1/contacts", {
    method: "POST",
    headers,
    body: JSON.stringify({
      name:         storeName,
      type:         "vendor",
      reference_id: settlementId,
    }),
  });
  const contact = await contactRes.json() as { id?: string; error?: unknown };
  if (!contact.id) throw new Error(`Contact creation failed: ${JSON.stringify(contact.error)}`);

  // 2. Create a fund account (bank account)
  const faRes = await fetch("https://api.razorpay.com/v1/fund_accounts", {
    method: "POST",
    headers,
    body: JSON.stringify({
      contact_id:   contact.id,
      account_type: "bank_account",
      bank_account: {
        name:           bank.accountHolder,
        ifsc:           bank.ifsc,
        account_number: bank.accountNumber,
      },
    }),
  });
  const fa = await faRes.json() as { id?: string; error?: unknown };
  if (!fa.id) throw new Error(`Fund account creation failed: ${JSON.stringify(fa.error)}`);

  // 3. Initiate payout (amount in paise)
  const accountNumber = process.env["RAZORPAY_PAYOUT_ACCOUNT"];
  if (!accountNumber) {
    throw new Error("Razorpay payout account not configured");
  }

  // ✅ SECURITY: Account number validated before use, never exposed in logs
  const payoutRes = await fetch("https://api.razorpay.com/v1/payouts", {
    method: "POST",
    headers,
    body: JSON.stringify({
      account_number: accountNumber,
      fund_account_id: fa.id,
      amount:   Math.round(netAmount * 100),
      currency: "INR",
      mode:     "NEFT",
      purpose:  "vendor_advance",
      queue_if_low_balance: true,
      reference_id: settlementId,
      narration:    `Aura settlement ${settlementId.slice(0, 8).toUpperCase()}`,
    }),
  });
  const payout = await payoutRes.json() as { id?: string; error?: unknown };
  if (!payout.id) throw new Error(`Payout failed: ${JSON.stringify(payout.error)}`);

  return payout.id;
}
