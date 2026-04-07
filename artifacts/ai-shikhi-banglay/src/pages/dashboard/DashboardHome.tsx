import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import StudentLayout from "@/layouts/StudentLayout";
import {
  BookOpen, Award, Clock, TrendingUp, Play,
  ArrowRight, CheckCircle, Star, Users
} from "lucide-react";

interface Stats {
  enrolled: number;
  completed: number;
  certificates: number;
  hoursLearned: number;
}

interface EnrolledCourse {
  id: string;
  title: string;
  thumbnail_url: string | null;
  progress_percent: number;
  last_accessed: string | null;
  instructor_name: string;
}

export default function DashboardHome() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<Stats>({ enrolled: 0, completed: 0, certificates: 0, hoursLearned: 0 });
  const [recentCourses, setRecentCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!profile) return;
      try {
        const { data: enrollments } = await supabase
          .from("enrollments")
          .select(`
            id, progress_percent, completed_at, last_accessed_at,
            courses(id, title, thumbnail_url, profiles!courses_instructor_id_fkey(name))
          `)
          .eq("user_id", profile.user_id)
          .order("last_accessed_at", { ascending: false });

        if (enrollments) {
          const completed = enrollments.filter((e: any) => e.completed_at).length;
          const certs = enrollments.filter((e: any) => e.completed_at).length;
          setStats({
            enrolled: enrollments.length,
            completed,
            certificates: certs,
            hoursLearned: Math.round(enrollments.length * 4.5),
          });
          setRecentCourses(
            enrollments.slice(0, 3).map((e: any) => ({
              id: e.courses?.id,
              title: e.courses?.title || "কোর্স",
              thumbnail_url: e.courses?.thumbnail_url,
              progress_percent: e.progress_percent || 0,
              last_accessed: e.last_accessed_at,
              instructor_name: e.courses?.profiles?.name || "ইন্সট্রাক্টর",
            }))
          );
        }
      } catch (_) {}
      setLoading(false);
    };
    fetchData();
  }, [profile]);

  const statCards = [
    { icon: BookOpen, label: "ভর্তি কোর্স", value: stats.enrolled, color: "violet", bg: "bg-violet-500/10", iconColor: "text-violet-400", border: "border-violet-500/20" },
    { icon: CheckCircle, label: "সম্পন্ন কোর্স", value: stats.completed, color: "green", bg: "bg-green-500/10", iconColor: "text-green-400", border: "border-green-500/20" },
    { icon: Award, label: "সার্টিফিকেট", value: stats.certificates, color: "yellow", bg: "bg-yellow-500/10", iconColor: "text-yellow-400", border: "border-yellow-500/20" },
    { icon: Clock, label: "শেখার সময়", value: `${stats.hoursLearned}h`, color: "blue", bg: "bg-blue-500/10", iconColor: "text-blue-400", border: "border-blue-500/20" },
  ];

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "শুভ সকাল";
    if (h < 17) return "শুভ দুপুর";
    return "শুভ সন্ধ্যা";
  };

  return (
    <StudentLayout>
      <div className="p-6 lg:p-8 max-w-6xl mx-auto">
        {/* Welcome Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl lg:text-3xl font-bold text-white">
              {getGreeting()}, {profile?.name?.split(" ")[0] || "শিক্ষার্থী"}! 👋
            </h1>
          </div>
          <p className="text-gray-400">আপনার লার্নিং জার্নি চালিয়ে যান</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat) => (
            <div key={stat.label} className={`${stat.bg} border ${stat.border} rounded-2xl p-5`}>
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
              </div>
              <div className="text-2xl font-bold text-white mb-0.5">{loading ? "—" : stat.value}</div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Continue Learning */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">চলমান কোর্স</h2>
              <Link href="/dashboard/courses" className="text-sm text-violet-400 hover:text-violet-300 flex items-center gap-1">
                সব দেখুন <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            {loading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="bg-gray-800/40 rounded-2xl h-24 animate-pulse" />
                ))}
              </div>
            ) : recentCourses.length === 0 ? (
              <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-8 text-center">
                <BookOpen className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-400 mb-1">এখনো কোনো কোর্সে ভর্তি হননি</p>
                <p className="text-gray-600 text-sm mb-4">আমাদের কোর্স দেখুন এবং শেখা শুরু করুন</p>
                <Link href="/courses" className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium py-2 px-5 rounded-xl transition-colors">
                  কোর্স ব্রাউজ করুন
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentCourses.map((course) => (
                  <Link key={course.id} href={`/dashboard/courses/${course.id}/learn`}>
                    <div className="flex items-center gap-4 bg-gray-900/60 border border-gray-800 hover:border-violet-500/40 rounded-2xl p-4 transition-all group cursor-pointer">
                      <div className="w-14 h-14 rounded-xl bg-gray-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {course.thumbnail_url ? (
                          <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                        ) : (
                          <BookOpen className="w-6 h-6 text-gray-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-white text-sm truncate mb-1">{course.title}</h3>
                        <p className="text-xs text-gray-500 mb-2">{course.instructor_name}</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all"
                              style={{ width: `${course.progress_percent}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 flex-shrink-0">{course.progress_percent}%</span>
                        </div>
                      </div>
                      <div className="w-9 h-9 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center flex-shrink-0 group-hover:bg-violet-600 transition-colors">
                        <Play className="w-4 h-4 text-violet-400 group-hover:text-white" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-5">
            {/* Daily Goal */}
            <div className="bg-gradient-to-br from-violet-900/40 to-indigo-900/30 border border-violet-500/20 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-violet-400" />
                <span className="text-sm font-medium text-violet-300">দৈনিক লক্ষ্য</span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">০ মিনিট</div>
              <p className="text-gray-400 text-xs mb-4">লক্ষ্য: প্রতিদিন ৩০ মিনিট</p>
              <div className="h-2 bg-gray-800 rounded-full">
                <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-400 rounded-full w-0" />
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white mb-3">দ্রুত লিংক</h3>
              <div className="space-y-2">
                {[
                  { href: "/dashboard/certificates", icon: Award, label: "সার্টিফিকেট দেখুন", color: "text-yellow-400" },
                  { href: "/dashboard/community", icon: Users, label: "কমিউনিটিতে যোগ দিন", color: "text-blue-400" },
                  { href: "/courses", icon: BookOpen, label: "নতুন কোর্স খুঁজুন", color: "text-green-400" },
                  { href: "/dashboard/profile", icon: Star, label: "প্রোফাইল আপডেট করুন", color: "text-violet-400" },
                ].map((item) => (
                  <Link key={item.href} href={item.href}
                    className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-gray-800/60 transition-colors group">
                    <item.icon className={`w-4 h-4 ${item.color} flex-shrink-0`} />
                    <span className="text-sm text-gray-400 group-hover:text-gray-200 transition-colors">{item.label}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-700 group-hover:text-gray-400 ml-auto" />
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
