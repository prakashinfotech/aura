import * as React from "react";
import { Mail, Phone, MessageCircle, Clock, MapPin } from "lucide-react";

const CHANNELS = [
  {
    icon: Phone,
    title: "Call Us",
    detail: "1800-102-3434",
    sub: "Toll-free · Mon–Sat, 9 AM – 9 PM",
    color: "bg-green-50 text-green-600",
  },
  {
    icon: Mail,
    title: "Email Us",
    detail: "support@aura.local",
    sub: "Response within 24 hours",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: MessageCircle,
    title: "Live Chat",
    detail: "Chat with an agent",
    sub: "Available 24 × 7",
    color: "bg-purple-50 text-purple-600",
  },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#F5F5F6]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-10 text-center">
        <h1 className="text-3xl font-bold text-[#282C3F]">Contact Us</h1>
        <p className="mt-2 text-gray-500">We're here to help. Reach us through any of the channels below.</p>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-12">
        {/* Channels */}
        <div className="mb-12 grid gap-4 sm:grid-cols-3">
          {CHANNELS.map((c) => (
            <div key={c.title} className="rounded-2xl bg-white p-6 shadow-sm text-center">
              <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${c.color}`}>
                <c.icon size={22} />
              </div>
              <div className="mb-1 font-semibold text-[#282C3F]">{c.title}</div>
              <div className="text-sm font-medium text-[#6366f1]">{c.detail}</div>
              <div className="mt-1 text-xs text-gray-400">{c.sub}</div>
            </div>
          ))}
        </div>

        {/* Contact Form */}
        <div className="rounded-2xl bg-white p-8 shadow-sm">
          <h2 className="mb-6 text-xl font-bold text-[#282C3F]">Send Us a Message</h2>
          <form className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Name</label>
                <input type="text" placeholder="Your full name" className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-[#6366f1] focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Email</label>
                <input type="email" placeholder="your@email.com" className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-[#6366f1] focus:outline-none" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Order ID (optional)</label>
              <input type="text" placeholder="e.g. MYN-2024-XXXXXX" className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-[#6366f1] focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Subject</label>
              <select className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-[#6366f1] focus:outline-none">
                <option>Order Issue</option>
                <option>Return / Refund</option>
                <option>Payment Problem</option>
                <option>Product Query</option>
                <option>Account Help</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Message</label>
              <textarea rows={5} placeholder="Describe your issue in detail…" className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-[#6366f1] focus:outline-none resize-none" />
            </div>
            <button type="submit" className="rounded-lg bg-[#6366f1] px-8 py-2.5 text-sm font-bold text-white hover:bg-[#e63560] transition-colors">
              Submit Message
            </button>
          </form>
        </div>

        {/* Office */}
        <div className="mt-8 flex items-start gap-4 rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-500">
            <MapPin size={20} />
          </div>
          <div>
            <div className="font-semibold text-[#282C3F]">Registered Office</div>
            <div className="mt-1 text-sm text-gray-500">
              Aura Designs Pvt. Ltd., Sy No. 17/9-11, 13-17, 19-24,<br />
              Bettadasanapura Village, Varthur Hobli, Bangalore East Taluk,<br />
              Bengaluru – 560 087, Karnataka, India.
            </div>
            <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
              <Clock size={12} /> Mon–Fri: 9 AM – 6 PM IST
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
