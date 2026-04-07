import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import AdminLayout from "@/layouts/AdminLayout";
import {
  Send, Bell, Users, BookOpen, Loader2, CheckCircle,
  Trash2, Clock, X, Plus, Info, AlertTriangle, Megaphone
} from "lucide-react";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "announcement";
  target: "all" | "students" | "course";
  target_course_id: string | null;
  target_course_title?: string;
  sent_count: number;
  read_count: number;
  created_at: string;
  is_sent: boolean;
}

const TYPE_CONFIG = {
  info: { label: "তথ্য", icon: Info, color: "text-blue-400 bg-blue-500/10 border-blue-500/30" },
  success: { label: "সাফল্য", icon: CheckCircle, color: "text-green-400 bg-green-500/10 border-green-500/30" },
  warning: { label: "সতর্কতা", icon: AlertTriangle, color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30" },
  announcement: { label: "ঘোষণা", icon: Megaphone, color: "text-rose-400 bg-rose-500/10 border-rose-500/30" },
};

const defaultForm = {
  title: "", message: "", type: "announcement" as const,
  target: "all" as const, target_course_id: "",
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications();
    supabase.from("courses").select("id, title").eq("status", "published").order("title")
      .then(({ data }) => setCourses(data || []));
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("notifications")
      .select("*, courses(title)")
      .order("created_at", { ascending: false })
      .limit(50);
    setNotifications(
      (data || []).map((n: any) => ({
        ...n,
        target_course_title: n.courses?.title,
      }))
    );
    setLoading(false);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) return;
    setSending(true);

    let recipientIds: string[] = [];
    if (form.target === "all") {
      const { data } = await supabase.from("profiles").select("user_id").eq("is_banned", false);
      recipientIds = (data || []).map((u: any) => u.user_id);
    } else if (form.target === "students") {
      const { data } = await supabase.from("profiles").select("user_id").eq("role", "student").eq("is_banned", false);
      recipientIds = (data || []).map((u: any) => u.user_id);
    } else if (form.target === "course" && form.target_course_id) {
      const { data } = await supabase.from("enrollments").select("user_id").eq("course_id", form.target_course_id);
      recipientIds = (data || []).map((u: any) => u.user_id);
    }

    const notifPayload = {
      title: form.title.trim(),
      message: form.message.trim(),
      type: form.type,
      target: form.target,
      target_course_id: form.target_course_id || null,
      sent_count: recipientIds.length,
      read_count: 0,
      is_sent: true,
      created_at: new Date().toISOString(),
    };

    const { data: notifData } = await supabase.from("notifications").insert(notifPayload).select("id").single();

    if (notifData?.id && recipientIds.length > 0) {
      const batchSize = 100;
      for (let i = 0; i < recipientIds.length; i += batchSize) {
        const batch = recipientIds.slice(i, i + batchSize).map((uid) => ({
          user_id: uid,
          notification_id: notifData.id,
          is_read: false,
          created_at: new Date().toISOString(),
        }));
        await supabase.from("user_notifications").insert(batch);
      }
    }

    setSending(false);
    setSent(true);
    setShowForm(false);
    setForm(defaultForm);
    setTimeout(() => setSent(false), 3000);
    await fetchNotifications();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("notifications").delete().eq("id", id);
    setDeleteId(null);
    await fetchNotifications();
  };

  const setF = (k: keyof typeof defaultForm, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const inputCls = "w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-rose-500 transition-all placeholder-gray-600";
  const labelCls = "block text-xs font-medium text-gray-400 mb-2";
  const timeAgo = (d: string) => new Date(d).toLocaleDateString("bn-BD", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <AdminLayout>
      <div className="p-6 lg:p-7 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-7">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">নোটিফিকেশন</h1>
            <p className="text-gray-500 text-sm">ব্যবহারকারীদের কাছে বার্তা পাঠান</p>
          </div>
          <div className="flex items-center gap-2">
            {sent && <span className="flex items-center gap-1.5 text-xs text-green-400"><CheckCircle className="w-3.5 h-3.5" />পাঠানো হয়েছে</span>}
            <button onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-medium py-2.5 px-4 rounded-xl text-sm transition-colors">
              <Plus className="w-4 h-4" /> নতুন নোটিফিকেশন
            </button>
          </div>
        </div>

        {/* Send Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
                <h2 className="font-semibold text-white">নতুন নোটিফিকেশন পাঠান</h2>
                <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800"><X className="w-4 h-4" /></button>
              </div>
              <form onSubmit={handleSend} className="p-6 space-y-4">
                <div>
                  <label className={labelCls}>ধরন</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(TYPE_CONFIG) as Array<keyof typeof TYPE_CONFIG>).map((t) => {
                      const tc = TYPE_CONFIG[t];
                      return (
                        <button key={t} type="button" onClick={() => setF("type", t)}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${form.type === t ? `${tc.color}` : "border-gray-700 text-gray-400 hover:text-gray-200 bg-gray-800/40"}`}>
                          <tc.icon className="w-4 h-4" /> {tc.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className={labelCls}>শিরোনাম *</label>
                  <input className={inputCls} value={form.title}
                    onChange={(e) => setF("title", e.target.value)} placeholder="নোটিফিকেশনের শিরোনাম" required />
                </div>
                <div>
                  <label className={labelCls}>বার্তা *</label>
                  <textarea className={`${inputCls} resize-none`} rows={4} value={form.message}
                    onChange={(e) => setF("message", e.target.value)} placeholder="বিস্তারিত বার্তা লিখুন..." required />
                </div>
                <div>
                  <label className={labelCls}>প্রাপক</label>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {[
                      { v: "all", l: "সবাই", icon: Bell },
                      { v: "students", l: "শিক্ষার্থী", icon: Users },
                      { v: "course", l: "কোর্স", icon: BookOpen },
                    ].map((t) => (
                      <button key={t.v} type="button" onClick={() => setF("target", t.v as any)}
                        className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-sm font-medium transition-all ${form.target === t.v ? "bg-rose-600 border-rose-600 text-white" : "border-gray-700 text-gray-400 hover:text-gray-200 bg-gray-800/40"}`}>
                        <t.icon className="w-3.5 h-3.5" /> {t.l}
                      </button>
                    ))}
                  </div>
                  {form.target === "course" && (
                    <select className={inputCls} value={form.target_course_id} onChange={(e) => setF("target_course_id", e.target.value)} required={form.target === "course"}>
                      <option value="">কোর্স বাছুন</option>
                      {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                  )}
                </div>

                {/* Preview */}
                {form.title && (
                  <div className={`rounded-xl border p-3 ${TYPE_CONFIG[form.type].color}`}>
                    <div className="flex items-start gap-2">
                      {(() => { const Ic = TYPE_CONFIG[form.type].icon; return <Ic className="w-4 h-4 mt-0.5 flex-shrink-0" />; })()}
                      <div>
                        <p className="text-sm font-semibold">{form.title}</p>
                        {form.message && <p className="text-xs mt-0.5 opacity-80 line-clamp-2">{form.message}</p>}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowForm(false)}
                    className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 text-sm hover:text-white hover:border-gray-600 transition-colors">বাতিল</button>
                  <button type="submit" disabled={sending}
                    className="flex-1 flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-medium py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60">
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    পাঠান
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
              <h3 className="text-lg font-bold text-white mb-2">নোটিফিকেশন মুছবেন?</h3>
              <p className="text-gray-400 text-sm mb-5">এই নোটিফিকেশনটি মুছে যাবে।</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 text-sm">বাতিল</button>
                <button onClick={() => handleDelete(deleteId)} className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-medium">মুছুন</button>
              </div>
            </div>
          </div>
        )}

        {/* Notifications List */}
        {loading ? (
          <div className="space-y-3">{[1,2,3,4].map((i) => <div key={i} className="h-24 bg-gray-900 rounded-2xl animate-pulse" />)}</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16 bg-gray-900/60 border border-gray-800 rounded-2xl">
            <Bell className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-400 mb-2">কোনো নোটিফিকেশন পাঠানো হয়নি</p>
            <button onClick={() => setShowForm(true)} className="text-rose-400 text-sm hover:text-rose-300">প্রথম নোটিফিকেশন পাঠান →</button>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => {
              const tc = TYPE_CONFIG[n.type] || TYPE_CONFIG.info;
              const TypeIcon = tc.icon;
              return (
                <div key={n.id} className="bg-gray-900/60 border border-gray-800 hover:border-gray-700 rounded-2xl p-5 transition-all">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${tc.color}`}>
                      <TypeIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="text-sm font-semibold text-white">{n.title}</h3>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-lg border ${tc.color}`}>{tc.label}</span>
                        <span className="text-xs text-gray-600 bg-gray-800 px-2 py-0.5 rounded-lg">
                          {n.target === "all" ? "সবাই" : n.target === "students" ? "শিক্ষার্থী" : n.target_course_title || "কোর্স"}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mb-2">{n.message}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-600">
                        <span><Clock className="w-3 h-3 inline mr-1" />{timeAgo(n.created_at)}</span>
                        <span>পাঠানো: {n.sent_count} জনকে</span>
                        <span>পড়েছেন: {n.read_count} জন</span>
                        {n.sent_count > 0 && (
                          <div className="flex items-center gap-1">
                            <div className="w-16 h-1 bg-gray-700 rounded-full overflow-hidden">
                              <div className="h-full bg-rose-500 rounded-full" style={{ width: `${Math.round((n.read_count / n.sent_count) * 100)}%` }} />
                            </div>
                            <span>{Math.round((n.read_count / n.sent_count) * 100)}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <button onClick={() => setDeleteId(n.id)}
                      className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
