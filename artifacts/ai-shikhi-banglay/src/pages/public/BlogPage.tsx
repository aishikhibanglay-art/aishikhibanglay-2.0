import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { supabase } from "@/lib/supabase";
import PublicLayout from "@/layouts/PublicLayout";
import { SEO } from "@/components/SEO";
import {
  Search, MessageSquare, Clock, Calendar, ChevronLeft, ChevronRight,
  TrendingUp, Tag, BookOpen, Users, Rss
} from "lucide-react";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  thumbnail_url: string | null;
  category: string | null;
  read_time: number;
  published_at: string | null;
  view_count: number;
  profiles: { name: string; avatar_url: string | null } | null;
}

interface BlogCategory {
  id: string;
  name: string;
  slug: string;
}

const PAGE_SIZE = 9;

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [recentPosts, setRecentPosts] = useState<BlogPost[]>([]);
  const [popularPosts, setPopularPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("blog_categories").select("id,name,slug").order("name").then(({ data }) => {
      if (data) setCategories(data);
    });
    supabase.from("blog_posts").select("id,title,slug,read_time,published_at,profiles(name,avatar_url),view_count").eq("status", "published").order("published_at", { ascending: false }).limit(5).then(({ data }) => {
      if (data) setRecentPosts(data as unknown as BlogPost[]);
    });
    supabase.from("blog_posts").select("id,title,slug,read_time,view_count,profiles(name,avatar_url)").eq("status", "published").order("view_count", { ascending: false }).limit(5).then(({ data }) => {
      if (data) setPopularPosts(data as unknown as BlogPost[]);
    });
  }, []);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("blog_posts")
      .select("id,title,slug,excerpt,thumbnail_url,category,read_time,published_at,view_count,profiles(name,avatar_url)", { count: "exact" })
      .eq("status", "published");

    if (search) query = query.ilike("title", `%${search}%`);
    if (selectedCategory) query = query.eq("category", selectedCategory);

    const { data, count } = await query
      .order("published_at", { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (data) setPosts(data as unknown as BlogPost[]);
    if (count !== null) setTotal(count);
    setLoading(false);
  }, [search, selectedCategory, page]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(0);
  };

  return (
    <PublicLayout>
      <SEO
        title="ব্লগ ও আর্টিকেল — AI, Technology ও ক্যারিয়ার টিপস বাংলায়"
        description="AI, ChatGPT, Python, Machine Learning, Data Science, Digital Marketing ও Freelancing বিষয়ক সর্বশেষ বাংলা আর্টিকেল পড়ুন। বিশেষজ্ঞ লেখক দ্বারা তৈরি গভীর ও তথ্যবহুল কনটেন্ট।"
        keywords="AI ব্লগ বাংলা, ChatGPT টিউটোরিয়াল, Python টিউটোরিয়াল, Machine Learning আর্টিকেল, Data Science বাংলা, Digital Marketing টিপস, Freelancing গাইড, AI সংবাদ, Technology বাংলা"
        url="/blog"
      />
      {/* Hero */}
      <section className="bg-gradient-to-b from-gray-900 to-gray-950 py-16 border-b border-gray-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">ব্লগ ও আর্টিকেল</h1>
          <p className="text-gray-400 mb-8">AI, Technology ও ক্যারিয়ার বিষয়ক সর্বশেষ আর্টিকেল পড়ুন</p>
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="আর্টিকেল খুঁজুন..."
                className="w-full bg-gray-800 border border-gray-700 focus:border-violet-500 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 outline-none transition-colors"
              />
            </div>
            <button type="submit" className="bg-violet-600 hover:bg-violet-700 text-white font-medium px-6 py-3 rounded-xl transition-colors">খুঁজুন</button>
          </form>
          {/* Category tabs */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
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
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-4 gap-10">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-gray-900/60 rounded-2xl overflow-hidden animate-pulse">
                    <div className="h-44 bg-gray-800" />
                    <div className="p-5 space-y-3">
                      <div className="h-4 bg-gray-800 rounded w-3/4" />
                      <div className="h-3 bg-gray-800 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-24">
                <MessageSquare className="w-16 h-16 mx-auto text-gray-700 mb-4" />
                <p className="text-gray-400">কোনো আর্টিকেল পাওয়া যায়নি</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post) => (
                  <Link key={post.id} href={`/blog/${post.slug}`}>
                    <div className="group bg-gray-900/60 border border-gray-800/60 hover:border-violet-500/40 rounded-2xl overflow-hidden transition-all hover:shadow-xl hover:shadow-violet-500/10 cursor-pointer h-full flex flex-col">
                      <div className="h-44 bg-gray-800 overflow-hidden flex-shrink-0">
                        {post.thumbnail_url ? (
                          <img src={post.thumbnail_url} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-900/40 to-purple-900/40">
                            <MessageSquare className="w-12 h-12 text-indigo-400/40" />
                          </div>
                        )}
                      </div>
                      <div className="p-5 flex-1 flex flex-col">
                        {post.category && (
                          <span className="inline-flex items-center gap-1 text-xs text-violet-400 mb-2">
                            <Tag className="w-3 h-3" /> {post.category}
                          </span>
                        )}
                        <h3 className="font-bold text-white line-clamp-2 mb-2 group-hover:text-violet-300 transition-colors flex-1">{post.title}</h3>
                        {post.excerpt && <p className="text-sm text-gray-400 line-clamp-2 mb-3">{post.excerpt}</p>}
                        <div className="flex items-center justify-between text-xs text-gray-500 mt-auto">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{post.read_time} মিনিট</span>
                            {post.published_at && (
                              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(post.published_at).toLocaleDateString("bn-BD")}</span>
                            )}
                          </div>
                        </div>
                        {post.profiles && (
                          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-800/60">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {post.profiles.name[0]}
                            </div>
                            <span className="text-xs text-gray-400">{post.profiles.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                <button onClick={() => setPage(p => p - 1)} disabled={page === 0} className="p-2 rounded-xl bg-gray-800 text-gray-400 hover:text-white disabled:opacity-40 transition-colors">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button key={i} onClick={() => setPage(i)} className={`w-10 h-10 rounded-xl text-sm font-medium transition-colors ${page === i ? "bg-violet-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"}`}>{i + 1}</button>
                ))}
                <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1} className="p-2 rounded-xl bg-gray-800 text-gray-400 hover:text-white disabled:opacity-40 transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent posts */}
            <div className="bg-gray-900/60 border border-gray-800/60 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-violet-400" /> সাম্প্রতিক পোস্ট
              </h3>
              <div className="space-y-4">
                {recentPosts.map((post) => (
                  <Link key={post.id} href={`/blog/${post.slug}`}>
                    <div className="group flex gap-3 cursor-pointer">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-300 group-hover:text-violet-400 transition-colors line-clamp-2">{post.title}</p>
                        <span className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" />{post.read_time} মিনিট
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Popular posts */}
            <div className="bg-gray-900/60 border border-gray-800/60 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-violet-400" /> জনপ্রিয় পোস্ট
              </h3>
              <div className="space-y-4">
                {popularPosts.map((post, i) => (
                  <Link key={post.id} href={`/blog/${post.slug}`}>
                    <div className="group flex gap-3 cursor-pointer">
                      <span className="text-2xl font-extrabold text-gray-700 flex-shrink-0 w-7 leading-none mt-0.5">{i + 1}</span>
                      <p className="text-sm text-gray-300 group-hover:text-violet-400 transition-colors line-clamp-2">{post.title}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div className="bg-gray-900/60 border border-gray-800/60 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <Tag className="w-4 h-4 text-violet-400" /> ক্যাটাগরি
              </h3>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => { setSelectedCategory(selectedCategory === cat.name ? null : cat.name); setPage(0); }}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${selectedCategory === cat.name ? "bg-violet-600 border-violet-600 text-white" : "border-gray-700 text-gray-400 hover:border-violet-500 hover:text-violet-400"}`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rich content for SEO */}
      <section className="py-14 bg-gray-950 border-t border-gray-800/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">AI শিখি বাংলায় ব্লগ সম্পর্কে</h2>
          <p className="text-gray-300 leading-relaxed mb-6">
            AI শিখি বাংলায়ের ব্লগে আমরা নিয়মিত প্রকাশ করি বাংলায় AI, Technology, Digital Marketing, Freelancing ও ক্যারিয়ার বিষয়ক গভীর ও তথ্যবহুল আর্টিকেল। আমাদের অভিজ্ঞ লেখকরা জটিল বিষয়গুলো সহজ বাংলায় ব্যাখ্যা করেন।
          </p>
          <div className="grid sm:grid-cols-3 gap-4 text-left">
            {[
              { icon: BookOpen, title: "টিউটোরিয়াল", desc: "ধাপে ধাপে AI ও প্রযুক্তি শেখার গাইড" },
              { icon: Users, title: "সাফল্যের গল্প", desc: "শিক্ষার্থীদের অনুপ্রেরণামূলক অভিজ্ঞতা" },
              { icon: Rss, title: "সর্বশেষ সংবাদ", desc: "AI জগতের সর্বশেষ আপডেট বাংলায়" },
            ].map((item, i) => (
              <div key={i} className="flex gap-3 p-4 bg-gray-900/60 border border-gray-800/60 rounded-xl">
                <item.icon className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-white mb-1">{item.title}</h3>
                  <p className="text-xs text-gray-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
