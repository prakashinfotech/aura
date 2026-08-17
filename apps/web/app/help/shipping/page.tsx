import * as React from "react";
import { Truck, Zap, Package, MapPin, Clock, IndianRupee } from "lucide-react";

const SHIPPING_OPTIONS = [
  { icon: Truck, title: "Standard Delivery", time: "4–7 business days", price: "Free on orders above ₹499", color: "bg-blue-50 text-blue-600" },
  { icon: Zap, title: "Express Delivery", time: "1–2 business days", price: "₹99 flat (select cities)", color: "bg-orange-50 text-orange-500" },
  { icon: Package, title: "Same Day Delivery", time: "By 10 PM today", price: "₹199 flat (Bengaluru, Mumbai, Delhi)", color: "bg-green-50 text-green-600" },
];

const POLICIES = [
  { title: "Free Shipping Threshold", body: "Orders above ₹499 qualify for free standard shipping across India. Orders below this value incur a flat ₹49 delivery fee." },
  { title: "Delivery Attempts", body: "Our delivery partner attempts delivery up to 3 times. If all attempts fail, the order is returned to our warehouse and a full refund is processed." },
  { title: "Remote Area Surcharge", body: "Deliveries to Tier 3 cities and remote pin codes may attract an additional ₹49 surcharge. This is shown clearly at checkout before payment." },
  { title: "Damaged in Transit", body: "If your order arrives damaged, please raise a request within 48 hours of delivery with photos. We'll arrange a free replacement or immediate refund." },
  { title: "International Shipping", body: "Aura currently ships only within India. International delivery is not available at this time." },
];

export default function ShippingPage() {
  return (
    <div className="min-h-screen bg-[#F5F5F6]">
      <div className="bg-white border-b border-gray-100 px-4 py-10 text-center">
        <h1 className="text-3xl font-bold text-[#282C3F]">Shipping Information</h1>
        <p className="mt-2 text-gray-500">Everything you need to know about how we deliver to you.</p>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-12">
        {/* Shipping Options */}
        <section className="mb-10">
          <h2 className="mb-5 text-xl font-bold text-[#282C3F]">Delivery Options</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {SHIPPING_OPTIONS.map((opt) => (
              <div key={opt.title} className="rounded-2xl bg-white p-6 shadow-sm">
                <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-full ${opt.color}`}>
                  <opt.icon size={20} />
                </div>
                <div className="mb-1 font-semibold text-[#282C3F]">{opt.title}</div>
                <div className="flex items-center gap-1 text-sm text-gray-500"><Clock size={13} /> {opt.time}</div>
                <div className="mt-1 flex items-center gap-1 text-sm font-medium text-[#6366f1]"><IndianRupee size={12} strokeWidth={2.5} />{opt.price.replace("₹","")}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Coverage */}
        <section className="mb-10 rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <MapPin size={18} className="text-[#6366f1]" />
            <h2 className="text-lg font-bold text-[#282C3F]">Delivery Coverage</h2>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed">
            We deliver to <strong className="text-[#282C3F]">27,000+ pin codes</strong> across India, covering all 28 states and 8 union territories.
            Express and Same Day delivery is currently available in Bengaluru, Mumbai, Delhi NCR, Hyderabad, Chennai, Pune, and Kolkata.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 text-center">
            {["27,000+ Pin Codes", "All 28 States", "7 Metro Cities", "24 × 7 Tracking"].map((stat) => (
              <div key={stat} className="rounded-xl bg-pink-50 p-3 text-xs font-semibold text-[#6366f1]">{stat}</div>
            ))}
          </div>
        </section>

        {/* Policies */}
        <section>
          <h2 className="mb-5 text-xl font-bold text-[#282C3F]">Shipping Policies</h2>
          <div className="space-y-3">
            {POLICIES.map((p) => (
              <div key={p.title} className="rounded-2xl bg-white p-5 shadow-sm">
                <div className="mb-1 font-semibold text-[#282C3F]">{p.title}</div>
                <p className="text-sm text-gray-500 leading-relaxed">{p.body}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
