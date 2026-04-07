import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import StudentLayout from "@/layouts/StudentLayout";
import { CreditCard, CheckCircle, XCircle, Clock, Receipt } from "lucide-react";

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  payment_method: string;
  created_at: string;
  course_title: string;
}

const statusMap: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  completed: { label: "সফল", color: "text-green-400 bg-green-500/10 border-green-500/20", icon: CheckCircle },
  failed: { label: "ব্যর্থ", color: "text-red-400 bg-red-500/10 border-red-500/20", icon: XCircle },
  pending: { label: "প্রক্রিয়াধীন", color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20", icon: Clock },
  refunded: { label: "ফেরত", color: "text-blue-400 bg-blue-500/10 border-blue-500/20", icon: Receipt },
};

export default function BillingHistory() {
  const { profile } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      if (!profile) return;
      const { data } = await supabase
        .from("payments")
        .select("id, amount, currency, status, payment_method, created_at, courses(title)")
        .eq("user_id", profile.user_id)
        .order("created_at", { ascending: false });
      if (data) {
        setPayments(data.map((p: any) => ({
          id: p.id,
          amount: p.amount,
          currency: p.currency || "BDT",
          status: p.status,
          payment_method: p.payment_method || "N/A",
          created_at: p.created_at,
          course_title: p.courses?.title || "কোর্স",
        })));
      }
      setLoading(false);
    };
    fetch();
  }, [profile]);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("bn-BD", { year: "numeric", month: "short", day: "numeric" });

  const totalSpent = payments
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <StudentLayout>
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">বিলিং ইতিহাস</h1>
          <p className="text-gray-400">আপনার সকল পেমেন্টের তথ্য</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: "মোট খরচ", value: `৳${totalSpent.toLocaleString()}`, color: "text-white", bg: "bg-violet-500/10 border-violet-500/20" },
            { label: "সফল পেমেন্ট", value: payments.filter((p) => p.status === "completed").length, color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
            { label: "মোট কেনা কোর্স", value: payments.filter((p) => p.status === "completed").length, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
          ].map((item) => (
            <div key={item.label} className={`${item.bg} border rounded-2xl p-5`}>
              <div className={`text-2xl font-bold ${item.color} mb-1`}>{item.value}</div>
              <div className="text-sm text-gray-500">{item.label}</div>
            </div>
          ))}
        </div>

        {/* Transactions */}
        <div className="bg-gray-900/80 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800">
            <h2 className="font-semibold text-white">লেনদেনের তালিকা</h2>
          </div>
          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-800/60 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-16">
              <CreditCard className="w-12 h-12 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-400">কোনো পেমেন্ট ইতিহাস নেই</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800/60">
              {payments.map((payment) => {
                const s = statusMap[payment.status] || statusMap.pending;
                const SIcon = s.icon;
                return (
                  <div key={payment.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-800/30 transition-colors">
                    <div className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center flex-shrink-0">
                      <CreditCard className="w-5 h-5 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{payment.course_title}</p>
                      <p className="text-xs text-gray-500">{payment.payment_method} · {formatDate(payment.created_at)}</p>
                    </div>
                    <div className="text-right flex-shrink-0 mr-3">
                      <p className="text-sm font-bold text-white">৳{payment.amount.toLocaleString()}</p>
                      <p className="text-xs text-gray-600">{payment.currency}</p>
                    </div>
                    <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg border ${s.color}`}>
                      <SIcon className="w-3 h-3" /> {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </StudentLayout>
  );
}
