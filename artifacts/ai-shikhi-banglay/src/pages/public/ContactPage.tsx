import { useState } from "react";
import PublicLayout from "@/layouts/PublicLayout";
import { SEO } from "@/components/SEO";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import {
  Mail, Phone, MessageCircle, Facebook, Youtube, Instagram,
  Linkedin, Twitter, Send, CheckCircle, Clock, HelpCircle
} from "lucide-react";

const faqs = [
  { q: "কোর্স কিনতে কি ক্রেডিট কার্ড লাগবে?", a: "না। বিকাশ, নগদ, রকেট ও যেকোনো ব্যাংক কার্ড দিয়ে পেমেন্ট করা যাবে।" },
  { q: "কোর্সের ভিডিও কি ডাউনলোড করা যাবে?", a: "ভিডিও সরাসরি ডাউনলোড করা যাবে না, তবে অফলাইনে দেখার জন্য আমাদের অ্যাপ ব্যবহার করা যাবে।" },
  { q: "সার্টিফিকেট কি ভেরিফাইযোগ্য?", a: "হ্যাঁ। প্রতিটি সার্টিফিকেটে একটি অনন্য QR কোড থাকে যা স্ক্যান করে যাচাই করা যাবে।" },
  { q: "গ্রুপ ডিসকাউন্ট পাওয়া যাবে?", a: "হ্যাঁ, ৫ বা তার বেশি জনের গ্রুপের জন্য বিশেষ ছাড় পাওয়া যায়। যোগাযোগ করুন।" },
];

