import { useState } from "react";
import { Link } from "wouter";
import { supabase } from "@/lib/supabase";
import { Loader2, BookOpen, ArrowLeft, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      setError("ইমেইল পাঠাতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } else {
      setSent(true);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-violet-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-10 h-10 text-violet-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">ইমেইল পাঠানো হয়েছে!</h2>
          <p className="text-gray-400 mb-2">
            <span className="text-white font-medium">{email}</span> এ পাসওয়ার্ড রিসেটের লিংক পাঠানো হয়েছে।
          </p>
          <p className="text-gray-500 text-sm mb-8">ইমেইল চেক করুন (স্প্যাম ফোল্ডারও দেখুন)।</p>
          <Link href="/login"
            className="inline-flex items-center gap-2 text-violet-400 hover:text-violet-300 font-medium">
            <ArrowLeft className="w-4 h-4" /> লগইন পেজে ফিরে যান
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 bg-violet-500 rounded-xl flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <span className="text-white font-bold text-xl">AI শিখি বাংলায়</span>
        </div>

        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">পাসওয়ার্ড ভুলে গেছেন?</h1>
          <p className="text-gray-400">আপনার ইমেইল দিন, রিসেট লিংক পাঠাবো</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">ইমেইল ঠিকানা</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              required
              className="w-full bg-gray-900 border border-gray-800 text-white placeholder-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold py-3 px-4 rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            রিসেট লিংক পাঠান
          </button>
        </form>

        <div className="text-center mt-6">
          <Link href="/login" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-300 text-sm">
            <ArrowLeft className="w-4 h-4" /> লগইনে ফিরে যান
          </Link>
        </div>
      </div>
    </div>
  );
}
