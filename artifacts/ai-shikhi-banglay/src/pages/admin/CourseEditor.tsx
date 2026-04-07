import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import AdminLayout from "@/layouts/AdminLayout";
import {
  Save, ArrowLeft, Plus, Trash2, Loader2, GripVertical,
  BookOpen, Video, FileText, ChevronDown, ChevronUp, Image as ImageIcon,
  Tag, DollarSign, Users, Globe, AlertCircle, CheckCircle
} from "lucide-react";

interface Lesson {
  id: string;
  title: string;
  type: "video" | "text" | "quiz";
  video_url: string;
  duration: number;
  is_free: boolean;
  order: number;
}

interface Chapter {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
  collapsed: boolean;
}

interface CourseForm {
  title: string;
  slug: string;
  description: string;
  short_description: string;
  price: number;
  discount_price: number;
  level: "beginner" | "intermediate" | "advanced";
  language: string;
  category_id: string;
  thumbnail_url: string;
  preview_video_url: string;
  status: "draft" | "pending" | "published";
  is_featured: boolean;
  what_you_learn: string[];
  requirements: string[];
  tags: string;
  certificate_enabled: boolean;
}

const LEVELS = [
  { value: "beginner", label: "শুরুর স্তর" },
  { value: "intermediate", label: "মধ্যম স্তর" },
  { value: "advanced", label: "উন্নত স্তর" },
];

const LANGUAGES = ["বাংলা", "English", "বাংলা + English"];

const defaultForm: CourseForm = {
  title: "", slug: "", description: "", short_description: "",
  price: 0, discount_price: 0, level: "beginner", language: "বাংলা",
  category_id: "", thumbnail_url: "", preview_video_url: "",
  status: "draft", is_featured: false,
  what_you_learn: [""], requirements: [""],
  tags: "", certificate_enabled: true,
};

const uid = () => Math.random().toString(36).slice(2);
const toSlug = (s: string) => s.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "");

