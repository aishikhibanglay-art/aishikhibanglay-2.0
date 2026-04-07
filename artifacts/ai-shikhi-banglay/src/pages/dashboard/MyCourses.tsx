import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import StudentLayout from "@/layouts/StudentLayout";
import { BookOpen, Play, CheckCircle, Clock, Search, Filter } from "lucide-react";

interface Course {
  id: string;
  title: string;
  thumbnail_url: string | null;
  progress_percent: number;
  completed_at: string | null;
  instructor_name: string;
  total_lessons: number;
  enrolled_at: string;
}

export default function MyCourses() {
  const { profile } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetch = async () => {
      if (!profile) return;
      const { data } = await supabase
        .from("enrollments")
        .select(`
          id, progress_percent, completed_at, enrolled_at,
          courses(id, title, thumbnail_url,
            profiles!courses_instructor_id_fkey(name),
            lessons(count)
          )
        `)
        .eq("user_id", profile.user_id)
        .order("enrolled_at", { ascending: false });

      if (data) {
        setCourses(data.map((e: any) => ({
          id: e.courses?.id,
          title: e.courses?.title || "কোর্স",
          thumbnail_url: e.courses?.thumbnail_url,
          progress_percent: e.progress_percent || 0,
          completed_at: e.completed_at,
          instructor_name: e.courses?.profiles?.name || "ইন্সট্রাক্টর",
          total_lessons: e.courses?.lessons?.[0]?.count || 0,
          enrolled_at: e.enrolled_at,
        })));
      }
      setLoading(false);
    };
    fetch();
  }, [profile]);

  const filtered = courses
    .filter((c) => filter === "all" || (filter === "completed" ? !!c.completed_at : !c.completed_at))
    .filter((c) => c.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <StudentLayout>
      <div className="p-6 lg:p-8 max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">আমার কোর্স</h1>
          <p className="text-gray-400">আপনার সব ভর্তি কোর্স এখানে আছে</p>
        </div>

        {/* Filter & Search */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="কোর্স খুঁজুন..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 text-white placeholder-gray-600 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 transition-all"
            />
          </div>
          <div className="flex rounded-xl border border-gray-800 overflow-hidden bg-gray-900">
            {(["all", "active", "completed"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                  filter === f ? "bg-violet-600 text-white" : "text-gray-400 hover:text-gray-200"
                }`}
              >
                {f === "all" ? "সব" : f === "active" ? "চলমান" : "সম্পন্ন"}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-900 rounded-2xl overflow-hidden animate-pulse">
                <div className="h-40 bg-gray-800" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-800 rounded w-3/4" />
                  <div className="h-3 bg-gray-800 rounded w-1/2" />
                  <div className="h-2 bg-gray-800 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="w-14 h-14 text-gray-700 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-400 mb-2">কোনো কোর্স পাওয়া যায়নি</h3>
            <p className="text-gray-600 mb-6 text-sm">
              {courses.length === 0 ? "আপনি এখনো কোনো কোর্সে ভর্তি হননি।" : "ফিল্টার পরিবর্তন করুন।"}
            </p>
            {courses.length === 0 && (
              <Link href="/courses" className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-medium py-2.5 px-6 rounded-xl transition-colors text-sm">
                <BookOpen className="w-4 h-4" /> কোর্স খুঁজুন
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((course) => (
              <div key={course.id} className="bg-gray-900/80 border border-gray-800 hover:border-violet-500/40 rounded-2xl overflow-hidden transition-all group">
                <div className="relative h-40 bg-gray-800 overflow-hidden">
                  {course.thumbnail_url ? (
                    <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-10 h-10 text-gray-700" />
                    </div>
                  )}
                  {course.completed_at && (
                    <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-lg flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> সম্পন্ন
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent" />
                  <Link href={`/dashboard/courses/${course.id}/learn`}>
                    <div className="absolute bottom-3 right-3 w-10 h-10 bg-violet-600 hover:bg-violet-500 rounded-full flex items-center justify-center cursor-pointer transition-colors shadow-lg">
                      <Play className="w-4 h-4 text-white ml-0.5" />
                    </div>
                  </Link>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-white text-sm mb-1 line-clamp-2">{course.title}</h3>
                  <p className="text-xs text-gray-500 mb-3">{course.instructor_name}</p>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full"
                        style={{ width: `${course.progress_percent}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">{course.progress_percent}%</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {course.total_lessons} লেসন</span>
                    <Link href={`/dashboard/courses/${course.id}/learn`} className="text-violet-400 hover:text-violet-300 font-medium">
                      {course.progress_percent > 0 ? "চালিয়ে যান →" : "শুরু করুন →"}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
