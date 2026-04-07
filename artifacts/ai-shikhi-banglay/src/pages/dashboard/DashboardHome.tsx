import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import StudentLayout from "@/layouts/StudentLayout";
import {
  BookOpen, Award, Clock, TrendingUp, Play,
  ArrowRight, CheckCircle, Star, Users, Flame,
  Target, Calendar, ChevronRight
} from "lucide-react";

interface Stats {
  enrolled: number;
  completed: number;
  certificates: number;
  hoursLearned: number;
  streak: number;
  completedToday: number;
}

interface EnrolledCourse {
  id: string;
  title: string;
  thumbnail_url: string | null;
  progress: number;
  last_accessed: string | null;
  instructor_name: string;
  completed: boolean;
}

const DAILY_GOAL_LESSONS = 1;

export default function DashboardHome() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<Stats>({ enrolled: 0, completed: 0, certificates: 0, hoursLearned: 0, streak: 0, completedToday: 0 });
  const [recentCourses, setRecentCourses] = useState<EnrolledCourse[]>([]);
  const [completedCourses, setCompletedCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    fetchData();
  }, [profile]);

  const fetchData = async () => {
    if (!profile) return;
    try {
      const { data: enrollments } = await supabase
        .from("enrollments")
        .select(`
          id, progress_percent, completed_at, enrolled_at, last_accessed_at,
          courses(id, title, thumbnail_url,
            profiles!courses_instructor_id_fkey(name)
          )
        `)
        .eq("user_id", profile.user_id)
        .order("last_accessed_at", { ascending: false });

      const { data: certs } = await supabase
        .from("certificates")
        .select("id")
        .eq("user_id", profile.user_id);

      // Lessons completed today
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { data: todayProgress } = await supabase
        .from("lesson_progress")
        .select("id")
        .eq("user_id", profile.user_id)
        .eq("completed", true)
        .gte("completed_at", todayStart.toISOString());

      // Streak: count consecutive days with at least one lesson completed
      const { data: allProgress } = await supabase
        .from("lesson_progress")
        .select("completed_at")
        .eq("user_id", profile.user_id)
        .eq("completed", true)
        .order("completed_at", { ascending: false });

      let streak = 0;
      if (allProgress && allProgress.length > 0) {
        const uniqueDays = [...new Set((allProgress || []).map((p: any) => new Date(p.completed_at).toDateString()))];
        let day = new Date();
        for (const d of uniqueDays) {
          if (d === day.toDateString()) { streak++; day.setDate(day.getDate() - 1); }
          else break;
        }
      }

      if (enrollments) {
        const completed = enrollments.filter((e: any) => !!e.completed_at);
        const inProgress = enrollments.filter((e: any) => !e.completed_at);
        const totalHours = Math.round(enrollments.reduce((s: number, e: any) => s + (e.progress_percent || 0) * 0.05, 0));

        setStats({
          enrolled: enrollments.length,
          completed: completed.length,
          certificates: certs?.length || 0,
          hoursLearned: totalHours,
          streak,
          completedToday: todayProgress?.length || 0,
        });

        const mapCourse = (e: any): EnrolledCourse => ({
          id: e.courses?.id,
          title: e.courses?.title || "কোর্স",
          thumbnail_url: e.courses?.thumbnail_url,
          progress: e.progress_percent || 0,
          last_accessed: e.last_accessed_at,
          instructor_name: e.courses?.profiles?.name || "ইন্সট্রাক্টর",
          completed: !!e.completed_at,
        });

        setRecentCourses(inProgress.slice(0, 3).map(mapCourse));
        setCompletedCourses(completed.slice(0, 3).map(mapCourse));
      }
    } catch (_) {}
    setLoading(false);
  };

  const statCards = [
    { icon: BookOpen, label: "ভর্তি কোর্স", value: stats.enrolled, bg: "bg-violet-500/10", iconColor: "text-violet-400", border: "border-violet-500/20" },
    { icon: CheckCircle, label: "সম্পন্ন", value: stats.completed, bg: "bg-green-500/10", iconColor: "text-green-400", border: "border-green-500/20" },
    { icon: Award, label: "সার্টিফিকেট", value: stats.certificates, bg: "bg-yellow-500/10", iconColor: "text-yellow-400", border: "border-yellow-500/20" },
    { icon: Clock, label: "শেখার সময়", value: `${stats.hoursLearned}h`, bg: "bg-blue-500/10", iconColor: "text-blue-400", border: "border-blue-500/20" },
  ];

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "শুভ সকাল";
    if (h < 17) return "শুভ দুপুর";
    return "শুভ সন্ধ্যা";
  };

  const dailyGoalPercent = Math.min(100, Math.round((stats.completedToday / DAILY_GOAL_LESSONS) * 100));

  return (
    <StudentLayout>
      <div className="p-5 lg:p-7 max-w-6xl mx-auto">
        {/* Welcome */}
        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1">
            {getGreeting()}, {profile?.name?.split(" ")[0] || "শিক্ষার্থী"}! 👋
          </h1>
          <p className="text-gray-400 text-sm">আপনার লার্নিং জার্নি চালিয়ে যান</p>
        </div>

        {/* Streak + Daily Goal banner */}
        {!loading && (
          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            {/* Streak */}
            <div className="bg-gradient-to-br from-orange-900/30 to-red-900/20 border border-orange-500/20 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-500/20 border border-orange-500/30 rounded-xl flex items-center justify-center flex-shrink-0">
                <Flame className="w-6 h-6 text-orange-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-white">{stats.streak}</span>
                  <span className="text-sm text-orange-300">দিনের ধারা</span>
                </div>
                <p className="text-xs text-gray-500">
                  {stats.streak === 0 ? "আজই শুরু করুন!" : stats.streak >= 7 ? "অসাধারণ! চালিয়ে যান 🔥" : "ভালো করছেন!"}
                </p>
              </div>
            </div>

            {/* Daily Goal */}
            <div className="bg-gradient-to-br from-violet-900/30 to-indigo-900/20 border border-violet-500/20 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-violet-400" />
                  <span className="text-sm font-medium text-violet-300">দৈনিক লক্ষ্য</span>
                </div>
                <span className="text-xs text-gray-500">{stats.completedToday}/{DAILY_GOAL_LESSONS} লেসন</span>
              </div>
              <div className="h-2.5 bg-gray-800 rounded-full overflow-hidden mb-1">
                <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-400 rounded-full transition-all duration-700"
                  style={{ width: `${dailyGoalPercent}%` }} />
              </div>
              <p className="text-xs text-gray-600">
                {dailyGoalPercent >= 100 ? "✅ আজকের লক্ষ্য সম্পন্ন!" : `প্রতিদিন ${DAILY_GOAL_LESSONS}টি লেসন সম্পন্ন করুন`}
              </p>
            </div>
          </div>
        )}

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {statCards.map((stat) => (
            <div key={stat.label} className={`${stat.bg} border ${stat.border} rounded-2xl p-4`}>
              <div className={`w-9 h-9 ${stat.bg} rounded-xl flex items-center justify-center mb-3`}>
                <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
              </div>
              <div className="text-2xl font-bold text-white mb-0.5">{loading ? "—" : stat.value}</div>
              <div className="text-xs text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-5">
          {/* Continue Learning */}
          <div className="lg:col-span-2 space-y-5">
            {/* In Progress */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-white">চলমান কোর্স</h2>
                <Link href="/dashboard/courses" className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1">
                  সব দেখুন <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              {loading ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => <div key={i} className="bg-gray-800/40 rounded-2xl h-20 animate-pulse" />)}
                </div>
              ) : recentCourses.length === 0 ? (
                <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 text-center">
                  <BookOpen className="w-10 h-10 text-gray-700 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm mb-1">এখনো কোনো কোর্সে ভর্তি হননি</p>
                  <Link href="/courses" className="inline-flex items-center gap-1.5 text-violet-400 text-xs hover:text-violet-300">
                    কোর্স দেখুন <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentCourses.map((course) => (
                    <Link key={course.id} href={`/dashboard/courses/${course.id}/learn`}>
                      <div className="flex items-center gap-3 bg-gray-900/60 border border-gray-800 hover:border-violet-500/40 rounded-2xl p-3.5 transition-all group cursor-pointer">
                        <div className="w-12 h-12 rounded-xl bg-gray-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {course.thumbnail_url ? (
                            <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                          ) : <BookOpen className="w-5 h-5 text-gray-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-white text-xs truncate mb-0.5">{course.title}</h3>
                          <p className="text-xs text-gray-600 mb-1.5">{course.instructor_name}</p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full" style={{ width: `${course.progress}%` }} />
                            </div>
                            <span className="text-xs text-gray-500">{course.progress}%</span>
                          </div>
                        </div>
                        <div className="w-8 h-8 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center flex-shrink-0 group-hover:bg-violet-600 transition-colors">
                          <Play className="w-3.5 h-3.5 text-violet-400 group-hover:text-white" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Completed Courses */}
            {completedCourses.length > 0 && !loading && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base font-semibold text-white">সম্পন্ন কোর্স</h2>
                  <Link href="/dashboard/courses" className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1">
                    সব দেখুন <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                <div className="space-y-2">
                  {completedCourses.map((course) => (
                    <div key={course.id} className="flex items-center gap-3 bg-green-500/5 border border-green-500/20 rounded-2xl p-3.5">
                      <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xs font-medium text-white truncate">{course.title}</h3>
                        <p className="text-xs text-green-400 mt-0.5">সম্পন্ন হয়েছে ✓</p>
                      </div>
                      <Link href="/dashboard/certificates">
                        <button className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-1 flex-shrink-0">
                          <Award className="w-3.5 h-3.5" /> সার্টিফিকেট
                        </button>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Weekly Activity */}
            <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-4 h-4 text-violet-400" />
                <span className="text-sm font-medium text-white">সাপ্তাহিক কার্যকলাপ</span>
              </div>
              <div className="flex gap-1 justify-between">
                {["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহ", "শুক্র", "শনি"].map((d, i) => {
                  const today = new Date().getDay();
                  const isPast = i <= today;
                  const isToday = i === today;
                  const hasActivity = isToday && stats.completedToday > 0;
                  return (
                    <div key={d} className="flex flex-col items-center gap-1.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs transition-all ${
                        hasActivity ? "bg-violet-600 text-white" :
                        isToday ? "bg-gray-800 border-2 border-violet-500/60 text-violet-400" :
                        isPast ? "bg-gray-800 text-gray-600" :
                        "bg-gray-800/40 text-gray-700"
                      }`}>
                        {hasActivity ? "✓" : isToday ? "●" : ""}
                      </div>
                      <span className={`text-xs ${isToday ? "text-violet-400 font-medium" : "text-gray-600"}`}>{d}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-4">
              <h3 className="text-sm font-semibold text-white mb-3">দ্রুত লিংক</h3>
              <div className="space-y-1">
                {[
                  { href: "/dashboard/certificates", icon: Award, label: "সার্টিফিকেট দেখুন", color: "text-yellow-400" },
                  { href: "/dashboard/community", icon: Users, label: "কমিউনিটিতে যোগ দিন", color: "text-blue-400" },
                  { href: "/courses", icon: BookOpen, label: "নতুন কোর্স খুঁজুন", color: "text-green-400" },
                  { href: "/dashboard/profile", icon: Star, label: "প্রোফাইল আপডেট করুন", color: "text-violet-400" },
                ].map((item) => (
                  <Link key={item.href} href={item.href}
                    className="flex items-center gap-2.5 py-2 px-2.5 rounded-xl hover:bg-gray-800/60 transition-colors group">
                    <item.icon className={`w-4 h-4 ${item.color} flex-shrink-0`} />
                    <span className="text-xs text-gray-400 group-hover:text-gray-200 flex-1 transition-colors">{item.label}</span>
                    <ChevronRight className="w-3 h-3 text-gray-700 group-hover:text-gray-400" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
