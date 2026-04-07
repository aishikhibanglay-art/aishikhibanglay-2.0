import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import AdminLayout from "@/layouts/AdminLayout";
import {
  TrendingUp, Users, BookOpen, CreditCard, Download,
  ArrowUpRight, ArrowDownRight, BarChart2, Activity
} from "lucide-react";

interface DailyData {
  date: string;
  users: number;
  payments: number;
  revenue: number;
  enrollments: number;
}

interface TopCourse {
  title: string;
  enrolled_count: number;
  revenue: number;
}

interface PaymentMethodStat {
  method: string;
  count: number;
  total: number;
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<7 | 30 | 90>(30);
  const [daily, setDaily] = useState<DailyData[]>([]);
  const [topCourses, setTopCourses] = useState<TopCourse[]>([]);
  const [methodStats, setMethodStats] = useState<PaymentMethodStat[]>([]);
  const [summary, setSummary] = useState({
    totalUsers: 0, newUsers: 0,
    totalRevenue: 0, prevRevenue: 0,
    totalEnrollments: 0, prevEnrollments: 0,
    totalPayments: 0, successRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, [period]);

  const fetchData = async () => {
    setLoading(true);
    const now = new Date();
    const from = new Date(now);
    from.setDate(from.getDate() - period);
    const prevFrom = new Date(from);
    prevFrom.setDate(prevFrom.getDate() - period);

    const fromStr = from.toISOString();
    const prevStr = prevFrom.toISOString();

    const [usersRes, paymentsRes, enrollRes, allUsers, prevPay, prevEnroll] = await Promise.all([
      supabase.from("profiles").select("created_at", { count: "exact" }).gte("created_at", fromStr),
      supabase.from("payments").select("amount, status, payment_method, created_at").gte("created_at", fromStr),
      supabase.from("enrollments").select("created_at", { count: "exact" }).gte("created_at", fromStr),
      supabase.from("profiles").select("id", { count: "exact" }),
      supabase.from("payments").select("amount, status").gte("created_at", prevStr).lt("created_at", fromStr),
      supabase.from("enrollments").select("id", { count: "exact" }).gte("created_at", prevStr).lt("created_at", fromStr),
    ]);

    const payments = paymentsRes.data || [];
    const completedPayments = payments.filter((p: any) => p.status === "completed");
    const totalRevenue = completedPayments.reduce((s: number, p: any) => s + (p.amount || 0), 0);
    const prevRevenue = (prevPay.data || []).filter((p: any) => p.status === "completed").reduce((s: number, p: any) => s + (p.amount || 0), 0);

    setSummary({
      totalUsers: allUsers.count || 0,
      newUsers: usersRes.count || 0,
      totalRevenue,
      prevRevenue,
      totalEnrollments: enrollRes.count || 0,
      prevEnrollments: prevEnroll.count || 0,
      totalPayments: payments.length,
      successRate: payments.length > 0 ? Math.round((completedPayments.length / payments.length) * 100) : 0,
    });

    const methodMap: Record<string, PaymentMethodStat> = {};
    payments.forEach((p: any) => {
      const m = p.payment_method || "Unknown";
      if (!methodMap[m]) methodMap[m] = { method: m, count: 0, total: 0 };
      methodMap[m].count++;
      if (p.status === "completed") methodMap[m].total += p.amount || 0;
    });
    setMethodStats(Object.values(methodMap).sort((a, b) => b.total - a.total));

    const dayMap: Record<string, DailyData> = {};
    for (let i = 0; i < period; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - (period - 1 - i));
      const key = d.toISOString().split("T")[0];
      dayMap[key] = { date: key, users: 0, payments: 0, revenue: 0, enrollments: 0 };
    }
    (usersRes.data || []).forEach((u: any) => {
      const key = u.created_at.split("T")[0];
      if (dayMap[key]) dayMap[key].users++;
    });
    payments.forEach((p: any) => {
      const key = p.created_at.split("T")[0];
      if (dayMap[key]) {
        dayMap[key].payments++;
        if (p.status === "completed") dayMap[key].revenue += p.amount || 0;
      }
    });
    (enrollRes.data || []).forEach((e: any) => {
      const key = e.created_at.split("T")[0];
      if (dayMap[key]) dayMap[key].enrollments++;
    });
    setDaily(Object.values(dayMap));

    const { data: courseData } = await supabase
      .from("courses")
      .select("title, enrollments(count), payments(amount, status)")
      .eq("status", "published")
      .limit(8);
    setTopCourses(
      (courseData || []).map((c: any) => ({
        title: c.title,
        enrolled_count: c.enrollments?.[0]?.count || 0,
        revenue: (c.payments || []).filter((p: any) => p.status === "completed").reduce((s: number, p: any) => s + (p.amount || 0), 0),
      })).sort((a, b) => b.revenue - a.revenue)
    );

    setLoading(false);
  };

