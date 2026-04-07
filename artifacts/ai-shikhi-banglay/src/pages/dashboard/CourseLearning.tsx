import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import StudentLayout from "@/layouts/StudentLayout";
import {
  ChevronLeft, ChevronRight, CheckCircle, Play, Lock,
  BookOpen, FileText, HelpCircle, Menu, X
} from "lucide-react";

interface Lesson {
  id: string;
  title: string;
  lesson_type: "video" | "text" | "quiz";
  order_index: number;
  duration_seconds: number | null;
  is_free: boolean;
  completed: boolean;
}

interface Section {
  id: string;
  title: string;
  order_index: number;
  lessons: Lesson[];
}

export default function CourseLearning() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const [sections, setSections] = useState<Section[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [courseTitle, setCourseTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      if (!id || !profile) return;
      const { data: course } = await supabase
        .from("courses")
        .select("title")
        .eq("id", id)
        .single();
      if (course) setCourseTitle(course.title);

      const { data: sectionData } = await supabase
        .from("sections")
        .select(`
          id, title, order_index,
          lessons(id, title, lesson_type, order_index, duration_seconds, is_free)
        `)
        .eq("course_id", id)
        .order("order_index");

      const { data: progress } = await supabase
        .from("lesson_progress")
        .select("lesson_id, completed")
        .eq("user_id", profile.user_id);

      const completedIds = new Set((progress || []).filter((p: any) => p.completed).map((p: any) => p.lesson_id));

      if (sectionData) {
        const enriched = sectionData.map((s: any) => ({
          ...s,
          lessons: (s.lessons || [])
            .map((l: any) => ({ ...l, completed: completedIds.has(l.id) }))
            .sort((a: any, b: any) => a.order_index - b.order_index),
        })).sort((a: any, b: any) => a.order_index - b.order_index);
        setSections(enriched);
        if (enriched[0]?.lessons?.[0]) {
          setCurrentLesson(enriched[0].lessons[0]);
        }
      }
      setLoading(false);
    };
    fetch();
  }, [id, profile]);

  const allLessons = sections.flatMap((s) => s.lessons);
  const currentIdx = allLessons.findIndex((l) => l.id === currentLesson?.id);
  const prevLesson = currentIdx > 0 ? allLessons[currentIdx - 1] : null;
  const nextLesson = currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1] : null;

  const markComplete = async () => {
    if (!currentLesson || !profile) return;
    await supabase.from("lesson_progress").upsert({
      user_id: profile.user_id,
      lesson_id: currentLesson.id,
      completed: true,
      completed_at: new Date().toISOString(),
    }, { onConflict: "user_id,lesson_id" });
    setSections((prev) =>
      prev.map((s) => ({
        ...s,
        lessons: s.lessons.map((l) =>
          l.id === currentLesson.id ? { ...l, completed: true } : l
        ),
      }))
    );
    if (nextLesson) setCurrentLesson(nextLesson);
  };

  const formatDuration = (sec: number | null) => {
    if (!sec) return "";
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const typeIcon = (type: string) => {
    if (type === "video") return <Play className="w-3.5 h-3.5" />;
    if (type === "quiz") return <HelpCircle className="w-3.5 h-3.5" />;
    return <FileText className="w-3.5 h-3.5" />;
  };

  if (loading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center h-full">
          <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="flex h-full overflow-hidden">
        {/* Curriculum Sidebar */}
        {sidebarOpen && (
          <div className="w-72 lg:w-80 flex-shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">কোর্স কারিকুলাম</p>
                <p className="text-sm font-semibold text-white line-clamp-1">{courseTitle}</p>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-2">
              {sections.map((section) => (
                <div key={section.id}>
                  <div className="px-4 py-2.5">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{section.title}</p>
                  </div>
                  {section.lessons.map((lesson) => (
                    <button
                      key={lesson.id}
                      onClick={() => setCurrentLesson(lesson)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                        currentLesson?.id === lesson.id
                          ? "bg-violet-600/20 border-r-2 border-violet-500"
                          : "hover:bg-gray-800/60"
                      }`}
                    >
                      <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                        lesson.completed ? "bg-green-500" : currentLesson?.id === lesson.id ? "bg-violet-500" : "bg-gray-700"
                      }`}>
                        {lesson.completed ? (
                          <CheckCircle className="w-3.5 h-3.5 text-white" />
                        ) : (
                          <span className={`text-xs ${currentLesson?.id === lesson.id ? "text-white" : "text-gray-500"}`}>
                            {typeIcon(lesson.lesson_type)}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs truncate ${lesson.completed ? "text-gray-400 line-through" : currentLesson?.id === lesson.id ? "text-white font-medium" : "text-gray-400"}`}>
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
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top bar */}
          <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-b border-gray-800 bg-gray-900/50">
            <div className="flex items-center gap-3">
              {!sidebarOpen && (
                <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800">
                  <Menu className="w-4 h-4" />
                </button>
              )}
              <Link href="/dashboard/courses" className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors">
                <ChevronLeft className="w-4 h-4" /> কোর্সে ফিরুন
              </Link>
            </div>
            <div className="text-xs text-gray-500">
              {allLessons.filter((l) => l.completed).length}/{allLessons.length} লেসন সম্পন্ন
            </div>
          </div>

          {/* Video/Content Area */}
          <div className="flex-1 overflow-y-auto">
            {currentLesson ? (
              <div className="max-w-4xl mx-auto p-6">
                {currentLesson.lesson_type === "video" && (
                  <div className="bg-gray-900 rounded-2xl aspect-video flex items-center justify-center mb-6 border border-gray-800">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-violet-600/20 border border-violet-500/30 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <Play className="w-8 h-8 text-violet-400" />
                      </div>
                      <p className="text-gray-400 text-sm">ভিডিও লোড হচ্ছে...</p>
                    </div>
                  </div>
                )}
                <h1 className="text-xl font-bold text-white mb-2">{currentLesson.title}</h1>
                <p className="text-gray-500 text-sm mb-6 capitalize">
                  {currentLesson.lesson_type === "video" ? "ভিডিও লেসন" : currentLesson.lesson_type === "quiz" ? "কুইজ" : "পড়ার উপকরণ"}
                  {currentLesson.duration_seconds && ` · ${formatDuration(currentLesson.duration_seconds)}`}
                </p>
                {currentLesson.lesson_type === "quiz" && (
                  <div className="bg-indigo-900/30 border border-indigo-500/30 rounded-2xl p-5 mb-6">
                    <div className="flex items-center gap-3 mb-3">
                      <HelpCircle className="w-5 h-5 text-indigo-400" />
                      <p className="font-medium text-white">কুইজ</p>
                    </div>
                    <p className="text-gray-400 text-sm mb-4">এই লেসনে একটি কুইজ আছে।</p>
                    <Link href={`/dashboard/courses/${id}/quiz?lesson=${currentLesson.id}`}
                      className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium py-2.5 px-5 rounded-xl transition-colors">
                      কুইজ শুরু করুন
                    </Link>
                  </div>
                )}
                {/* Navigation */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                  <button
                    disabled={!prevLesson}
                    onClick={() => prevLesson && setCurrentLesson(prevLesson)}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" /> আগের লেসন
                  </button>
                  <button
                    onClick={markComplete}
                    disabled={currentLesson.completed}
                    className={`flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-xl transition-colors ${
                      currentLesson.completed
                        ? "bg-green-500/20 border border-green-500/30 text-green-400 cursor-default"
                        : "bg-violet-600 hover:bg-violet-500 text-white"
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    {currentLesson.completed ? "সম্পন্ন হয়েছে" : "সম্পন্ন করুন"}
                  </button>
                  <button
                    disabled={!nextLesson}
                    onClick={() => nextLesson && setCurrentLesson(nextLesson)}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
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
    </StudentLayout>
  );
}
