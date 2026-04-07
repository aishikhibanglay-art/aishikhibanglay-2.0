import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import AdminLayout from "@/layouts/AdminLayout";
import { ICON_OPTIONS, getIcon } from "@/lib/iconMap";
import {
  DEFAULT_HERO, DEFAULT_FEATURES, DEFAULT_STEPS, DEFAULT_COMMUNITY,
  DEFAULT_TESTIMONIALS, DEFAULT_FAQS, DEFAULT_TRUST_BADGES, DEFAULT_CTA
} from "@/lib/homeDefaults";
import {
  Save, Loader2, CheckCircle, Plus, Trash2, ChevronDown, ChevronUp,
  LayoutDashboard, Sparkles, ListOrdered, Users, Star, HelpCircle,
  Shield, Megaphone, Eye
} from "lucide-react";

const TABS = [
  { id: "hero", label: "হিরো", icon: Sparkles },
  { id: "features", label: "বিশেষত্ব", icon: LayoutDashboard },
  { id: "steps", label: "শিক্ষা পথ", icon: ListOrdered },
  { id: "community", label: "কমিউনিটি", icon: Users },
  { id: "testimonials", label: "রিভিউ", icon: Star },
  { id: "faqs", label: "FAQ", icon: HelpCircle },
  { id: "trust", label: "ট্রাস্ট", icon: Shield },
  { id: "cta", label: "CTA", icon: Megaphone },
];

const inputClass = "w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-rose-500 transition-all";
const labelClass = "block text-xs font-medium text-gray-400 mb-1.5";

async function loadSetting<T>(key: string, fallback: T): Promise<T> {
  const { data } = await supabase.from("site_settings").select("value").eq("key", key).maybeSingle();
  if (!data?.value) return fallback;
  try { return JSON.parse(data.value); } catch { return fallback; }
}

async function saveSetting(key: string, value: unknown) {
  await supabase.from("site_settings").upsert({ key, value: JSON.stringify(value), updated_at: new Date().toISOString() }, { onConflict: "key" });
}

function IconSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const Icon = getIcon(value);
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2 text-sm hover:border-rose-500 transition-all min-w-32">
        <Icon className="w-4 h-4 text-violet-400" />
        <span className="flex-1 text-left truncate">{value}</span>
        <ChevronDown className="w-3 h-3 text-gray-500" />
      </button>
      {open && (
        <div className="absolute top-11 left-0 z-50 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-2 max-h-56 overflow-y-auto w-52">
          {ICON_OPTIONS.map((name) => {
            const I = getIcon(name);
            return (
              <button key={name} type="button" onClick={() => { onChange(name); setOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg hover:bg-gray-800 text-left transition-colors ${value === name ? "text-violet-400 bg-gray-800" : "text-gray-300"}`}>
                <I className="w-3.5 h-3.5" /> {name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SaveBtn({ saving, saved }: { saving: boolean; saved: boolean }) {
  return (
    <button type="submit" disabled={saving}
      className={`flex items-center gap-2 font-medium py-2.5 px-6 rounded-xl transition-all text-sm ${saved ? "bg-green-500/20 border border-green-500/30 text-green-400" : "bg-rose-600 hover:bg-rose-500 text-white"} disabled:opacity-60`}>
      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
      {saved ? "সংরক্ষিত!" : "সংরক্ষণ করুন"}
    </button>
  );
}

export default function HomepageEditor() {
  const [tab, setTab] = useState("hero");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [hero, setHero] = useState(DEFAULT_HERO);
  const [features, setFeatures] = useState(DEFAULT_FEATURES);
  const [steps, setSteps] = useState(DEFAULT_STEPS);
  const [community, setCommunity] = useState(DEFAULT_COMMUNITY);
  const [testimonials, setTestimonials] = useState(DEFAULT_TESTIMONIALS);
  const [faqs, setFaqs] = useState(DEFAULT_FAQS);
  const [trust, setTrust] = useState(DEFAULT_TRUST_BADGES);
  const [cta, setCta] = useState(DEFAULT_CTA);

  useEffect(() => {
    Promise.all([
      loadSetting("hero_content", DEFAULT_HERO),
      loadSetting("home_features", DEFAULT_FEATURES),
      loadSetting("home_steps", DEFAULT_STEPS),
      loadSetting("community_content", DEFAULT_COMMUNITY),
      loadSetting("home_testimonials", DEFAULT_TESTIMONIALS),
      loadSetting("home_faqs", DEFAULT_FAQS),
      loadSetting("trust_badges", DEFAULT_TRUST_BADGES),
      loadSetting("cta_content", DEFAULT_CTA),
    ]).then(([h, f, s, c, t, q, tr, ct]) => {
      setHero(h); setFeatures(f); setSteps(s); setCommunity(c);
      setTestimonials(t); setFaqs(q); setTrust(tr); setCta(ct);
    });
  }, []);

  const doSave = async (key: string, value: unknown) => {
    setSaving(true); setSaved(false);
    await saveSetting(key, value);
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  // Array item helpers
  const updateItem = (setter: any, idx: number, field: string, val: string) =>
    setter((prev: any[]) => prev.map((item, i) => i === idx ? { ...item, [field]: val } : item));
  const addItem = (setter: any, template: object) =>
    setter((prev: any[]) => [...prev, { ...template }]);
  const removeItem = (setter: any, idx: number) =>
    setter((prev: any[]) => prev.filter((_, i) => i !== idx));
  const moveItem = (setter: any, idx: number, dir: -1 | 1) =>
    setter((prev: any[]) => {
      const arr = [...prev];
      const ni = idx + dir;
      if (ni < 0 || ni >= arr.length) return prev;
      [arr[idx], arr[ni]] = [arr[ni], arr[idx]];
      return arr;
    });

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 max-w-6xl mx-auto">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">হোমপেজ এডিটর</h1>
            <p className="text-gray-400 text-sm">ল্যান্ডিং পেজের সব সেকশন এখান থেকে পরিচালনা করুন</p>
          </div>
          <a href="/" target="_blank" rel="noreferrer"
            className="flex items-center gap-2 bg-gray-800 border border-gray-700 text-gray-300 hover:text-white px-4 py-2 rounded-xl text-sm transition-colors">
            <Eye className="w-4 h-4" /> প্রিভিউ
          </a>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${tab === t.id ? "bg-rose-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"}`}>
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        {/* ── HERO TAB ── */}
        {tab === "hero" && (
          <form onSubmit={(e) => { e.preventDefault(); doSave("hero_content", hero); }}
            className="bg-gray-900/80 border border-gray-800 rounded-2xl p-6 space-y-4">
            <h2 className="font-semibold text-white mb-2">হিরো সেকশন</h2>
            <div>
              <label className={labelClass}>ব্যাজ টেক্সট (উপরের ছোট লেবেল)</label>
              <input value={hero.badge} onChange={(e) => setHero(h => ({ ...h, badge: e.target.value }))} className={inputClass} />
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>হেডলাইন (প্রথম অংশ)</label>
                <input value={hero.headline_pre} onChange={(e) => setHero(h => ({ ...h, headline_pre: e.target.value }))} className={inputClass} placeholder="বাংলায়" />
              </div>
              <div>
                <label className={labelClass}>হাইলাইট অংশ</label>
                <input value={hero.headline_highlight} onChange={(e) => setHero(h => ({ ...h, headline_highlight: e.target.value }))} className={inputClass} placeholder="AI শিখুন" />
              </div>
              <div>
                <label className={labelClass}>হেডলাইন (শেষ অংশ)</label>
                <input value={hero.headline_post} onChange={(e) => setHero(h => ({ ...h, headline_post: e.target.value }))} className={inputClass} placeholder="ভবিষ্যৎ গড়ুন" />
              </div>
            </div>
            <div>
              <label className={labelClass}>বিবরণ (Description)</label>
              <textarea value={hero.description} onChange={(e) => setHero(h => ({ ...h, description: e.target.value }))} rows={3} className={`${inputClass} resize-none`} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>CTA বাটন ১ (Primary)</label>
                <input value={hero.cta1_text} onChange={(e) => setHero(h => ({ ...h, cta1_text: e.target.value }))} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>CTA বাটন ২ (Secondary)</label>
                <input value={hero.cta2_text} onChange={(e) => setHero(h => ({ ...h, cta2_text: e.target.value }))} className={inputClass} />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <SaveBtn saving={saving} saved={saved} />
            </div>
          </form>
        )}

        {/* ── FEATURES TAB ── */}
        {tab === "features" && (
          <form onSubmit={(e) => { e.preventDefault(); doSave("home_features", features); }}>
            <div className="space-y-4">
              {features.map((item, i) => (
                <div key={i} className="bg-gray-900/80 border border-gray-800 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-gray-300">বৈশিষ্ট্য {i + 1}</span>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => moveItem(setFeatures, i, -1)} disabled={i === 0} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button>
                      <button type="button" onClick={() => moveItem(setFeatures, i, 1)} disabled={i === features.length - 1} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button>
                      <button type="button" onClick={() => removeItem(setFeatures, i)} className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                      <label className={labelClass}>আইকন</label>
                      <IconSelect value={item.icon} onChange={(v) => updateItem(setFeatures, i, "icon", v)} />
                    </div>
                    <div>
                      <label className={labelClass}>শিরোনাম</label>
                      <input value={item.title} onChange={(e) => updateItem(setFeatures, i, "title", e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>বিবরণ</label>
                      <input value={item.desc} onChange={(e) => updateItem(setFeatures, i, "desc", e.target.value)} className={inputClass} />
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => addItem(setFeatures, { icon: "BookOpen", title: "", desc: "" })}
                className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-700 rounded-2xl py-4 text-gray-500 hover:text-white hover:border-gray-600 transition-colors text-sm">
                <Plus className="w-4 h-4" /> নতুন বৈশিষ্ট্য যোগ করুন
              </button>
            </div>
            <div className="flex justify-end pt-4">
              <SaveBtn saving={saving} saved={saved} />
            </div>
          </form>
        )}

        {/* ── STEPS TAB ── */}
        {tab === "steps" && (
          <form onSubmit={(e) => { e.preventDefault(); doSave("home_steps", steps); }}>
            <div className="space-y-4">
              {steps.map((item, i) => (
                <div key={i} className="bg-gray-900/80 border border-gray-800 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-gray-300">ধাপ {i + 1}</span>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => moveItem(setSteps, i, -1)} disabled={i === 0} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button>
                      <button type="button" onClick={() => moveItem(setSteps, i, 1)} disabled={i === steps.length - 1} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button>
                      <button type="button" onClick={() => removeItem(setSteps, i)} className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className={labelClass}>স্টেপ নম্বর (বাংলায়)</label>
                      <input value={item.step} onChange={(e) => updateItem(setSteps, i, "step", e.target.value)} placeholder="০১" className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>আইকন</label>
                      <IconSelect value={item.icon} onChange={(v) => updateItem(setSteps, i, "icon", v)} />
                    </div>
                    <div>
                      <label className={labelClass}>শিরোনাম</label>
                      <input value={item.title} onChange={(e) => updateItem(setSteps, i, "title", e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>গ্রেডিয়েন্ট রঙ</label>
                      <input value={item.color} onChange={(e) => updateItem(setSteps, i, "color", e.target.value)} placeholder="from-violet-500 to-purple-600" className={inputClass} />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className={labelClass}>বিবরণ</label>
                    <textarea value={item.desc} onChange={(e) => updateItem(setSteps, i, "desc", e.target.value)} rows={2} className={`${inputClass} resize-none`} />
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => addItem(setSteps, { step: `০${steps.length + 1}`, icon: "BookOpen", title: "", desc: "", color: "from-violet-500 to-indigo-600" })}
                className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-700 rounded-2xl py-4 text-gray-500 hover:text-white hover:border-gray-600 transition-colors text-sm">
                <Plus className="w-4 h-4" /> নতুন ধাপ যোগ করুন
              </button>
            </div>
            <div className="flex justify-end pt-4">
              <SaveBtn saving={saving} saved={saved} />
            </div>
          </form>
        )}

        {/* ── COMMUNITY TAB ── */}
        {tab === "community" && (
          <form onSubmit={(e) => { e.preventDefault(); doSave("community_content", community); }}
            className="bg-gray-900/80 border border-gray-800 rounded-2xl p-6 space-y-4">
            <h2 className="font-semibold text-white mb-2">কমিউনিটি সেকশন</h2>
            <div>
              <label className={labelClass}>শিরোনাম</label>
              <input value={community.title} onChange={(e) => setCommunity(c => ({ ...c, title: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>বিবরণ</label>
              <textarea value={community.description} onChange={(e) => setCommunity(c => ({ ...c, description: e.target.value }))} rows={3} className={`${inputClass} resize-none`} />
            </div>
            <div>
              <label className={labelClass}>বুলেট পয়েন্ট (প্রতি লাইনে একটি)</label>
              <textarea
                value={(community.bullets || []).join("\n")}
                onChange={(e) => setCommunity(c => ({ ...c, bullets: e.target.value.split("\n").filter(Boolean) }))}
                rows={5} className={`${inputClass} resize-none`}
                placeholder="প্রতিদিন নতুন পোস্ট ও আলোচনা&#10;বিশেষজ্ঞদের সরাসরি সাড়া" />
              <p className="text-xs text-gray-600 mt-1">প্রতিটি বুলেট আলাদা লাইনে লিখুন</p>
            </div>
            <p className="text-xs text-gray-500 bg-gray-800/60 border border-gray-700/60 rounded-xl px-4 py-3">
              💡 কমিউনিটি পোস্ট সরাসরি ডাটাবেজ থেকে আসে। সর্বশেষ ৩টি published পোস্ট স্বয়ংক্রিয়ভাবে দেখাবে।
            </p>
            <div className="flex justify-end pt-2">
              <SaveBtn saving={saving} saved={saved} />
            </div>
          </form>
        )}

        {/* ── TESTIMONIALS TAB ── */}
        {tab === "testimonials" && (
          <form onSubmit={(e) => { e.preventDefault(); doSave("home_testimonials", testimonials); }}>
            <div className="space-y-4">
              {testimonials.map((item, i) => (
                <div key={i} className="bg-gray-900/80 border border-gray-800 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-gray-300">রিভিউ {i + 1}</span>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => moveItem(setTestimonials, i, -1)} disabled={i === 0} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button>
                      <button type="button" onClick={() => moveItem(setTestimonials, i, 1)} disabled={i === testimonials.length - 1} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button>
                      <button type="button" onClick={() => removeItem(setTestimonials, i)} className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-4 mb-3">
                    <div>
                      <label className={labelClass}>নাম</label>
                      <input value={item.name} onChange={(e) => updateItem(setTestimonials, i, "name", e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>পেশা/ভূমিকা</label>
                      <input value={item.role} onChange={(e) => updateItem(setTestimonials, i, "role", e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>রেটিং (১-৫)</label>
                      <select value={item.rating || 5} onChange={(e) => updateItem(setTestimonials, i, "rating", e.target.value)}
                        className={inputClass}>
                        {[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{r} ⭐</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>রিভিউ টেক্সট</label>
                    <textarea value={item.review} onChange={(e) => updateItem(setTestimonials, i, "review", e.target.value)} rows={2} className={`${inputClass} resize-none`} />
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => addItem(setTestimonials, { name: "", role: "", review: "", rating: 5 })}
                className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-700 rounded-2xl py-4 text-gray-500 hover:text-white hover:border-gray-600 transition-colors text-sm">
                <Plus className="w-4 h-4" /> নতুন রিভিউ যোগ করুন
              </button>
            </div>
            <div className="flex justify-end pt-4">
              <SaveBtn saving={saving} saved={saved} />
            </div>
          </form>
        )}

        {/* ── FAQS TAB ── */}
        {tab === "faqs" && (
          <form onSubmit={(e) => { e.preventDefault(); doSave("home_faqs", faqs); }}>
            <div className="space-y-3">
              {faqs.map((item, i) => (
                <div key={i} className="bg-gray-900/80 border border-gray-800 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-300">প্রশ্ন {i + 1}</span>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => moveItem(setFaqs, i, -1)} disabled={i === 0} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button>
                      <button type="button" onClick={() => moveItem(setFaqs, i, 1)} disabled={i === faqs.length - 1} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button>
                      <button type="button" onClick={() => removeItem(setFaqs, i)} className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className={labelClass}>প্রশ্ন</label>
                      <input value={item.q} onChange={(e) => updateItem(setFaqs, i, "q", e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>উত্তর</label>
                      <textarea value={item.a} onChange={(e) => updateItem(setFaqs, i, "a", e.target.value)} rows={2} className={`${inputClass} resize-none`} />
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => addItem(setFaqs, { q: "", a: "" })}
                className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-700 rounded-2xl py-4 text-gray-500 hover:text-white hover:border-gray-600 transition-colors text-sm">
                <Plus className="w-4 h-4" /> নতুন প্রশ্ন যোগ করুন
              </button>
            </div>
            <div className="flex justify-end pt-4">
              <SaveBtn saving={saving} saved={saved} />
            </div>
          </form>
        )}

        {/* ── TRUST BADGES TAB ── */}
        {tab === "trust" && (
          <form onSubmit={(e) => { e.preventDefault(); doSave("trust_badges", trust); }}>
            <div className="grid sm:grid-cols-2 gap-4">
              {trust.map((item, i) => (
                <div key={i} className="bg-gray-900/80 border border-gray-800 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-gray-300">ব্যাজ {i + 1}</span>
                    <button type="button" onClick={() => removeItem(setTrust, i)} className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className={labelClass}>আইকন</label>
                      <IconSelect value={item.icon} onChange={(v) => updateItem(setTrust, i, "icon", v)} />
                    </div>
                    <div>
                      <label className={labelClass}>শিরোনাম</label>
                      <input value={item.title} onChange={(e) => updateItem(setTrust, i, "title", e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>বিবরণ</label>
                      <input value={item.desc} onChange={(e) => updateItem(setTrust, i, "desc", e.target.value)} className={inputClass} />
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => addItem(setTrust, { icon: "Shield", title: "", desc: "" })}
                className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-700 rounded-2xl py-8 text-gray-500 hover:text-white hover:border-gray-600 transition-colors text-sm">
                <Plus className="w-4 h-4" /> ব্যাজ যোগ করুন
              </button>
            </div>
            <div className="flex justify-end pt-4">
              <SaveBtn saving={saving} saved={saved} />
            </div>
          </form>
        )}

        {/* ── CTA TAB ── */}
        {tab === "cta" && (
          <form onSubmit={(e) => { e.preventDefault(); doSave("cta_content", cta); }}
            className="bg-gray-900/80 border border-gray-800 rounded-2xl p-6 space-y-4">
            <h2 className="font-semibold text-white mb-2">CTA সেকশন (পেজের নিচে)</h2>
            <div>
              <label className={labelClass}>বড় হেডলাইন</label>
              <input value={cta.headline} onChange={(e) => setCta(c => ({ ...c, headline: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>বিবরণ</label>
              <input value={cta.description} onChange={(e) => setCta(c => ({ ...c, description: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>উপশিরোনাম (ছোট টেক্সট)</label>
              <input value={cta.subtitle} onChange={(e) => setCta(c => ({ ...c, subtitle: e.target.value }))} className={inputClass} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>প্রাইমারি বাটন</label>
                <input value={cta.cta1_text} onChange={(e) => setCta(c => ({ ...c, cta1_text: e.target.value }))} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>সেকেন্ডারি বাটন</label>
                <input value={cta.cta2_text} onChange={(e) => setCta(c => ({ ...c, cta2_text: e.target.value }))} className={inputClass} />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <SaveBtn saving={saving} saved={saved} />
            </div>
          </form>
        )}
      </div>
    </AdminLayout>
  );
}
