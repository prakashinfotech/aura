"use client";
import * as React from "react";
import { ChevronDown } from "lucide-react";

const FAQS = [
  {
    category: "Orders & Delivery",
    items: [
      { q: "How do I track my order?", a: "Go to My Orders under your account, or use the Track Orders link in the footer. You'll get live status updates and an estimated delivery time." },
      { q: "How long does delivery take?", a: "Standard delivery takes 4–7 business days. Express delivery (available in select cities) takes 1–2 business days. Metro cities typically receive orders faster." },
      { q: "Can I change my delivery address after placing an order?", a: "Address changes are possible only before the order is shipped. Go to My Orders, select the order, and click 'Edit Address' if the option is available." },
      { q: "What if I miss my delivery?", a: "Our delivery partner will attempt delivery up to 3 times. After that, the package is returned to our warehouse and a refund is initiated automatically." },
    ],
  },
  {
    category: "Returns & Refunds",
    items: [
      { q: "What is the return policy?", a: "Most products are eligible for return within 30 days of delivery. Items must be unused, unwashed, and returned with original tags and packaging." },
      { q: "How do I initiate a return?", a: "Go to My Orders, select the item you wish to return, and click 'Return'. Choose a reason, select pickup or drop-off, and we'll arrange the rest." },
      { q: "When will I get my refund?", a: "Refunds are processed within 7–10 business days after the returned item passes quality checks. The amount is credited to your original payment method." },
      { q: "Can I exchange instead of returning?", a: "Yes. During the return process, select 'Exchange' and choose your preferred size or colour. Exchanges are processed within the same timeline as returns." },
    ],
  },
  {
    category: "Payments",
    items: [
      { q: "What payment methods are accepted?", a: "We accept all major credit/debit cards, UPI (GPay, PhonePe, Paytm), net banking, and Aura Gift Cards. EMI options are available on orders above ₹3,000." },
      { q: "Is it safe to save my card on Aura?", a: "Yes. All card data is stored using RBI-compliant tokenisation. We never store your CVV, and every transaction requires your bank's authentication." },
      { q: "Why was my payment declined?", a: "Common reasons include incorrect card details, insufficient balance, or bank blocks on online transactions. Try a different payment method or contact your bank." },
    ],
  },
  {
    category: "Account & Profile",
    items: [
      { q: "How do I reset my password?", a: "On the login screen, click 'Forgot Password', enter your registered email, and follow the reset link sent to your inbox." },
      { q: "Can I have multiple delivery addresses?", a: "Yes. You can save up to 5 delivery addresses in your account under Profile → Addresses. You can set one as default." },
      { q: "How do I delete my account?", a: "Contact our support team via the Contact Us page or email privacy@aura.local. Account deletion requests are processed within 30 days." },
    ],
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-0 py-4 text-left text-sm font-medium text-[#282C3F] hover:text-[#6366f1] transition-colors"
      >
        {q}
        <ChevronDown size={16} className={`shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <p className="pb-4 text-sm text-gray-500 leading-relaxed">{a}</p>}
    </div>
  );
}

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-[#F5F5F6]">
      <div className="bg-white border-b border-gray-100 px-4 py-10 text-center">
        <h1 className="text-3xl font-bold text-[#282C3F]">Frequently Asked Questions</h1>
        <p className="mt-2 text-gray-500">Find quick answers to the most common questions.</p>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-12 space-y-6">
        {FAQS.map((section) => (
          <div key={section.category} className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-[#6366f1]">{section.category}</h2>
            {section.items.map((item) => (
              <FAQItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        ))}

        <div className="rounded-2xl bg-[#282C3F] p-6 text-center text-white">
          <p className="mb-3 text-sm text-white/70">Can't find what you're looking for?</p>
          <a href="/help/contact" className="inline-block rounded-full bg-[#6366f1] px-8 py-2.5 text-sm font-bold hover:bg-[#e63560] transition-colors">
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}