export default function CourseEditor() {
  const params = useParams<{ id?: string }>();
  const courseId = params?.id;
  const isNew = !courseId || courseId === "new";
  const [, navigate] = useLocation();
  const { profile } = useAuth();

  const [form, setForm] = useState<CourseForm>(defaultForm);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("basic");

  useEffect(() => {
    supabase.from("categories").select("id, name").order("name").then(({ data }) => {
      setCategories(data || []);
    });
    if (!isNew && courseId) {
      Promise.all([
        supabase.from("courses").select("*").eq("id", courseId).single(),
        supabase.from("chapters").select("*, lessons(*)")
          .eq("course_id", courseId).order("order"),
      ]).then(([{ data: c }, { data: ch }]) => {
        if (c) setForm({
          title: c.title || "", slug: c.slug || "", description: c.description || "",
          short_description: c.short_description || "", price: c.price || 0,
          discount_price: c.discount_price || 0, level: c.level || "beginner",
          language: c.language || "বাংলা", category_id: c.category_id || "",
          thumbnail_url: c.thumbnail_url || "", preview_video_url: c.preview_video_url || "",
          status: c.status || "draft", is_featured: c.is_featured || false,
          what_you_learn: c.what_you_learn?.length ? c.what_you_learn : [""],
          requirements: c.requirements?.length ? c.requirements : [""],
          tags: (c.tags || []).join(", "), certificate_enabled: c.certificate_enabled !== false,
        });
        setChapters(
          (ch || []).map((ch: any) => ({
            id: ch.id, title: ch.title, order: ch.order, collapsed: false,
            lessons: (ch.lessons || []).sort((a: any, b: any) => a.order - b.order).map((l: any) => ({
              id: l.id, title: l.title, type: l.type || "video",
              video_url: l.video_url || "", duration: l.duration || 0, is_free: l.is_free || false, order: l.order,
            })),
          }))
        );
        setLoading(false);
      });
    }
  }, [courseId]);

  const setF = <K extends keyof CourseForm>(k: K, v: CourseForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async (status?: CourseForm["status"]) => {
    if (!form.title.trim()) { setError("কোর্সের শিরোনাম দেওয়া বাধ্যতামূলক"); return; }
    setSaving(true); setError("");
    const payload = {
      ...form,
      slug: form.slug.trim() || toSlug(form.title),
      status: status || form.status,
      what_you_learn: form.what_you_learn.filter(Boolean),
      requirements: form.requirements.filter(Boolean),
      tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      instructor_id: profile?.user_id,
    };
    let cId = courseId;
    if (isNew) {
      const { data, error: e } = await supabase.from("courses").insert(payload).select("id").single();
      if (e) { setError(e.message); setSaving(false); return; }
      cId = data.id;
      navigate(`/admin/courses/${cId}/edit`);
    } else {
      const { error: e } = await supabase.from("courses").update(payload).eq("id", cId);
      if (e) { setError(e.message); setSaving(false); return; }
    }
    for (const ch of chapters) {
      const chPayload = { title: ch.title, order: ch.order, course_id: cId };
      let chId = ch.id.startsWith("new_") ? null : ch.id;
      if (!chId) {
        const { data } = await supabase.from("chapters").insert(chPayload).select("id").single();
        chId = data?.id;
      } else {
        await supabase.from("chapters").update(chPayload).eq("id", chId);
      }
      if (!chId) continue;
      for (const l of ch.lessons) {
        const lPayload = { title: l.title, type: l.type, video_url: l.video_url, duration: l.duration, is_free: l.is_free, order: l.order, chapter_id: chId, course_id: cId };
        if (l.id.startsWith("new_")) {
          await supabase.from("lessons").insert(lPayload);
        } else {
          await supabase.from("lessons").update(lPayload).eq("id", l.id);
        }
      }
    }
    setSaving(false); setSaved(true);
    if (status) setF("status", status);
    setTimeout(() => setSaved(false), 3000);
  };

  const addChapter = () =>
    setChapters((c) => [...c, { id: `new_${uid()}`, title: "নতুন অধ্যায়", order: c.length + 1, lessons: [], collapsed: false }]);

  const deleteChapter = async (chId: string, i: number) => {
    if (!chId.startsWith("new_")) await supabase.from("chapters").delete().eq("id", chId);
    setChapters((c) => c.filter((_, idx) => idx !== i));
  };

  const addLesson = (chIdx: number) =>
    setChapters((c) => {
      const n = [...c];
      n[chIdx].lessons = [...n[chIdx].lessons, { id: `new_${uid()}`, title: "নতুন পাঠ", type: "video", video_url: "", duration: 0, is_free: false, order: n[chIdx].lessons.length + 1 }];
      return n;
    });

  const deleteLesson = async (chIdx: number, lIdx: number) => {
    const l = chapters[chIdx].lessons[lIdx];
    if (!l.id.startsWith("new_")) await supabase.from("lessons").delete().eq("id", l.id);
    setChapters((c) => { const n = [...c]; n[chIdx].lessons = n[chIdx].lessons.filter((_, i) => i !== lIdx); return n; });
  };

  const updateChapter = (i: number, k: keyof Chapter, v: any) =>
    setChapters((c) => { const n = [...c]; (n[i] as any)[k] = v; return n; });

  const updateLesson = (ci: number, li: number, k: keyof Lesson, v: any) =>
    setChapters((c) => { const n = [...c]; (n[ci].lessons[li] as any)[k] = v; return n; });

  const updateList = (key: "what_you_learn" | "requirements", i: number, v: string) =>
    setF(key, form[key].map((x, idx) => idx === i ? v : x));
  const addListItem = (key: "what_you_learn" | "requirements") => setF(key, [...form[key], ""]);
  const removeListItem = (key: "what_you_learn" | "requirements", i: number) =>
    setF(key, form[key].filter((_, idx) => idx !== i));

  const inputCls = "w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-rose-500 transition-all placeholder-gray-600";
  const labelCls = "block text-xs font-medium text-gray-400 mb-2";

  const tabs = [
    { id: "basic", label: "মূল তথ্য", icon: BookOpen },
    { id: "curriculum", label: "কারিকুলাম", icon: Video },
    { id: "pricing", label: "মূল্য", icon: DollarSign },
    { id: "seo", label: "SEO", icon: Globe },
  ];

  const totalLessons = chapters.reduce((s, c) => s + c.lessons.length, 0);
  const totalDuration = chapters.reduce((s, c) => s + c.lessons.reduce((ls, l) => ls + (l.duration || 0), 0), 0);

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
            <button onClick={() => navigate("/admin/courses")}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-sm font-semibold text-white">{isNew ? "নতুন কোর্স" : "কোর্স সম্পাদনা"}</h1>
              <p className="text-xs text-gray-600">{chapters.length} অধ্যায় · {totalLessons} পাঠ · {Math.round(totalDuration / 60)} ঘণ্টা</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {saved && <span className="flex items-center gap-1.5 text-xs text-green-400"><CheckCircle className="w-3.5 h-3.5" /> সংরক্ষিত</span>}
            {error && <span className="text-xs text-red-400">{error}</span>}
            <span className={`text-xs px-2.5 py-1 rounded-lg border ${form.status === "published" ? "text-green-400 bg-green-500/10 border-green-500/30" : form.status === "pending" ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/30" : "text-gray-400 bg-gray-800 border-gray-700"}`}>
              {form.status === "published" ? "প্রকাশিত" : form.status === "pending" ? "রিভিউতে" : "ড্রাফট"}
            </span>
            <button onClick={() => handleSave("draft")} disabled={saving}
              className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-3 rounded-xl text-sm transition-colors disabled:opacity-60">
              <Save className="w-3.5 h-3.5" /> সেভ
            </button>
            <button onClick={() => handleSave("published")} disabled={saving}
              className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-medium py-2 px-4 rounded-xl text-sm transition-colors disabled:opacity-60">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              {form.status === "published" ? "আপডেট" : "প্রকাশ করুন"}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto p-6">
            {/* Tabs */}
            <div className="flex gap-1 bg-gray-900/60 border border-gray-800 rounded-xl p-1 mb-6 overflow-x-auto">
              {tabs.map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 flex-1 justify-center py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id ? "bg-gray-800 text-white" : "text-gray-500 hover:text-gray-300"}`}>
                  <tab.icon className="w-3.5 h-3.5" /> {tab.label}
                </button>
              ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                {/* Basic Info */}
                {activeTab === "basic" && (
                  <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5 space-y-4">
                    <div>
                      <label className={labelCls}>কোর্সের শিরোনাম *</label>
                      <input className={`${inputCls} text-base font-medium`} value={form.title}
                        onChange={(e) => { setF("title", e.target.value); if (isNew) setF("slug", toSlug(e.target.value)); }}
                        placeholder="কোর্সের নাম লিখুন..." />
                    </div>
                    <div>
                      <label className={labelCls}>সংক্ষিপ্ত বিবরণ (কার্ডে দেখাবে)</label>
                      <textarea className={`${inputCls} resize-none`} rows={2} value={form.short_description}
                        onChange={(e) => setF("short_description", e.target.value)}
                        placeholder="কোর্সের সংক্ষিপ্ত বিবরণ..." />
                    </div>
                    <div>
                      <label className={labelCls}>বিস্তারিত বিবরণ</label>
                      <textarea className={`${inputCls} resize-none`} rows={6} value={form.description}
                        onChange={(e) => setF("description", e.target.value)}
                        placeholder="কোর্সের সম্পূর্ণ বিবরণ লিখুন..." />
                    </div>
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div>
                        <label className={labelCls}>স্তর</label>
                        <select className={inputCls} value={form.level} onChange={(e) => setF("level", e.target.value as CourseForm["level"])}>
                          {LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={labelCls}>ভাষা</label>
                        <select className={inputCls} value={form.language} onChange={(e) => setF("language", e.target.value)}>
                          {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={labelCls}>ক্যাটাগরি</label>
                        <select className={inputCls} value={form.category_id} onChange={(e) => setF("category_id", e.target.value)}>
                          <option value="">ক্যাটাগরি বাছুন</option>
                          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                    </div>
                    {/* What You'll Learn */}
                    <div>
                      <label className={labelCls}>কী কী শিখবেন</label>
                      <div className="space-y-2">
                        {form.what_you_learn.map((item, i) => (
                          <div key={i} className="flex gap-2">
                            <input className={inputCls} value={item}
                              onChange={(e) => updateList("what_you_learn", i, e.target.value)}
                              placeholder={`শিক্ষার বিষয় ${i + 1}`} />
                            {form.what_you_learn.length > 1 && (
                              <button onClick={() => removeListItem("what_you_learn", i)}
                                className="p-2.5 rounded-xl border border-gray-700 text-gray-500 hover:text-red-400 hover:border-red-500/50 transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                        <button onClick={() => addListItem("what_you_learn")}
                          className="flex items-center gap-2 text-xs text-rose-400 hover:text-rose-300 transition-colors">
                          <Plus className="w-3.5 h-3.5" /> আরো যোগ করুন
                        </button>
                      </div>
                    </div>
                    {/* Requirements */}
                    <div>
                      <label className={labelCls}>পূর্বশর্ত (Requirements)</label>
                      <div className="space-y-2">
                        {form.requirements.map((item, i) => (
                          <div key={i} className="flex gap-2">
                            <input className={inputCls} value={item}
                              onChange={(e) => updateList("requirements", i, e.target.value)}
                              placeholder={`শর্ত ${i + 1}`} />
                            {form.requirements.length > 1 && (
                              <button onClick={() => removeListItem("requirements", i)}
                                className="p-2.5 rounded-xl border border-gray-700 text-gray-500 hover:text-red-400 hover:border-red-500/50 transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                        <button onClick={() => addListItem("requirements")}
                          className="flex items-center gap-2 text-xs text-rose-400 hover:text-rose-300 transition-colors">
                          <Plus className="w-3.5 h-3.5" /> আরো যোগ করুন
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>ট্যাগ (কমা দিয়ে আলাদা করুন)</label>
                      <input className={inputCls} value={form.tags}
                        onChange={(e) => setF("tags", e.target.value)}
                        placeholder="AI, Machine Learning, Python" />
                    </div>
                  </div>
                )}

                {/* Curriculum */}
                {activeTab === "curriculum" && (
                  <div className="space-y-4">
                    {chapters.length === 0 ? (
                      <div className="text-center py-12 bg-gray-900/60 border border-gray-800 rounded-2xl">
                        <BookOpen className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                        <p className="text-gray-400 mb-3 text-sm">এখনো কোনো অধ্যায় নেই</p>
                        <button onClick={addChapter}
                          className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white text-sm font-medium py-2 px-4 rounded-xl mx-auto transition-colors">
                          <Plus className="w-4 h-4" /> প্রথম অধ্যায় যোগ করুন
                        </button>
                      </div>
                    ) : (
                      <>
                        {chapters.map((ch, ci) => (
                          <div key={ch.id} className="bg-gray-900/60 border border-gray-800 rounded-2xl overflow-hidden">
                            <div className="flex items-center gap-3 px-4 py-3 bg-gray-800/40 border-b border-gray-800">
                              <GripVertical className="w-4 h-4 text-gray-600 flex-shrink-0" />
                              <span className="text-xs font-bold text-rose-400 w-6 flex-shrink-0">Ch{ci + 1}</span>
                              <input value={ch.title}
                                onChange={(e) => updateChapter(ci, "title", e.target.value)}
                                className="flex-1 bg-transparent text-sm font-medium text-white placeholder-gray-600 focus:outline-none"
                                placeholder="অধ্যায়ের নাম" />
                              <button onClick={() => updateChapter(ci, "collapsed", !ch.collapsed)}
                                className="p-1 rounded text-gray-500 hover:text-white transition-colors">
                                {ch.collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                              </button>
                              <button onClick={() => deleteChapter(ch.id, ci)}
                                className="p-1 rounded text-gray-600 hover:text-red-400 transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            {!ch.collapsed && (
                              <div className="divide-y divide-gray-800/60">
                                {ch.lessons.map((l, li) => (
                                  <div key={l.id} className="flex items-center gap-3 px-4 py-2.5">
                                    <GripVertical className="w-3.5 h-3.5 text-gray-700 flex-shrink-0" />
                                    <span className="text-xs text-gray-600 w-5 text-center">{li + 1}</span>
                                    <select value={l.type}
                                      onChange={(e) => updateLesson(ci, li, "type", e.target.value as Lesson["type"])}
                                      className="bg-gray-800 border border-gray-700 text-gray-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none flex-shrink-0">
                                      <option value="video">🎥 ভিডিও</option>
                                      <option value="text">📄 টেক্সট</option>
                                      <option value="quiz">❓ কুইজ</option>
                                    </select>
                                    <input value={l.title}
                                      onChange={(e) => updateLesson(ci, li, "title", e.target.value)}
                                      className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 focus:outline-none"
                                      placeholder="পাঠের নাম" />
                                    {l.type === "video" && (
                                      <input value={l.video_url}
                                        onChange={(e) => updateLesson(ci, li, "video_url", e.target.value)}
                                        className="w-32 text-xs bg-gray-800 border border-gray-700 text-gray-300 rounded-lg px-2 py-1.5 focus:outline-none placeholder-gray-600"
                                        placeholder="Video URL" />
                                    )}
                                    <input type="number" min={0} value={l.duration}
                                      onChange={(e) => updateLesson(ci, li, "duration", Number(e.target.value))}
                                      className="w-16 text-xs bg-gray-800 border border-gray-700 text-gray-300 rounded-lg px-2 py-1.5 focus:outline-none text-center"
                                      placeholder="মিনিট" />
                                    <label className="flex items-center gap-1 cursor-pointer flex-shrink-0">
                                      <input type="checkbox" checked={l.is_free}
                                        onChange={(e) => updateLesson(ci, li, "is_free", e.target.checked)}
                                        className="rounded border-gray-600 bg-gray-800 text-rose-500 focus:ring-0" />
                                      <span className="text-xs text-gray-500">ফ্রি</span>
                                    </label>
                                    <button onClick={() => deleteLesson(ci, li)}
                                      className="p-1 rounded text-gray-600 hover:text-red-400 transition-colors flex-shrink-0">
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ))}
                                <div className="px-4 py-2">
                                  <button onClick={() => addLesson(ci)}
                                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-rose-400 transition-colors">
                                    <Plus className="w-3.5 h-3.5" /> পাঠ যোগ করুন
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                        <button onClick={addChapter}
                          className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-gray-700 rounded-2xl text-sm text-gray-500 hover:text-rose-400 hover:border-rose-500/50 transition-colors">
                          <Plus className="w-4 h-4" /> নতুন অধ্যায় যোগ করুন
                        </button>
                      </>
                    )}
                  </div>
                )}

                {/* Pricing */}
                {activeTab === "pricing" && (
                  <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5 space-y-5">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelCls}>মূল মূল্য (৳)</label>
                        <input type="number" min={0} className={inputCls} value={form.price}
                          onChange={(e) => setF("price", Number(e.target.value))} placeholder="0" />
                        <p className="text-xs text-gray-600 mt-1">০ হলে ফ্রি কোর্স</p>
                      </div>
                      <div>
                        <label className={labelCls}>ডিসকাউন্ট মূল্য (৳)</label>
                        <input type="number" min={0} className={inputCls} value={form.discount_price}
                          onChange={(e) => setF("discount_price", Number(e.target.value))} placeholder="0" />
                        {form.discount_price > 0 && form.price > 0 && (
                          <p className="text-xs text-green-400 mt-1">
                            {Math.round(((form.price - form.discount_price) / form.price) * 100)}% ছাড়
                          </p>
                        )}
                      </div>
                    </div>
                    {form.discount_price > form.price && (
                      <div className="flex items-center gap-2 text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        ডিসকাউন্ট মূল্য মূল মূল্যের চেয়ে বেশি হতে পারে না।
                      </div>
                    )}
                    <div className="p-4 bg-gray-800/40 rounded-xl">
                      <p className="text-sm font-medium text-white mb-2">মূল্য প্রিভিউ</p>
                      <div className="flex items-center gap-3">
                        {form.price === 0 ? (
                          <span className="text-2xl font-bold text-green-400">ফ্রি</span>
                        ) : form.discount_price > 0 ? (
                          <>
                            <span className="text-2xl font-bold text-white">৳{form.discount_price.toLocaleString()}</span>
                            <span className="text-gray-500 line-through text-lg">৳{form.price.toLocaleString()}</span>
                          </>
                        ) : (
                          <span className="text-2xl font-bold text-white">৳{form.price.toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-800/40 rounded-xl">
                      <div>
                        <p className="text-sm text-white">সার্টিফিকেট সক্রিয়</p>
                        <p className="text-xs text-gray-500">কোর্স সম্পন্নে সার্টিফিকেট দেওয়া হবে</p>
                      </div>
                      <button type="button" onClick={() => setF("certificate_enabled", !form.certificate_enabled)}
                        className={`relative w-11 h-6 rounded-full transition-colors ${form.certificate_enabled ? "bg-rose-500" : "bg-gray-700"}`}>
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.certificate_enabled ? "translate-x-6" : "translate-x-1"}`} />
                      </button>
                    </div>
                  </div>
                )}

                {/* SEO */}
                {activeTab === "seo" && (
                  <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5 space-y-4">
                    <div>
                      <label className={labelCls}>URL Slug</label>
                      <input className={`${inputCls} font-mono text-xs`} value={form.slug}
                        onChange={(e) => setF("slug", e.target.value)} placeholder="course-url-slug" />
                    </div>
                  </div>
                )}
              </div>

              {/* Right Sidebar */}
              <div className="space-y-4">
                {/* Status & Visibility */}
                <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5 space-y-3">
                  <h3 className="text-sm font-semibold text-white">প্রকাশনা</h3>
                  <select className={inputCls} value={form.status}
                    onChange={(e) => setF("status", e.target.value as CourseForm["status"])}>
                    <option value="draft">ড্রাফট</option>
                    <option value="pending">রিভিউর জন্য পাঠান</option>
                    <option value="published">প্রকাশিত</option>
                  </select>
                  <div className="flex items-center justify-between p-3 bg-gray-800/40 rounded-xl">
                    <div>
                      <p className="text-sm text-white">Featured কোর্স</p>
                      <p className="text-xs text-gray-500">হোমপেজে হাইলাইট করুন</p>
                    </div>
                    <button type="button" onClick={() => setF("is_featured", !form.is_featured)}
                      className={`relative w-11 h-6 rounded-full transition-colors ${form.is_featured ? "bg-rose-500" : "bg-gray-700"}`}>
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_featured ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                  </div>
                </div>

                {/* Thumbnail */}
                <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5 space-y-3">
                  <h3 className="text-sm font-semibold text-white">থাম্বনেইল</h3>
                  {form.thumbnail_url ? (
                    <div className="relative">
                      <img src={form.thumbnail_url} alt="Thumbnail" className="w-full h-36 object-cover rounded-xl" />
                      <button onClick={() => setF("thumbnail_url", "")}
                        className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs hover:bg-red-400">✕</button>
                    </div>
                  ) : (
                    <div className="h-28 bg-gray-800 rounded-xl flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-gray-600" />
                    </div>
                  )}
                  <input className={inputCls} value={form.thumbnail_url}
                    onChange={(e) => setF("thumbnail_url", e.target.value)}
                    placeholder="ছবির URL" />
                </div>

                {/* Preview Video */}
                <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5 space-y-3">
                  <h3 className="text-sm font-semibold text-white">প্রিভিউ ভিডিও</h3>
                  <input className={inputCls} value={form.preview_video_url}
                    onChange={(e) => setF("preview_video_url", e.target.value)}
                    placeholder="YouTube বা Bunny.net URL" />
                </div>

                {/* Stats */}
                {!isNew && (
                  <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5">
                    <h3 className="text-sm font-semibold text-white mb-3">কারিকুলাম সারসংক্ষেপ</h3>
                    <div className="space-y-2">
                      {[
                        { label: "অধ্যায়", value: chapters.length, icon: BookOpen },
                        { label: "পাঠ", value: totalLessons, icon: Video },
                        { label: "মোট সময়", value: `${Math.round(totalDuration / 60)}h ${totalDuration % 60}m`, icon: Users },
                      ].map((s) => (
                        <div key={s.label} className="flex items-center justify-between">
                          <span className="text-xs text-gray-500 flex items-center gap-1.5"><s.icon className="w-3 h-3" />{s.label}</span>
                          <span className="text-sm font-medium text-white">{s.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