export default function ContactPage() {
  const { settings } = useSiteSettings();
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      setError("নাম, ইমেইল ও মেসেজ পূরণ করা আবশ্যক।");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError("সঠিক ইমেইল ঠিকানা দিন।");
      return;
    }
    setSending(true);
    setError("");
    await new Promise(r => setTimeout(r, 1500));
    setSent(true);
    setSending(false);
    setForm({ name: "", email: "", phone: "", subject: "", message: "" });
  };

  const contactSchema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "AI শিখি বাংলায় — যোগাযোগ",
    description: "AI শিখি বাংলায়-এর সাথে যোগাযোগ করুন। ইমেইল, WhatsApp বা ফোনে আমাদের সাথে কথা বলুন।",
    url: "https://aishikhibanglay.com/contact",
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "হোম", item: "https://aishikhibanglay.com" },
        { "@type": "ListItem", position: 2, name: "যোগাযোগ", item: "https://aishikhibanglay.com/contact" },
      ],
    },
  };

  const socialIcons: Record<string, React.ReactNode> = {
    facebook: <Facebook className="w-5 h-5" />,
    youtube: <Youtube className="w-5 h-5" />,
    instagram: <Instagram className="w-5 h-5" />,
    linkedin: <Linkedin className="w-5 h-5" />,
    twitter: <Twitter className="w-5 h-5" />,
  };
  const socialColors: Record<string, string> = {
    facebook: "hover:bg-blue-600",
    youtube: "hover:bg-red-600",
    instagram: "hover:bg-pink-600",
    linkedin: "hover:bg-blue-700",
    twitter: "hover:bg-sky-500",
  };

  return (
    <PublicLayout>
      <SEO
        title="যোগাযোগ করুন — AI শিখি বাংলায় সাপোর্ট ও কাস্টমার সেবা"
        description="AI শিখি বাংলায়-এর সাথে যোগাযোগ করুন। কোর্স সংক্রান্ত প্রশ্ন, পেমেন্ট সমস্যা বা যেকোনো সহায়তার জন্য ইমেইল, WhatsApp বা ফোনে আমাদের সাথে কথা বলুন। ২৪/৭ সাপোর্ট।"
        keywords="AI শিখি বাংলায় যোগাযোগ, customer support, সাপোর্ট, helpdesk, AI কোর্স সহায়তা, বাংলাদেশ AI শিক্ষা"
        url="/contact"
        schema={contactSchema}
      />

      <section className="bg-gradient-to-b from-gray-900 to-gray-950 py-16 border-b border-gray-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">আমাদের সাথে যোগাযোগ করুন</h1>
          <p className="text-gray-400 max-w-xl mx-auto">যেকোনো প্রশ্ন, সমস্যা বা পরামর্শের জন্য আমরা সবসময় আপনার পাশে আছি</p>
        </div>
      </section>

      {/* Response time bar */}
      <div className="bg-violet-600/10 border-b border-violet-500/20 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center gap-6 flex-wrap text-sm text-gray-300">
          <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-violet-400" /> গড় সাড়া সময়: ২-৪ ঘন্টা</span>
          <span className="flex items-center gap-2"><MessageCircle className="w-4 h-4 text-green-400" /> WhatsApp: ১ ঘন্টার মধ্যে</span>
          <span className="flex items-center gap-2"><Mail className="w-4 h-4 text-blue-400" /> ইমেইল: ২৪ ঘন্টার মধ্যে</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-5 gap-12">
          {/* Contact Form */}
          <div className="lg:col-span-3">
            <div className="bg-gray-900/60 border border-gray-800/60 rounded-2xl p-8">
              <h2 className="text-xl font-bold text-white mb-2">মেসেজ পাঠান</h2>
              <p className="text-sm text-gray-500 mb-6">আমরা সাধারণত ২-৪ ঘন্টার মধ্যে সাড়া দিই।</p>

              {sent ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">মেসেজ পাঠানো হয়েছে!</h3>
                  <p className="text-gray-400 mb-2">ধন্যবাদ আপনার মেসেজের জন্য।</p>
                  <p className="text-gray-500 text-sm mb-6">আমরা শীঘ্রই আপনার ইমেইলে উত্তর পাঠাবো।</p>
                  <button onClick={() => setSent(false)} className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-xl transition-colors">
                    আরেকটি মেসেজ পাঠান
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="text-sm font-medium text-gray-300 block mb-2">আপনার নাম *</label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="পুরো নাম লিখুন"
                        className="w-full bg-gray-800 border border-gray-700 focus:border-violet-500 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-300 block mb-2">ইমেইল *</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                        placeholder="example@email.com"
                        className="w-full bg-gray-800 border border-gray-700 focus:border-violet-500 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none transition-colors"
                      />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="text-sm font-medium text-gray-300 block mb-2">মোবাইল নম্বর</label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                        placeholder="01XXXXXXXXX"
                        className="w-full bg-gray-800 border border-gray-700 focus:border-violet-500 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-300 block mb-2">বিষয়</label>
                      <select
                        value={form.subject}
                        onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                        className="w-full bg-gray-800 border border-gray-700 focus:border-violet-500 rounded-xl px-4 py-3 text-white outline-none transition-colors"
                      >
                        <option value="">বিষয় নির্বাচন করুন</option>
                        <option value="course">কোর্স সংক্রান্ত</option>
                        <option value="payment">পেমেন্ট সমস্যা</option>
                        <option value="certificate">সার্টিফিকেট</option>
                        <option value="technical">টেকনিক্যাল সমস্যা</option>
                        <option value="refund">রিফান্ড</option>
                        <option value="partnership">পার্টনারশিপ</option>
                        <option value="other">অন্যান্য</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-300 block mb-2">মেসেজ *</label>
                    <textarea
                      value={form.message}
                      onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                      placeholder="আপনার প্রশ্ন বা সমস্যার বিস্তারিত লিখুন..."
                      rows={5}
                      className="w-full bg-gray-800 border border-gray-700 focus:border-violet-500 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none transition-colors resize-none"
                    />
                  </div>
                  {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:opacity-60 text-white font-semibold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    {sending ? (
                      <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> পাঠানো হচ্ছে...</>
                    ) : (
                      <><Send className="w-5 h-5" /> মেসেজ পাঠান</>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-gray-900/60 border border-gray-800/60 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-5">যোগাযোগের তথ্য</h3>
              <div className="space-y-4">
                {settings.contact_email && (
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-violet-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-0.5">ইমেইল</p>
                      <a href={`mailto:${settings.contact_email}`} className="text-white hover:text-violet-400 transition-colors font-medium text-sm break-all">
                        {settings.contact_email}
                      </a>
                      <p className="text-xs text-gray-600 mt-0.5">২৪ ঘন্টার মধ্যে উত্তর</p>
                    </div>
                  </div>
                )}
                {settings.contact_phone && (
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                      <Phone className="w-5 h-5 text-violet-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-0.5">ফোন</p>
                      <a href={`tel:${settings.contact_phone}`} className="text-white hover:text-violet-400 transition-colors font-medium text-sm">
                        {settings.contact_phone}
                      </a>
                      <p className="text-xs text-gray-600 mt-0.5">সকাল ৯টা — রাত ৯টা</p>
                    </div>
                  </div>
                )}
                {settings.whatsapp_number && (
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
                      <MessageCircle className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-0.5">WhatsApp</p>
                      <a
                        href={`https://wa.me/${settings.whatsapp_number.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-400 hover:text-green-300 transition-colors font-medium text-sm"
                      >
                        WhatsApp-এ মেসেজ করুন →
                      </a>
                      <p className="text-xs text-gray-600 mt-0.5">১ ঘন্টার মধ্যে সাড়া</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {Object.values(settings.social_links).some(Boolean) && (
              <div className="bg-gray-900/60 border border-gray-800/60 rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">সোশ্যাল মিডিয়া</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(settings.social_links).map(([platform, url]) =>
                    url ? (
                      <a key={platform} href={url} target="_blank" rel="noopener noreferrer"
                        className={`flex items-center gap-2 bg-gray-800 ${socialColors[platform] || "hover:bg-gray-700"} text-gray-300 hover:text-white px-3 py-2 rounded-lg transition-all text-sm font-medium capitalize`}>
                        {socialIcons[platform]}
                        {platform}
                      </a>
                    ) : null
                  )}
                </div>
              </div>
            )}

            {settings.whatsapp_number && (
              <a
                href={`https://wa.me/${settings.whatsapp_number.replace(/\D/g, "")}`}
                target="_blank" rel="noopener noreferrer"
                className="block bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold px-6 py-4 rounded-2xl transition-all text-center shadow-lg shadow-green-500/20"
              >
                <div className="flex items-center justify-center gap-3">
                  <MessageCircle className="w-6 h-6" />
                  <div>
                    <div className="text-base font-bold">WhatsApp-এ সরাসরি কথা বলুন</div>
                    <div className="text-sm font-normal text-green-200">সবচেয়ে দ্রুত সাড়া পাবেন</div>
                  </div>
                </div>
              </a>
            )}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <div className="text-center mb-10">
            <HelpCircle className="w-10 h-10 text-violet-400 mx-auto mb-3" />
            <h2 className="text-2xl font-bold text-white mb-3">সাধারণ প্রশ্নোত্তর</h2>
            <p className="text-gray-400">আমাদের সাথে যোগাযোগ করার আগে এই প্রশ্নগুলো দেখুন</p>
          </div>
          <div className="max-w-3xl mx-auto space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-gray-900/60 border border-gray-800/60 rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-gray-800/40 transition-colors"
                >
                  <span className="font-medium text-white">{faq.q}</span>
                  <span className={`text-violet-400 text-xl transition-transform flex-shrink-0 ${openFaq === i ? "rotate-45" : ""}`}>+</span>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-sm text-gray-400 leading-relaxed border-t border-gray-800/60 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
