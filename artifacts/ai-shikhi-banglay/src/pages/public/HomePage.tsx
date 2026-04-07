import { useState, useEffect } from "react";
import { Link } from "wouter";
import { supabase } from "@/lib/supabase";
import PublicLayout from "@/layouts/PublicLayout";
import { SEO } from "@/components/SEO";
import {
  BookOpen, Users, Award, Star, ChevronRight, Play, MessageSquare,
  Zap, Target, TrendingUp, CheckCircle, ArrowRight, Clock, Calendar,
  GraduationCap, Shield, Headphones, Globe
} from "lucide-react";

interface Course {
  id: string;
  title: string;
  slug: string;
  short_desc: string;
  thumbnail_url: string | null;
  price_bdt: number;
  price_usd: number;
  is_free: boolean;
  type: string;
  category: string | null;
  total_duration: number;
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  thumbnail_url: string | null;
  category: string | null;
  read_time: number;
  published_at: string | null;
  profiles: { name: string; avatar_url: string | null } | null;
}

interface Stats {
  total_students: number;
  published_courses: number;
  total_certificates: number;
}

const faqs = [
  { q: "কোর্সগুলো কি বাংলায়?", a: "হ্যাঁ! সকল ভিডিও লেসন বাংলায় তৈরি করা হয়েছে, যাতে সহজে বোঝা যায়।" },
  { q: "কোর্স কিনলে কতদিন অ্যাক্সেস পাবো?", a: "একবার কোর্স কিনলে আজীবন অ্যাক্সেস পাবেন। যেকোনো সময় যেকোনো ডিভাইস থেকে দেখতে পারবেন।" },
  { q: "সার্টিফিকেট কি দেওয়া হয়?", a: "হ্যাঁ! কোর্স সম্পন্ন করলে ও কুইজে পাস করলে ভেরিফাইড সার্টিফিকেট পাবেন।" },
  { q: "পেমেন্ট কিভাবে করবো?", a: "বিকাশ, নগদ, রকেট ও ব্যাংক কার্ড দিয়ে SSLCommerz-এর মাধ্যমে নিরাপদে পেমেন্ট করা যাবে।" },
  { q: "রিফান্ড পাওয়া যাবে?", a: "পেমেন্টের ৭ দিনের মধ্যে রিফান্ডের আবেদন করা যাবে। বিস্তারিত রিফান্ড নীতিতে দেখুন।" },
  { q: "মোবাইলে কি দেখা যাবে?", a: "অবশ্যই! আমাদের প্ল্যাটফর্ম মোবাইল, ট্যাবলেট ও কম্পিউটার সব ডিভাইসে সুন্দরভাবে কাজ করে।" },
];

function StarRating({ count = 5 }: { count?: number }) {
  return (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star key={i} className={`w-3.5 h-3.5 ${i < count ? "fill-yellow-400 text-yellow-400" : "text-gray-600"}`} />
      ))}
    </div>
  );
}

function formatDuration(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h > 0) return `${h}ঘ ${m}মি`;
  return `${m} মিনিট`;
}

