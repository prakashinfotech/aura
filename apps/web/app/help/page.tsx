"use client";

import * as React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface FAQItem {
  q: string;
  a: string;
}

const FAQS: { section: string; items: FAQItem[] }[] = [
  {
    section: "Orders & Delivery",
    items: [
      {
        q: "How do I track my order?",
        a: "Go to My Orders in your account. Click on the order to see real-time tracking details including the courier partner and expected delivery date.",
      },
      {
        q: "How long does delivery take?",
        a: "Standard delivery takes 3–7 business days depending on your location. Metro cities usually receive orders within 2–4 days.",
      },
      {
        q: "Can I change my delivery address after placing an order?",
        a: "You can change the delivery address within 30 minutes of placing the order. Go to My Orders, select the order, and click 'Edit Address'.",
      },
      {
        q: "Is free delivery available?",
        a: "Yes! Orders above ₹499 qualify for free delivery. Orders below that incur a ₹49 delivery fee.",
      },
    ],
  },
  {
    section: "Returns & Refunds",
    items: [
      {
        q: "What is the return policy?",
        a: "Most items can be returned within 30 days of delivery. Items must be unused, unwashed, and in original packaging with all tags intact.",
      },
      {
        q: "How do I initiate a return?",
        a: "Go to My Orders, select the item you want to return, and click 'Return'. Choose your reason and schedule a pickup. The item will be picked up within 2–3 business days.",
      },
      {
        q: "When will I get my refund?",
        a: "Refunds are processed within 5–7 business days after the returned item is received and verified. The amount is credited back to your original payment method.",
      },
      {
        q: "Can I exchange an item instead of returning it?",
        a: "Currently, exchanges are handled as a return + new order. Initiate a return for the original item and place a fresh order for the replacement.",
      },
    ],
  },
  {
    section: "Payments",
    items: [
      {
        q: "What payment methods are accepted?",
        a: "We accept UPI (GPay, PhonePe, Paytm), Net Banking, all major Credit/Debit cards (Visa, Mastercard, RuPay), and Cash on Delivery for eligible orders.",
      },
      {
        q: "Is it safe to save my card details?",
        a: "Yes. We use industry-standard SSL encryption. Card details are tokenized and never stored on our servers — they are securely managed by our payment partner Razorpay.",
      },
      {
        q: "My payment failed but money was deducted. What do I do?",
        a: "If your payment failed but money was deducted, it will be automatically refunded within 5–7 business days by your bank. You can also contact our support team with your transaction reference number.",
      },
    ],
  },
  {
    section: "Account & Profile",
    items: [
      {
        q: "How do I reset my password?",
        a: "On the login screen, click 'Forgot Password'. Enter your registered email address and we'll send you a password reset link.",
      },
      {
        q: "Can I have multiple addresses saved?",
        a: "Yes. Go to My Account → Addresses to add, edit, or delete multiple delivery addresses.",
      },
      {
        q: "How do I delete my account?",
        a: "To delete your account, please contact our support team. Note that account deletion is permanent and all your order history will be lost.",
      },
    ],
  },
  {
    section: "Products & Sizing",
    items: [
      {
        q: "How do I find the right size?",
        a: "Each product page has a Size Guide button. Sizes vary by brand, so we recommend checking the guide for each item before ordering.",
      },
      {
        q: "Are all products 100% genuine?",
        a: "Yes. We source products directly from brands and authorized sellers. Every item sold on our platform comes with a 100% authenticity guarantee.",
      },
      {
        q: "A product I want is out of stock. What should I do?",
        a: "Click 'Notify Me' on the product page to get an email alert when the item is back in stock.",
      },
    ],
  },
];

function FAQSection({ section, items }: { section: string; items: FAQItem[] }) {
  return (
    <div className="mb-6">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-[#6366f1]">
        {section}
      </h2>
      <div className="overflow-hidden rounded-lg border border-gray-100 bg-white">
        {items.map((item, idx) => (
          <FAQRow key={idx} item={item} isLast={idx === items.length - 1} />
        ))}
      </div>
    </div>
  );
}

function FAQRow({ item, isLast }: { item: FAQItem; isLast: boolean }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className={!isLast ? "border-b border-gray-100" : undefined}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <span className="pr-4 text-sm font-medium text-[#282C3F]">{item.q}</span>
        {open ? (
          <ChevronUp size={16} className="shrink-0 text-gray-400" />
        ) : (
          <ChevronDown size={16} className="shrink-0 text-gray-400" />
        )}
      </button>
      {open && (
        <div className="px-5 pb-4">
          <p className="text-sm leading-relaxed text-gray-500">{item.a}</p>
        </div>
      )}
    </div>
  );
}

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#282C3F]">Help Centre</h1>
        <p className="mt-1 text-sm text-gray-400">
          Find answers to the most common questions below.
        </p>
      </div>

      {FAQS.map((section) => (
        <FAQSection key={section.section} section={section.section} items={section.items} />
      ))}

      <div className="mt-8 rounded-lg border border-gray-100 bg-white p-6 text-center">
        <p className="text-sm font-semibold text-[#282C3F]">Still need help?</p>
        <p className="mt-1 text-sm text-gray-400">
          Reach us at{" "}
          <a href="mailto:support@aura.local" className="text-[#6366f1] hover:underline">
            support@aura.local
          </a>
        </p>
      </div>
    </div>
  );
}
