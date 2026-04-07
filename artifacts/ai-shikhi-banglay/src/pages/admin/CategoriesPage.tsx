import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import AdminLayout from "@/layouts/AdminLayout";
import {
  Plus, Edit2, Trash2, Tag, Loader2, Check, X, Save
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  icon: string;
  course_count: number;
  created_at: string;
}

const COLORS = [
  "bg-violet-500", "bg-blue-500", "bg-green-500", "bg-orange-500",
  "bg-red-500", "bg-pink-500", "bg-cyan-500", "bg-yellow-500",
  "bg-indigo-500", "bg-teal-500", "bg-rose-500", "bg-amber-500",
];

const defaultForm = { name: "", slug: "", description: "", color: "bg-violet-500", icon: "📚" };

const toSlug = (name: string) =>
  name.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "").replace(/-+/g, "-");

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("categories")
      .select("id, name, slug, description, color, icon, created_at, courses(count)")
      .order("name");
    setCategories(
      (data || []).map((c: any) => ({
        ...c,
        course_count: c.courses?.[0]?.count || 0,
      }))
    );
    setLoading(false);
  };

  const openNew = () => {
    setEditId(null);
    setForm(defaultForm);
    setShowForm(true);
  };

  const openEdit = (cat: Category) => {
    setEditId(cat.id);
    setForm({ name: cat.name, slug: cat.slug, description: cat.description || "", color: cat.color || "bg-violet-500", icon: cat.icon || "📚" });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || toSlug(form.name),
      description: form.description.trim() || null,
      color: form.color,
      icon: form.icon.trim() || "📚",
    };
    if (editId) {
      await supabase.from("categories").update(payload).eq("id", editId);
    } else {
      await supabase.from("categories").insert(payload);
    }
    setSaving(false);
    setShowForm(false);
    setEditId(null);
    await fetchCategories();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("categories").delete().eq("id", id);
    setDeleteId(null);
    await fetchCategories();
  };

  const setF = (k: keyof typeof defaultForm, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const inputCls = "w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-rose-500 transition-all placeholder-gray-600";
  const labelCls = "block text-xs font-medium text-gray-400 mb-2";

  return (
    <AdminLayout>
      <div className="p-6 lg:p-7 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-7">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">ক্যাটাগরি ব্যবস্থাপনা</h1>
            <p className="text-gray-500 text-sm">{categories.length}টি ক্যাটাগরি</p>
          </div>
          <button onClick={openNew}
            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-medium py-2.5 px-4 rounded-xl text-sm transition-colors">
            <Plus className="w-4 h-4" /> নতুন ক্যাটাগরি
          </button>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
                <h2 className="font-semibold text-white">{editId ? "ক্যাটাগরি সম্পাদনা" : "নতুন ক্যাটাগরি"}</h2>
                <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>আইকন (Emoji) *</label>
                    <input className={inputCls} value={form.icon} onChange={(e) => setF("icon", e.target.value)}
                      placeholder="📚" maxLength={4} />
                  </div>
                  <div>
                    <label className={labelCls}>নাম *</label>
                    <input className={inputCls} value={form.name}
                      onChange={(e) => { setF("name", e.target.value); if (!editId) setF("slug", toSlug(e.target.value)); }}
                      placeholder="ক্যাটাগরির নাম" required />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Slug (URL)</label>
                  <input className={inputCls} value={form.slug} onChange={(e) => setF("slug", e.target.value)}
                    placeholder="category-slug" />
                </div>
                <div>
                  <label className={labelCls}>বিবরণ</label>
                  <textarea className={`${inputCls} resize-none`} rows={2} value={form.description}
                    onChange={(e) => setF("description", e.target.value)}
                    placeholder="এই ক্যাটাগরি সম্পর্কে সংক্ষিপ্ত বিবরণ" />
                </div>
                <div>
                  <label className={labelCls}>রঙ</label>
                  <div className="flex gap-2 flex-wrap">
                    {COLORS.map((c) => (
                      <button key={c} type="button" onClick={() => setF("color", c)}
                        className={`w-8 h-8 rounded-lg ${c} flex items-center justify-center transition-all ${form.color === c ? "ring-2 ring-white scale-110" : "opacity-60 hover:opacity-100"}`}>
                        {form.color === c && <Check className="w-4 h-4 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowForm(false)}
                    className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 text-sm hover:text-white hover:border-gray-600 transition-colors">
                    বাতিল
                  </button>
                  <button type="submit" disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-medium py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {editId ? "আপডেট করুন" : "তৈরি করুন"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirm */}
        {deleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl">
              <div className="w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">ক্যাটাগরি মুছবেন?</h3>
              <p className="text-gray-400 text-sm mb-5">এই ক্যাটাগরিটি মুছে গেলে আর ফেরত আনা যাবে না।</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 text-sm hover:text-white transition-colors">
                  বাতিল
                </button>
                <button onClick={() => handleDelete(deleteId)}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-colors">
                  মুছুন
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Categories Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map((i) => (
              <div key={i} className="h-28 bg-gray-900 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-16">
            <Tag className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-400 mb-2">কোনো ক্যাটাগরি নেই</p>
            <button onClick={openNew} className="text-rose-400 text-sm hover:text-rose-300">নতুন ক্যাটাগরি যোগ করুন →</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <div key={cat.id} className="bg-gray-900/80 border border-gray-800 hover:border-gray-700 rounded-2xl p-5 transition-all group">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-12 h-12 ${cat.color || "bg-violet-500"} rounded-xl flex items-center justify-center text-2xl shadow-lg`}>
                    {cat.icon || "📚"}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(cat)}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeleteId(cat.id)}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <h3 className="font-semibold text-white text-sm mb-1">{cat.name}</h3>
                <p className="text-xs text-gray-600 mb-3 line-clamp-2">{cat.description || "কোনো বিবরণ নেই"}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-mono bg-gray-800 px-2 py-0.5 rounded-lg">{cat.slug}</span>
                  <span className="text-xs text-gray-500">{cat.course_count} কোর্স</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