export default function HomePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [stats, setStats] = useState<Stats>({ total_students: 0, published_courses: 0, total_certificates: 0 });
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      const [coursesRes, blogsRes, statsRes] = await Promise.all([
        supabase
          .from("courses")
          .select("id,title,slug,short_desc,thumbnail_url,price_bdt,price_usd,is_free,type,category,total_duration")
          .eq("is_published", true)
          .order("created_at", { ascending: false })
          .limit(6),
        supabase
          .from("blog_posts")
          .select("id,title,slug,excerpt,thumbnail_url,category,read_time,published_at,profiles(name,avatar_url)")
          .eq("status", "published")
          .order("published_at", { ascending: false })
          .limit(3),
        supabase.from("super_admin_dashboard").select("total_students,published_courses,total_certificates").single(),
      ]);

      if (coursesRes.data) setCourses(coursesRes.data);
      if (blogsRes.data) setBlogs(blogsRes.data as unknown as BlogPost[]);
      if (statsRes.data) setStats(statsRes.data);
      setLoading(false);
    };
    fetchAll();
  }, []);

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <PublicLayout>
      <SEO
        title="বাংলায় AI শিখুন — ChatGPT, Python, Machine Learning, Data Science কোর্স"
        description="বাংলাদেশের #১ AI শিক্ষামূলক প্ল্যাটফর্ম। বাংলায় ChatGPT, Python, Machine Learning, Data Science, Digital Marketing শিখুন। ৫০,০০০+ শিক্ষার্থী, ১০০+ কোর্স, ভেরিফাইড সার্টিফিকেট ও লাইভ কমিউনিটি। বিকাশ, নগদ, কার্ডে পেমেন্ট।"
        keywords="AI শিখি বাংলায়, বাংলায় AI কোর্স, ChatGPT বাংলা, Python কোর্স বাংলাদেশ, Machine Learning কোর্স, Data Science বাংলা, অনলাইন কোর্স, ডিজিটাল মার্কেটিং, ফ্রিল্যান্সিং, AI সার্টিফিকেট"
        url="/"
        schema={faqSchema}
      />
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-indigo-950 pt-20 pb-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-violet-600/20 via-transparent to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-indigo-600/15 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 mb-6">
              <Zap className="w-4 h-4 text-violet-400" />
              <span className="text-sm text-violet-300 font-medium">বাংলাদেশের #১ AI শিক্ষামূলক প্ল্যাটফর্ম</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
              বাংলায় <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">AI শিখুন</span>,<br />
              ভবিষ্যৎ গড়ুন
            </h1>
            <p className="text-lg sm:text-xl text-gray-300 mb-10 leading-relaxed">
              বাংলাদেশের সেরা AI শিক্ষামূলক প্ল্যাটফর্মে আপনাকে স্বাগতম।<br className="hidden sm:block" />
              ভিডিও লেসন, সার্টিফিকেট ও লাইভ কমিউনিটি সাপোর্ট নিয়ে এগিয়ে যান।
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/courses">
                <button className="flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold px-8 py-4 rounded-2xl transition-all shadow-xl shadow-violet-500/30 text-lg">
                  <BookOpen className="w-5 h-5" />
                  কোর্স দেখুন
                </button>
              </Link>
              <Link href="/signup">
                <button className="flex items-center justify-center gap-2 bg-gray-800/80 hover:bg-gray-700 border border-gray-700 text-white font-semibold px-8 py-4 rounded-2xl transition-all text-lg">
                  <Play className="w-5 h-5 text-violet-400" />
                  বিনামূল্যে শুরু করুন
                </button>
              </Link>
            </div>

            {/* Mini stats */}
            <div className="flex flex-wrap justify-center gap-8 mt-14 pt-8 border-t border-gray-800/60">
              {[
                { icon: Users, value: `${(stats.total_students || 50000).toLocaleString()}+`, label: "শিক্ষার্থী" },
                { icon: BookOpen, value: `${stats.published_courses || 100}+`, label: "কোর্স" },
                { icon: Award, value: `${(stats.total_certificates || 15000).toLocaleString()}+`, label: "সার্টিফিকেট" },
                { icon: Star, value: "৪.৯", label: "রেটিং" },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                    <s.icon className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-white">{s.value}</div>
                    <div className="text-xs text-gray-500">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Featured Courses ── */}
      <section className="py-20 bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-sm font-semibold text-violet-400 uppercase tracking-wider mb-2">জনপ্রিয় কোর্স</p>
              <h2 className="text-3xl font-bold text-white">সেরা কোর্সসমূহ</h2>
            </div>
            <Link href="/courses" className="flex items-center gap-1 text-sm text-violet-400 hover:text-violet-300 transition-colors font-medium">
              সব দেখুন <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-gray-900/60 rounded-2xl overflow-hidden animate-pulse">
                  <div className="h-44 bg-gray-800" />
                  <div className="p-5 space-y-3">
                    <div className="h-4 bg-gray-800 rounded w-3/4" />
                    <div className="h-3 bg-gray-800 rounded w-full" />
                    <div className="h-3 bg-gray-800 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p>শীঘ্রই কোর্স যুক্ত হবে</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <Link key={course.id} href={`/courses/${course.slug}`}>
                  <div className="group bg-gray-900/60 border border-gray-800/60 hover:border-violet-500/40 rounded-2xl overflow-hidden transition-all hover:shadow-xl hover:shadow-violet-500/10 cursor-pointer">
                    <div className="relative h-44 bg-gray-800 overflow-hidden">
                      {course.thumbnail_url ? (
                        <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-900/40 to-indigo-900/40">
                          <BookOpen className="w-12 h-12 text-violet-400/40" />
                        </div>
                      )}
                      <div className="absolute top-3 left-3 flex gap-2">
                        {course.is_free && (
                          <span className="bg-green-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">বিনামূল্যে</span>
                        )}
                        <span className="bg-gray-900/80 backdrop-blur text-gray-300 text-xs font-medium px-2.5 py-1 rounded-full capitalize">{course.type}</span>
                      </div>
                      {course.total_duration > 0 && (
                        <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-gray-900/80 backdrop-blur px-2 py-1 rounded-lg text-xs text-gray-300">
                          <Clock className="w-3 h-3" />
                          {formatDuration(course.total_duration)}
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      {course.category && (
                        <span className="text-xs text-violet-400 font-medium">{course.category}</span>
                      )}
                      <h3 className="font-bold text-white mt-1 mb-2 line-clamp-2 group-hover:text-violet-300 transition-colors">{course.title}</h3>
                      {course.short_desc && (
                        <p className="text-sm text-gray-400 line-clamp-2 mb-3">{course.short_desc}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <StarRating />
                        <div className="text-right">
                          {course.is_free ? (
                            <span className="text-green-400 font-bold">বিনামূল্যে</span>
                          ) : (
                            <span className="text-white font-bold">৳{course.price_bdt.toLocaleString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Why Us ── */}
      <section className="py-20 bg-gradient-to-b from-gray-950 to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-violet-400 uppercase tracking-wider mb-2">কেন আমাদের বেছে নেবেন?</p>
            <h2 className="text-3xl font-bold text-white">আমাদের বিশেষত্ব</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: BookOpen, title: "বাংলায় সহজ লেসন", desc: "সম্পূর্ণ বাংলায় তৈরি ভিডিও লেসন যা সহজে বোঝা যায়" },
              { icon: Award, title: "ভেরিফাইড সার্টিফিকেট", desc: "কোর্স শেষে ভেরিফাইড ডিজিটাল সার্টিফিকেট পাবেন" },
              { icon: Users, title: "লাইভ কমিউনিটি", desc: "হাজারো শিক্ষার্থীর সাথে প্রশ্ন করুন, উত্তর পান" },
              { icon: Target, title: "প্রজেক্ট-ভিত্তিক শিক্ষা", desc: "বাস্তব প্রজেক্টের মাধ্যমে দক্ষতা অর্জন করুন" },
              { icon: TrendingUp, title: "আপডেটেড কনটেন্ট", desc: "নিয়মিত আপডেট হওয়া কোর্স কনটেন্ট" },
              { icon: Zap, title: "মোবাইল ফ্রেন্ডলি", desc: "যেকোনো ডিভাইসে যেকোনো সময় শিখুন" },
            ].map((item, i) => (
              <div key={i} className="group bg-gray-900/60 border border-gray-800/60 hover:border-violet-500/30 rounded-2xl p-6 transition-all hover:shadow-lg hover:shadow-violet-500/5">
                <div className="w-12 h-12 rounded-xl bg-violet-500/10 group-hover:bg-violet-500/20 flex items-center justify-center mb-4 transition-colors">
                  <item.icon className="w-6 h-6 text-violet-400" />
                </div>
                <h3 className="font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-20 bg-gradient-to-r from-violet-900/30 via-gray-900 to-indigo-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {[
              { value: `${(stats.total_students || 50000).toLocaleString()}+`, label: "সন্তুষ্ট শিক্ষার্থী", icon: Users },
              { value: `${stats.published_courses || 100}+`, label: "অ্যাক্টিভ কোর্স", icon: BookOpen },
              { value: `${(stats.total_certificates || 15000).toLocaleString()}+`, label: "সার্টিফিকেট দেওয়া হয়েছে", icon: Award },
              { value: "৪.৯/৫", label: "গড় রেটিং", icon: Star },
            ].map((s, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-2xl bg-violet-500/15 flex items-center justify-center mb-4">
                  <s.icon className="w-7 h-7 text-violet-400" />
                </div>
                <div className="text-3xl font-extrabold text-white mb-1">{s.value}</div>
                <div className="text-sm text-gray-400">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Learning Path ── */}
      <section className="py-20 bg-gray-900/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-violet-400 uppercase tracking-wider mb-2">ধাপে ধাপে শিখুন</p>
            <h2 className="text-3xl font-bold text-white mb-4">আমাদের শিক্ষা পথ</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">শূন্য থেকে শুরু করে বিশেষজ্ঞ হওয়ার সম্পূর্ণ রোডম্যাপ। প্রতিটি ধাপ সহজ ও কার্যকর।</p>
          </div>
          <div className="relative">
            <div className="hidden lg:block absolute top-8 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-600/0 via-violet-600/50 to-violet-600/0" />
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { step: "০১", icon: GraduationCap, title: "বেসিক শিখুন", desc: "AI ও Technology-র মূল বিষয়গুলো সহজ ভাষায় বুঝুন। কোনো পূর্বজ্ঞান দরকার নেই।", color: "from-violet-500 to-purple-600" },
                { step: "০২", icon: BookOpen, title: "কোর্স সম্পন্ন করুন", desc: "ভিডিও লেসন, কুইজ ও প্র্যাকটিক্যাল প্রজেক্টের মাধ্যমে দক্ষতা অর্জন করুন।", color: "from-indigo-500 to-blue-600" },
                { step: "০৩", icon: Users, title: "কমিউনিটিতে যোগ দিন", desc: "হাজারো শিক্ষার্থীর সাথে সংযুক্ত হন, প্রশ্ন করুন ও অভিজ্ঞতা শেয়ার করুন।", color: "from-blue-500 to-cyan-600" },
                { step: "০৪", icon: Award, title: "সার্টিফিকেট পান", desc: "কোর্স সম্পন্ন করে ভেরিফাইড সার্টিফিকেট ডাউনলোড করুন। CV-তে যোগ করুন।", color: "from-emerald-500 to-teal-600" },
              ].map((item, i) => (
                <div key={i} className="relative bg-gray-900 border border-gray-800/60 rounded-2xl p-6 hover:border-violet-500/30 transition-all hover:shadow-lg">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-4 shadow-lg`}>
                    <item.icon className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-xs font-bold text-gray-600 tracking-widest">{item.step}</span>
                  <h3 className="font-bold text-white text-lg mt-1 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Blog Preview ── */}
      <section className="py-20 bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-sm font-semibold text-violet-400 uppercase tracking-wider mb-2">সর্বশেষ</p>
              <h2 className="text-3xl font-bold text-white">ব্লগ ও আর্টিকেল</h2>
            </div>
            <Link href="/blog" className="flex items-center gap-1 text-sm text-violet-400 hover:text-violet-300 transition-colors font-medium">
              সব দেখুন <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {blogs.length === 0 ? (
            <div className="grid sm:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-gray-900/60 rounded-2xl overflow-hidden border border-gray-800/60 p-6 text-center text-gray-600">
                  শীঘ্রই আসছে...
                </div>
              ))}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogs.map((post) => (
                <Link key={post.id} href={`/blog/${post.slug}`}>
                  <div className="group bg-gray-900/60 border border-gray-800/60 hover:border-violet-500/40 rounded-2xl overflow-hidden transition-all hover:shadow-xl hover:shadow-violet-500/10 cursor-pointer">
                    <div className="h-44 bg-gray-800 overflow-hidden">
                      {post.thumbnail_url ? (
                        <img src={post.thumbnail_url} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-900/40 to-purple-900/40">
                          <MessageSquare className="w-12 h-12 text-indigo-400/40" />
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      {post.category && (
                        <span className="text-xs text-violet-400 font-medium">{post.category}</span>
                      )}
                      <h3 className="font-bold text-white mt-1 mb-2 line-clamp-2 group-hover:text-violet-300 transition-colors">{post.title}</h3>
                      {post.excerpt && <p className="text-sm text-gray-400 line-clamp-2 mb-3">{post.excerpt}</p>}
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{post.read_time} মিনিট</span>
                        {post.published_at && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(post.published_at).toLocaleDateString("bn-BD")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Community Preview ── */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-sm font-semibold text-violet-400 uppercase tracking-wider mb-3">লাইভ কমিউনিটি</p>
              <h2 className="text-3xl font-bold text-white mb-5">একসাথে শিখি, একসাথে বাড়ি</h2>
              <p className="text-gray-400 leading-relaxed mb-8">
                হাজারো শিক্ষার্থীর সাথে সংযুক্ত হন। প্রশ্ন করুন, উত্তর পান, অভিজ্ঞতা শেয়ার করুন। আমাদের সক্রিয় কমিউনিটিতে আপনার যাত্রা আরও সহজ হবে।
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "প্রতিদিন নতুন পোস্ট ও আলোচনা",
                  "বিশেষজ্ঞদের সরাসরি সাড়া",
                  "প্রজেক্ট শেয়ারিং ও ফিডব্যাক",
                  "নিরাপদ ও সম্মানজনক পরিবেশ",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-gray-300">
                    <CheckCircle className="w-5 h-5 text-violet-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/community">
                <button className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors">
                  কমিউনিটিতে যোগ দিন <ChevronRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
            <div className="bg-gray-800/60 border border-gray-700/60 rounded-2xl p-6">
              <div className="space-y-4">
                {[
                  { name: "রাহেলা বেগম", time: "২ ঘন্টা আগে", msg: "ChatGPT দিয়ে কিভাবে ব্যবসার প্রমো কন্টেন্ট তৈরি করবো?" },
                  { name: "কামাল হোসেন", time: "৫ ঘন্টা আগে", msg: "Python দিয়ে data analysis শেখার জন্য কোন কোর্সটা সেরা হবে?" },
                  { name: "তানিয়া ইসলাম", time: "১ দিন আগে", msg: "AI শিখে freelancing শুরু করেছি, প্রথম ক্লায়েন্ট পেয়েছি! 🎉" },
                ].map((post, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-gray-900/60 rounded-xl">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {post.name[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-white">{post.name}</span>
                        <span className="text-xs text-gray-500">{post.time}</span>
                      </div>
                      <p className="text-sm text-gray-300">{post.msg}</p>
                    </div>
                  </div>
                ))}
                <p className="text-center text-xs text-gray-500 pt-2">কমিউনিটিতে লগইন করে আলোচনায় যোগ দিন</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-20 bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-violet-400 uppercase tracking-wider mb-2">সাফল্যের গল্প</p>
            <h2 className="text-3xl font-bold text-white">শিক্ষার্থীরা কী বলছেন</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: "আরিফ হোসেন", role: "Freelancer", review: "AI শিখি বাংলায়-এর ChatGPT কোর্সটি আমার ক্যারিয়ার বদলে দিয়েছে। এখন মাসে ৫০,০০০+ টাকা ইনকাম করছি।" },
              { name: "শাহিনা বেগম", role: "Digital Marketer", review: "বাংলায় এত সুন্দর করে AI শেখানো আগে কোথাও পাইনি। কোর্সের কনটেন্ট অসাধারণ।" },
              { name: "রিয়াদ আহমেদ", role: "Student", review: "ভার্সিটি পড়ার পাশাপাশি AI শিখে ফ্রিল্যান্সিং শুরু করেছি। সার্টিফিকেটটা CV-তে অনেক কাজে দিচ্ছে।" },
              { name: "নাসরিন আক্তার", role: "Content Creator", review: "কমিউনিটিতে অনেক সাহায্য পেয়েছি। সবাই খুব সহযোগিতামূলক।" },
              { name: "ফারুক আলম", role: "Entrepreneur", review: "Data Science কোর্সটি শেষ করে নিজের ব্যবসার ডেটা এখন নিজেই বিশ্লেষণ করতে পারি।" },
              { name: "মেহেদী হাসান", role: "Developer", review: "Python কোর্সটি খুবই practical। রিয়েল প্রজেক্টের মাধ্যমে শেখানো হয়েছে।" },
            ].map((t, i) => (
              <div key={i} className="bg-gray-900/60 border border-gray-800/60 rounded-2xl p-6">
                <StarRating />
                <p className="text-sm text-gray-300 my-4 leading-relaxed">"{t.review}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{t.name}</div>
                    <div className="text-xs text-gray-500">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-violet-400 uppercase tracking-wider mb-2">সাধারণ প্রশ্ন</p>
            <h2 className="text-3xl font-bold text-white">সচরাচর জিজ্ঞাসা</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-gray-800/60 border border-gray-700/60 rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 p-5 text-left"
                >
                  <span className="font-medium text-white">{faq.q}</span>
                  <ChevronRight className={`w-5 h-5 text-violet-400 flex-shrink-0 transition-transform ${openFaq === i ? "rotate-90" : ""}`} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-sm text-gray-400 leading-relaxed border-t border-gray-700/60 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust Badges ── */}
      <section className="py-12 bg-gray-900 border-y border-gray-800/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs text-gray-500 font-medium uppercase tracking-widest mb-8">আমাদের বিশ্বাসযোগ্যতা</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {[
              { icon: Shield, title: "SSL নিরাপদ পেমেন্ট", desc: "SSLCommerz দ্বারা সুরক্ষিত" },
              { icon: Headphones, title: "২৪/৭ সাপোর্ট", desc: "WhatsApp ও ইমেইলে সহায়তা" },
              { icon: Globe, title: "যেকোনো ডিভাইসে", desc: "মোবাইল, ট্যাবলেট ও পিসি" },
              { icon: Award, title: "ISO সার্টিফাইড", desc: "মানসম্পন্ন শিক্ষা নিশ্চিত" },
            ].map((b, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-xl bg-gray-800 flex items-center justify-center mb-3">
                  <b.icon className="w-6 h-6 text-violet-400" />
                </div>
                <div className="text-sm font-semibold text-white">{b.title}</div>
                <div className="text-xs text-gray-500 mt-1">{b.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 bg-gradient-to-br from-violet-900/40 via-gray-950 to-indigo-900/40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-5">আজই শুরু করুন আপনার AI শিক্ষার যাত্রা</h2>
          <p className="text-lg text-gray-300 mb-4">বিনামূল্যে রেজিস্ট্রেশন করুন। কোনো ক্রেডিট কার্ড দরকার নেই।</p>
          <p className="text-sm text-gray-500 mb-10">ইতিমধ্যে ৫০,০০০+ শিক্ষার্থী তাদের AI শিক্ষার যাত্রা শুরু করেছেন। আপনিও যোগ দিন!</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <button className="flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold px-8 py-4 rounded-2xl transition-all shadow-xl shadow-violet-500/30 text-lg">
                বিনামূল্যে শুরু করুন <ChevronRight className="w-5 h-5" />
              </button>
            </Link>
            <Link href="/courses">
              <button className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-semibold px-8 py-4 rounded-2xl transition-all text-lg">
                কোর্স দেখুন
              </button>
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
