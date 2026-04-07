import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import AdminLayout from "@/layouts/AdminLayout";
import { Save, Loader2, CheckCircle, Globe, Mail, CreditCard, Shield, Image } from "lucide-react";

interface Settings {
  site_name: string;
  site_tagline: string;
  site_description: string;
  contact_email: string;
  support_email: string;
  primary_color: string;
  maintenance_mode: boolean;
  allow_registration: boolean;
  require_email_verification: boolean;
  currency: string;
  timezone: string;
  facebook_url: string;
  youtube_url: string;
  instagram_url: string;
}

const defaultSettings: Settings = {
  site_name: "AI শিখি বাংলায়",
  site_tagline: "বাংলায় AI শিখুন, ভবিষ্যৎ গড়ুন",
  site_description: "",
  contact_email: "",
  support_email: "",
  primary_color: "#7c3aed",
  maintenance_mode: false,
  allow_registration: true,
  require_email_verification: true,
  currency: "BDT",
  timezone: "Asia/Dhaka",
  facebook_url: "",
  youtube_url: "",
  instagram_url: "",
};

export default function SiteSettings() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("site_settings").select("key, value");
      if (data) {
        const mapped = data.reduce((acc: any, row: any) => {
          try { acc[row.key] = JSON.parse(row.value); }
          catch { acc[row.key] = row.value; }
          return acc;
        }, {});
        setSettings((s) => ({ ...s, ...mapped }));
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const entries = Object.entries(settings).map(([key, value]) => ({
      key, value: JSON.stringify(value), updated_at: new Date().toISOString()
    }));
    await supabase.from("site_settings").upsert(entries, { onConflict: "key" });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const set = (key: keyof Settings, value: any) =>
    setSettings((s) => ({ ...s, [key]: value }));

  const inputClass = "w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-rose-500 transition-all";
  const labelClass = "block text-xs font-medium text-gray-400 mb-2";

  const tabs = [
    { id: "general", label: "সাধারণ", icon: Globe },
    { id: "contact", label: "যোগাযোগ", icon: Mail },
    { id: "payment", label: "পেমেন্ট", icon: CreditCard },
    { id: "security", label: "নিরাপত্তা", icon: Shield },
    { id: "social", label: "সোশ্যাল", icon: Image },
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-rose-400 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 lg:p-7 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-7">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">সাইট সেটিংস</h1>
            <p className="text-gray-500 text-sm">প্ল্যাটফর্মের সার্বিক কনফিগারেশন</p>
          </div>
          {saved && (
            <div className="flex items-center gap-2 text-green-400 text-sm bg-green-500/10 border border-green-500/30 px-4 py-2 rounded-xl">
              <CheckCircle className="w-4 h-4" /> সংরক্ষিত হয়েছে
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-900/60 border border-gray-800 rounded-xl p-1 flex-wrap">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all flex-1 justify-center ${
                activeTab === tab.id ? "bg-gray-800 text-white shadow-sm" : "text-gray-500 hover:text-gray-300"
              }`}>
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSave}>
          {/* General */}
          {activeTab === "general" && (
            <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 space-y-5">
              <h2 className="text-sm font-semibold text-white border-b border-gray-800 pb-3">সাধারণ তথ্য</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>সাইটের নাম</label>
                  <input className={inputClass} value={settings.site_name}
                    onChange={(e) => set("site_name", e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>ট্যাগলাইন</label>
                  <input className={inputClass} value={settings.site_tagline}
                    onChange={(e) => set("site_tagline", e.target.value)} />
                </div>
              </div>
              <div>
                <label className={labelClass}>সাইটের বিবরণ</label>
                <textarea className={`${inputClass} resize-none`} rows={3} value={settings.site_description}
                  onChange={(e) => set("site_description", e.target.value)} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>মুদ্রা</label>
                  <select className={inputClass} value={settings.currency}
                    onChange={(e) => set("currency", e.target.value)}>
                    <option value="BDT">BDT (টাকা)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>টাইমজোন</label>
                  <select className={inputClass} value={settings.timezone}
                    onChange={(e) => set("timezone", e.target.value)}>
                    <option value="Asia/Dhaka">Asia/Dhaka (BST +6)</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Contact */}
          {activeTab === "contact" && (
            <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 space-y-5">
              <h2 className="text-sm font-semibold text-white border-b border-gray-800 pb-3">যোগাযোগ তথ্য</h2>
              <div>
                <label className={labelClass}>যোগাযোগের ইমেইল</label>
                <input type="email" className={inputClass} value={settings.contact_email}
                  placeholder="contact@example.com"
                  onChange={(e) => set("contact_email", e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>সাপোর্ট ইমেইল</label>
                <input type="email" className={inputClass} value={settings.support_email}
                  placeholder="support@example.com"
                  onChange={(e) => set("support_email", e.target.value)} />
              </div>
            </div>
          )}

          {/* Payment */}
          {activeTab === "payment" && (
            <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 space-y-5">
              <h2 className="text-sm font-semibold text-white border-b border-gray-800 pb-3">পেমেন্ট কনফিগারেশন</h2>
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 text-sm text-blue-300">
                SSLCommerz API keys Replit Secrets-এ সংরক্ষণ করুন। এখানে শুধু সাধারণ পেমেন্ট অপশন।
              </div>
              <div>
                <label className={labelClass}>ডিফল্ট মুদ্রা</label>
                <select className={inputClass} value={settings.currency}
                  onChange={(e) => set("currency", e.target.value)}>
                  <option value="BDT">BDT (বাংলাদেশি টাকা)</option>
                  <option value="USD">USD (US Dollar)</option>
                </select>
              </div>
            </div>
          )}

          {/* Security */}
          {activeTab === "security" && (
            <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 space-y-5">
              <h2 className="text-sm font-semibold text-white border-b border-gray-800 pb-3">নিরাপত্তা সেটিংস</h2>
              {[
                { key: "maintenance_mode" as keyof Settings, label: "মেইনটেন্যান্স মোড", desc: "চালু করলে সাধারণ ব্যবহারকারীরা সাইটে প্রবেশ করতে পারবে না", warn: true },
                { key: "allow_registration" as keyof Settings, label: "নতুন নিবন্ধন অনুমতি", desc: "বন্ধ করলে নতুন ব্যবহারকারী সাইনআপ করতে পারবে না" },
                { key: "require_email_verification" as keyof Settings, label: "ইমেইল যাচাই বাধ্যতামূলক", desc: "সাইনআপের পর ইমেইল যাচাই না করলে লগইন হবে না" },
              ].map((item) => (
                <div key={item.key} className={`flex items-start justify-between p-4 rounded-xl border ${
                  item.warn && settings[item.key] ? "border-red-500/30 bg-red-500/5" : "border-gray-800 bg-gray-800/30"
                }`}>
                  <div className="flex-1 mr-4">
                    <p className="text-sm font-medium text-white">{item.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                  </div>
                  <button type="button" onClick={() => set(item.key, !settings[item.key])}
                    className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                      settings[item.key] ? (item.warn ? "bg-red-500" : "bg-rose-500") : "bg-gray-700"
                    }`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      settings[item.key] ? "translate-x-6" : "translate-x-1"
                    }`} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Social */}
          {activeTab === "social" && (
            <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 space-y-5">
              <h2 className="text-sm font-semibold text-white border-b border-gray-800 pb-3">সোশ্যাল মিডিয়া লিংক</h2>
              {[
                { key: "facebook_url" as keyof Settings, label: "Facebook Page URL", placeholder: "https://facebook.com/page" },
                { key: "youtube_url" as keyof Settings, label: "YouTube Channel URL", placeholder: "https://youtube.com/@channel" },
                { key: "instagram_url" as keyof Settings, label: "Instagram Profile URL", placeholder: "https://instagram.com/profile" },
              ].map((item) => (
                <div key={item.key}>
                  <label className={labelClass}>{item.label}</label>
                  <input className={inputClass} type="url" placeholder={item.placeholder}
                    value={(settings[item.key] as string) || ""}
                    onChange={(e) => set(item.key, e.target.value)} />
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold py-2.5 px-7 rounded-xl transition-colors disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              সেটিংস সংরক্ষণ করুন
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
