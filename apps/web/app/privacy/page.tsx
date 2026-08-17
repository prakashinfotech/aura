import * as React from "react";
import { ShieldCheck, Eye, Database, Share2, Lock, UserCheck, Mail } from "lucide-react";

const HIGHLIGHTS = [
  { icon: Database, title: "What We Collect", color: "bg-blue-50 text-blue-600" },
  { icon: Eye, title: "How We Use It", color: "bg-purple-50 text-purple-600" },
  { icon: Share2, title: "Who We Share With", color: "bg-orange-50 text-orange-500" },
  { icon: Lock, title: "How We Protect It", color: "bg-green-50 text-green-600" },
  { icon: UserCheck, title: "Your Rights", color: "bg-pink-50 text-pink-600" },
  { icon: Mail, title: "Contact DPO", color: "bg-teal-50 text-teal-600" },
];

const SECTIONS = [
  {
    title: "1. Information We Collect",
    body: `We collect the following categories of personal data:
• Identity data: name, email address, mobile number, date of birth.
• Contact data: delivery addresses and billing details.
• Transaction data: orders placed, payment methods used, returns and refunds.
• Technical data: IP address, browser type, device identifiers, cookies.
• Usage data: pages visited, products viewed, search queries, wishlist items.
• Marketing data: your preferences for receiving communications from us.`,
  },
  {
    title: "2. How We Use Your Information",
    body: `We use your personal data to:
• Process and fulfil your orders and manage returns.
• Provide customer support and resolve disputes.
• Personalise your shopping experience and product recommendations.
• Send you order updates, promotional offers, and important service notifications.
• Detect and prevent fraud, abuse, and security threats.
• Comply with legal obligations under Indian law (IT Act 2000, DPDP Act 2023).`,
  },
  {
    title: "3. Sharing Your Information",
    body: `We share your data only as necessary with:
• Delivery partners (name, address, phone) to complete your order.
• Payment processors (tokenised card data) to handle transactions securely.
• Sellers (order details only) to fulfil your purchase.
• Analytics providers (aggregated, anonymised data) to improve our platform.
• Authorities when required by law or court order.
We do not sell your personal data to third parties for their own marketing purposes.`,
  },
  {
    title: "4. Data Security",
    body: `We implement industry-standard security measures including TLS 1.3 encryption for data in transit, AES-256 encryption for sensitive data at rest, RBI-compliant card tokenisation, regular security audits and penetration testing, and strict access controls. Despite these measures, no system is completely immune to risk. Please notify us immediately if you suspect unauthorised access to your account.`,
  },
  {
    title: "5. Data Retention",
    body: `We retain your personal data for as long as your account is active or as needed to provide services. Transaction records are retained for 7 years as required by Indian tax law. After account deletion, most personal data is purged within 30 days, except data required for legal compliance or pending disputes.`,
  },
  {
    title: "6. Your Rights Under DPDP Act 2023",
    body: `Under India's Digital Personal Data Protection Act 2023, you have the right to:
• Access: request a copy of personal data we hold about you.
• Correction: correct inaccurate or incomplete data.
• Erasure: request deletion of your data (subject to legal obligations).
• Grievance redress: raise concerns with our Data Protection Officer.
To exercise any right, email privacy@aura.local. We respond within 30 days.`,
  },
  {
    title: "7. Cookies",
    body: `We use strictly necessary cookies (for login and cart), functional cookies (for preferences), and analytical/marketing cookies (with your consent). You can manage cookie preferences in your browser settings. Note that disabling cookies may affect platform functionality.`,
  },
  {
    title: "8. Children's Privacy",
    body: `Aura is not directed at children under 13. We do not knowingly collect personal data from children under 13. If we discover that we have inadvertently collected such data, we will delete it promptly. Parents who believe their child's data has been collected should contact privacy@aura.local.`,
  },
  {
    title: "9. Changes to This Policy",
    body: `We may update this Privacy Policy periodically. When we make material changes, we will notify you via email and an in-app notification at least 14 days before the changes take effect. Continued use of Aura after the effective date constitutes acceptance of the revised policy.`,
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#F5F5F6]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-10 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-pink-50">
          <ShieldCheck size={28} className="text-[#6366f1]" />
        </div>
        <h1 className="text-3xl font-bold text-[#282C3F]">Privacy Policy</h1>
        <p className="mt-2 text-sm text-gray-400">Last updated: 1 January 2025 · Effective: 1 January 2025</p>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-12">
        {/* Quick nav highlights */}
        <div className="mb-8 grid grid-cols-3 gap-3 sm:grid-cols-6">
          {HIGHLIGHTS.map((h) => (
            <div key={h.title} className={`flex flex-col items-center gap-1 rounded-xl p-3 text-center ${h.color.split(" ")[0]}`}>
              <h.icon size={18} className={h.color.split(" ")[1]} />
              <span className={`text-[10px] font-semibold leading-tight ${h.color.split(" ")[1]}`}>{h.title}</span>
            </div>
          ))}
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-sm space-y-7">
          <p className="text-sm text-gray-500 leading-relaxed">
            Aura Designs Pvt. Ltd. ("Aura", "we", "us") is committed to protecting your privacy. This Policy explains what personal data we collect, why we collect it, and how we use and protect it in accordance with the <strong className="text-[#282C3F]">Digital Personal Data Protection Act, 2023</strong> and other applicable Indian laws.
          </p>

          {SECTIONS.map((s) => (
            <div key={s.title}>
              <h2 className="mb-2 text-base font-bold text-[#282C3F]">{s.title}</h2>
              <p className="whitespace-pre-line text-sm text-gray-500 leading-relaxed">{s.body}</p>
            </div>
          ))}

          <div className="rounded-xl bg-pink-50 p-5 text-sm">
            <div className="mb-1 font-bold text-[#282C3F]">Data Protection Officer</div>
            <p className="text-gray-500">
              For privacy-related concerns, contact our DPO at{" "}
              <a href="mailto:privacy@aura.local" className="text-[#6366f1] hover:underline">privacy@aura.local</a>
              {" "}or write to us at: Aura Designs Pvt. Ltd., Sy No. 17/9-11, Bettadasanapura Village, Bengaluru – 560 087.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
