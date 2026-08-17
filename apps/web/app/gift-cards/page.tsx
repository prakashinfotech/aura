import * as React from "react";
import Link from "next/link";
import { Gift, Star, ShieldCheck, Zap } from "lucide-react";

const DENOMINATIONS = [500, 1000, 2000, 5000, 10000];

const CARD_DESIGNS = [
  { name: "Birthday Bash", gradient: "from-pink-500 to-rose-500", emoji: "🎂" },
  { name: "Wedding Bells", gradient: "from-amber-400 to-orange-500", emoji: "💍" },
  { name: "Festive Joy", gradient: "from-purple-500 to-indigo-600", emoji: "✨" },
  { name: "Just Because", gradient: "from-teal-400 to-cyan-500", emoji: "💝" },
];

const HOW_IT_WORKS = [
  { icon: Gift, title: "Choose a Design", desc: "Pick from our curated collection of gift card designs for every occasion." },
  { icon: Zap, title: "Select Amount", desc: "Choose a denomination from ₹500 to ₹10,000 or enter a custom value." },
  { icon: Star, title: "Send Instantly", desc: "Deliver via email or WhatsApp — the recipient gets it within seconds." },
  { icon: ShieldCheck, title: "Shop with Ease", desc: "Valid on all products across Aura. No expiry for 1 year from purchase." },
];

export default function GiftCardsPage() {
  return (
    <div className="min-h-screen bg-[#F5F5F6]">
      {/* Hero */}
      <div className="bg-gradient-to-r from-[#6366f1] to-[#FF905A] py-16 text-white">
        <div className="mx-auto max-w-5xl px-4 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
            <Gift size={32} />
          </div>
          <h1 className="text-4xl font-bold">Aura Gift Cards</h1>
          <p className="mt-3 text-lg text-white/80">
            Give the gift of fashion. Perfect for every occasion.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-12">
        {/* Card Designs */}
        <section className="mb-12">
          <h2 className="mb-6 text-xl font-bold text-[#282C3F]">Choose a Design</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {CARD_DESIGNS.map((card) => (
              <div
                key={card.name}
                className={`cursor-pointer rounded-2xl bg-gradient-to-br ${card.gradient} p-6 text-white shadow-md transition-transform hover:-translate-y-1 hover:shadow-lg`}
              >
                <div className="mb-3 text-4xl">{card.emoji}</div>
                <div className="text-sm font-semibold">aura</div>
                <div className="mt-1 text-xs text-white/80">{card.name}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Denominations */}
        <section className="mb-12">
          <h2 className="mb-6 text-xl font-bold text-[#282C3F]">Select Amount</h2>
          <div className="flex flex-wrap gap-3">
            {DENOMINATIONS.map((amt) => (
              <button
                key={amt}
                className="rounded-full border-2 border-[#6366f1] px-6 py-2.5 text-sm font-semibold text-[#6366f1] transition-colors hover:bg-[#6366f1] hover:text-white"
              >
                ₹{amt.toLocaleString("en-IN")}
              </button>
            ))}
            <button className="rounded-full border-2 border-gray-300 px-6 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:border-[#6366f1] hover:text-[#6366f1]">
              Custom Amount
            </button>
          </div>
        </section>

        {/* How it works */}
        <section className="mb-12">
          <h2 className="mb-6 text-xl font-bold text-[#282C3F]">How It Works</h2>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.title} className="rounded-2xl bg-white p-6 shadow-sm">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-pink-50">
                  <step.icon size={20} className="text-[#6366f1]" />
                </div>
                <div className="mb-1 text-xs font-bold uppercase tracking-wide text-[#6366f1]">Step {i + 1}</div>
                <div className="mb-1 text-sm font-semibold text-[#282C3F]">{step.title}</div>
                <p className="text-xs text-gray-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="rounded-2xl bg-[#282C3F] p-8 text-center text-white">
          <h3 className="mb-2 text-2xl font-bold">Ready to send joy?</h3>
          <p className="mb-6 text-white/60">Gift cards are delivered instantly and never expire for 12 months.</p>
          <button className="rounded-full bg-[#6366f1] px-10 py-3 text-sm font-bold text-white hover:bg-[#e63560] transition-colors">
            Buy a Gift Card
          </button>
        </div>
      </div>
    </div>
  );
}
