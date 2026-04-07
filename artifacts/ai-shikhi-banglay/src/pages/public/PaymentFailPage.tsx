import { useSearch } from "wouter";
import PublicLayout from "@/layouts/PublicLayout";
import { SEO } from "@/components/SEO";
import { XCircle, RefreshCw, MessageCircle, ArrowLeft } from "lucide-react";

const REASON_MESSAGES: Record<string, string> = {
  payment_failed: "পেমেন্ট সম্পন্ন হয়নি। কার্ড/মোবাইল ব্যালেন্স যাচাই করে আবার চেষ্টা করুন।",
  cancelled: "আপনি পেমেন্ট বাতিল করেছেন।",
  validation_failed: "পেমেন্ট যাচাইকরণে সমস্যা হয়েছে। কিছুক্ষণ পরে আবার চেষ্টা করুন।",
  tran_mismatch: "পেমেন্ট তথ্যে অমিল পাওয়া গেছে। সাপোর্টে যোগাযোগ করুন।",
  order_not_found: "অর্ডার খুঁজে পাওয়া যায়নি।",
  server_error: "সার্ভারে সমস্যা হয়েছে। কিছুক্ষণ পরে আবার চেষ্টা করুন।",
  invalid_status: "পেমেন্টের স্ট্যাটাস অবৈধ।",
};

export default function PaymentFailPage() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const reason = params.get("reason") || "payment_failed";

  const message = REASON_MESSAGES[reason] || "পেমেন্ট সম্পন্ন হয়নি। আবার চেষ্টা করুন।";

  return (
    <PublicLayout>
      <SEO title="পেমেন্ট ব্যর্থ — AI শিখি বাংলায়" description="পেমেন্ট সম্পন্ন হয়নি।" noIndex />

      <div className="min-h-screen bg-gray-950 flex items-center justify-center py-16 px-4">
        <div className="max-w-lg w-full text-center">
          {/* Fail Icon */}
          <div className="relative inline-flex items-center justify-center mb-6">
            <div className="absolute inset-0 bg-red-500/20 rounded-full blur-2xl scale-150" />
            <div className="relative w-24 h-24 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center">
              <XCircle className="w-12 h-12 text-red-400" />
            </div>
          </div>

          <h1 className="text-3xl font-extrabold text-white mb-2">পেমেন্ট সফল হয়নি</h1>
          <p className="text-gray-400 mb-8 leading-relaxed">{message}</p>

          {/* Tips */}
          <div className="bg-gray-900 border border-gray-800/60 rounded-2xl p-5 mb-8 text-left">
            <h3 className="text-sm font-semibold text-yellow-400 mb-3">সমস্যা সমাধানের টিপস:</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-start gap-2"><span className="text-violet-400 mt-0.5">•</span> কার্ড বা মোবাইল ব্যাংকিং-এ পর্যাপ্ত ব্যালেন্স আছে কিনা নিশ্চিত করুন</li>
              <li className="flex items-start gap-2"><span className="text-violet-400 mt-0.5">•</span> ইন্টারনেট কানেকশন ভালো কিনা পরীক্ষা করুন</li>
              <li className="flex items-start gap-2"><span className="text-violet-400 mt-0.5">•</span> অন্য একটি পেমেন্ট পদ্ধতি ব্যবহার করে দেখুন</li>
              <li className="flex items-start gap-2"><span className="text-violet-400 mt-0.5">•</span> কিছুক্ষণ অপেক্ষা করে আবার চেষ্টা করুন</li>
            </ul>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => window.history.back()}
              className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" /> আবার চেষ্টা করুন
            </button>
            <a
              href="/contact"
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-5 h-5" /> সাপোর্টে যোগাযোগ
            </a>
          </div>

          <a
            href="/courses"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-violet-400 transition-colors mt-6"
          >
            <ArrowLeft className="w-4 h-4" /> কোর্সে ফিরে যান
          </a>
        </div>
      </div>
    </PublicLayout>
  );
}
