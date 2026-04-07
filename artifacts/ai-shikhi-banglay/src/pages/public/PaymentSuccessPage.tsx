import { useEffect, useState } from "react";
import { useSearch } from "wouter";
import PublicLayout from "@/layouts/PublicLayout";
import { SEO } from "@/components/SEO";
import { CheckCircle, BookOpen, ArrowRight, Download } from "lucide-react";
import { supabase } from "@/lib/supabase";
import confetti from "canvas-confetti";

interface OrderInfo {
  id: string;
  amount: number;
  currency: string;
  gateway_ref: string;
  created_at: string;
  courses: { title: string; slug: string } | null;
}

export default function PaymentSuccessPage() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const orderId = params.get("order_id");

  const [order, setOrder] = useState<OrderInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fire confetti 🎉
    confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 }, colors: ["#7c3aed", "#4f46e5", "#34d399", "#fbbf24"] });

    if (!orderId) { setLoading(false); return; }

    supabase
      .from("orders")
      .select("id,amount,currency,gateway_ref,created_at,courses(title,slug)")
      .eq("id", orderId)
      .single()
      .then(({ data }) => {
        if (data) setOrder(data as unknown as OrderInfo);
        setLoading(false);
      });
  }, [orderId]);

  return (
    <PublicLayout>
      <SEO title="পেমেন্ট সফল — AI শিখি বাংলায়" description="আপনার পেমেন্ট সফল হয়েছে।" noIndex />

      <div className="min-h-screen bg-gray-950 flex items-center justify-center py-16 px-4">
        <div className="max-w-lg w-full text-center">
          {/* Success Icon */}
          <div className="relative inline-flex items-center justify-center mb-6">
            <div className="absolute inset-0 bg-green-500/20 rounded-full blur-2xl scale-150" />
            <div className="relative w-24 h-24 rounded-full bg-green-500/15 border-2 border-green-500/40 flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-400" />
            </div>
          </div>

          <h1 className="text-3xl font-extrabold text-white mb-2">পেমেন্ট সফল হয়েছে!</h1>
          <p className="text-gray-400 mb-8">
            আপনার পেমেন্ট নিশ্চিত হয়েছে। একটি রসিদ আপনার ইমেইলে পাঠানো হয়েছে।
          </p>

          {/* Order Details */}
          {!loading && order && (
            <div className="bg-gray-900 border border-gray-800/60 rounded-2xl p-6 mb-8 text-left">
              <h3 className="text-sm font-semibold text-violet-400 uppercase tracking-wider mb-4">পেমেন্ট রসিদ</h3>
              <div className="space-y-3">
                {order.courses && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">কোর্স</span>
                    <span className="text-white font-medium text-right max-w-[60%]">{order.courses.title}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">পরিমাণ</span>
                  <span className="text-green-400 font-bold text-lg">৳{Number(order.amount).toLocaleString("bn-BD")}</span>
                </div>
                {order.gateway_ref && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">ট্রানজেকশন রেফ</span>
                    <span className="text-white font-mono text-xs">{order.gateway_ref}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">তারিখ</span>
                  <span className="text-white">
                    {new Date(order.created_at).toLocaleDateString("bn-BD", { year: "numeric", month: "long", day: "numeric" })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">অর্ডার আইডি</span>
                  <span className="text-white font-mono text-xs">{order.id.slice(0, 8)}...</span>
                </div>
              </div>
            </div>
          )}

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="/dashboard/courses"
              className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <BookOpen className="w-5 h-5" /> কোর্স শুরু করুন
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="/dashboard/billing"
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" /> পেমেন্ট ইতিহাস
            </a>
          </div>

          <p className="text-gray-600 text-sm mt-6">
            সমস্যা হলে{" "}
            <a href="mailto:support@aishikhibanglay.com" className="text-violet-400 hover:underline">
              support@aishikhibanglay.com
            </a>
            -এ যোগাযোগ করুন।
          </p>
        </div>
      </div>
    </PublicLayout>
  );
}
