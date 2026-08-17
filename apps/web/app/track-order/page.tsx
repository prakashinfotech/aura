"use client";
import * as React from "react";
import { Search, Package, Truck, CheckCircle, Clock, MapPin } from "lucide-react";

const MOCK_STATUSES = [
  { icon: CheckCircle, label: "Order Placed", date: "Mon, 13 Jan", done: true },
  { icon: Package, label: "Packed & Ready", date: "Tue, 14 Jan", done: true },
  { icon: Truck, label: "Out for Delivery", date: "Wed, 15 Jan", done: true },
  { icon: MapPin, label: "Delivered", date: "Wed, 15 Jan · 2:34 PM", done: false },
];

export default function TrackOrderPage() {
  const [orderId, setOrderId] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [searched, setSearched] = React.useState(false);

  function handleTrack(e: React.FormEvent) {
    e.preventDefault();
    if (orderId.trim()) setSearched(true);
  }

  return (
    <div className="min-h-screen bg-[#F5F5F6]">
      <div className="bg-white border-b border-gray-100 px-4 py-10 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-pink-50">
          <Truck size={28} className="text-[#6366f1]" />
        </div>
        <h1 className="text-3xl font-bold text-[#282C3F]">Track Your Order</h1>
        <p className="mt-2 text-gray-500">Enter your order ID to get real-time delivery updates.</p>
      </div>

      <div className="mx-auto max-w-xl px-4 py-12">
        {/* Search form */}
        <div className="rounded-2xl bg-white p-8 shadow-sm">
          <form onSubmit={handleTrack} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Order ID</label>
              <input
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="e.g. MYN-2025-ABC123"
                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-[#6366f1] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Registered email"
                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-[#6366f1] focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#6366f1] py-3 text-sm font-bold text-white hover:bg-[#e63560] transition-colors"
            >
              <Search size={16} /> Track Order
            </button>
          </form>
        </div>

        {/* Mock result */}
        {searched && (
          <div className="mt-6 rounded-2xl bg-white p-8 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm font-bold text-[#282C3F]">Order #{orderId}</div>
              <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-600">In Transit</span>
            </div>
            <div className="mb-6 text-xs text-gray-400">Estimated delivery: <strong className="text-[#282C3F]">Wed, 15 Jan</strong></div>

            {/* Timeline */}
            <div className="space-y-0">
              {MOCK_STATUSES.map((step, i) => (
                <div key={step.label} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${i < 3 ? "bg-[#6366f1] text-white" : "border-2 border-gray-200 bg-white text-gray-300"}`}>
                      <step.icon size={16} />
                    </div>
                    {i < MOCK_STATUSES.length - 1 && (
                      <div className={`w-0.5 flex-1 my-1 ${i < 2 ? "bg-[#6366f1]" : "bg-gray-200"}`} style={{ minHeight: 24 }} />
                    )}
                  </div>
                  <div className="pb-5">
                    <div className={`text-sm font-semibold ${i < 3 ? "text-[#282C3F]" : "text-gray-400"}`}>{step.label}</div>
                    <div className="text-xs text-gray-400">{step.date}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-xl bg-blue-50 p-4 text-xs text-blue-800">
              <strong>Delivery Partner:</strong> Ecom Express · Tracking ID: <span className="font-mono">1234567890</span>
            </div>
          </div>
        )}

        {/* Tip */}
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-500">
          <div className="mb-1 font-semibold text-[#282C3F]">Logged in?</div>
          View all your orders and live tracking in{" "}
          <a href="/account/orders" className="font-semibold text-[#6366f1] hover:underline">My Orders</a>.
        </div>
      </div>
    </div>
  );
}
