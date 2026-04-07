import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import AdminLayout from "@/layouts/AdminLayout";
import {
  Plus, Ticket, Trash2, Edit2, Copy, Check, X, Save, Loader2,
  CheckCircle, Clock, AlertCircle, TrendingDown, Percent, DollarSign
} from "lucide-react";

interface Coupon {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_purchase: number;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
  applicable_course_id: string | null;
  course_title?: string;
  created_at: string;
}

const defaultForm = {
  code: "", discount_type: "percentage" as const, discount_value: 10,
  min_purchase: 0, max_uses: "" as string | number,
  expires_at: "", is_active: true, applicable_course_id: "",
};

const genCode = () => Math.random().toString(36).slice(2, 10).toUpperCase();

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetchCoupons();
    supabase.from("courses").select("id, title").eq("status", "published").order("title")
      .then(({ data }) => setCourses(data || []));
  }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("coupons")
      .select("*, courses(title)")
      .order("created_at", { ascending: false });
    setCoupons((data || []).map((c: any) => ({ ...c, course_title: c.courses?.title })));
    setLoading(false);
  };

  const openNew = () => { setForm({ ...defaultForm, code: genCode() }); setEditId(null); setShowForm(true); };
  const openEdit = (c: Coupon) => {
    setForm({
      code: c.code, discount_type: c.discount_type, discount_value: c.discount_value,
      min_purchase: c.min_purchase, max_uses: c.max_uses ?? "",
      expires_at: c.expires_at ? c.expires_at.split("T")[0] : "",
      is_active: c.is_active, applicable_course_id: c.applicable_course_id || "",
    });
    setEditId(c.id); setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim()) return;
    setSaving(true);
    const payload = {
      code: form.code.trim().toUpperCase(),
      discount_type: form.discount_type,
      discount_value: Number(form.discount_value),
      min_purchase: Number(form.min_purchase) || 0,
      max_uses: form.max_uses === "" ? null : Number(form.max_uses),
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      is_active: form.is_active,
      applicable_course_id: form.applicable_course_id || null,
    };
    if (editId) await supabase.from("coupons").update(payload).eq("id", editId);
    else await supabase.from("coupons").insert(payload);
    setSaving(false);
    setShowForm(false);
    setEditId(null);
    await fetchCoupons();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("coupons").delete().eq("id", id);
    setDeleteId(null);
    await fetchCoupons();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("coupons").update({ is_active: !current }).eq("id", id);
    await fetchCoupons();
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  const isExpired = (exp: string | null) => exp ? new Date(exp) < new Date() : false;

  const setF = (k: keyof typeof defaultForm, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const inputCls = "w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-rose-500 transition-all placeholder-gray-600";
  const labelCls = "block text-xs font-medium text-gray-400 mb-2";

  const active = coupons.filter((c) => c.is_active && !isExpired(c.expires_at)).length;
  const expired = coupons.filter((c) => isExpired(c.expires_at)).length;
  const totalUses = coupons.reduce((s, c) => s + (c.used_count || 0), 0);

  return (
    <AdminLayout>
      <div className="p-6 lg:p-7 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-7">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">কুপন ব্যবস্থাপনা</h1>
            <p className="text-gray-500 text-sm">{coupons.length}টি কুপন</p>
          </div>
          <button onClick={openNew}
            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-medium py-2.5 px-4 rounded-xl text-sm transition-colors">
            <Plus className="w-4 h-4" /> নতুন কুপন
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: "মোট কুপন", value: coupons.length, color: "text-white", icon: Ticket, bg: "bg-gray-900/60", border: "border-gray-800" },
            { label: "সক্রিয়", value: active, color: "text-green-400", icon: CheckCircle, bg: "bg-green-500/5", border: "border-green-500/20" },
            { label: "মেয়াদোত্তীর্ণ", value: expired, color: "text-red-400", icon: Clock, bg: "bg-red-500/5", border: "border-red-500/20" },
            { label: "মোট ব্যবহার", value: totalUses, color: "text-violet-400", icon: TrendingDown, bg: "bg-violet-500/5", border: "border-violet-500/20" },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} border ${s.border} rounded-2xl px-4 py-4`}>
              <div className="flex items-center gap-2 mb-1">
                <s.icon className={`w-4 h-4 ${s.color}`} />
                <span className={`text-xl font-bold ${s.color}`}>{s.value}</span>
              </div>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 sticky top-0 bg-gray-900">
                <h2 className="font-semibold text-white">{editId ? "কুপন সম্পাদনা" : "নতুন কুপন"}</h2>
                <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div>
                  <label className={labelCls}>কুপন কোড *</label>
                  <div className="flex gap-2">
                    <input className={inputCls} value={form.code} onChange={(e) => setF("code", e.target.value.toUpperCase())}
                      placeholder="DISCOUNT20" required />
                    <button type="button" onClick={() => setF("code", genCode())}
                      className="px-3 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-xl text-xs flex-shrink-0 transition-colors">
                      🎲 Generate
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>ডিসকাউন্টের ধরন</label>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setF("discount_type", "percentage")}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${form.discount_type === "percentage" ? "bg-rose-600 text-white" : "bg-gray-800 text-gray-400 hover:text-gray-200"}`}>
                        <Percent className="w-3.5 h-3.5" /> %
                      </button>
                      <button type="button" onClick={() => setF("discount_type", "fixed")}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${form.discount_type === "fixed" ? "bg-rose-600 text-white" : "bg-gray-800 text-gray-400 hover:text-gray-200"}`}>
                        <DollarSign className="w-3.5 h-3.5" /> ৳
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>পরিমাণ ({form.discount_type === "percentage" ? "%" : "৳"})</label>
                    <input type="number" min={1} max={form.discount_type === "percentage" ? 100 : undefined}
                      className={inputCls} value={form.discount_value}
                      onChange={(e) => setF("discount_value", e.target.value)} required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>সর্বনিম্ন কেনাকাটা (৳)</label>
                    <input type="number" min={0} className={inputCls} value={form.min_purchase}
                      onChange={(e) => setF("min_purchase", e.target.value)} placeholder="0" />
                  </div>
                  <div>
                    <label className={labelCls}>সর্বোচ্চ ব্যবহার (ফাঁকা = সীমাহীন)</label>
                    <input type="number" min={1} className={inputCls} value={form.max_uses}
                      onChange={(e) => setF("max_uses", e.target.value)} placeholder="সীমাহীন" />
                  </div>
                </div>

                <div>
                  <label className={labelCls}>মেয়াদ শেষের তারিখ (ফাঁকা = মেয়াদহীন)</label>
                  <input type="date" className={inputCls} value={form.expires_at}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setF("expires_at", e.target.value)} />
                </div>

                <div>
                  <label className={labelCls}>নির্দিষ্ট কোর্সে প্রযোজ্য (ফাঁকা = সব কোর্সে)</label>
                  <select className={inputCls} value={form.applicable_course_id} onChange={(e) => setF("applicable_course_id", e.target.value)}>
                    <option value="">সব কোর্সে প্রযোজ্য</option>
                    {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-800/40 rounded-xl">
                  <div>
                    <p className="text-sm text-white">কুপন সক্রিয়</p>
                    <p className="text-xs text-gray-500">বন্ধ করলে ব্যবহার করা যাবে না</p>
                  </div>
                  <button type="button" onClick={() => setF("is_active", !form.is_active)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${form.is_active ? "bg-rose-500" : "bg-gray-700"}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_active ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                </div>

                {/* Preview */}
                {form.discount_value > 0 && (
                  <div className="bg-gradient-to-r from-rose-500/10 to-orange-500/10 border border-rose-500/20 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-400 mb-1">কুপন প্রিভিউ</p>
                    <p className="text-xl font-bold text-white">{form.code || "CODE"}</p>
                    <p className="text-sm text-rose-300 mt-1">
                      {form.discount_type === "percentage" ? `${form.discount_value}% ছাড়` : `৳${form.discount_value} ছাড়`}
                      {form.min_purchase > 0 && ` · ৳${form.min_purchase}+ কেনাকাটায়`}
                    </p>
                  </div>
                )}

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
              <h3 className="text-lg font-bold text-white mb-2">কুপন মুছবেন?</h3>
              <p className="text-gray-400 text-sm mb-5">এই কুপনটি মুছে গেলে আর ব্যবহার করা যাবে না।</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 text-sm hover:text-white">বাতিল</button>
                <button onClick={() => handleDelete(deleteId)} className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-medium">মুছুন</button>
              </div>
            </div>
          </div>
        )}

        {/* Coupons Table */}
        <div className="bg-gray-900/60 border border-gray-800 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-5 space-y-3">{[1,2,3,4,5].map((i) => <div key={i} className="h-14 bg-gray-800/60 rounded-xl animate-pulse" />)}</div>
          ) : coupons.length === 0 ? (
            <div className="text-center py-16">
              <Ticket className="w-12 h-12 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-400 mb-2">কোনো কুপন নেই</p>
              <button onClick={openNew} className="text-rose-400 text-sm hover:text-rose-300">প্রথম কুপন তৈরি করুন →</button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    {["কোড", "ডিসকাউন্ট", "ব্যবহার", "মেয়াদ", "কোর্স", "স্ট্যাটাস", ""].map((h) => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {coupons.map((c) => {
                    const expired = isExpired(c.expires_at);
                    const exhausted = c.max_uses !== null && c.used_count >= c.max_uses;
                    const statusActive = c.is_active && !expired && !exhausted;
                    return (
                      <tr key={c.id} className="hover:bg-gray-800/30 transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-bold text-white">{c.code}</span>
                            <button onClick={() => copyCode(c.code)}
                              className="p-1 rounded text-gray-600 hover:text-gray-300 transition-colors">
                              {copied === c.code ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`text-sm font-bold ${c.discount_type === "percentage" ? "text-orange-400" : "text-green-400"}`}>
                            {c.discount_type === "percentage" ? `${c.discount_value}%` : `৳${c.discount_value}`}
                          </span>
                          {c.min_purchase > 0 && <p className="text-xs text-gray-600">min ৳{c.min_purchase}</p>}
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-sm text-white">{c.used_count}</span>
                          {c.max_uses !== null && (
                            <span className="text-gray-600 text-xs"> / {c.max_uses}</span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          {c.expires_at ? (
                            <span className={`text-xs ${expired ? "text-red-400" : "text-gray-400"}`}>
                              {expired ? "মেয়াদ শেষ" : new Date(c.expires_at).toLocaleDateString("bn-BD", { month: "short", day: "numeric", year: "numeric" })}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-600">মেয়াদহীন</span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-xs text-gray-400 truncate max-w-[120px] block">
                            {c.course_title || <span className="text-gray-600">সব কোর্সে</span>}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-lg border flex items-center gap-1 w-fit ${statusActive ? "text-green-400 bg-green-500/10 border-green-500/30" : expired ? "text-red-400 bg-red-500/10 border-red-500/30" : exhausted ? "text-orange-400 bg-orange-500/10 border-orange-500/30" : "text-gray-400 bg-gray-800 border-gray-700"}`}>
                            {statusActive ? <><CheckCircle className="w-3 h-3" />সক্রিয়</> : expired ? <><Clock className="w-3 h-3" />মেয়াদ শেষ</> : exhausted ? <><AlertCircle className="w-3 h-3" />শেষ</> : "নিষ্ক্রিয়"}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg text-gray-600 hover:text-blue-400 hover:bg-blue-500/10 transition-colors">
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => toggleActive(c.id, c.is_active)}
                              className="p-1.5 rounded-lg text-gray-600 hover:text-yellow-400 hover:bg-yellow-500/10 transition-colors">
                              {c.is_active ? <X className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                            </button>
                            <button onClick={() => setDeleteId(c.id)} className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
