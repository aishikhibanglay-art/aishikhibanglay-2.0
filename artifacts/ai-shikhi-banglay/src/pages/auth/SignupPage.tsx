import { useState } from "react";
import { Link, useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { Eye, EyeOff, Loader2, BookOpen, CheckCircle } from "lucide-react";

export default function SignupPage() {
  const [, navigate] = useLocation();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "facebook" | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) {
      setError("পাসওয়ার্ড দুটি মিলছে না।");
      return;
    }
    if (form.password.length < 8) {
      setError("পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।");
      return;
    }
    if (!agreed) {
      setError("শর্তাবলীতে সম্মতি দিন।");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    if (error) {
      if (error.message.includes("already registered")) {
        setError("এই ইমেইলে আগেই একাউন্ট আছে। লগইন করুন।");
      } else {
        setError(error.message);
      }
    } else {
      setSuccess(true);
    }
  };

  const handleOAuth = async (provider: "google" | "facebook") => {
    setOauthLoading(provider);
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    setOauthLoading(null);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">ইমেইল যাচাই করুন!</h2>
          <p className="text-gray-400 mb-2">
            <span className="text-white font-medium">{form.email}</span> এ একটি যাচাইকরণ লিংক পাঠানো হয়েছে।
          </p>
          <p className="text-gray-500 text-sm mb-8">
            ইমেইল চেক করুন এবং লিংকে ক্লিক করে একাউন্ট সক্রিয় করুন।
          </p>
          <Link href="/login" className="inline-block bg-violet-600 hover:bg-violet-500 text-white font-semibold py-3 px-8 rounded-xl transition-all">
            লগইন পেজে যান
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
          <h1 className="text-3xl font-bold text-white mb-2">একাউন্ট তৈরি করুন</h1>
          <p className="text-gray-400">আজই শুরু করুন, বিনামূল্যে</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* OAuth */}
        <div className="space-y-3 mb-6">
          <button onClick={() => handleOAuth("google")} disabled={!!oauthLoading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-900 font-medium py-3 px-4 rounded-xl transition-all disabled:opacity-60">
            {oauthLoading === "google" ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            )}
            Google দিয়ে সাইনআপ করুন
          </button>
          <button onClick={() => handleOAuth("facebook")} disabled={!!oauthLoading}
            className="w-full flex items-center justify-center gap-3 bg-[#1877F2] hover:bg-[#166FE5] text-white font-medium py-3 px-4 rounded-xl transition-all disabled:opacity-60">
            {oauthLoading === "facebook" ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <svg className="w-5 h-5" fill="white" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            )}
            Facebook দিয়ে সাইনআপ করুন
          </button>
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-800" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-gray-950 text-gray-500">অথবা ইমেইল দিয়ে</span>
          </div>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">পুরো নাম</label>
            <input name="name" type="text" value={form.name} onChange={handleChange}
              placeholder="আপনার নাম" required
              className="w-full bg-gray-900 border border-gray-800 text-white placeholder-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">ইমেইল</label>
            <input name="email" type="email" value={form.email} onChange={handleChange}
              placeholder="example@email.com" required
              className="w-full bg-gray-900 border border-gray-800 text-white placeholder-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">পাসওয়ার্ড</label>
            <div className="relative">
              <input name="password" type={showPass ? "text" : "password"} value={form.password} onChange={handleChange}
                placeholder="কমপক্ষে ৮ অক্ষর" required
                className="w-full bg-gray-900 border border-gray-800 text-white placeholder-gray-600 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all" />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">পাসওয়ার্ড নিশ্চিত করুন</label>
            <div className="relative">
              <input name="confirmPassword" type={showConfirm ? "text" : "password"} value={form.confirmPassword} onChange={handleChange}
                placeholder="পাসওয়ার্ড আবার লিখুন" required
                className="w-full bg-gray-900 border border-gray-800 text-white placeholder-gray-600 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all" />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-gray-700 bg-gray-900 text-violet-600 focus:ring-violet-500" />
            <span className="text-sm text-gray-400">
              আমি{" "}
              <Link href="/terms" className="text-violet-400 hover:text-violet-300">শর্তাবলী</Link>
              {" "}এবং{" "}
              <Link href="/privacy-policy" className="text-violet-400 hover:text-violet-300">গোপনীয়তা নীতি</Link>
              {" "}পড়েছি এবং সম্মত আছি।
            </span>
          </label>
          <button type="submit" disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold py-3 px-4 rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            একাউন্ট তৈরি করুন
          </button>
        </form>

        <p className="text-center mt-6 text-gray-500 text-sm">
          আগে থেকে একাউন্ট আছে?{" "}
          <Link href="/login" className="text-violet-400 hover:text-violet-300 font-medium">লগইন করুন</Link>
        </p>
      </div>
    </div>
  );
}
