import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { supabase } from "@/lib/supabase";
import PublicLayout from "@/layouts/PublicLayout";
import { SEO } from "@/components/SEO";
import {
  Search, BookOpen, Filter, X, Grid, List, Star, Clock, Users,
  ChevronLeft, ChevronRight, SlidersHorizontal, CheckCircle, Award, Zap
} from "lucide-react";

interface Course {
  id: string;
  title: string;
  slug: string;
  short_desc: string | null;
  thumbnail_url: string | null;
  price_bdt: number;
  price_usd: number;
  is_free: boolean;
  type: string;
  category: string | null;
  total_duration: number;
  instructor_id: string | null;
  profiles: { name: string; avatar_url: string | null } | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

const PAGE_SIZE = 12;

function formatDuration(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h > 0) return `${h}ঘ ${m}মি`;
  return `${m}মি`;
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [priceFilter, setPriceFilter] = useState<"all" | "free" | "paid">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "video" | "pdf" | "template">("all");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    supabase.from("course_categories").select("id,name,slug").order("order_index").then(({ data }) => {
      if (data) setCategories(data);
    });
  }, []);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("courses")
      .select("id,title,slug,short_desc,thumbnail_url,price_bdt,price_usd,is_free,type,category,total_duration,profiles(name,avatar_url)", { count: "exact" })
      .eq("is_published", true);

    if (search) query = query.ilike("title", `%${search}%`);
    if (selectedCategory) query = query.eq("category", selectedCategory);
    if (priceFilter === "free") query = query.eq("is_free", true);
    if (priceFilter === "paid") query = query.eq("is_free", false);
    if (typeFilter !== "all") query = query.eq("type", typeFilter);

    const { data, count } = await query
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (data) setCourses(data as unknown as Course[]);
    if (count !== null) setTotal(count);
    setLoading(false);
  }, [search, selectedCategory, priceFilter, typeFilter, page]);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(0);
  };

  const clearFilters = () => {
    setSearch(""); setSearchInput(""); setSelectedCategory(null);
    setPriceFilter("all"); setTypeFilter("all"); setPage(0);
  };

  const hasFilters = search || selectedCategory || priceFilter !== "all" || typeFilter !== "all";

  const courseListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "AI শিখি বাংলায় কোর্সসমূহ",
    description: "বাংলাদেশের সেরা AI, Python, Machine Learning, Data Science কোর্স",
    url: "https://aishikhibanglay.com/courses",
    itemListElement: courses.slice(0, 10).map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.title,
      url: `https://aishikhibanglay.com/courses/${c.slug}`,
    })),
  };

  return (
    <PublicLayout>
      <SEO
        title="সকল কোর্সসমূহ — AI, Python, Machine Learning, Data Science বাংলায়"
        description="বাংলাদেশের সেরা AI ও Technology কোর্স সমূহ। ChatGPT, Python, Machine Learning, Data Science, Digital Marketing, Graphic Design, Freelancing কোর্স বাংলায়। ভেরিফাইড সার্টিফিকেট, আজীবন অ্যাক্সেস, বিকাশ/নগদে পেমেন্ট।"
        keywords="AI কোর্স বাংলাদেশ, ChatGPT কোর্স, Python কোর্স বাংলা, Machine Learning কোর্স, Data Science বাংলা, Digital Marketing কোর্স, Freelancing কোর্স, বাংলায় কোর্স, অনলাইন কোর্স বাংলাদেশ"
        url="/courses"
        schema={courseListSchema}
      />
      {/* Hero */}
      <section className="bg-gradient-to-b from-gray-900 to-gray-950 py-16 border-b border-gray-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">সকল কোর্সসমূহ</h1>
          <p className="text-gray-400 mb-8">বাংলায় AI ও Technology শিখুন — বিশেষজ্ঞদের সাথে</p>
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="কোর্স খুঁজুন..."
                className="w-full bg-gray-800 border border-gray-700 focus:border-violet-500 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 outline-none transition-colors"
              />
            </div>
            <button type="submit" className="bg-violet-600 hover:bg-violet-700 text-white font-medium px-6 py-3 rounded-xl transition-colors">
              খুঁজুন
            </button>
          </form>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 text-sm font-medium px-4 py-2 rounded-xl transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4" /> ফিল্টার
            </button>
            {hasFilters && (
              <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors">
                <X className="w-3 h-3" /> ফিল্টার মুছুন
              </button>
            )}
            <span className="text-sm text-gray-500">{total} টি কোর্স পাওয়া গেছে</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setView("grid")} className={`p-2 rounded-lg transition-colors ${view === "grid" ? "bg-violet-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"}`}>
              <Grid className="w-4 h-4" />
            </button>
            <button onClick={() => setView("list")} className={`p-2 rounded-lg transition-colors ${view === "list" ? "bg-violet-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"}`}>
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-gray-900/60 border border-gray-800/60 rounded-2xl p-6 mb-8">
            <div className="grid sm:grid-cols-3 gap-6">
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-3">ক্যাটাগরি</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => { setSelectedCategory(null); setPage(0); }}
                    className={`text-xs px-3 py-1.5 rounded-full transition-colors ${!selectedCategory ? "bg-violet-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"}`}
                  >
                    সব
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => { setSelectedCategory(cat.name); setPage(0); }}
                      className={`text-xs px-3 py-1.5 rounded-full transition-colors ${selectedCategory === cat.name ? "bg-violet-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"}`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-3">মূল্য</label>
                <div className="flex flex-wrap gap-2">
                  {(["all", "free", "paid"] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => { setPriceFilter(p); setPage(0); }}
                      className={`text-xs px-3 py-1.5 rounded-full transition-colors ${priceFilter === p ? "bg-violet-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"}`}
                    >
                      {p === "all" ? "সব" : p === "free" ? "বিনামূল্যে" : "পেইড"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-3">ধরন</label>
                <div className="flex flex-wrap gap-2">
                  {(["all", "video", "pdf", "template"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => { setTypeFilter(t); setPage(0); }}
                      className={`text-xs px-3 py-1.5 rounded-full transition-colors ${typeFilter === t ? "bg-violet-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"}`}
                    >
                      {t === "all" ? "সব" : t === "video" ? "ভিডিও" : t === "pdf" ? "PDF" : "টেমপ্লেট"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Category Tabs */}
        <div className="flex gap-2 flex-wrap mb-8">
          <button
            onClick={() => { setSelectedCategory(null); setPage(0); }}
            className={`text-sm px-4 py-2 rounded-full border transition-colors ${!selectedCategory ? "bg-violet-600 border-violet-600 text-white" : "border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white"}`}
          >
            সব
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => { setSelectedCategory(cat.name); setPage(0); }}
              className={`text-sm px-4 py-2 rounded-full border transition-colors ${selectedCategory === cat.name ? "bg-violet-600 border-violet-600 text-white" : "border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white"}`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Courses Grid/List */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-gray-900/60 rounded-2xl overflow-hidden animate-pulse">
                <div className="h-40 bg-gray-800" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-gray-800 rounded w-3/4" />
                  <div className="h-3 bg-gray-800 rounded" />
                  <div className="h-3 bg-gray-800 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-24">
            <BookOpen className="w-16 h-16 mx-auto text-gray-700 mb-4" />
            <p className="text-gray-400 font-medium">কোনো কোর্স পাওয়া যায়নি</p>
            {hasFilters && (
              <button onClick={clearFilters} className="mt-4 text-sm text-violet-400 hover:text-violet-300">
                ফিল্টার মুছুন
              </button>
            )}
          </div>
        ) : view === "grid" ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {courses.map((course) => (
              <Link key={course.id} href={`/courses/${course.slug}`}>
                <div className="group bg-gray-900/60 border border-gray-800/60 hover:border-violet-500/40 rounded-2xl overflow-hidden transition-all hover:shadow-xl hover:shadow-violet-500/10 cursor-pointer h-full flex flex-col">
                  <div className="relative h-40 bg-gray-800 flex-shrink-0">
                    {course.thumbnail_url ? (
                      <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-900/40 to-indigo-900/40">
                        <BookOpen className="w-10 h-10 text-violet-400/40" />
                      </div>
                    )}
                    <div className="absolute top-2 left-2 flex gap-1.5">
                      {course.is_free && <span className="bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">ফ্রি</span>}
                      <span className="bg-gray-900/80 text-gray-300 text-xs px-2 py-0.5 rounded-full capitalize">{course.type}</span>
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    {course.category && <span className="text-xs text-violet-400 mb-1">{course.category}</span>}
                    <h3 className="font-semibold text-white text-sm line-clamp-2 mb-2 group-hover:text-violet-300 transition-colors flex-1">{course.title}</h3>
                    {course.profiles && (
                      <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                        <Users className="w-3 h-3" /> {course.profiles.name}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        {course.total_duration > 0 && (
                          <><Clock className="w-3 h-3" />{formatDuration(course.total_duration)}</>
                        )}
                      </div>
                      <span className={`font-bold text-sm ${course.is_free ? "text-green-400" : "text-white"}`}>
                        {course.is_free ? "বিনামূল্যে" : `৳${course.price_bdt.toLocaleString()}`}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {courses.map((course) => (
              <Link key={course.id} href={`/courses/${course.slug}`}>
                <div className="group bg-gray-900/60 border border-gray-800/60 hover:border-violet-500/40 rounded-2xl overflow-hidden transition-all hover:shadow-lg cursor-pointer flex gap-4 p-4">
                  <div className="w-36 h-24 rounded-xl bg-gray-800 flex-shrink-0 overflow-hidden">
                    {course.thumbnail_url ? (
                      <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-900/40 to-indigo-900/40">
                        <BookOpen className="w-8 h-8 text-violet-400/40" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        {course.category && <span className="text-xs text-violet-400">{course.category}</span>}
                        <h3 className="font-semibold text-white group-hover:text-violet-300 transition-colors mt-0.5 line-clamp-1">{course.title}</h3>
                        {course.short_desc && <p className="text-sm text-gray-400 line-clamp-1 mt-1">{course.short_desc}</p>}
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-yellow-400 text-yellow-400" /> ৪.৯</span>
                          {course.total_duration > 0 && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDuration(course.total_duration)}</span>}
                          <span className="capitalize bg-gray-800 px-2 py-0.5 rounded-full">{course.type}</span>
                          {course.is_free && <span className="bg-green-500/15 text-green-400 px-2 py-0.5 rounded-full">বিনামূল্যে</span>}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className={`font-bold text-lg ${course.is_free ? "text-green-400" : "text-white"}`}>
                          {course.is_free ? "ফ্রি" : `৳${course.price_bdt.toLocaleString()}`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-12">
            <button
              onClick={() => setPage(p => p - 1)}
              disabled={page === 0}
              className="p-2 rounded-xl bg-gray-800 text-gray-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={`w-10 h-10 rounded-xl text-sm font-medium transition-colors ${page === i ? "bg-violet-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"}`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page >= totalPages - 1}
              className="p-2 rounded-xl bg-gray-800 text-gray-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Rich content for SEO */}
      <section className="py-16 bg-gray-900 border-t border-gray-800/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">কেন AI শিখি বাংলায়ের কোর্স বেছে নেবেন?</h2>
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              { icon: CheckCircle, title: "বাংলায় সম্পূর্ণ কোর্স", desc: "সকল কোর্স শতভাগ বাংলায় তৈরি। ইংরেজি না জানলেও সমস্যা নেই, শূন্য থেকে শুরু করা যাবে।" },
              { icon: Award, title: "ভেরিফাইড সার্টিফিকেট", desc: "প্রতিটি কোর্স সম্পন্ন করলে QR কোড যুক্ত ভেরিফাইড ডিজিটাল সার্টিফিকেট পাবেন।" },
              { icon: Zap, title: "আজীবন অ্যাক্সেস", desc: "একবার কিনলে আজীবন অ্যাক্সেস। কোর্স আপডেট হলেও নতুন কনটেন্ট বিনামূল্যে পাবেন।" },
            ].map((item, i) => (
              <div key={i} className="flex gap-4 p-5 bg-gray-800/60 rounded-xl border border-gray-700/60">
                <item.icon className="w-6 h-6 text-violet-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-white mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-gray-800/40 border border-gray-700/60 rounded-2xl p-8">
            <h2 className="text-xl font-bold text-white mb-4">আমাদের কোর্স ক্যাটাগরি</h2>
            <div className="text-gray-300 leading-relaxed space-y-3">
              <p>
                <strong className="text-white">AI ও Machine Learning:</strong> ChatGPT, Gemini, Claude সহ সর্বশেষ AI টুলস ব্যবহার করতে শিখুন। Prompt Engineering, AI Image Generation, AI Video Creation সহ আরও অনেক কিছু।
              </p>
              <p>
                <strong className="text-white">Python Programming:</strong> শূন্য থেকে শুরু করে Python প্রোগ্রামিং শিখুন। Data Analysis, Automation, Web Scraping, Machine Learning Implementation সহ।
              </p>
              <p>
                <strong className="text-white">Data Science:</strong> ডেটা সংগ্রহ, পরিষ্কার, বিশ্লেষণ ও ভিজ্যুয়ালাইজেশন শিখুন। Pandas, NumPy, Matplotlib, Seaborn সহ সব প্রয়োজনীয় টুলস।
              </p>
              <p>
                <strong className="text-white">Digital Marketing:</strong> Facebook Ads, Google Ads, SEO, Email Marketing, Social Media Marketing — সম্পূর্ণ ডিজিটাল মার্কেটিং বাংলায় শিখুন।
              </p>
              <p>
                <strong className="text-white">Freelancing:</strong> Upwork, Fiverr, Freelancer.com-এ সফল ফ্রিল্যান্সার হওয়ার সম্পূর্ণ গাইড। প্রোফাইল তৈরি থেকে পেমেন্ট পাওয়া পর্যন্ত।
              </p>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
