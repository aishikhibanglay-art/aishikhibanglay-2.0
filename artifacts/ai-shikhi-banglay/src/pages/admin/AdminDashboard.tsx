import { useEffect, useState } from "react";
import { Link } from "wouter";
import { supabase } from "@/lib/supabase";
import AdminLayout from "@/layouts/AdminLayout";
import {
  Users, BookOpen, CreditCard, TrendingUp, ArrowUpRight,
  ArrowDownRight, Activity, Clock, CheckCircle, XCircle,
  AlertTriangle, Eye, Star
} from "lucide-react";

interface Stats {
  total_users: number;
  total_courses: number;
  total_revenue: number;
  pending_courses: number;
  new_users_today: number;
  active_enrollments: number;
  total_payments: number;
  failed_payments: number;
}

interface RecentUser {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

interface RecentPayment {
  id: string;
  amount: number;
  status: string;
  user_name: string;
  course_title: string;
  created_at: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    total_users: 0, total_courses: 0, total_revenue: 0,
    pending_courses: 0, new_users_today: 0, active_enrollments: 0,
    total_payments: 0, failed_payments: 0,
  });
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const today = new Date().toISOString().split("T")[0];
      const [usersRes, coursesRes, paymentsRes, enrollRes, pendingRes, todayUsersRes] = await Promise.all([
        supabase.from("profiles").select("id, name, email, role, created_at", { count: "exact" }).order("created_at", { ascending: false }).limit(5),
        supabase.from("courses").select("id", { count: "exact" }),
        supabase.from("payments").select("id, amount, status, created_at, profiles(name), courses(title)", { count: "exact" }).order("created_at", { ascending: false }).limit(5),
        supabase.from("enrollments").select("id", { count: "exact" }),
        supabase.from("courses").select("id", { count: "exact" }).eq("status", "pending"),
        supabase.from("profiles").select("id", { count: "exact" }).gte("created_at", today),
      ]);

      const completed = (paymentsRes.data || []).filter((p: any) => p.status === "completed");
      const totalRevenue = completed.reduce((s: number, p: any) => s + (p.amount || 0), 0);
      const failed = (paymentsRes.data || []).filter((p: any) => p.status === "failed").length;

      setStats({
        total_users: usersRes.count || 0,
        total_courses: coursesRes.count || 0,
        total_revenue: totalRevenue,
        pending_courses: pendingRes.count || 0,
        new_users_today: todayUsersRes.count || 0,
        active_enrollments: enrollRes.count || 0,
        total_payments: paymentsRes.count || 0,
        failed_payments: failed,
      });
      setRecentUsers((usersRes.data || []).map((u: any) => ({
        id: u.id, name: u.name, email: u.email, role: u.role, created_at: u.created_at,
      })));
      setRecentPayments((paymentsRes.data || []).map((p: any) => ({
        id: p.id, amount: p.amount, status: p.status,
        user_name: p.profiles?.name || "Unknown",
        course_title: p.courses?.title || "Course",
        created_at: p.created_at,
      })));
      setLoading(false);
    };
    fetch();
  }, []);

  const statCards = [
    {
      label: "মোট ব্যবহারকারী", value: stats.total_users, sub: `+${stats.new_users_today} আজকে`,
      icon: Users, color: "violet", trend: "up",
      bg: "from-violet-900/30 to-violet-950/30", border: "border-violet-500/20", iconBg: "bg-violet-500/20", iconColor: "text-violet-400",
      href: "/admin/users",
    },
    {
      label: "মোট কোর্স", value: stats.total_courses, sub: `${stats.pending_courses} অনুমোদন বাকি`,
      icon: BookOpen, color: "blue", trend: "up",
      bg: "from-blue-900/30 to-blue-950/30", border: "border-blue-500/20", iconBg: "bg-blue-500/20", iconColor: "text-blue-400",
      href: "/admin/courses",
    },
    {
      label: "মোট আয়", value: `৳${stats.total_revenue.toLocaleString()}`, sub: `${stats.total_payments} লেনদেন`,
      icon: CreditCard, color: "green", trend: "up",
      bg: "from-green-900/30 to-green-950/30", border: "border-green-500/20", iconBg: "bg-green-500/20", iconColor: "text-green-400",
      href: "/admin/payments",
    },
    {
      label: "সক্রিয় নথিভুক্তি", value: stats.active_enrollments, sub: "সকল কোর্সে",
      icon: Activity, color: "orange", trend: "up",
      bg: "from-orange-900/30 to-orange-950/30", border: "border-orange-500/20", iconBg: "bg-orange-500/20", iconColor: "text-orange-400",
      href: "/admin/courses",
    },
  ];

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const h = Math.floor(diff / 3600000);
    if (h < 1) return `${Math.floor(diff / 60000)} মি আগে`;
    if (h < 24) return `${h} ঘণ্টা আগে`;
    return `${Math.floor(h / 24)} দিন আগে`;
  };

  const roleColors: Record<string, string> = {
    super_admin: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    admin: "text-orange-400 bg-orange-500/10 border-orange-500/20",
    moderator: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    student: "text-gray-400 bg-gray-500/10 border-gray-500/20",
  };

  return (
    <AdminLayout>
      <div className="p-6 lg:p-7 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-7">
          <h1 className="text-2xl font-bold text-white mb-1">অ্যাডমিন ড্যাশবোর্ড</h1>
          <p className="text-gray-500 text-sm">প্ল্যাটফর্মের সার্বিক অবস্থা এক নজরে</p>
        </div>

        {/* Alert: Pending */}
        {stats.pending_courses > 0 && (
          <div className="flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-3 mb-6">
            <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
            <p className="text-yellow-300 text-sm flex-1">
              <strong>{stats.pending_courses}টি</strong> কোর্স অনুমোদনের অপেক্ষায় আছে।
            </p>
            <Link href="/admin/courses?filter=pending" className="text-xs text-yellow-400 hover:text-yellow-300 font-medium">
              দেখুন →
            </Link>
          </div>
        )}

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
          {statCards.map((card) => (
            <Link key={card.label} href={card.href}>
              <div className={`bg-gradient-to-br ${card.bg} border ${card.border} rounded-2xl p-5 hover:scale-[1.02] transition-all cursor-pointer group`}>
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-10 h-10 ${card.iconBg} rounded-xl flex items-center justify-center`}>
                    <card.icon className={`w-5 h-5 ${card.iconColor}`} />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-gray-700 group-hover:text-gray-400 transition-colors" />
                </div>
                <div className="text-2xl font-bold text-white mb-0.5">
                  {loading ? "—" : card.value}
                </div>
                <div className="text-xs text-gray-500">{card.label}</div>
                <div className="text-xs text-gray-600 mt-1">{card.sub}</div>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-7">
          {[
            { href: "/admin/courses/new", label: "নতুন কোর্স", icon: BookOpen, color: "bg-violet-600 hover:bg-violet-500" },
            { href: "/admin/users", label: "ব্যবহারকারী দেখুন", icon: Users, color: "bg-blue-600 hover:bg-blue-500" },
            { href: "/admin/blog/new", label: "ব্লগ পোস্ট", icon: Star, color: "bg-green-600 hover:bg-green-500" },
            { href: "/admin/settings", label: "সেটিংস", icon: Activity, color: "bg-gray-700 hover:bg-gray-600" },
          ].map((action) => (
            <Link key={action.href} href={action.href}>
              <button className={`w-full flex items-center gap-2 ${action.color} text-white text-sm font-medium py-2.5 px-4 rounded-xl transition-colors`}>
                <action.icon className="w-4 h-4" /> {action.label}
              </button>
            </Link>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Users */}
          <div className="bg-gray-900/60 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
              <h2 className="font-semibold text-white text-sm">সাম্প্রতিক ব্যবহারকারী</h2>
              <Link href="/admin/users" className="text-xs text-rose-400 hover:text-rose-300">সব দেখুন →</Link>
            </div>
            {loading ? (
              <div className="p-5 space-y-3">
                {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-gray-800/60 rounded-xl animate-pulse" />)}
              </div>
            ) : recentUsers.length === 0 ? (
              <div className="p-8 text-center text-gray-600 text-sm">কোনো ব্যবহারকারী নেই</div>
            ) : (
              <div className="divide-y divide-gray-800/60">
                {recentUsers.map((user) => (
                  <div key={user.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-800/30 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {user.name?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{user.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-lg border ${roleColors[user.role] || roleColors.student}`}>
                        {user.role}
                      </span>
                      <span className="text-xs text-gray-700">{timeAgo(user.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Payments */}
          <div className="bg-gray-900/60 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
              <h2 className="font-semibold text-white text-sm">সাম্প্রতিক পেমেন্ট</h2>
              <Link href="/admin/payments" className="text-xs text-rose-400 hover:text-rose-300">সব দেখুন →</Link>
            </div>
            {loading ? (
              <div className="p-5 space-y-3">
                {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-gray-800/60 rounded-xl animate-pulse" />)}
              </div>
            ) : recentPayments.length === 0 ? (
              <div className="p-8 text-center text-gray-600 text-sm">কোনো পেমেন্ট নেই</div>
            ) : (
              <div className="divide-y divide-gray-800/60">
                {recentPayments.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-800/30 transition-colors">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      p.status === "completed" ? "bg-green-500/20" : p.status === "failed" ? "bg-red-500/20" : "bg-yellow-500/20"
                    }`}>
                      {p.status === "completed" ? <CheckCircle className="w-4 h-4 text-green-400" /> :
                        p.status === "failed" ? <XCircle className="w-4 h-4 text-red-400" /> :
                        <Clock className="w-4 h-4 text-yellow-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{p.user_name}</p>
                      <p className="text-xs text-gray-500 truncate">{p.course_title}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-white">৳{p.amount?.toLocaleString()}</p>
                      <p className="text-xs text-gray-600">{timeAgo(p.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
