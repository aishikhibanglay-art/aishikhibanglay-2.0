import { useState, useEffect } from "react";
import { Link } from "wouter";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import PublicLayout from "@/layouts/PublicLayout";
import { SEO } from "@/components/SEO";
import {
  Users, MessageSquare, ThumbsUp, ChevronRight, Shield,
  Pin, Lock, LogIn
} from "lucide-react";

interface CommunityPost {
  id: string;
  title: string;
  content: string;
  category: string | null;
  upvotes: number;
  reply_count: number;
  is_pinned: boolean;
  created_at: string;
  profiles: { name: string; avatar_url: string | null } | null;
}

interface CommunityRule {
  id: string;
  rule_text: string;
  order_index: number;
}

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, "").slice(0, 200);
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 60) return `${min} মিনিট আগে`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} ঘন্টা আগে`;
  return `${Math.floor(h / 24)} দিন আগে`;
}

export default function CommunityPublicPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [rules, setRules] = useState<CommunityRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ posts: 0, replies: 0 });

  useEffect(() => {
    const fetchAll = async () => {
      const [postsRes, rulesRes, statsRes] = await Promise.all([
        supabase
          .from("community_posts")
          .select("id,title,content,category,upvotes,reply_count,is_pinned,created_at,profiles(name,avatar_url)")
          .eq("is_hidden", false)
          .order("is_pinned", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("community_rules")
          .select("id,rule_text,order_index")
          .order("order_index"),
        Promise.all([
          supabase.from("community_posts").select("id", { count: "exact", head: true }).eq("is_hidden", false),
          supabase.from("community_replies").select("id", { count: "exact", head: true }).eq("is_hidden", false),
        ]),
      ]);

      if (postsRes.data) setPosts(postsRes.data as unknown as CommunityPost[]);
      if (rulesRes.data) setRules(rulesRes.data);
      const [postCount, replyCount] = statsRes;
      setStats({ posts: postCount.count || 0, replies: replyCount.count || 0 });
      setLoading(false);
    };
    fetchAll();
  }, []);

  const categories = [...new Set(posts.map(p => p.category).filter(Boolean))];

  return (
    <PublicLayout>
      <SEO
        title="কমিউনিটি — বাংলায় AI শিক্ষার্থীদের সম্প্রদায়"
        description="AI শিখি বাংলায়ের কমিউনিটিতে যোগ দিন। হাজারো AI শিক্ষার্থীর সাথে সংযুক্ত হন, প্রশ্ন করুন, উত্তর পান, অভিজ্ঞতা শেয়ার করুন এবং একসাথে বেড়ে উঠুন।"
        keywords="AI কমিউনিটি বাংলাদেশ, AI শিক্ষার্থী, বাংলা AI ফোরাম, ChatGPT হেল্প, Python সাহায্য, Machine Learning কমিউনিটি"
        url="/community"
      />
      {/* Hero */}
      <section className="bg-gradient-to-b from-gray-900 to-gray-950 py-16 border-b border-gray-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-violet-500/15 mb-6">
            <Users className="w-8 h-8 text-violet-400" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">কমিউনিটি</h1>
          <p className="text-gray-400 max-w-xl mx-auto mb-8">হাজারো শিক্ষার্থীর সাথে প্রশ্ন করুন, উত্তর পান, অভিজ্ঞতা ভাগ করুন</p>
          <div className="flex justify-center gap-8 mb-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{stats.posts.toLocaleString()}+</div>
              <div className="text-sm text-gray-400">মোট পোস্ট</div>
            </div>
            <div className="w-px bg-gray-700" />
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{stats.replies.toLocaleString()}+</div>
              <div className="text-sm text-gray-400">মোট উত্তর</div>
            </div>
          </div>
          {!user ? (
            <div className="flex justify-center gap-3">
              <Link href="/signup">
                <button className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors">
                  যোগ দিন <ChevronRight className="w-4 h-4" />
                </button>
              </Link>
              <Link href="/login">
                <button className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors">
                  <LogIn className="w-4 h-4" /> লগইন
                </button>
              </Link>
            </div>
          ) : (
            <Link href="/dashboard/community">
              <button className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors mx-auto">
                কমিউনিটিতে যান <ChevronRight className="w-4 h-4" />
              </button>
            </Link>
          )}
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-4 gap-10">
          {/* Posts */}
          <div className="lg:col-span-3">
            {/* Categories */}
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {categories.map((cat) => (
                  <span key={cat} className="text-xs bg-gray-800 text-gray-300 px-3 py-1.5 rounded-full border border-gray-700">{cat}</span>
                ))}
              </div>
            )}

            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="bg-gray-900/60 rounded-2xl p-5 animate-pulse">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-800" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-800 rounded w-3/4" />
                        <div className="h-3 bg-gray-800 rounded w-full" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-24">
                <MessageSquare className="w-16 h-16 mx-auto text-gray-700 mb-4" />
                <p className="text-gray-400">এখনো কোনো পোস্ট নেই</p>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <div key={post.id} className={`bg-gray-900/60 border rounded-2xl p-5 transition-all ${post.is_pinned ? "border-violet-500/30 bg-violet-500/5" : "border-gray-800/60"}`}>
                    <div className="flex items-start gap-4">
                      {post.profiles?.avatar_url ? (
                        <img src={post.profiles.avatar_url} alt={post.profiles.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {post.profiles?.name?.[0] || "?"}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {post.is_pinned && <Pin className="w-3.5 h-3.5 text-violet-400" />}
                            <span className="text-sm font-medium text-white">{post.profiles?.name}</span>
                            <span className="text-xs text-gray-500">{timeAgo(post.created_at)}</span>
                            {post.category && (
                              <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">{post.category}</span>
                            )}
                          </div>
                        </div>
                        <h3 className="font-semibold text-white mb-2">{post.title}</h3>
                        <p className="text-sm text-gray-400 leading-relaxed line-clamp-2">{stripHtml(post.content)}...</p>
                        <div className="flex items-center gap-4 mt-3">
                          <span className="flex items-center gap-1.5 text-xs text-gray-500">
                            <ThumbsUp className="w-3.5 h-3.5" /> {post.upvotes}
                          </span>
                          <span className="flex items-center gap-1.5 text-xs text-gray-500">
                            <MessageSquare className="w-3.5 h-3.5" /> {post.reply_count} উত্তর
                          </span>
                          {!user && (
                            <Link href="/login">
                              <span className="text-xs text-violet-400 hover:text-violet-300 transition-colors cursor-pointer ml-auto">
                                লগইন করে উত্তর দিন →
                              </span>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* CTA for guests */}
            {!user && (
              <div className="mt-8 bg-gradient-to-br from-violet-900/30 to-indigo-900/30 border border-violet-500/20 rounded-2xl p-8 text-center">
                <Lock className="w-12 h-12 text-violet-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-3">আলোচনায় অংশ নিন</h3>
                <p className="text-gray-400 mb-6">প্রশ্ন করতে, উত্তর দিতে ও পোস্ট করতে একাউন্ট তৈরি করুন</p>
                <div className="flex justify-center gap-3">
                  <Link href="/signup">
                    <button className="bg-violet-600 hover:bg-violet-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors">বিনামূল্যে যোগ দিন</button>
                  </Link>
                  <Link href="/login">
                    <button className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors">লগইন</button>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar: Rules */}
          <div className="space-y-6">
            <div className="bg-gray-900/60 border border-gray-800/60 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4 text-violet-400" /> কমিউনিটি নিয়মাবলী
              </h3>
              {rules.length > 0 ? (
                <ol className="space-y-3">
                  {rules.map((rule, i) => (
                    <li key={rule.id} className="flex items-start gap-3 text-sm text-gray-400">
                      <span className="w-6 h-6 rounded-full bg-violet-500/15 text-violet-400 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      {rule.rule_text}
                    </li>
                  ))}
                </ol>
              ) : (
                <div className="space-y-2 text-sm text-gray-400">
                  <p>১. সম্মানজনক ভাষা ব্যবহার করুন।</p>
                  <p>২. স্প্যাম বা বিজ্ঞাপন পোস্ট করবেন না।</p>
                  <p>৩. প্রাসঙ্গিক বিষয়ে পোস্ট করুন।</p>
                </div>
              )}
            </div>

            {!user && (
              <div className="bg-gray-900/60 border border-gray-800/60 rounded-2xl p-5 text-center">
                <Users className="w-10 h-10 text-violet-400 mx-auto mb-3" />
                <p className="text-sm font-medium text-white mb-3">কমিউনিটিতে যোগ দিন</p>
                <Link href="/signup">
                  <button className="w-full bg-violet-600 hover:bg-violet-700 text-white font-medium py-2.5 rounded-xl transition-colors text-sm">
                    রেজিস্ট্রেশন করুন
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
