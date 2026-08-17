import * as React from "react";
import { XCircle, Clock, CreditCard, AlertTriangle, CheckCircle } from "lucide-react";

const STEPS = [
  "Go to My Orders in your account.",
  "Find the order or item you want to cancel.",
  "Click 'Cancel' next to the item.",
  "Select a cancellation reason from the dropdown.",
  "Confirm cancellation — you'll receive an email instantly.",
];

const REFUND_TIMELINE = [
  { method: "UPI / Net Banking", time: "2–3 business days" },
  { method: "Credit / Debit Card", time: "5–7 business days" },
  { method: "Aura Gift Card", time: "Instant" },
  { method: "Wallet (Paytm / PhonePe)", time: "1–2 business days" },
  { method: "EMI (Credit Card)", time: "7–10 business days" },
  { method: "Cash on Delivery", time: "NEFT within 7 days" },
];

export default function CancellationPage() {
  return (
    <div className="min-h-screen bg-[#F5F5F6]">
      <div className="bg-white border-b border-gray-100 px-4 py-10 text-center">
        <h1 className="text-3xl font-bold text-[#282C3F]">Cancellation Policy</h1>
        <p className="mt-2 text-gray-500">Cancel your order quickly and get a full refund.</p>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-12 space-y-8">
        {/* When can you cancel */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={18} className="text-[#6366f1]" />
            <h2 className="text-lg font-bold text-[#282C3F]">When Can You Cancel?</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-xl bg-green-50 p-4">
              <CheckCircle size={18} className="mt-0.5 shrink-0 text-green-600" />
              <div>
                <div className="text-sm font-semibold text-green-800">Before Shipment</div>
                <p className="text-sm text-green-700">You can cancel any item instantly with a full refund, right up until it is shipped from our warehouse.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl bg-orange-50 p-4">
              <AlertTriangle size={18} className="mt-0.5 shrink-0 text-orange-500" />
              <div>
                <div className="text-sm font-semibold text-orange-800">After Shipment</div>
                <p className="text-sm text-orange-700">Once shipped, you cannot cancel directly. You can refuse delivery or use the Returns process after receiving the item.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl bg-red-50 p-4">
              <XCircle size={18} className="mt-0.5 shrink-0 text-red-500" />
              <div>
                <div className="text-sm font-semibold text-red-800">Non-Cancellable Items</div>
                <p className="text-sm text-red-700">Gift Cards, personalised items, and international orders cannot be cancelled once placed.</p>
              </div>
            </div>
          </div>
        </div>

        {/* How to cancel */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-[#282C3F]">How to Cancel</h2>
          <ol className="space-y-3">
            {STEPS.map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#6366f1] text-xs font-bold text-white">{i + 1}</span>
                <span className="text-sm text-gray-600">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Refund timeline */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard size={18} className="text-[#6366f1]" />
            <h2 className="text-lg font-bold text-[#282C3F]">Refund Timeline After Cancellation</h2>
          </div>
          <div className="overflow-hidden rounded-xl border border-gray-100">
            {REFUND_TIMELINE.map((row, i) => (
              <div key={row.method} className={`flex items-center justify-between px-4 py-3 text-sm ${i % 2 === 0 ? "bg-gray-50" : "bg-white"}`}>
                <span className="text-[#282C3F]">{row.method}</span>
                <span className="font-medium text-[#6366f1]">{row.time}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-gray-400">* Timelines are indicative. Bank processing times may vary.</p>
        </div>
      </div>
    </div>
  );
}
