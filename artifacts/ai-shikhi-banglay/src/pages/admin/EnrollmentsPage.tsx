import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import AdminLayout from "@/layouts/AdminLayout";
import {
  GraduationCap, Search, ChevronLeft, ChevronRight,
  UserPlus, Trash2, CheckCircle, Clock, X, Loader2, Download
} from "lucide-react";

interface Enrollment {
  id: string;
  user_name: string;
  user_email: string;
  course_title: string;
  course_id: string;
  user_id: string;
  progress: number;
  completed: boolean;
  enrolled_at: string;
  payment_amount: number | null;
}

export default function EnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showManual, setShowManual] = useState(false);
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [users, setUsers] = useState<{ user_id: string; name: string; email: string }[]>([]);
  const [manualForm, setManualForm] = useState({ user_id: "", course_id: "" });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const PAGE_SIZE = 15;

  useEffect(() => {
    fetchEnrollments();
    supabase.from("courses").select("id, title").eq("status", "published").order("title").then(({ data }) => setCourses(data || []));
    supabase.from("profiles").select("user_id, name, email").order("name").limit(100).then(({ data }) => setUsers(data || []));
  }, [page, filter]);

  const fetchEnrollments = async () => {
    setLoading(true);
    let q = supabase
      .from("enrollments")
      .select(`
        id, progress, completed, enrolled_at,
        profiles(user_id, name, email),
        courses(id, title),
        payments(amount)
      `, { count: "exact" })
      .order("enrolled_at", { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
    if (filter === "completed") q = q.eq("completed", true);
    if (filter === "in_progress") q = q.eq("completed", false);
    const { data, count } = await q;
    setEnrollments(
      (data || []).map((e: any) => ({
        id: e.id,
        user_name: e.profiles?.name || "Unknown",
        user_email: e.profiles?.email || "",
        user_id: e.profiles?.user_id || "",
        course_title: e.courses?.title || "Unknown",
        course_id: e.courses?.id || "",
        progress: e.progress || 0,
        completed: e.completed || false,
        enrolled_at: e.enrolled_at,
        payment_amount: e.payments?.[0]?.amount || null,
      }))
    );
    setTotal(count || 0);
    setLoading(false);
  };

  const handleManualEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.user_id || !manualForm.course_id) return;
    setSaving(true);
    await supabase.from("enrollments").upsert({
      user_id: manualForm.user_id,
      course_id: manualForm.course_id,
      enrolled_at: new Date().toISOString(),
      progress: 0,
      completed: false,
    }, { onConflict: "user_id,course_id" });
    setSaving(false);
    setShowManual(false);
    setManualForm({ user_id: "", course_id: "" });
    await fetchEnrollments();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("enrollments").delete().eq("id", id);
    setDeleteId(null);
    await fetchEnrollments();
  };

  const exportCSV = () => {
    const rows = [
      ["নাম", "ইমেইল", "কোর্স", "অগ্রগতি", "সম্পন্ন", "তারিখ"],
      ...enrollments.map((e) => [e.user_name, e.user_email, e.course_title, `${e.progress}%`, e.completed ? "হ্যাঁ" : "না", new Date(e.enrolled_at).toLocaleDateString("bn-BD")]),
    ];
    const blob = new Blob([rows.map((r) => r.join(",")).join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "enrollments.csv"; a.click();
  };

  const filtered = enrollments.filter(
    (e) => e.user_name.toLowerCase().includes(search.toLowerCase()) || e.course_title.toLowerCase().includes(search.toLowerCase()) || e.user_email.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const timeAgo = (d: string) => new Date(d).toLocaleDateString("bn-BD", { year: "numeric", month: "short", day: "numeric" });

  return (
    <AdminLayout>
      <div className="p-6 lg:p-7 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-7">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">নথিভুক্তি ব্যবস্থাপনা</h1>
            <p className="text-gray-500 text-sm">মোট {total} নথিভুক্তি</p>
          </div>
          <div className="flex gap-2">
            <button onClick={exportCSV}
              className="flex items-center gap-2 bg-gray-800 border border-gray-700 text-gray-300 text-sm py-2 px-3 rounded-xl hover:bg-gray-700 transition-colors">
              <Download className="w-4 h-4" /> CSV
            </button>
            <button onClick={() => setShowManual(true)}
              className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-medium py-2.5 px-4 rounded-xl text-sm transition-colors">
              <UserPlus className="w-4 h-4" /> ম্যানুয়াল নথিভুক্তি
            </button>
          </div>
        </div>

        {/* Manual Enroll Modal */}
        {showManual && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
                <h2 className="font-semibold text-white">ম্যানুয়াল নথিভুক্তি</h2>
                <button onClick={() => setShowManual(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800"><X className="w-4 h-4" /></button>
              </div>
              <form onSubmit={handleManualEnroll} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2">ব্যবহারকারী *</label>
                  <select className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-rose-500"
                    value={manualForm.user_id} onChange={(e) => setManualForm((f) => ({ ...f, user_id: e.target.value }))} required>
                    <option value="">ব্যবহারকারী বাছুন</option>
                    {users.map((u) => <option key={u.user_id} value={u.user_id}>{u.name} ({u.email})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2">কোর্স *</label>
                  <select className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-rose-500"
                    value={manualForm.course_id} onChange={(e) => setManualForm((f) => ({ ...f, course_id: e.target.value }))} required>
                    <option value="">কোর্স বাছুন</option>
                    {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 text-xs text-blue-300">
                  ম্যানুয়াল নথিভুক্তিতে কোনো পেমেন্ট প্রয়োজন হবে না।
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowManual(false)}
                    className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 text-sm hover:text-white transition-colors">বাতিল</button>
                  <button type="submit" disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 text-white text-sm font-medium py-2.5 rounded-xl transition-colors disabled:opacity-60">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                    নথিভুক্ত করুন
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
              <div className="w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 className="w-6 h-6 text-red-400" /></div>
              <h3 className="text-lg font-bold text-white mb-2">নথিভুক্তি বাতিল করবেন?</h3>
              <p className="text-gray-400 text-sm mb-5">এই শিক্ষার্থীর কোর্স অ্যাক্সেস চলে যাবে।</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 text-sm">বাতিল</button>
                <button onClick={() => handleDelete(deleteId)} className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-medium">মুছুন</button>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="নাম, ইমেইল বা কোর্স দিয়ে খুঁজুন..."
              className="w-full bg-gray-900 border border-gray-800 text-white text-sm placeholder-gray-600 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-rose-500" />
          </div>
          <div className="flex rounded-xl border border-gray-800 overflow-hidden bg-gray-900">
            {[{ v: "all", l: "সব" }, { v: "completed", l: "সম্পন্ন" }, { v: "in_progress", l: "চলমান" }].map((f) => (
              <button key={f.v} onClick={() => { setFilter(f.v); setPage(1); }}
                className={`px-4 py-2.5 text-xs font-medium transition-colors ${filter === f.v ? "bg-rose-600 text-white" : "text-gray-400 hover:text-gray-200"}`}>
                {f.l}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-gray-900/60 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  {["শিক্ষার্থী", "কোর্স", "অগ্রগতি", "পেমেন্ট", "তারিখ", "স্ট্যাটাস", ""].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}><td colSpan={7} className="px-5 py-3"><div className="h-10 bg-gray-800/60 rounded-xl animate-pulse" /></td></tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center">
                      <GraduationCap className="w-10 h-10 text-gray-700 mx-auto mb-2" />
                      <p className="text-gray-600 text-sm">কোনো নথিভুক্তি নেই</p>
                    </td>
                  </tr>
                ) : filtered.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {e.user_name?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate">{e.user_name}</p>
                          <p className="text-xs text-gray-500 truncate">{e.user_email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-sm text-gray-300 truncate max-w-[160px]">{e.course_title}</p>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-rose-500 to-orange-500 rounded-full"
                            style={{ width: `${e.progress}%` }} />
                        </div>
                        <span className="text-xs text-gray-400">{e.progress}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      {e.payment_amount !== null ? (
                        <span className="text-sm font-medium text-green-400">৳{e.payment_amount.toLocaleString()}</span>
                      ) : (
                        <span className="text-xs text-gray-600">বিনামূল্যে</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-500 whitespace-nowrap">{timeAgo(e.enrolled_at)}</td>
                    <td className="px-5 py-3">
                      <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg border w-fit ${e.completed ? "text-green-400 bg-green-500/10 border-green-500/30" : "text-blue-400 bg-blue-500/10 border-blue-500/30"}`}>
                        {e.completed ? <><CheckCircle className="w-3 h-3" />সম্পন্ন</> : <><Clock className="w-3 h-3" />চলমান</>}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <button onClick={() => setDeleteId(e.id)}
                        className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-gray-800">
              <p className="text-xs text-gray-500">{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} / {total}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  className="p-2 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:bg-gray-700 disabled:opacity-30 transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="flex items-center px-3 text-sm text-gray-300">{page}/{totalPages}</span>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="p-2 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:bg-gray-700 disabled:opacity-30 transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
