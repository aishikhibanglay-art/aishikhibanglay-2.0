import { useState, useEffect } from "react";
import { Link } from "wouter";
import { supabase } from "@/lib/supabase";
import { getIcon } from "@/lib/iconMap";
import PublicLayout from "@/layouts/PublicLayout";
import { SEO } from "@/components/SEO";
import {
  BookOpen, Users, Award, Star, ChevronRight, Play,
  ArrowRight, Clock, CheckCircle, Zap, Calendar, MessageSquare
} from "lucide-react";
import {
  DEFAULT_HERO, DEFAULT_FEATURES, DEFAULT_STEPS, DEFAULT_COMMUNITY,
  DEFAULT_TESTIMONIALS, DEFAULT_FAQS, DEFAULT_TRUST_BADGES, DEFAULT_CTA
} from "@/lib/homeDefaults";

interface Course {
  id: string; title: string; slug: string; short_desc: string;
  thumbnail_url: string | null; price_bdt: number; is_free: boolean;
  type: string; category: string | null; total_duration: number;
}
interface BlogPost {
  id: string; title: string; slug: string; excerpt: string | null;
  thumbnail_url: string | null; category: string | null; read_time: number;
  published_at: string | null; profiles: { name: string } | null;
}
interface CommunityPost {
  id: string; title: string; content: string; author_name: string; created_at: string;
}
interface SiteStats {
  total_students: number; published_courses: number; total_certificates: number;
}

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
  const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60);
  return h > 0 ? `${h}ঘ ${m}মি` : `${m} মিনিট`;
}

// Helper to fetch a setting key with JSON parse + default fallback
async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const { data } = await supabase.from("site_settings").select("value").eq("key", key).maybeSingle();
  if (!data?.value) return fallback;
  try { return JSON.parse(data.value) as T; } catch { return fallback; }
}

