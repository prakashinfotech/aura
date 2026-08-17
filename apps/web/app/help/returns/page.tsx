import * as React from "react";
import { RotateCcw, Package, CheckCircle, XCircle, Truck, CreditCard } from "lucide-react";

const ELIGIBLE = ["Clothing & Footwear (unworn, unwashed, with tags)", "Accessories in original packaging", "Beauty products (unopened / sealed)", "Home & Living items (unused, in original box)"];
const NOT_ELIGIBLE = ["Innerwear, swimwear & socks (hygiene)", "Customised / personalised items", "Gift Cards", "Items with removed or tampered tags", "Products damaged due to misuse"];

const RETURN_STEPS = [
  { icon: RotateCcw, title: "Initiate Return", desc: "Go to My Orders → select item → click 'Return'. Choose reason and pickup time." },
  { icon: Truck, title: "Free Pickup", desc: "Our delivery partner will pick up the item from your doorstep at no cost." },
  { icon: Package, title: "Quality Check", desc: "Once received, we inspect the item within 2–3 business days." },
  { icon: CreditCard, title: "Refund / Exchange", desc: "Approved returns are refunded to the original payment method within 7–10 days." },
];

export default function ReturnsPage() {
  return (
    <div className="min-h-screen bg-[#F5F5F6]">
      <div className="bg-white border-b border-gray-100 px-4 py-10 text-center">
        <h1 className="text-3xl font-bold text-[#282C3F]">Returns & Refunds</h1>
        <p className="mt-2 text-gray-500">30-day hassle-free returns on most products.</p>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-12 space-y-8">
        {/* Window */}
        <div className="rounded-2xl bg-gradient-to-r from-[#6366f1] to-[#f59e0b] p-8 text-white text-center">
          <div className="text-5xl font-bold">30</div>
          <div className="text-lg font-medium">Day Return Window</div>
          <p className="mt-2 text-sm text-white/80">From the date of delivery. Free pickup. No questions asked.</p>
        </div>

        {/* How it works */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-6 text-xl font-bold text-[#282C3F]">How Returns Work</h2>
          <div className="grid gap-5 sm:grid-cols-4">
            {RETURN_STEPS.map((step, i) => (
              <div key={step.title} className="text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-pink-50">
                  <step.icon size={22} className="text-[#6366f1]" />
                </div>
                <div className="mb-1 text-xs font-bold uppercase tracking-wide text-gray-400">Step {i + 1}</div>
                <div className="mb-1 text-sm font-semibold text-[#282C3F]">{step.title}</div>
                <p className="text-xs text-gray-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Eligible / Not eligible */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <CheckCircle size={18} className="text-green-500" />
              <h2 className="font-bold text-[#282C3F]">Eligible for Return</h2>
            </div>
            <ul className="space-y-2">
              {ELIGIBLE.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-green-400" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <XCircle size={18} className="text-red-500" />
              <h2 className="font-bold text-[#282C3F]">Not Eligible</h2>
            </div>
            <ul className="space-y-2">
              {NOT_ELIGIBLE.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Note */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
          <strong>Important:</strong> Items must be returned in original condition with all tags, packaging, and accessories intact. Returns that fail quality checks will be sent back to you and no refund will be issued.
        </div>
      </div>
    </div>
  );
}
