import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import AdminLayout from "@/layouts/AdminLayout";
import { CreditCard, CheckCircle, XCircle, Clock, Search, TrendingUp, Download } from "lucide-react";

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  payment_method: string;
  transaction_id: string | null;
  created_at: string;
  user_name: string;
  user_email: string;
  course_title: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  completed: { label: "সফল", color: "text-green-400 bg-green-500/10 border-green-500/30", icon: CheckCircle },
  failed: { label: "ব্যর্থ", color: "text-red-400 bg-red-500/10 border-red-500/30", icon: XCircle },
  pending: { label: "প্রক্রিয়াধীন", color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30", icon: Clock },
  refunded: { label: "ফেরত", color: "text-blue-400 bg-blue-500/10 border-blue-500/30", icon: TrendingUp },
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [totalRevenue, setTotalRevenue] = useState(0);

  useEffect(() => { fetchPayments(); }, [statusFilter]);

  const fetchPayments = async () => {
    setLoading(true);
    let q = supabase
      .from("payments")
      .select(`id, amount, currency, status, payment_method, transaction_id, created_at,
        profiles(name, email), courses(title)
      `)
      .order("created_at", { ascending: false });
    if (statusFilter !== "all") q = q.eq("status", statusFilter);
    const { data } = await q;
    const mapped = (data || []).map((p: any) => ({
      id: p.id, amount: p.amount, currency: p.currency || "BDT",
      status: p.status, payment_method: p.payment_method,
      transaction_id: p.transaction_id, created_at: p.created_at,
      user_name: p.profiles?.name || "Unknown",
      user_email: p.profiles?.email || "",
      course_title: p.courses?.title || "Course",
    }));
    setPayments(mapped);
    setTotalRevenue(mapped.filter((p) => p.status === "completed").reduce((s, p) => s + p.amount, 0));
    setLoading(false);
  };

  const filtered = payments.filter((p) =>
    p.user_name.toLowerCase().includes(search.toLowerCase()) ||
    p.course_title.toLowerCase().includes(search.toLowerCase()) ||
    (p.transaction_id || "").toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (d: string) => new Date(d).toLocaleString("bn-BD", {
    year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
  });

  return (
    <AdminLayout>
      <div className="p-6 lg:p-7 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-7">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">পেমেন্ট ইতিহাস</h1>
            <p className="text-gray-500 text-sm">সকল লেনদেন</p>
          </div>
          <button className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 font-medium py-2.5 px-4 rounded-xl text-sm transition-colors">
            <Download className="w-4 h-4" /> CSV Export
          </button>
        </div>

        {/* Revenue Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: "মোট আয়", value: `৳${totalRevenue.toLocaleString()}`, color: "text-green-400", border: "border-green-500/20", bg: "bg-green-500/5" },
            { label: "সফল পেমেন্ট", value: payments.filter((p) => p.status === "completed").length, color: "text-white", border: "border-gray-700", bg: "bg-gray-900/60" },
            { label: "ব্যর্থ পেমেন্ট", value: payments.filter((p) => p.status === "failed").length, color: "text-red-400", border: "border-red-500/20", bg: "bg-red-500/5" },
            { label: "ফেরত", value: payments.filter((p) => p.status === "refunded").length, color: "text-blue-400", border: "border-blue-500/20", bg: "bg-blue-500/5" },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} border ${s.border} rounded-2xl px-5 py-4`}>
              <div className={`text-2xl font-bold ${s.color} mb-0.5`}>{loading ? "—" : s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="নাম, কোর্স বা Transaction ID..."
              className="w-full bg-gray-900 border border-gray-800 text-white text-sm placeholder-gray-600 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-rose-500 transition-all" />
          </div>
          <div className="flex rounded-xl border border-gray-800 overflow-hidden bg-gray-900">
            {["all", "completed", "pending", "failed", "refunded"].map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-2.5 text-xs font-medium transition-colors ${
                  statusFilter === s ? "bg-rose-600 text-white" : "text-gray-400 hover:text-gray-200"
                }`}>
                {s === "all" ? "সব" : statusConfig[s]?.label || s}
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
                  {["ব্যবহারকারী", "কোর্স", "পরিমাণ", "পদ্ধতি", "তারিখ", "Status"].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}><td colSpan={6} className="px-5 py-3">
                      <div className="h-10 bg-gray-800/60 rounded-xl animate-pulse" />
                    </td></tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} className="py-12 text-center text-gray-600 text-sm">
                    <CreditCard className="w-8 h-8 mx-auto mb-2 text-gray-700" />কোনো পেমেন্ট নেই
                  </td></tr>
                ) : filtered.map((p) => {
                  const sc = statusConfig[p.status] || statusConfig.pending;
                  const SIcon = sc.icon;
                  return (
                    <tr key={p.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-5 py-3">
                        <p className="text-sm font-medium text-white">{p.user_name}</p>
                        <p className="text-xs text-gray-500">{p.user_email}</p>
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-sm text-gray-300 truncate max-w-[140px]">{p.course_title}</p>
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-sm font-bold text-white">৳{p.amount?.toLocaleString()}</p>
                        <p className="text-xs text-gray-600">{p.currency}</p>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded-lg">{p.payment_method || "—"}</span>
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-500 whitespace-nowrap">{formatDate(p.created_at)}</td>
                      <td className="px-5 py-3">
                        <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg border w-fit ${sc.color}`}>
                          <SIcon className="w-3 h-3" /> {sc.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