  const pctChange = (cur: number, prev: number) => {
    if (prev === 0) return cur > 0 ? 100 : 0;
    return Math.round(((cur - prev) / prev) * 100);
  };

  const maxRevenue = Math.max(...daily.map((d) => d.revenue), 1);
  const maxUsers = Math.max(...daily.map((d) => d.users), 1);

  const formatDate = (d: string) => {
    const date = new Date(d);
    return period <= 7
      ? date.toLocaleDateString("bn-BD", { weekday: "short" })
      : date.toLocaleDateString("bn-BD", { month: "short", day: "numeric" });
  };

  const exportCSV = () => {
    const rows = [
      ["তারিখ", "নতুন ব্যবহারকারী", "পেমেন্ট", "আয়", "নথিভুক্তি"],
      ...daily.map((d) => [d.date, d.users, d.payments, d.revenue, d.enrollments]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `analytics-${period}days.csv`; a.click();
  };

  const revChange = pctChange(summary.totalRevenue, summary.prevRevenue);
  const enrollChange = pctChange(summary.totalEnrollments, summary.prevEnrollments);

  return (
    <AdminLayout>
      <div className="p-6 lg:p-7 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-7">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">অ্যানালিটিক্স</h1>
            <p className="text-gray-500 text-sm">প্ল্যাটফর্মের বিস্তারিত পরিসংখ্যান</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-xl border border-gray-800 overflow-hidden bg-gray-900">
              {([7, 30, 90] as const).map((p) => (
                <button key={p} onClick={() => setPeriod(p)}
                  className={`px-3 py-2 text-xs font-medium transition-colors ${period === p ? "bg-rose-600 text-white" : "text-gray-400 hover:text-gray-200"}`}>
                  {p} দিন
                </button>
              ))}
            </div>
            <button onClick={exportCSV}
              className="flex items-center gap-2 bg-gray-800 border border-gray-700 text-gray-300 text-sm py-2 px-3 rounded-xl hover:bg-gray-700 transition-colors">
              <Download className="w-4 h-4" /> CSV
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            {
              label: "মোট ব্যবহারকারী", value: summary.totalUsers.toLocaleString(),
              sub: `+${summary.newUsers} এই সময়ে`, icon: Users,
              bg: "from-violet-900/30 to-violet-950/30", border: "border-violet-500/20",
              iconBg: "bg-violet-500/20", iconColor: "text-violet-400",
            },
            {
              label: "মোট আয়", value: `৳${summary.totalRevenue.toLocaleString()}`,
              sub: `${revChange >= 0 ? "+" : ""}${revChange}% আগের তুলনায়`, icon: CreditCard,
              bg: "from-green-900/30 to-green-950/30", border: "border-green-500/20",
              iconBg: "bg-green-500/20", iconColor: "text-green-400",
              change: revChange,
            },
            {
              label: "নথিভুক্তি", value: summary.totalEnrollments.toLocaleString(),
              sub: `${enrollChange >= 0 ? "+" : ""}${enrollChange}% আগের তুলনায়`, icon: BookOpen,
              bg: "from-blue-900/30 to-blue-950/30", border: "border-blue-500/20",
              iconBg: "bg-blue-500/20", iconColor: "text-blue-400",
              change: enrollChange,
            },
            {
              label: "সাফল্যের হার", value: `${summary.successRate}%`,
              sub: `${summary.totalPayments} মোট পেমেন্ট`, icon: TrendingUp,
              bg: "from-orange-900/30 to-orange-950/30", border: "border-orange-500/20",
              iconBg: "bg-orange-500/20", iconColor: "text-orange-400",
            },
          ].map((card) => (
            <div key={card.label} className={`bg-gradient-to-br ${card.bg} border ${card.border} rounded-2xl p-5`}>
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 ${card.iconBg} rounded-xl flex items-center justify-center`}>
                  <card.icon className={`w-5 h-5 ${card.iconColor}`} />
                </div>
                {"change" in card && (
                  <span className={`flex items-center gap-0.5 text-xs font-medium ${(card.change || 0) >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {(card.change || 0) >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {Math.abs(card.change || 0)}%
                  </span>
                )}
              </div>
              <div className="text-2xl font-bold text-white mb-0.5">{loading ? "—" : card.value}</div>
              <div className="text-xs text-gray-500">{card.label}</div>
              <div className="text-xs text-gray-700 mt-0.5">{card.sub}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          {/* Revenue Chart */}
          <div className="lg:col-span-2 bg-gray-900/60 border border-gray-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-sm font-semibold text-white">দৈনিক আয়</h2>
                <p className="text-xs text-gray-600 mt-0.5">গত {period} দিনের আয়</p>
              </div>
              <BarChart2 className="w-4 h-4 text-gray-600" />
            </div>
            {loading ? (
              <div className="h-36 bg-gray-800/40 rounded-xl animate-pulse" />
            ) : (
              <div className="flex items-end gap-1 h-36">
                {(period <= 30 ? daily : daily.filter((_, i) => i % 3 === 0)).map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      ৳{d.revenue.toLocaleString()}
                    </div>
                    <div
                      className="w-full bg-gradient-to-t from-rose-600 to-rose-500/70 rounded-t-md transition-all hover:from-rose-500 hover:to-rose-400/70"
                      style={{ height: `${Math.max(4, (d.revenue / maxRevenue) * 136)}px` }}
                    />
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-between mt-2">
              <span className="text-xs text-gray-700">{daily[0]?.date ? formatDate(daily[0].date) : ""}</span>
              <span className="text-xs text-gray-700">{daily[daily.length - 1]?.date ? formatDate(daily[daily.length - 1].date) : ""}</span>
            </div>
          </div>

          {/* User Growth */}
          <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-sm font-semibold text-white">ব্যবহারকারী বৃদ্ধি</h2>
                <p className="text-xs text-gray-600 mt-0.5">দৈনিক নতুন সদস্য</p>
              </div>
              <Activity className="w-4 h-4 text-gray-600" />
            </div>
            {loading ? (
              <div className="h-36 bg-gray-800/40 rounded-xl animate-pulse" />
            ) : (
              <div className="flex items-end gap-1 h-36">
                {(period <= 30 ? daily : daily.filter((_, i) => i % 3 === 0)).map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center group relative">
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      {d.users} জন
                    </div>
                    <div
                      className="w-full bg-gradient-to-t from-violet-600 to-violet-500/70 rounded-t-md"
                      style={{ height: `${Math.max(4, (d.users / maxUsers) * 136)}px` }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Top Courses */}
          <div className="bg-gray-900/60 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-800">
              <h2 className="text-sm font-semibold text-white">শীর্ষ কোর্স</h2>
              <p className="text-xs text-gray-600 mt-0.5">সর্বোচ্চ আয় করা কোর্স</p>
            </div>
            {loading ? (
              <div className="p-4 space-y-3">{[1,2,3,4].map((i) => <div key={i} className="h-12 bg-gray-800/40 rounded-xl animate-pulse" />)}</div>
            ) : topCourses.length === 0 ? (
              <div className="p-8 text-center text-gray-600 text-sm">কোনো ডেটা নেই</div>
            ) : (
              <div className="divide-y divide-gray-800/60">
                {topCourses.slice(0, 6).map((course, i) => (
                  <div key={i} className="flex items-center gap-3 px-5 py-3">
                    <span className={`text-xs font-bold w-5 text-center ${i === 0 ? "text-yellow-400" : i === 1 ? "text-gray-400" : i === 2 ? "text-orange-400" : "text-gray-600"}`}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{course.title}</p>
                      <p className="text-xs text-gray-500">{course.enrolled_count} জন নথিভুক্ত</p>
                    </div>
                    <p className="text-sm font-bold text-green-400">৳{course.revenue.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment Methods */}
          <div className="bg-gray-900/60 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-800">
              <h2 className="text-sm font-semibold text-white">পেমেন্ট পদ্ধতি</h2>
              <p className="text-xs text-gray-600 mt-0.5">পদ্ধতি অনুযায়ী বিভাজন</p>
            </div>
            {loading ? (
              <div className="p-4 space-y-3">{[1,2,3].map((i) => <div key={i} className="h-14 bg-gray-800/40 rounded-xl animate-pulse" />)}</div>
            ) : methodStats.length === 0 ? (
              <div className="p-8 text-center text-gray-600 text-sm">কোনো পেমেন্ট ডেটা নেই</div>
            ) : (
              <div className="p-5 space-y-4">
                {methodStats.slice(0, 6).map((m) => {
                  const pct = summary.totalPayments > 0 ? Math.round((m.count / summary.totalPayments) * 100) : 0;
                  return (
                    <div key={m.method}>
                      <div className="flex justify-between mb-1.5">
                        <span className="text-sm text-white capitalize">{m.method}</span>
                        <div className="text-right">
                          <span className="text-xs text-gray-400">{m.count} বার · </span>
                          <span className="text-xs font-medium text-green-400">৳{m.total.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-rose-600 to-orange-500 rounded-full"
                          style={{ width: `${pct}%` }} />
                      </div>
                      <div className="text-xs text-gray-600 mt-0.5">{pct}%</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
