import { useEffect, useState, useRef } from "react";
import { Link, useParams, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import StudentLayout from "@/layouts/StudentLayout";
import {
  ChevronLeft, ChevronRight, CheckCircle, Play, Lock,
  BookOpen, FileText, HelpCircle, Menu, X, Star,
  MessageSquare, Loader2, Volume2, Maximize2, RotateCcw,
  Award, AlignLeft, StickyNote
} from "lucide-react";

interface Lesson {
  id: string;
  title: string;
  lesson_type: "video" | "text" | "quiz";
  order_index: number;
  duration_seconds: number | null;
  is_free: boolean;
  completed: boolean;
  video_url: string | null;
  content: string | null;
}

interface Section {
  id: string;
  title: string;
  order_index: number;
  lessons: Lesson[];
}

interface ReviewData {
  rating: number;
  comment: string;
  submitted: boolean;
}

function VideoPlayer({ url }: { url: string }) {
  const getEmbedUrl = (rawUrl: string) => {
    // YouTube
    const ytMatch = rawUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0&autoplay=0`;
    // Vimeo
    const vimeoMatch = rawUrl.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}?dnt=1`;
    // Bunny.net / direct iframe
    if (rawUrl.includes("iframe.mediadelivery.net") || rawUrl.includes("bunny.net")) return rawUrl;
    return null;
  };

  const embedUrl = getEmbedUrl(url);

  if (embedUrl) {
    return (
      <div className="relative bg-black rounded-2xl overflow-hidden" style={{ aspectRatio: "16/9" }}>
        <iframe
          src={embedUrl}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      </div>
    );
  }

  // HTML5 video fallback
  return (
    <div className="relative bg-black rounded-2xl overflow-hidden" style={{ aspectRatio: "16/9" }}>
      <video controls className="absolute inset-0 w-full h-full" src={url}>
        আপনার ব্রাউজার ভিডিও সাপোর্ট করে না।
      </video>
    </div>
  );
}

export default function CourseLearning() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const [, setLocation] = useLocation();

  const [sections, setSections] = useState<Section[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [courseTitle, setCourseTitle] = useState("");
  const [courseId, setCourseId] = useState("");
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [marking, setMarking] = useState(false);
  const [activeTab, setActiveTab] = useState<"content" | "notes" | "discussion">("content");
  const [note, setNote] = useState("");
  const [notesSaved, setNotesSaved] = useState(false);

  // Review state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [review, setReview] = useState<ReviewData>({ rating: 0, comment: "", submitted: false });
  const [reviewLoading, setReviewLoading] = useState(false);
  const [existingReview, setExistingReview] = useState(false);

  // Course completion
  const [courseCompleted, setCourseCompleted] = useState(false);
  const [showCompletionBanner, setShowCompletionBanner] = useState(false);

  useEffect(() => {
    if (!id || !profile) return;
    loadCourse();
  }, [id, profile]);

  const loadCourse = async () => {
    if (!id || !profile) return;
    setLoading(true);

    const { data: course } = await supabase
      .from("courses")
      .select("id, title")
      .eq("id", id)
      .single();
    if (course) { setCourseTitle(course.title); setCourseId(course.id); }

    const { data: sectionData } = await supabase
      .from("sections")
      .select(`
        id, title, order_index,
        lessons(id, title, lesson_type, order_index, duration_seconds, is_free, video_url, content)
      `)
      .eq("course_id", id)
      .order("order_index");

    const { data: progress } = await supabase
      .from("lesson_progress")
      .select("lesson_id, completed")
      .eq("user_id", profile.user_id);

    const completedIds = new Set((progress || []).filter((p: any) => p.completed).map((p: any) => p.lesson_id));

    const { data: reviewData } = await supabase
      .from("course_reviews")
      .select("id")
      .eq("user_id", profile.user_id)
      .eq("course_id", id)
      .maybeSingle();
    if (reviewData) setExistingReview(true);

    if (sectionData) {
      const enriched = sectionData.map((s: any) => ({
        ...s,
        lessons: (s.lessons || [])
          .map((l: any) => ({ ...l, completed: completedIds.has(l.id) }))
          .sort((a: any, b: any) => a.order_index - b.order_index),
      })).sort((a: any, b: any) => a.order_index - b.order_index);
      setSections(enriched);

      // Find last incomplete or last accessed lesson
      const allLessons = enriched.flatMap((s: any) => s.lessons);
      const firstIncomplete = allLessons.find((l: any) => !l.completed);
      setCurrentLesson(firstIncomplete || allLessons[allLessons.length - 1] || allLessons[0]);

      // Check if course already completed
      const totalLessons = allLessons.length;
      const completedCount = allLessons.filter((l: any) => l.completed).length;
      if (totalLessons > 0 && completedCount === totalLessons) setCourseCompleted(true);
    }

    setLoading(false);
  };

  const allLessons = sections.flatMap((s) => s.lessons);
  const currentIdx = allLessons.findIndex((l) => l.id === currentLesson?.id);
  const prevLesson = currentIdx > 0 ? allLessons[currentIdx - 1] : null;
  const nextLesson = currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1] : null;
  const completedCount = allLessons.filter((l) => l.completed).length;
  const progressPercent = allLessons.length > 0 ? Math.round((completedCount / allLessons.length) * 100) : 0;

  const markComplete = async () => {
    if (!currentLesson || !profile || marking) return;
    setMarking(true);

    await supabase.from("lesson_progress").upsert({
      user_id: profile.user_id,
      lesson_id: currentLesson.id,
      completed: true,
      completed_at: new Date().toISOString(),
    }, { onConflict: "user_id,lesson_id" });

    const newCompletedCount = completedCount + 1;
    const newPercent = Math.round((newCompletedCount / allLessons.length) * 100);

    await supabase.from("enrollments").update({
      progress_percent: newPercent,
      last_accessed_at: new Date().toISOString(),
      ...(newPercent === 100 ? { completed_at: new Date().toISOString() } : {}),
    }).eq("user_id", profile.user_id).eq("course_id", id);

    setSections((prev) =>
      prev.map((s) => ({
        ...s,
        lessons: s.lessons.map((l) =>
          l.id === currentLesson.id ? { ...l, completed: true } : l
        ),
      }))
    );

    // Check if all done
    if (newCompletedCount === allLessons.length) {
      setCourseCompleted(true);
      setShowCompletionBanner(true);
      // Auto-generate certificate
      await supabase.from("certificates").upsert({
        user_id: profile.user_id,
        course_id: id,
        issued_at: new Date().toISOString(),
      }, { onConflict: "user_id,course_id" });
      if (!existingReview) setShowReviewModal(true);
    } else if (nextLesson) {
      setCurrentLesson(nextLesson);
    }

    setMarking(false);
  };

  const submitReview = async () => {
    if (!profile || review.rating === 0) return;
    setReviewLoading(true);
    await supabase.from("course_reviews").upsert({
      user_id: profile.user_id,
      course_id: id,
      rating: review.rating,
      comment: review.comment.trim(),
      is_approved: false,
    }, { onConflict: "user_id,course_id" });
    setReview((r) => ({ ...r, submitted: true }));
    setReviewLoading(false);
    setTimeout(() => setShowReviewModal(false), 2000);
  };

  const saveNote = () => {
    if (!note.trim()) return;
    localStorage.setItem(`note_${id}_${currentLesson?.id}`, note);
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 2000);
  };

  useEffect(() => {
    if (currentLesson) {
      const saved = localStorage.getItem(`note_${id}_${currentLesson.id}`);
      setNote(saved || "");
      setNotesSaved(false);
      setActiveTab("content");
    }
  }, [currentLesson?.id]);

  const formatDuration = (sec: number | null) => {
    if (!sec) return "";
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const typeIcon = (type: string) => {
    if (type === "video") return <Play className="w-3 h-3" />;
    if (type === "quiz") return <HelpCircle className="w-3 h-3" />;
    return <FileText className="w-3 h-3" />;
  };

  const selectLesson = (lesson: Lesson) => {
    setCurrentLesson(lesson);
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  if (loading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-500 text-sm">কোর্স লোড হচ্ছে...</p>
          </div>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      {/* Completion Banner */}
      {showCompletionBanner && (
        <div className="fixed top-16 left-0 right-0 z-40 flex justify-center px-4 animate-bounce-once">
          <div className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 max-w-md">
            <Award className="w-6 h-6 text-yellow-300" />
            <div className="flex-1">
              <p className="font-bold text-sm">কোর্স সম্পন্ন! 🎉</p>
              <p className="text-xs text-violet-200">আপনার সার্টিফিকেট তৈরি হয়েছে</p>
            </div>
            <button onClick={() => setShowCompletionBanner(false)} className="p-1 rounded-lg hover:bg-white/20"><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-6">
            {review.submitted ? (
              <div className="text-center py-4">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                <p className="text-white font-semibold">রিভিউ সম্পন্ন! ধন্যবাদ</p>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <div className="w-14 h-14 bg-yellow-500/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Star className="w-7 h-7 text-yellow-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white">কোর্সটি কেমন লাগলো?</h3>
                  <p className="text-gray-400 text-sm mt-1">আপনার মতামত অন্য শিক্ষার্থীদের সাহায্য করবে</p>
                </div>
                {/* Stars */}
                <div className="flex justify-center gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button key={s} onClick={() => setReview((r) => ({ ...r, rating: s }))}
                      className="p-1 transition-transform hover:scale-110">
                      <Star className={`w-8 h-8 ${s <= review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-600"} transition-colors`} />
                    </button>
                  ))}
                </div>
                <textarea
                  value={review.comment}
                  onChange={(e) => setReview((r) => ({ ...r, comment: e.target.value }))}
                  placeholder="আপনার অভিজ্ঞতা শেয়ার করুন... (ঐচ্ছিক)"
                  rows={3}
                  className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 resize-none mb-4"
                />
                <div className="flex gap-3">
                  <button onClick={() => setShowReviewModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 text-sm hover:text-white">পরে দেব</button>
                  <button onClick={submitReview} disabled={review.rating === 0 || reviewLoading}
                    className="flex-1 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium py-2.5 rounded-xl disabled:opacity-50">
                    {reviewLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />}
                    রিভিউ দিন
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="flex h-full overflow-hidden">
        {/* Curriculum Sidebar */}
        <div className={`${sidebarOpen ? "w-72 lg:w-80" : "w-0"} flex-shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col overflow-hidden transition-all duration-300`}>
          {/* Sidebar header */}
          <div className="px-4 py-3 border-b border-gray-800 flex-shrink-0">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 mb-0.5">কোর্স কারিকুলাম</p>
                <p className="text-sm font-semibold text-white line-clamp-2">{courseTitle}</p>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 flex-shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* Progress */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-500">
                <span>{completedCount}/{allLessons.length} লেসন</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
          </div>

          {/* Lessons list */}
          <div className="flex-1 overflow-y-auto py-1">
            {sections.map((section, si) => (
              <div key={section.id}>
                <div className="px-4 py-2.5 mt-1">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    {si + 1}. {section.title}
                  </p>
                </div>
                {section.lessons.map((lesson, li) => (
                  <button key={lesson.id} onClick={() => selectLesson(lesson)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      currentLesson?.id === lesson.id
                        ? "bg-violet-600/20 border-r-2 border-violet-500"
                        : "hover:bg-gray-800/60"
                    }`}>
                    <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs border ${
                      lesson.completed
                        ? "bg-green-500 border-green-500 text-white"
                        : currentLesson?.id === lesson.id
                        ? "bg-violet-600 border-violet-600 text-white"
                        : "border-gray-700 text-gray-500 bg-gray-800"
                    }`}>
                      {lesson.completed ? <CheckCircle className="w-3.5 h-3.5" /> : typeIcon(lesson.lesson_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs leading-tight truncate ${
                        lesson.completed ? "text-gray-500" : currentLesson?.id === lesson.id ? "text-white font-medium" : "text-gray-400"
                      }`}>
                        {lesson.title}
                      </p>
                      {lesson.duration_seconds && (
                        <p className="text-xs text-gray-600">{formatDuration(lesson.duration_seconds)}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Topbar */}
          <div className="flex-shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-gray-800 bg-gray-900/50">
            <div className="flex items-center gap-2">
              {!sidebarOpen && (
                <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800">
                  <Menu className="w-4 h-4" />
                </button>
              )}
              <Link href="/dashboard/courses" className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors">
                <ChevronLeft className="w-3.5 h-3.5" /> কোর্সে ফিরুন
              </Link>
            </div>
            <div className="flex items-center gap-2">
              {courseCompleted && (
                <Link href="/dashboard/certificates">
                  <button className="flex items-center gap-1.5 text-xs bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 px-3 py-1.5 rounded-lg hover:bg-yellow-500/20">
                    <Award className="w-3.5 h-3.5" /> সার্টিফিকেট
                  </button>
                </Link>
              )}
              {!existingReview && courseCompleted && !showReviewModal && (
                <button onClick={() => setShowReviewModal(true)} className="flex items-center gap-1.5 text-xs bg-gray-800 border border-gray-700 text-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-700">
                  <Star className="w-3.5 h-3.5" /> রিভিউ দিন
                </button>
              )}
              <span className="text-xs text-gray-500">{completedCount}/{allLessons.length} সম্পন্ন</span>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto">
            {currentLesson ? (
              <div className="max-w-4xl mx-auto p-4 lg:p-6">
                {/* Video Player */}
                {currentLesson.lesson_type === "video" && (
                  <div className="mb-6">
                    {currentLesson.video_url ? (
                      <VideoPlayer url={currentLesson.video_url} />
                    ) : (
                      <div className="bg-gray-900 rounded-2xl flex items-center justify-center border border-gray-800" style={{ aspectRatio: "16/9" }}>
                        <div className="text-center p-8">
                          <div className="w-16 h-16 bg-violet-600/20 border border-violet-500/30 rounded-2xl flex items-center justify-center mx-auto mb-3">
                            <Play className="w-8 h-8 text-violet-400" />
                          </div>
                          <p className="text-gray-400 text-sm">ভিডিও শীঘ্রই আসছে</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Quiz CTA */}
                {currentLesson.lesson_type === "quiz" && (
                  <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-2xl p-6 mb-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center">
                        <HelpCircle className="w-5 h-5 text-indigo-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-white text-sm">কুইজ</p>
                        <p className="text-xs text-gray-400">এই লেসনে একটি কুইজ আছে</p>
                      </div>
                    </div>
                    <Link href={`/dashboard/courses/${id}/quiz?lesson=${currentLesson.id}`}
                      className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium py-2.5 px-5 rounded-xl transition-colors">
                      <HelpCircle className="w-4 h-4" /> কুইজ শুরু করুন
                    </Link>
                  </div>
                )}

                {/* Title */}
                <h1 className="text-xl font-bold text-white mb-1">{currentLesson.title}</h1>
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-xs text-gray-500 capitalize">
                    {currentLesson.lesson_type === "video" ? "ভিডিও লেসন" : currentLesson.lesson_type === "quiz" ? "কুইজ" : "পড়ার উপকরণ"}
                  </span>
                  {currentLesson.duration_seconds && (
                    <span className="text-xs text-gray-500">· {formatDuration(currentLesson.duration_seconds)}</span>
                  )}
                  {currentLesson.completed && (
                    <span className="flex items-center gap-1 text-xs text-green-400">
                      <CheckCircle className="w-3.5 h-3.5" /> সম্পন্ন
                    </span>
                  )}
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mb-5 border-b border-gray-800">
                  {([
                    { id: "content", label: "বিষয়বস্তু", icon: AlignLeft },
                    { id: "notes", label: "নোট", icon: StickyNote },
                    { id: "discussion", label: "আলোচনা", icon: MessageSquare },
                  ] as const).map((tab) => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-all -mb-px ${
                        activeTab === tab.id ? "border-violet-500 text-violet-400" : "border-transparent text-gray-500 hover:text-gray-300"
                      }`}>
                      <tab.icon className="w-3.5 h-3.5" /> {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                {activeTab === "content" && (
                  <div className="prose-render text-gray-300 text-sm leading-relaxed">
                    {currentLesson.content ? (
                      <div dangerouslySetInnerHTML={{ __html: currentLesson.content }} />
                    ) : (
                      <div className="text-center py-8 text-gray-600">
                        <FileText className="w-10 h-10 mx-auto mb-2" />
                        <p>এই লেসনের কোনো টেক্সট বিষয়বস্তু নেই।</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "notes" && (
                  <div>
                    <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={8}
                      placeholder="এই লেসনের জন্য নোট লিখুন... (শুধু আপনি দেখতে পাবেন)"
                      className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500 resize-none mb-3" />
                    <button onClick={saveNote}
                      className={`flex items-center gap-2 text-sm font-medium py-2 px-4 rounded-xl transition-all ${notesSaved ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700"}`}>
                      {notesSaved ? <><CheckCircle className="w-4 h-4" /> সংরক্ষিত</> : "নোট সংরক্ষণ করুন"}
                    </button>
                  </div>
                )}

                {activeTab === "discussion" && (
                  <div className="text-center py-8">
                    <MessageSquare className="w-10 h-10 text-gray-700 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm mb-3">কমিউনিটিতে প্রশ্ন করুন</p>
                    <Link href="/dashboard/community">
                      <button className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium py-2 px-5 rounded-xl transition-colors mx-auto">
                        <MessageSquare className="w-4 h-4" /> কমিউনিটিতে যান
                      </button>
                    </Link>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between pt-6 mt-6 border-t border-gray-800">
                  <button disabled={!prevLesson} onClick={() => prevLesson && setCurrentLesson(prevLesson)}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                    <ChevronLeft className="w-4 h-4" /> আগের লেসন
                  </button>

                  <button onClick={markComplete} disabled={currentLesson.completed || marking}
                    className={`flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-xl transition-all ${
                      currentLesson.completed
                        ? "bg-green-500/20 border border-green-500/30 text-green-400 cursor-default"
                        : "bg-violet-600 hover:bg-violet-500 text-white"
                    }`}>
                    {marking ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    {currentLesson.completed ? "সম্পন্ন হয়েছে" : "সম্পন্ন করুন"}
                  </button>

                  <button disabled={!nextLesson} onClick={() => nextLesson && setCurrentLesson(nextLesson)}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                    পরের লেসন <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <BookOpen className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                  <p className="text-gray-400">কোনো লেসন পাওয়া যায়নি</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .prose-render h1 { font-size: 1.25rem; font-weight: 700; color: #f9fafb; margin-bottom: 0.75rem; }
        .prose-render h2 { font-size: 1.1rem; font-weight: 700; color: #f3f4f6; margin-bottom: 0.5rem; }
        .prose-render h3 { font-size: 1rem; font-weight: 600; color: #e5e7eb; margin-bottom: 0.5rem; }
        .prose-render p { margin-bottom: 0.75rem; }
        .prose-render strong { font-weight: 700; color: #e5e7eb; }
        .prose-render em { font-style: italic; }
        .prose-render ul { list-style: disc; padding-left: 1.25rem; margin-bottom: 0.75rem; }
        .prose-render ol { list-style: decimal; padding-left: 1.25rem; margin-bottom: 0.75rem; }
        .prose-render li { margin-bottom: 0.25rem; }
        .prose-render code { background: rgba(139,92,246,0.15); color: #a78bfa; padding: 1px 6px; border-radius: 4px; font-size: 0.85em; }
        .prose-render pre { background: #111827; border: 1px solid #374151; border-radius: 0.75rem; padding: 1rem; margin-bottom: 0.75rem; overflow-x: auto; }
        .prose-render blockquote { border-left: 3px solid #7c3aed; padding-left: 0.75rem; color: #9ca3af; font-style: italic; margin-bottom: 0.75rem; }
        .prose-render a { color: #a78bfa; text-decoration: underline; }
        .prose-render img { max-width: 100%; border-radius: 0.75rem; }
        @keyframes bounce-once { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        .animate-bounce-once { animation: bounce-once 0.6s ease; }
      `}</style>
    </StudentLayout>
  );
}
