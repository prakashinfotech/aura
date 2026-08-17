import * as React from "react";

const SECTIONS = [
  {
    title: "1. Acceptance of Terms",
    body: `By accessing or using the Aura platform (website, mobile application, or any related service), you agree to be bound by these Terms and Conditions ("Terms"). If you do not agree with any part of these Terms, you must discontinue use of our services immediately. These Terms constitute a legally binding agreement between you and Aura Designs Pvt. Ltd.`,
  },
  {
    title: "2. Eligibility",
    body: `You must be at least 18 years of age and legally capable of entering into binding contracts under the Indian Contract Act, 1872, to use our services. Persons under 18 may use the platform only with the involvement and supervision of a parent or legal guardian. By using Aura, you represent and warrant that you meet these eligibility requirements.`,
  },
  {
    title: "3. Account Registration",
    body: `To access certain features, you must create an account using a valid email address and mobile number. You are responsible for maintaining the confidentiality of your login credentials and for all activities conducted through your account. Aura reserves the right to suspend or terminate accounts that violate these Terms or engage in fraudulent activity.`,
  },
  {
    title: "4. Product Listings and Pricing",
    body: `Aura acts as a marketplace connecting buyers with sellers. While we strive to ensure accurate product descriptions and pricing, errors may occur. Aura reserves the right to cancel any order where the price was listed incorrectly due to a technical error or typo. Product images are for illustrative purposes only; actual products may vary slightly in colour or texture due to photography conditions.`,
  },
  {
    title: "5. Orders and Payments",
    body: `Placing an order constitutes an offer to purchase. Aura reserves the right to accept or reject any order, including after confirmation, due to stock unavailability, pricing errors, or fraud suspicion. All prices are in Indian Rupees (INR) and include applicable taxes unless stated otherwise. Payment must be completed at the time of order placement for prepaid orders.`,
  },
  {
    title: "6. Cancellation, Returns and Refunds",
    body: `Our cancellation and return policies are governed by the detailed policies available on our help pages. In general, most items may be returned within 30 days of delivery subject to conditions. Refunds are processed to the original payment method within 7–10 business days after quality verification of returned goods.`,
  },
  {
    title: "7. Intellectual Property",
    body: `All content on the Aura platform — including logos, product images, text, software, and design — is the exclusive property of Aura Designs Pvt. Ltd. or its licensors and is protected under applicable intellectual property laws. You may not reproduce, distribute, modify, or create derivative works without express written consent from Aura.`,
  },
  {
    title: "8. Prohibited Conduct",
    body: `You agree not to: (a) use the platform for unlawful purposes; (b) post false, misleading, or defamatory content; (c) reverse-engineer, scrape, or harvest data; (d) interfere with platform security or operations; (e) misuse promotions, discount codes, or loyalty points; (f) create multiple accounts to exploit offers. Violation may result in immediate account suspension and legal action.`,
  },
  {
    title: "9. Limitation of Liability",
    body: `To the fullest extent permitted by law, Aura shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of or inability to use the platform. Aura's total aggregate liability in connection with any claim shall not exceed the value of the order to which the claim relates.`,
  },
  {
    title: "10. Governing Law and Dispute Resolution",
    body: `These Terms are governed by the laws of India. Any disputes arising out of or relating to these Terms or your use of Aura shall first be attempted to be resolved through mediation. If mediation fails, disputes shall be subject to the exclusive jurisdiction of the courts at Bengaluru, Karnataka, India.`,
  },
  {
    title: "11. Amendments",
    body: `Aura reserves the right to update these Terms at any time. Continued use of the platform after changes are posted constitutes acceptance of the revised Terms. We will notify registered users of material changes via email or an in-app notification.`,
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#F5F5F6]">
      <div className="bg-white border-b border-gray-100 px-4 py-10 text-center">
        <h1 className="text-3xl font-bold text-[#282C3F]">Terms & Conditions</h1>
        <p className="mt-2 text-sm text-gray-400">Last updated: 1 January 2025</p>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-2xl bg-white p-8 shadow-sm space-y-7">
          <p className="text-sm text-gray-500 leading-relaxed">
            Please read these Terms and Conditions carefully before using the Aura platform. These Terms govern your access to and use of all Aura services.
          </p>
          {SECTIONS.map((s) => (
            <div key={s.title}>
              <h2 className="mb-2 text-base font-bold text-[#282C3F]">{s.title}</h2>
              <p className="text-sm text-gray-500 leading-relaxed">{s.body}</p>
            </div>
          ))}
          <div className="border-t border-gray-100 pt-6 text-xs text-gray-400">
            For questions about these Terms, contact us at <a href="/help/contact" className="text-[#6366f1] hover:underline">legal@aura.local</a>.
          </div>
        </div>
      </div>
    </div>
  );
}