export default function HomePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
  const [siteStats, setSiteStats] = useState<SiteStats>({ total_students: 0, published_courses: 0, total_certificates: 0 });
  const [avgRating, setAvgRating] = useState(4.9);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Dynamic content from site_settings
  const [hero, setHero] = useState(DEFAULT_HERO);
  const [features, setFeatures] = useState(DEFAULT_FEATURES);
  const [steps, setSteps] = useState(DEFAULT_STEPS);
  const [community, setCommunity] = useState(DEFAULT_COMMUNITY);
  const [testimonials, setTestimonials] = useState(DEFAULT_TESTIMONIALS);
  const [faqs, setFaqs] = useState(DEFAULT_FAQS);
  const [trustBadges, setTrustBadges] = useState(DEFAULT_TRUST_BADGES);
  const [cta, setCta] = useState(DEFAULT_CTA);

  useEffect(() => {
    const fetchAll = async () => {
      const [
        coursesRes, blogsRes, statsRes, communityRes, reviewsRes,
        heroVal, featuresVal, stepsVal, communityVal,
        testimonialsVal, faqsVal, trustVal, ctaVal,
      ] = await Promise.all([
        supabase.from("courses").select("id,title,slug,short_desc,thumbnail_url,price_bdt,is_free,type,category,total_duration").eq("is_published", true).order("created_at", { ascending: false }).limit(6),
        supabase.from("blog_posts").select("id,title,slug,excerpt,thumbnail_url,category,read_time,published_at,profiles(name)").eq("status", "published").order("published_at", { ascending: false }).limit(3),
        supabase.from("super_admin_dashboard").select("total_students,published_courses,total_certificates").maybeSingle(),
        supabase.from("community_posts").select("id,title,content,created_at,profiles(name)").eq("status", "published").order("created_at", { ascending: false }).limit(3),
        supabase.from("course_reviews").select("rating").eq("is_approved", true),
        getSetting("hero_content", DEFAULT_HERO),
        getSetting("home_features", DEFAULT_FEATURES),
        getSetting("home_steps", DEFAULT_STEPS),
        getSetting("community_content", DEFAULT_COMMUNITY),
        getSetting("home_testimonials", DEFAULT_TESTIMONIALS),
        getSetting("home_faqs", DEFAULT_FAQS),
        getSetting("trust_badges", DEFAULT_TRUST_BADGES),
        getSetting("cta_content", DEFAULT_CTA),
      ]);

      if (coursesRes.data) setCourses(coursesRes.data);
      if (blogsRes.data) setBlogs(blogsRes.data as unknown as BlogPost[]);
      if (statsRes.data) setSiteStats(statsRes.data);
      if (communityRes.data) {
        setCommunityPosts(communityRes.data.map((p: any) => ({
          id: p.id, title: p.title,
          content: p.content?.replace(/<[^>]*>/g, "").slice(0, 100) || "",
          author_name: p.profiles?.name || "শিক্ষার্থী",
          created_at: p.created_at,
        })));
      }
      if (reviewsRes.data && reviewsRes.data.length > 0) {
        const avg = reviewsRes.data.reduce((s: number, r: any) => s + r.rating, 0) / reviewsRes.data.length;
        setAvgRating(Math.round(avg * 10) / 10);
      }

      setHero(heroVal);
      setFeatures(featuresVal);
      setSteps(stepsVal);
      setCommunity(communityVal);
      setTestimonials(testimonialsVal);
      setFaqs(faqsVal);
      setTrustBadges(trustVal);
      setCta(ctaVal);
      setLoading(false);
    };
    fetchAll();
  }, []);

  const timeAgo = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const h = Math.floor(diff / 3600000);
    if (h < 1) return "এইমাত্র";
    if (h < 24) return `${h} ঘন্টা আগে`;
    return `${Math.floor(h / 24)} দিন আগে`;
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question", name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <PublicLayout>
      <SEO
        title="বাংলায় AI শিখুন — ChatGPT, Python, Machine Learning, Data Science কোর্স"
        description="বাংলাদেশের #১ AI শিক্ষামূলক প্ল্যাটফর্ম। বাংলায় ChatGPT, Python, Machine Learning, Data Science শিখুন।"
        keywords="AI শিখি বাংলায়, বাংলায় AI কোর্স, ChatGPT বাংলা, Python কোর্স বাংলাদেশ"
        url="/"
        schema={faqSchema}
      />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-indigo-950 pt-20 pb-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-violet-600/20 via-transparent to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-indigo-600/15 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl mx-auto text-center">
            {hero.badge && (
              <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 mb-6">
                <Zap className="w-4 h-4 text-violet-400" />
                <span className="text-sm text-violet-300 font-medium">{hero.badge}</span>
              </div>
            )}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
              {hero.headline_pre && <>{hero.headline_pre} </>}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">{hero.headline_highlight}</span>
              {hero.headline_post && <>,<br />{hero.headline_post}</>}
            </h1>
            <p className="text-lg sm:text-xl text-gray-300 mb-10 leading-relaxed">
              {hero.description}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/courses">
                <button className="flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold px-8 py-4 rounded-2xl transition-all shadow-xl shadow-violet-500/30 text-lg">
                  <BookOpen className="w-5 h-5" /> {hero.cta1_text}
                </button>
              </Link>
              <Link href="/signup">
                <button className="flex items-center justify-center gap-2 bg-gray-800/80 hover:bg-gray-700 border border-gray-700 text-white font-semibold px-8 py-4 rounded-2xl transition-all text-lg">
                  <Play className="w-5 h-5 text-violet-400" /> {hero.cta2_text}
                </button>
              </Link>
            </div>
            {/* Mini stats */}
            <div className="flex flex-wrap justify-center gap-8 mt-14 pt-8 border-t border-gray-800/60">
              {[
                { icon: Users, value: `${(siteStats.total_students || 50000).toLocaleString()}+`, label: "শিক্ষার্থী" },
                { icon: BookOpen, value: `${siteStats.published_courses || 100}+`, label: "কোর্স" },
                { icon: Award, value: `${(siteStats.total_certificates || 15000).toLocaleString()}+`, label: "সার্টিফিকেট" },
                { icon: Star, value: `${avgRating}`, label: "রেটিং" },
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
                        {course.is_free && <span className="bg-green-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">বিনামূল্যে</span>}
                        <span className="bg-gray-900/80 backdrop-blur text-gray-300 text-xs font-medium px-2.5 py-1 rounded-full capitalize">{course.type}</span>
                      </div>
                      {course.total_duration > 0 && (
                        <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-gray-900/80 backdrop-blur px-2 py-1 rounded-lg text-xs text-gray-300">
                          <Clock className="w-3 h-3" /> {formatDuration(course.total_duration)}
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      {course.category && <span className="text-xs text-violet-400 font-medium">{course.category}</span>}
                      <h3 className="font-bold text-white mt-1 mb-2 line-clamp-2 group-hover:text-violet-300 transition-colors">{course.title}</h3>
                      {course.short_desc && <p className="text-sm text-gray-400 line-clamp-2 mb-3">{course.short_desc}</p>}
                      <div className="flex items-center justify-between">
                        <StarRating />
                        <div className="text-right">
                          {course.is_free ? <span className="text-green-400 font-bold">বিনামূল্যে</span> : <span className="text-white font-bold">৳{course.price_bdt.toLocaleString()}</span>}
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

      {/* ── Why Us / Features ── */}
      <section className="py-20 bg-gradient-to-b from-gray-950 to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-violet-400 uppercase tracking-wider mb-2">কেন আমাদের বেছে নেবেন?</p>
            <h2 className="text-3xl font-bold text-white">আমাদের বিশেষত্ব</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((item, i) => {
              const Icon = getIcon(item.icon);
              return (
                <div key={i} className="group bg-gray-900/60 border border-gray-800/60 hover:border-violet-500/30 rounded-2xl p-6 transition-all hover:shadow-lg hover:shadow-violet-500/5">
                  <div className="w-12 h-12 rounded-xl bg-violet-500/10 group-hover:bg-violet-500/20 flex items-center justify-center mb-4 transition-colors">
                    <Icon className="w-6 h-6 text-violet-400" />
                  </div>
                  <h3 className="font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-20 bg-gradient-to-r from-violet-900/30 via-gray-900 to-indigo-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {[
              { value: `${(siteStats.total_students || 50000).toLocaleString()}+`, label: "সন্তুষ্ট শিক্ষার্থী", icon: Users },
              { value: `${siteStats.published_courses || 100}+`, label: "অ্যাক্টিভ কোর্স", icon: BookOpen },
              { value: `${(siteStats.total_certificates || 15000).toLocaleString()}+`, label: "সার্টিফিকেট দেওয়া হয়েছে", icon: Award },
              { value: `${avgRating}/৫`, label: "গড় রেটিং", icon: Star },
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

      {/* ── Learning Path / Steps ── */}
      <section className="py-20 bg-gray-900/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-violet-400 uppercase tracking-wider mb-2">ধাপে ধাপে শিখুন</p>
            <h2 className="text-3xl font-bold text-white mb-4">আমাদের শিক্ষা পথ</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">শূন্য থেকে শুরু করে বিশেষজ্ঞ হওয়ার সম্পূর্ণ রোডম্যাপ।</p>
          </div>
          <div className="relative">
            <div className="hidden lg:block absolute top-8 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-600/0 via-violet-600/50 to-violet-600/0" />
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {steps.map((item, i) => {
                const Icon = getIcon(item.icon);
                return (
                  <div key={i} className="relative bg-gray-900 border border-gray-800/60 rounded-2xl p-6 hover:border-violet-500/30 transition-all hover:shadow-lg">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${item.color || "from-violet-500 to-indigo-600"} flex items-center justify-center mb-4 shadow-lg`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <span className="text-xs font-bold text-gray-600 tracking-widest">{item.step}</span>
                    <h3 className="font-bold text-white text-lg mt-1 mb-2">{item.title}</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── Community Preview ── */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-sm font-semibold text-violet-400 uppercase tracking-wider mb-3">লাইভ কমিউনিটি</p>
              <h2 className="text-3xl font-bold text-white mb-5">{community.title}</h2>
              <p className="text-gray-400 leading-relaxed mb-8">{community.description}</p>
              <ul className="space-y-3 mb-8">
                {(community.bullets || []).map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-gray-300">
                    <CheckCircle className="w-5 h-5 text-violet-400 flex-shrink-0" /> {item}
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
                {communityPosts.length > 0 ? communityPosts.map((post) => (
                  <div key={post.id} className="flex items-start gap-3 p-3 bg-gray-900/60 rounded-xl">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {post.author_name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-white">{post.author_name}</span>
                        <span className="text-xs text-gray-500">{timeAgo(post.created_at)}</span>
                      </div>
                      <p className="text-sm text-gray-300 font-medium truncate">{post.title}</p>
                      {post.content && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{post.content}...</p>}
                    </div>
                  </div>
                )) : (
                  // Fallback if no community posts yet
                  [
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
                  ))
                )}
                <p className="text-center text-xs text-gray-500 pt-2">
                  {communityPosts.length > 0 ? "সর্বশেষ কমিউনিটি পোস্ট" : "কমিউনিটিতে লগইন করে আলোচনায় যোগ দিন"}
                </p>
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
            {testimonials.map((t, i) => (
              <div key={i} className="bg-gray-900/60 border border-gray-800/60 rounded-2xl p-6">
                <StarRating count={t.rating || 5} />
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

      {/* ── Blog Preview ── */}
      {blogs.length > 0 && (
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
                      {post.category && <span className="text-xs text-violet-400 font-medium">{post.category}</span>}
                      <h3 className="font-bold text-white mt-1 mb-2 line-clamp-2 group-hover:text-violet-300 transition-colors">{post.title}</h3>
                      {post.excerpt && <p className="text-sm text-gray-400 line-clamp-2 mb-3">{post.excerpt}</p>}
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{post.read_time} মিনিট</span>
                        {post.published_at && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(post.published_at).toLocaleDateString("bn-BD")}</span>}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

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
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 p-5 text-left">
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
            {trustBadges.map((b, i) => {
              const Icon = getIcon(b.icon);
              return (
                <div key={i} className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-xl bg-gray-800 flex items-center justify-center mb-3">
                    <Icon className="w-6 h-6 text-violet-400" />
                  </div>
                  <div className="text-sm font-semibold text-white">{b.title}</div>
                  <div className="text-xs text-gray-500 mt-1">{b.desc}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 bg-gradient-to-br from-violet-900/40 via-gray-950 to-indigo-900/40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-5">{cta.headline}</h2>
          <p className="text-lg text-gray-300 mb-4">{cta.description}</p>
          {cta.subtitle && <p className="text-sm text-gray-500 mb-10">{cta.subtitle}</p>}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <button className="flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold px-8 py-4 rounded-2xl transition-all shadow-xl shadow-violet-500/30 text-lg">
                {cta.cta1_text} <ChevronRight className="w-5 h-5" />
              </button>
            </Link>
            <Link href="/courses">
              <button className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-semibold px-8 py-4 rounded-2xl transition-all text-lg">
                {cta.cta2_text}
              </button>
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
