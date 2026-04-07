import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import PublicLayout from "@/layouts/PublicLayout";
import { SEO } from "@/components/SEO";
import {
  BookOpen, Tag, CheckCircle, Shield, Clock, Award,
  Loader2, ChevronRight, AlertCircle, Lock, CreditCard,
} from "lucide-react";

const API_BASE = "/api";

interface Course {
  id: string;
  title: string;
  slug: string;
  thumbnail_url: string | null;
  price_bdt: number;
  price_usd: number;
  is_free: boolean;
  total_duration: number;
  certificate_enabled: boolean;
}

export default function CheckoutPage() {
  const { slug } = useParams<{ slug: string }>();
  const [, navigate] = useLocation();
  const { user, profile } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponResult, setCouponResult] = useState<{
    valid: boolean;
    discount_amount: number;
    final_price: number;
    message: string;
    discount_label?: string;
  } | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);

  // Payment state
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) navigate(`/login?redirect=/checkout/${slug}`);
  }, [user, slug, navigate]);

  useEffect(() => {
    if (!slug || !user) return;
    const fetchData = async () => {
      const { data: c } = await supabase
        .from("courses")
        .select("id,title,slug,thumbnail_url,price_bdt,price_usd,is_free,total_duration,certificate_enabled")
        .eq("slug", slug)
        .eq("is_published", true)
        .single();

      if (!c) { navigate("/courses"); return; }
      setCourse(c);

      if (profile) {
        const { data: enr } = await supabase
          .from("enrollments")
          .select("id")
          .eq("user_id", profile.id)
          .eq("course_id", c.id)
          .maybeSingle();
        if (enr) setIsEnrolled(true);
      }
      setLoading(false);
    };
    fetchData();
  }, [slug, user, profile, navigate]);

  const validateCoupon = async () => {
    if (!couponCode.trim() || !course) return;
    setCouponLoading(true);
    setCouponResult(null);
    try {
      const res = await fetch(`${API_BASE}/coupons/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponCode.trim(),
          course_id: course.id,
          price_bdt: course.price_bdt,
        }),
      });
      const data = await res.json();
      setCouponResult(data);
      if (data.valid) setAppliedCoupon(couponCode.trim().toUpperCase());
    } catch {
      setCouponResult({ valid: false, discount_amount: 0, final_price: course.price_bdt, message: "কুপন যাচাই করতে সমস্যা হয়েছে।" });
    }
    setCouponLoading(false);
  };

  const removeCoupon = () => {
    setCouponCode("");
    setCouponResult(null);
    setAppliedCoupon(null);
  };

  const finalPrice = couponResult?.valid ? couponResult.final_price : course?.price_bdt ?? 0;

  const handlePayment = async () => {
    if (!course || !user) return;
    setPaying(true);
    setPayError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login"); return; }

      const res = await fetch(`${API_BASE}/payment/sslcommerz/init`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          course_id: course.id,
          coupon_code: appliedCoupon || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPayError(data.error || "পেমেন্ট শুরু করতে সমস্যা হয়েছে।");
        setPaying(false);
        return;
      }

      if (data.type === "free") {
        navigate("/dashboard/courses");
        return;
      }

      if (data.type === "redirect" && data.url) {
        window.location.href = data.url;
        return;
      }

      setPayError("পেমেন্ট শুরু করতে সমস্যা হয়েছে।");
      setPaying(false);
    } catch {
      setPayError("নেটওয়ার্ক সমস্যা হয়েছে। আবার চেষ্টা করুন।");
      setPaying(false);
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <PublicLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
        </div>
      </PublicLayout>
    );
  }

  if (!course) return null;

  if (isEnrolled) {
    return (
      <PublicLayout>
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
          <CheckCircle className="w-16 h-16 text-green-400" />
          <h1 className="text-2xl font-bold text-white">আপনি ইতিমধ্যে এই কোর্সে ভর্তি আছেন!</h1>
          <a href="/dashboard/courses" className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors">
            কোর্স শুরু করুন
          </a>
        </div>
      </PublicLayout>
    );
  }

  const savingsAmount = course.price_bdt - finalPrice;
  const discountPct = course.price_bdt > 0 ? Math.round((savingsAmount / course.price_bdt) * 100) : 0;

  return (
    <PublicLayout>
      <SEO title={`চেকআউট — ${course.title}`} description={`${course.title} কোর্সটি কিনুন`} noIndex />

      <div className="min-h-screen bg-gray-950 py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
            <a href="/courses" className="hover:text-violet-400 transition-colors">কোর্সসমূহ</a>
            <ChevronRight className="w-4 h-4" />
            <a href={`/courses/${course.slug}`} className="hover:text-violet-400 transition-colors line-clamp-1">{course.title}</a>
            <ChevronRight className="w-4 h-4" />
            <span className="text-violet-400">চেকআউট</span>
          </nav>

          <div className="grid lg:grid-cols-5 gap-8">
            {/* LEFT: Course Info + Coupon */}
            <div className="lg:col-span-3 space-y-6">
              {/* Course Card */}
              <div className="bg-gray-900 border border-gray-800/60 rounded-2xl p-6">
                <div className="flex gap-4">
                  {course.thumbnail_url ? (
                    <img src={course.thumbnail_url} alt={course.title} className="w-24 h-18 object-cover rounded-xl flex-shrink-0" />
                  ) : (
                    <div className="w-24 h-18 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-8 h-8 text-white" />
                    </div>
                  )}
                  <div>
                    <h2 className="text-lg font-bold text-white leading-snug mb-2">{course.title}</h2>
                    <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                      {course.total_duration > 0 && (
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-violet-400" />{Math.ceil(course.total_duration / 60)} ঘণ্টা</span>
                      )}
                      <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-violet-400" />আজীবন অ্যাক্সেস</span>
                      {course.certificate_enabled && (
                        <span className="flex items-center gap-1"><Award className="w-3.5 h-3.5 text-violet-400" />সার্টিফিকেট</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Coupon Section */}
              {!course.is_free && (
                <div className="bg-gray-900 border border-gray-800/60 rounded-2xl p-6">
                  <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-violet-400" /> কুপন কোড
                  </h3>

                  {appliedCoupon && couponResult?.valid ? (
                    <div className="flex items-center justify-between bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3">
                      <div>
                        <p className="text-green-400 font-semibold text-sm">{appliedCoupon}</p>
                        <p className="text-green-300/70 text-xs mt-0.5">{couponResult.message}</p>
                      </div>
                      <button
                        onClick={removeCoupon}
                        className="text-xs text-gray-400 hover:text-red-400 transition-colors underline"
                      >
                        সরান
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        value={couponCode}
                        onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponResult(null); }}
                        onKeyDown={(e) => e.key === "Enter" && validateCoupon()}
                        placeholder="COUPON10"
                        className="flex-1 bg-gray-800 border border-gray-700 focus:border-violet-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition-colors"
                      />
                      <button
                        onClick={validateCoupon}
                        disabled={couponLoading || !couponCode.trim()}
                        className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm px-5 py-2.5 rounded-xl transition-colors flex items-center gap-2 font-semibold whitespace-nowrap"
                      >
                        {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "প্রয়োগ করুন"}
                      </button>
                    </div>
                  )}

                  {couponResult && !couponResult.valid && (
                    <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {couponResult.message}
                    </p>
                  )}
                </div>
              )}

              {/* Security badges */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: Shield, text: "SSL সুরক্ষিত পেমেন্ট" },
                  { icon: Lock, text: "SSLCommerz নিরাপদ গেটওয়ে" },
                  { icon: CheckCircle, text: "৭ দিনের মানি-ব্যাক গ্যারান্টি" },
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center gap-1.5 p-3 bg-gray-900/60 border border-gray-800/40 rounded-xl text-center">
                    <item.icon className="w-5 h-5 text-violet-400" />
                    <p className="text-xs text-gray-400 leading-tight">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT: Price Summary + Pay Button */}
            <div className="lg:col-span-2">
              <div className="bg-gray-900 border border-gray-800/60 rounded-2xl p-6 sticky top-24">
                <h3 className="text-base font-semibold text-white mb-5">পেমেন্ট সারসংক্ষেপ</h3>

                <div className="space-y-3 mb-5">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">মূল মূল্য</span>
                    <span className={`${savingsAmount > 0 ? "line-through text-gray-500" : "text-white font-semibold"}`}>
                      ৳{course.price_bdt.toLocaleString("bn-BD")}
                    </span>
                  </div>

                  {savingsAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-green-400">ছাড় ({discountPct}%)</span>
                      <span className="text-green-400 font-semibold">− ৳{savingsAmount.toLocaleString("bn-BD")}</span>
                    </div>
                  )}

                  <div className="border-t border-gray-800/60 pt-3 flex justify-between items-center">
                    <span className="text-white font-semibold">মোট মূল্য</span>
                    <div className="text-right">
                      {course.is_free ? (
                        <span className="text-2xl font-extrabold text-green-400">বিনামূল্যে</span>
                      ) : (
                        <>
                          <span className="text-2xl font-extrabold text-white">৳{finalPrice.toLocaleString("bn-BD")}</span>
                          <span className="text-xs text-gray-500 ml-1">BDT</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {payError && (
                  <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 mb-4">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-red-300 text-sm">{payError}</p>
                  </div>
                )}

                <button
                  onClick={handlePayment}
                  disabled={paying}
                  className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:opacity-60 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-violet-500/20 flex items-center justify-center gap-2 text-base"
                >
                  {paying ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> অনুগ্রহ করে অপেক্ষা করুন...</>
                  ) : course.is_free ? (
                    <><CheckCircle className="w-5 h-5" /> বিনামূল্যে ভর্তি হন</>
                  ) : (
                    <><CreditCard className="w-5 h-5" /> এখনই পেমেন্ট করুন</>
                  )}
                </button>

                <p className="text-xs text-gray-500 text-center mt-3 leading-relaxed">
                  পেমেন্ট করে আপনি আমাদের{" "}
                  <a href="/terms" className="text-violet-400 hover:underline">শর্তাবলী</a> ও{" "}
                  <a href="/refund-policy" className="text-violet-400 hover:underline">রিফান্ড নীতিতে</a> সম্মত হচ্ছেন।
                </p>

                {/* Payment method logos */}
                <div className="mt-5 pt-4 border-t border-gray-800/60">
                  <p className="text-xs text-gray-500 text-center mb-3">গ্রহণযোগ্য পেমেন্ট পদ্ধতি</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {["বিকাশ", "নগদ", "রকেট", "VISA", "Mastercard", "ব্যাংক ট্রান্সফার"].map((pm) => (
                      <span key={pm} className="text-xs text-gray-400 bg-gray-800 px-2.5 py-1 rounded-lg border border-gray-700/50">
                        {pm}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
