import { useState } from "react";
import PublicLayout from "@/layouts/PublicLayout";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import {
  Mail, Phone, MessageCircle, Facebook, Youtube, Instagram,
  Linkedin, Twitter, Send, CheckCircle
} from "lucide-react";

export default function ContactPage() {
  const { settings } = useSiteSettings();
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      setError("সব তথ্য পূরণ করুন।");
      return;
    }
    setSending(true);
    setError("");
    // In production, this would call a Resend-powered API endpoint
    await new Promise(r => setTimeout(r, 1500));
    setSent(true);
    setSending(false);
    setForm({ name: "", email: "", subject: "", message: "" });
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
      <section className="bg-gradient-to-b from-gray-900 to-gray-950 py-16 border-b border-gray-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">যোগাযোগ করুন</h1>
          <p className="text-gray-400">আমাদের সাথে যেকোনো প্রশ্ন বা সমস্যা নিয়ে কথা বলুন</p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-5 gap-12">
          {/* Contact Form */}
          <div className="lg:col-span-3">
            <div className="bg-gray-900/60 border border-gray-800/60 rounded-2xl p-8">
              <h2 className="text-xl font-bold text-white mb-6">মেসেজ পাঠান</h2>

              {sent ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">মেসেজ পাঠানো হয়েছে!</h3>
                  <p className="text-gray-400 mb-6">আমরা শীঘ্রই আপনার সাথে যোগাযোগ করবো।</p>
                  <button onClick={() => setSent(false)} className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-xl transition-colors">
                    আরেকটি মেসেজ পাঠান
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="text-sm font-medium text-gray-300 block mb-2">আপনার নাম *</label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="আপনার পুরো নাম"
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
                  <div>
                    <label className="text-sm font-medium text-gray-300 block mb-2">বিষয়</label>
                    <input
                      type="text"
                      value={form.subject}
                      onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                      placeholder="মেসেজের বিষয়"
                      className="w-full bg-gray-800 border border-gray-700 focus:border-violet-500 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-300 block mb-2">মেসেজ *</label>
                    <textarea
                      value={form.message}
                      onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                      placeholder="আপনার প্রশ্ন বা মেসেজ লিখুন..."
                      rows={6}
                      className="w-full bg-gray-800 border border-gray-700 focus:border-violet-500 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none transition-colors resize-none"
                    />
                  </div>
                  {error && <p className="text-sm text-red-400">{error}</p>}
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

          {/* Contact Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-gray-900/60 border border-gray-800/60 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-5">যোগাযোগের তথ্য</h3>
              <div className="space-y-4">
                {settings.contact_email && (
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-violet-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">ইমেইল</p>
                      <a href={`mailto:${settings.contact_email}`} className="text-white hover:text-violet-400 transition-colors font-medium break-all">
                        {settings.contact_email}
                      </a>
                    </div>
                  </div>
                )}
                {settings.contact_phone && (
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                      <Phone className="w-5 h-5 text-violet-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">ফোন</p>
                      <a href={`tel:${settings.contact_phone}`} className="text-white hover:text-violet-400 transition-colors font-medium">
                        {settings.contact_phone}
                      </a>
                    </div>
                  </div>
                )}
                {settings.whatsapp_number && (
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
                      <MessageCircle className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">WhatsApp</p>
                      <a
                        href={`https://wa.me/${settings.whatsapp_number.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-400 hover:text-green-300 transition-colors font-medium"
                      >
                        WhatsApp-এ মেসেজ করুন →
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Social Links */}
            {Object.values(settings.social_links).some(Boolean) && (
              <div className="bg-gray-900/60 border border-gray-800/60 rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">সোশ্যাল মিডিয়া</h3>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(settings.social_links).map(([platform, url]) =>
                    url ? (
                      <a
                        key={platform}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-2 bg-gray-800 ${socialColors[platform] || "hover:bg-gray-700"} text-gray-300 hover:text-white px-4 py-2.5 rounded-xl transition-all text-sm font-medium capitalize`}
                      >
                        {socialIcons[platform]}
                        {platform}
                      </a>
                    ) : null
                  )}
                </div>
              </div>
            )}

            {/* WhatsApp CTA */}
            {settings.whatsapp_number && (
              <a
                href={`https://wa.me/${settings.whatsapp_number.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold px-6 py-4 rounded-2xl transition-all text-center shadow-lg shadow-green-500/20"
              >
                <div className="flex items-center justify-center gap-3">
                  <MessageCircle className="w-6 h-6" />
                  <div>
                    <div className="text-lg">WhatsApp-এ কথা বলুন</div>
                    <div className="text-sm font-normal text-green-200">দ্রুত সাড়া পাবেন</div>
                  </div>
                </div>
              </a>
            )}
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
