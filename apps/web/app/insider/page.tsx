import * as React from "react";
import { Star, Zap, Gift, Crown, Shield, TrendingUp, Percent, Truck } from "lucide-react";

const TIERS = [
  {
    name: "Insider",
    color: "from-gray-400 to-gray-600",
    textColor: "text-gray-600",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
    points: "0 – 999",
    icon: Star,
    perks: ["Early sale access (6 hrs)", "Birthday discount 10%", "Free standard shipping on ₹799+"],
  },
  {
    name: "Elite",
    color: "from-blue-400 to-blue-600",
    textColor: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    points: "1,000 – 4,999",
    icon: Zap,
    perks: ["Early sale access (12 hrs)", "Birthday discount 15%", "Free standard shipping on ₹499+", "1 free exchange per month"],
  },
  {
    name: "Royale",
    color: "from-amber-400 to-orange-500",
    textColor: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    points: "5,000 – 14,999",
    icon: Crown,
    perks: ["Early sale access (24 hrs)", "Birthday discount 20%", "Always-free standard shipping", "2 free exchanges per month", "Exclusive brand launches"],
  },
  {
    name: "Icon",
    color: "from-[#6366f1] to-[#FF905A]",
    textColor: "text-[#6366f1]",
    bgColor: "bg-pink-50",
    borderColor: "border-pink-200",
    points: "15,000+",
    icon: Shield,
    perks: ["24-hr early access to ALL sales", "Birthday discount 25%", "Always-free express shipping", "Unlimited free exchanges", "Dedicated support line", "Invite-only luxury events"],
  },
];

const HOW_TO_EARN = [
  { icon: TrendingUp, title: "Every Purchase", desc: "Earn 1 point per ₹100 spent on your orders.", color: "bg-blue-50 text-blue-600" },
  { icon: Star, title: "Write Reviews", desc: "Get 50 bonus points for every verified product review.", color: "bg-purple-50 text-purple-600" },
  { icon: Gift, title: "Refer Friends", desc: "Earn 500 points when a friend makes their first purchase.", color: "bg-green-50 text-green-600" },
  { icon: Percent, title: "Special Events", desc: "Bonus point events during sales, festive seasons, and brand weeks.", color: "bg-orange-50 text-orange-500" },
];

export default function InsiderPage() {
  return (
    <div className="min-h-screen bg-[#F5F5F6]">
      {/* Hero */}
      <div className="bg-gradient-to-r from-[#282C3F] to-[#3d4259] py-16 text-white">
        <div className="mx-auto max-w-5xl px-4 text-center">
          <div className="mb-2 text-sm font-semibold uppercase tracking-widest text-[#6366f1]">Loyalty Programme</div>
          <h1 className="text-5xl font-bold tracking-tight">Aura Insider</h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/70">
            Shop more, earn more, unlock exclusive rewards. Four tiers designed to celebrate your style journey.
          </p>
          <button className="mt-8 rounded-full bg-[#6366f1] px-10 py-3 text-sm font-bold text-white hover:bg-[#e63560] transition-colors">
            Join for Free
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-14">
        {/* Tiers */}
        <section className="mb-14">
          <h2 className="mb-8 text-center text-2xl font-bold text-[#282C3F]">Your Journey Through the Tiers</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {TIERS.map((tier) => (
              <div key={tier.name} className={`rounded-2xl border ${tier.borderColor} ${tier.bgColor} p-6`}>
                <div className={`mb-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br ${tier.color}`}>
                  <tier.icon size={20} className="text-white" />
                </div>
                <div className={`text-lg font-bold ${tier.textColor}`}>{tier.name}</div>
                <div className="mb-4 text-xs text-gray-400">{tier.points} pts / year</div>
                <ul className="space-y-2">
                  {tier.perks.map((perk) => (
                    <li key={perk} className="flex items-start gap-2 text-xs text-gray-600">
                      <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${tier.textColor.replace("text-", "bg-")}`} />
                      {perk}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* How to earn */}
        <section className="mb-14">
          <h2 className="mb-8 text-center text-2xl font-bold text-[#282C3F]">How to Earn Points</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_TO_EARN.map((way) => (
              <div key={way.title} className="rounded-2xl bg-white p-6 shadow-sm text-center">
                <div className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full ${way.color}`}>
                  <way.icon size={22} />
                </div>
                <div className="mb-1 font-semibold text-[#282C3F]">{way.title}</div>
                <p className="text-xs text-gray-500">{way.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Benefits strip */}
        <section className="mb-14">
          <div className="grid gap-4 sm:grid-cols-3 rounded-2xl overflow-hidden">
            <div className="bg-[#6366f1] p-7 text-white">
              <Truck size={28} className="mb-3" />
              <div className="text-lg font-bold">Free Shipping</div>
              <p className="mt-1 text-sm text-white/80">Royale & Icon members enjoy always-free delivery on every order.</p>
            </div>
            <div className="bg-[#282C3F] p-7 text-white">
              <Zap size={28} className="mb-3 text-[#FF905A]" />
              <div className="text-lg font-bold">Sale Access</div>
              <p className="mt-1 text-sm text-white/80">Get early entry to End of Season Sales, Flash Sales, and brand events before the rest.</p>
            </div>
            <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-7 text-white">
              <Gift size={28} className="mb-3" />
              <div className="text-lg font-bold">Birthday Rewards</div>
              <p className="mt-1 text-sm text-white/80">Unlock a special discount coupon every year on your birthday. Higher tier = bigger reward.</p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="rounded-2xl bg-white p-10 shadow-sm text-center">
          <h3 className="text-2xl font-bold text-[#282C3F]">Already a member?</h3>
          <p className="mt-2 text-sm text-gray-500">Check your current tier, points balance, and rewards in your account.</p>
          <div className="mt-6 flex justify-center gap-4 flex-wrap">
            <a href="/account/profile" className="rounded-full bg-[#6366f1] px-8 py-3 text-sm font-bold text-white hover:bg-[#e63560] transition-colors">
              View My Insider Status
            </a>
            <a href="/help/faq" className="rounded-full border-2 border-[#282C3F] px-8 py-3 text-sm font-bold text-[#282C3F] hover:bg-[#282C3F] hover:text-white transition-colors">
              FAQ
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
