import * as React from "react";

const SECTIONS = [
  {
    title: "1. Platform Usage",
    body: "The Aura platform is provided for personal, non-commercial use only. You may browse, search, and purchase products for personal consumption. Any commercial resale, bulk purchase for trade, or use of automated tools to access the platform is strictly prohibited.",
  },
  {
    title: "2. User Conduct",
    body: "When using Aura, you agree to behave honestly and respectfully. This includes writing honest product reviews, providing accurate delivery addresses, and not abusing return or promotional policies. Fake reviews, fraudulent returns, and misuse of referral codes are violations that may lead to permanent account suspension.",
  },
  {
    title: "3. Content You Submit",
    body: "Any reviews, photos, or comments you submit on Aura grant us a royalty-free, worldwide licence to use, display, and distribute that content for marketing and operational purposes. You warrant that any content you submit does not infringe any third-party rights and is not defamatory, obscene, or unlawful.",
  },
  {
    title: "4. Third-Party Links",
    body: "The Aura platform may contain links to third-party websites or services. These are provided for convenience only. Aura does not endorse, control, or take responsibility for the content, privacy practices, or availability of such external sites.",
  },
  {
    title: "5. Cookies and Tracking",
    body: "Aura uses cookies, pixels, and similar technologies to improve your shopping experience, serve relevant advertisements, and analyse platform usage. By continuing to use the platform, you consent to our use of these technologies as described in our Privacy Policy.",
  },
  {
    title: "6. Accuracy of Information",
    body: "We strive to ensure all product information, pricing, and availability is accurate. However, Aura does not warrant the completeness or accuracy of any content on the platform. Product specifications provided by sellers are their responsibility. If you find an error, please report it via the Contact Us page.",
  },
  {
    title: "7. Termination of Access",
    body: "Aura reserves the right to restrict, suspend, or permanently terminate your access to the platform without notice if you breach these Terms of Use, engage in fraudulent activity, or harm other users or sellers on the platform.",
  },
  {
    title: "8. Disclaimer of Warranties",
    body: 'The Aura platform is provided on an "as is" and "as available" basis without warranties of any kind, express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement. Aura does not guarantee that the platform will be error-free or uninterrupted.',
  },
];

export default function TermsOfUsePage() {
  return (
    <div className="min-h-screen bg-[#F5F5F6]">
      <div className="bg-white border-b border-gray-100 px-4 py-10 text-center">
        <h1 className="text-3xl font-bold text-[#282C3F]">Terms of Use</h1>
        <p className="mt-2 text-sm text-gray-400">Last updated: 1 January 2025</p>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-2xl bg-white p-8 shadow-sm space-y-7">
          <p className="text-sm text-gray-500 leading-relaxed">
            These Terms of Use outline the rules for using the Aura website and mobile application. By accessing the platform you confirm that you accept these terms.
          </p>
          {SECTIONS.map((s) => (
            <div key={s.title}>
              <h2 className="mb-2 text-base font-bold text-[#282C3F]">{s.title}</h2>
              <p className="text-sm text-gray-500 leading-relaxed">{s.body}</p>
            </div>
          ))}
          <div className="rounded-xl bg-pink-50 p-4 text-sm text-[#282C3F]">
            These Terms of Use should be read alongside our full{" "}
            <a href="/terms" className="font-semibold text-[#6366f1] hover:underline">Terms & Conditions</a>{" "}
            and{" "}
            <a href="/privacy" className="font-semibold text-[#6366f1] hover:underline">Privacy Policy</a>.
          </div>
        </div>
      </div>
    </div>
  );
}
