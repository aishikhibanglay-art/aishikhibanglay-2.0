import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import AdminLayout from "@/layouts/AdminLayout";
import {
  Plus, Edit2, Trash2, Globe, Eye, EyeOff, Save, X, Loader2,
  CheckCircle, Clock, ExternalLink
} from "lucide-react";

interface CustomPage {
  id: string;
  title: string;
  slug: string;
  content: string;
  status: "draft" | "published";
  meta_title: string;
  meta_description: string;
  created_at: string;
  updated_at: string;
}

const defaultForm = {
  title: "", slug: "", content: "", status: "draft" as const,
  meta_title: "", meta_description: "",
};

const toSlug = (s: string) => s.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "");

export default function CustomPages() {
  const [pages, setPages] = useState<CustomPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editPage, setEditPage] = useState<CustomPage | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);

  useEffect(() => { fetchPages(); }, []);

  const fetchPages = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("custom_pages")
      .select("*")
      .order("created_at", { ascending: false });
    setPages(data || []);
    setLoading(false);
  };

  const openNew = () => {
    setForm(defaultForm);
    setEditPage(null);
    setIsNew(true);
    setPreview(false);
  };

  const openEdit = (page: CustomPage) => {
    setForm({
      title: page.title, slug: page.slug, content: page.content,
      status: page.status, meta_title: page.meta_title || "",
      meta_description: page.meta_description || "",
    });
    setEditPage(page);
    setIsNew(false);
    setPreview(false);
  };

  const closeEditor = () => { setEditPage(null); setIsNew(false); };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    const payload = {
      ...form,
      slug: form.slug.trim() || toSlug(form.title),
      updated_at: new Date().toISOString(),
    };
    if (isNew) {
      await supabase.from("custom_pages").insert(payload);
    } else if (editPage) {
      await supabase.from("custom_pages").update(payload).eq("id", editPage.id);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    await fetchPages();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("custom_pages").delete().eq("id", id);
    setDeleteId(null);
    await fetchPages();
  };

  const toggleStatus = async (page: CustomPage) => {
    const newStatus = page.status === "published" ? "draft" : "published";
    await supabase.from("custom_pages").update({ status: newStatus }).eq("id", page.id);
    await fetchPages();
  };

  const setF = (k: keyof typeof defaultForm, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const inputCls = "w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-rose-500 transition-all placeholder-gray-600";
  const labelCls = "block text-xs font-medium text-gray-400 mb-2";
  const timeAgo = (d: string) => new Date(d).toLocaleDateString("bn-BD", { year: "numeric", month: "short", day: "numeric" });

  const showEditor = editPage || isNew;

  return (
    <AdminLayout>
      <div className="p-6 lg:p-7 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-7">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">কাস্টম পেজ</h1>
            <p className="text-gray-500 text-sm">স্ট্যাটিক পেজ তৈরি ও পরিচালনা করুন</p>
          </div>
          {!showEditor && (
            <button onClick={openNew}
              className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-medium py-2.5 px-4 rounded-xl text-sm transition-colors">
              <Plus className="w-4 h-4" /> নতুন পেজ
            </button>
          )}
        </div>

        {/* Delete Confirm */}
        {deleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl">
              <div className="w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">পেজ মুছবেন?</h3>
              <p className="text-gray-400 text-sm mb-5">এই পেজটি মুছে গেলে আর ফেরত আনা যাবে না।</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 text-sm hover:text-white">বাতিল</button>
                <button onClick={() => handleDelete(deleteId)}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-medium">মুছুন</button>
              </div>
            </div>
          </div>
        )}

        {showEditor ? (
          /* Editor */
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <button onClick={() => setPreview(!preview)}
                    className="flex items-center gap-2 bg-gray-800 border border-gray-700 text-gray-300 text-sm py-2 px-3 rounded-xl hover:bg-gray-700 transition-colors">
                    {preview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {preview ? "সম্পাদনা" : "প্রিভিউ"}
                  </button>
                  {saved && <span className="flex items-center gap-1 text-xs text-green-400"><CheckCircle className="w-3 h-3" />সংরক্ষিত</span>}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={closeEditor}
                    className="flex items-center gap-2 bg-gray-800 border border-gray-700 text-gray-300 text-sm py-2 px-3 rounded-xl hover:bg-gray-700 transition-colors">
                    <X className="w-4 h-4" /> বাতিল
                  </button>
                  <button onClick={handleSave} disabled={saving}
                    className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-medium py-2 px-4 rounded-xl text-sm transition-colors disabled:opacity-60">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    সংরক্ষণ
                  </button>
                </div>
              </div>

              <div className="bg-gray-900/60 border border-gray-800 rounded-2xl overflow-hidden">
                {preview ? (
                  <div className="p-8">
                    <h1 className="text-2xl font-bold text-white mb-4">{form.title || "শিরোনাম"}</h1>
                    <div className="prose prose-invert">
                      <div className="text-gray-300 text-sm leading-loose whitespace-pre-wrap">
                        {form.content || "পেজের কন্টেন্ট এখানে দেখাবে..."}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-5 space-y-4">
                    <div>
                      <label className={labelCls}>পেজের শিরোনাম *</label>
                      <input className={`${inputCls} text-base font-medium`} value={form.title}
                        onChange={(e) => { setF("title", e.target.value); if (isNew) setF("slug", toSlug(e.target.value)); }}
                        placeholder="পেজের শিরোনাম" />
                    </div>
                    <div>
                      <label className={labelCls}>কন্টেন্ট</label>
                      <textarea className={`${inputCls} resize-none`} rows={20} value={form.content}
                        onChange={(e) => setF("content", e.target.value)}
                        placeholder="পেজের কন্টেন্ট লিখুন (HTML সাপোর্টেড)..." />
                    </div>
                    <div>
                      <label className={labelCls}>URL Slug</label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 flex-shrink-0">/pages/</span>
                        <input className={inputCls} value={form.slug}
                          onChange={(e) => setF("slug", e.target.value)} placeholder="page-slug" />
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Meta Title</label>
                      <input className={inputCls} value={form.meta_title}
                        onChange={(e) => setF("meta_title", e.target.value)}
                        placeholder={form.title || "SEO টাইটেল"} />
                    </div>
                    <div>
                      <label className={labelCls}>Meta Description</label>
                      <textarea className={`${inputCls} resize-none`} rows={2} value={form.meta_description}
                        onChange={(e) => setF("meta_description", e.target.value)}
                        placeholder="SEO বিবরণ" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-semibold text-white">প্রকাশনা</h3>
                <div className="flex gap-2">
                  <button onClick={() => setF("status", "draft")}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${form.status === "draft" ? "bg-gray-700 text-white" : "border border-gray-700 text-gray-500 hover:text-gray-300"}`}>
                    ড্রাফট
                  </button>
                  <button onClick={() => setF("status", "published")}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${form.status === "published" ? "bg-rose-600 text-white" : "border border-gray-700 text-gray-500 hover:text-gray-300"}`}>
                    প্রকাশিত
                  </button>
                </div>
                {form.slug && (
                  <div className="bg-gray-800/60 rounded-xl p-3">
                    <p className="text-xs text-gray-500 mb-1">পেজের URL:</p>
                    <p className="text-xs text-violet-400 font-mono">/pages/{form.slug || "slug"}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Pages List */
          <>
            {loading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1,2,3].map((i) => <div key={i} className="h-32 bg-gray-900 rounded-2xl animate-pulse" />)}
              </div>
            ) : pages.length === 0 ? (
              <div className="text-center py-16 bg-gray-900/60 border border-gray-800 rounded-2xl">
                <Globe className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-400 mb-2 text-sm">কোনো কাস্টম পেজ নেই</p>
                <button onClick={openNew} className="text-rose-400 text-sm hover:text-rose-300">নতুন পেজ তৈরি করুন →</button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pages.map((page) => (
                  <div key={page.id} className="bg-gray-900/80 border border-gray-800 hover:border-gray-700 rounded-2xl p-5 transition-all group">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 bg-violet-500/10 rounded-xl flex items-center justify-center">
                        <Globe className="w-5 h-5 text-violet-400" />
                      </div>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-lg border flex items-center gap-1 ${page.status === "published" ? "text-green-400 bg-green-500/10 border-green-500/30" : "text-gray-400 bg-gray-800 border-gray-700"}`}>
                        {page.status === "published" ? <><CheckCircle className="w-3 h-3" /> প্রকাশিত</> : <><Clock className="w-3 h-3" /> ড্রাফট</>}
                      </span>
                    </div>
                    <h3 className="font-semibold text-white text-sm mb-1">{page.title}</h3>
                    <p className="text-xs text-gray-600 font-mono mb-3">/pages/{page.slug}</p>
                    <div className="text-xs text-gray-600 mb-4">{timeAgo(page.updated_at || page.created_at)}-এ আপডেট</div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(page)}
                        className="flex items-center gap-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 py-1.5 px-3 rounded-lg transition-colors">
                        <Edit2 className="w-3 h-3" /> সম্পাদনা
                      </button>
                      <button onClick={() => toggleStatus(page)}
                        className="flex items-center gap-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 py-1.5 px-3 rounded-lg transition-colors">
                        {page.status === "published" ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        {page.status === "published" ? "লুকান" : "প্রকাশ"}
                      </button>
                      {page.status === "published" && (
                        <a href={`/pages/${page.slug}`} target="_blank" rel="noreferrer"
                          className="flex items-center gap-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 py-1.5 px-2 rounded-lg transition-colors">
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      <button onClick={() => setDeleteId(page.id)}
                        className="flex items-center gap-1 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 py-1.5 px-2 rounded-lg transition-colors ml-auto">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
