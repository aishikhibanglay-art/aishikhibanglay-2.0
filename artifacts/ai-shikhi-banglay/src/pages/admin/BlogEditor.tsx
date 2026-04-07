import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import AdminLayout from "@/layouts/AdminLayout";
import {
  Save, ArrowLeft, Eye, EyeOff, Loader2, Image as ImageIcon,
  Pin, Tag, FileText, AlertCircle
} from "lucide-react";

interface BlogForm {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  cover_image_url: string;
  status: "draft" | "published";
  is_featured: boolean;
  meta_title: string;
  meta_description: string;
  read_time: number;
}

const CATEGORIES = [
  "AI ও মেশিন লার্নিং", "প্রোগ্রামিং", "ডেটা সায়েন্স", "ওয়েব ডেভেলপমেন্ট",
  "মোবাইল ডেভেলপমেন্ট", "ক্যারিয়ার গাইড", "টেকনোলজি নিউজ", "অন্যান্য",
];

const toSlug = (s: string) => s.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "").replace(/-+/g, "-");

const defaultForm: BlogForm = {
  title: "", slug: "", excerpt: "", content: "", category: "",
  cover_image_url: "", status: "draft", is_featured: false,
  meta_title: "", meta_description: "", read_time: 5,
};

export default function BlogEditor() {
  const params = useParams<{ id?: string }>();
  const postId = params?.id;
  const isNew = !postId || postId === "new";

  const [, navigate] = useLocation();
  const { profile } = useAuth();
  const [form, setForm] = useState<BlogForm>(defaultForm);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(false);
  const [activeTab, setActiveTab] = useState("content");

  useEffect(() => {
    if (!isNew && postId) {
      supabase.from("blog_posts").select("*").eq("id", postId).single().then(({ data }) => {
        if (data) setForm({
          title: data.title || "", slug: data.slug || "", excerpt: data.excerpt || "",
          content: data.content || "", category: data.category || "", cover_image_url: data.cover_image_url || "",
          status: data.status || "draft", is_featured: data.is_featured || false,
          meta_title: data.meta_title || "", meta_description: data.meta_description || "",
          read_time: data.read_time || 5,
        });
        setLoading(false);
      });
    }
  }, [postId]);

  const setF = <K extends keyof BlogForm>(k: K, v: BlogForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async (status?: "draft" | "published") => {
    if (!form.title.trim()) { setError("শিরোনাম দেওয়া বাধ্যতামূলক"); return; }
    setSaving(true);
    setError("");
    const payload = {
      ...form,
      slug: form.slug.trim() || toSlug(form.title),
      status: status || form.status,
      published_at: (status === "published" || form.status === "published") ? new Date().toISOString() : null,
      author_id: profile?.user_id,
      read_time: form.read_time || Math.max(1, Math.ceil(form.content.split(" ").length / 200)),
    };
    let err;
    if (isNew) {
      const res = await supabase.from("blog_posts").insert(payload).select("id").single();
      err = res.error;
      if (!err && res.data) navigate(`/admin/blog/${res.data.id}/edit`);
    } else {
      const res = await supabase.from("blog_posts").update(payload).eq("id", postId);
      err = res.error;
    }
    setSaving(false);
    if (err) { setError(err.message); return; }
    setSaved(true);
    if (status) setF("status", status);
    setTimeout(() => setSaved(false), 3000);
  };

  const inputCls = "w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-rose-500 transition-all placeholder-gray-600";
  const labelCls = "block text-xs font-medium text-gray-400 mb-2";

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
      <div className="flex flex-col h-full">
        {/* Topbar */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-gray-800 bg-gray-900/50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/admin/blog")}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-sm font-semibold text-white">{isNew ? "নতুন ব্লগ পোস্ট" : "পোস্ট সম্পাদনা"}</h1>
              {saved && <p className="text-xs text-green-400">সংরক্ষিত হয়েছে ✓</p>}
              {error && <p className="text-xs text-red-400">{error}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2.5 py-1 rounded-lg border ${form.status === "published" ? "text-green-400 bg-green-500/10 border-green-500/30" : "text-gray-400 bg-gray-800 border-gray-700"}`}>
              {form.status === "published" ? "প্রকাশিত" : "ড্রাফট"}
            </span>
            <button onClick={() => setPreview(!preview)}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
              {preview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            <button onClick={() => handleSave("draft")} disabled={saving}
              className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-xl text-sm transition-colors disabled:opacity-60">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              ড্রাফট সেভ
            </button>
            <button onClick={() => handleSave("published")} disabled={saving}
              className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-medium py-2 px-4 rounded-xl text-sm transition-colors disabled:opacity-60">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              {form.status === "published" ? "আপডেট করুন" : "প্রকাশ করুন"}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {preview ? (
            /* Preview */
            <div className="max-w-3xl mx-auto p-8">
              {form.cover_image_url && (
                <img src={form.cover_image_url} alt={form.title} className="w-full h-56 object-cover rounded-2xl mb-6" />
              )}
              <div className="flex items-center gap-2 mb-3">
                {form.category && <span className="text-xs bg-violet-500/20 text-violet-300 border border-violet-500/30 px-2.5 py-1 rounded-lg">{form.category}</span>}
                {form.is_featured && <span className="text-xs bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 px-2.5 py-1 rounded-lg flex items-center gap-1"><Pin className="w-3 h-3" />Featured</span>}
              </div>
              <h1 className="text-3xl font-bold text-white mb-4">{form.title || "শিরোনাম"}</h1>
              {form.excerpt && <p className="text-gray-400 text-lg leading-relaxed mb-6">{form.excerpt}</p>}
              <div className="prose prose-invert max-w-none">
                <div className="text-gray-300 text-sm leading-loose whitespace-pre-wrap">{form.content || "কন্টেন্ট এখানে দেখাবে..."}</div>
              </div>
            </div>
          ) : (
            /* Editor */
            <div className="max-w-5xl mx-auto p-6 grid lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-5">
                {/* Tabs */}
                <div className="flex gap-1 bg-gray-900/60 border border-gray-800 rounded-xl p-1">
                  {[
                    { id: "content", label: "কন্টেন্ট", icon: FileText },
                    { id: "seo", label: "SEO", icon: Tag },
                  ].map((tab) => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 flex-1 justify-center py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? "bg-gray-800 text-white" : "text-gray-500 hover:text-gray-300"}`}>
                      <tab.icon className="w-3.5 h-3.5" /> {tab.label}
                    </button>
                  ))}
                </div>

                {activeTab === "content" && (
                  <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5 space-y-4">
                    <div>
                      <label className={labelCls}>শিরোনাম *</label>
                      <input className={`${inputCls} text-lg font-semibold`} value={form.title}
                        onChange={(e) => { setF("title", e.target.value); if (!form.slug || isNew) setF("slug", toSlug(e.target.value)); }}
                        placeholder="ব্লগ পোস্টের শিরোনাম লিখুন..." />
                    </div>
                    <div>
                      <label className={labelCls}>সংক্ষেপ</label>
                      <textarea className={`${inputCls} resize-none`} rows={2} value={form.excerpt}
                        onChange={(e) => setF("excerpt", e.target.value)}
                        placeholder="পোস্টের সংক্ষিপ্ত বিবরণ (সার্চ এবং কার্ডে দেখাবে)..." />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className={labelCls.replace("mb-2","")}>মূল কন্টেন্ট *</label>
                        <span className="text-xs text-gray-600">{form.content.split(" ").filter(Boolean).length} শব্দ · ~{Math.max(1, Math.ceil(form.content.split(" ").filter(Boolean).length / 200))} মিনিট</span>
                      </div>
                      <textarea className={`${inputCls} resize-none font-mono text-xs leading-relaxed`} rows={20} value={form.content}
                        onChange={(e) => setF("content", e.target.value)}
                        placeholder="এখানে ব্লগ পোস্টের মূল কন্টেন্ট লিখুন..." />
                    </div>
                  </div>
                )}

                {activeTab === "seo" && (
                  <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5 space-y-4">
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 text-xs text-blue-300 flex items-start gap-2">
                      <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                      SEO অপ্টিমাইজেশনের জন্য meta title ৬০ এবং meta description ১৬০ অক্ষরের মধ্যে রাখুন।
                    </div>
                    <div>
                      <label className={labelCls}>URL Slug</label>
                      <input className={`${inputCls} font-mono text-xs`} value={form.slug}
                        onChange={(e) => setF("slug", e.target.value)} placeholder="blog-post-url-slug" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className={labelCls.replace("mb-2","")}>Meta Title</label>
                        <span className={`text-xs ${form.meta_title.length > 60 ? "text-red-400" : "text-gray-600"}`}>{form.meta_title.length}/60</span>
                      </div>
                      <input className={inputCls} value={form.meta_title}
                        onChange={(e) => setF("meta_title", e.target.value)}
                        placeholder={form.title || "Meta title (ফাঁকা রাখলে শিরোনাম ব্যবহার হবে)"} />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className={labelCls.replace("mb-2","")}>Meta Description</label>
                        <span className={`text-xs ${form.meta_description.length > 160 ? "text-red-400" : "text-gray-600"}`}>{form.meta_description.length}/160</span>
                      </div>
                      <textarea className={`${inputCls} resize-none`} rows={3} value={form.meta_description}
                        onChange={(e) => setF("meta_description", e.target.value)}
                        placeholder={form.excerpt || "Meta description (ফাঁকা রাখলে সংক্ষেপ ব্যবহার হবে)"} />
                    </div>
                    {/* SERP Preview */}
                    <div className="bg-gray-800/60 rounded-xl p-4">
                      <p className="text-xs text-gray-500 mb-3">SERP Preview</p>
                      <p className="text-blue-400 text-sm font-medium mb-1 truncate">{form.meta_title || form.title || "শিরোনাম"}</p>
                      <p className="text-green-700 text-xs mb-1">aishikhibanglay.com/blog/{form.slug || "post-slug"}</p>
                      <p className="text-gray-400 text-xs line-clamp-2">{form.meta_description || form.excerpt || "Meta description..."}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-4">
                {/* Settings */}
                <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5 space-y-4">
                  <h3 className="text-sm font-semibold text-white">পোস্ট সেটিংস</h3>
                  <div>
                    <label className={labelCls}>ক্যাটাগরি</label>
                    <select className={inputCls} value={form.category} onChange={(e) => setF("category", e.target.value)}>
                      <option value="">ক্যাটাগরি বাছুন</option>
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>পড়ার সময় (মিনিট)</label>
                    <input type="number" min={1} className={inputCls} value={form.read_time}
                      onChange={(e) => setF("read_time", Number(e.target.value))} />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-800/60 rounded-xl">
                    <div>
                      <p className="text-sm text-white">Featured পোস্ট</p>
                      <p className="text-xs text-gray-500">হোমপেজে দেখাবে</p>
                    </div>
                    <button type="button" onClick={() => setF("is_featured", !form.is_featured)}
                      className={`relative w-11 h-6 rounded-full transition-colors ${form.is_featured ? "bg-rose-500" : "bg-gray-700"}`}>
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_featured ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                  </div>
                </div>

                {/* Cover Image */}
                <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5 space-y-3">
                  <h3 className="text-sm font-semibold text-white">কভার ছবি</h3>
                  {form.cover_image_url ? (
                    <div className="relative">
                      <img src={form.cover_image_url} alt="Cover" className="w-full h-32 object-cover rounded-xl" />
                      <button onClick={() => setF("cover_image_url", "")}
                        className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs hover:bg-red-400 transition-colors">✕</button>
                    </div>
                  ) : (
                    <div className="h-24 bg-gray-800 rounded-xl flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-gray-600" />
                    </div>
                  )}
                  <input className={inputCls} value={form.cover_image_url}
                    onChange={(e) => setF("cover_image_url", e.target.value)}
                    placeholder="ছবির URL" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
