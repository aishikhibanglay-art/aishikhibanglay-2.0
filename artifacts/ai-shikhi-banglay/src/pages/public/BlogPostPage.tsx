import { useState, useEffect } from "react";
import { Link, useParams } from "wouter";
import { supabase } from "@/lib/supabase";
import PublicLayout from "@/layouts/PublicLayout";
import {
  Clock, Calendar, Facebook, Twitter, Linkedin, MessageCircle,
  Tag, Eye, MessageSquare, AlertCircle, ChevronRight
} from "lucide-react";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  excerpt: string | null;
  thumbnail_url: string | null;
  category: string | null;
  tags: string[];
  read_time: number;
  published_at: string | null;
  view_count: number;
  profiles: { name: string; bio: string | null; avatar_url: string | null } | null;
}

interface RelatedPost {
  id: string;
  title: string;
  slug: string;
  thumbnail_url: string | null;
  read_time: number;
  published_at: string | null;
}

export default function BlogPostPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const [post, setPost] = useState<BlogPost | null>(null);
  const [related, setRelated] = useState<RelatedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  useEffect(() => {
    if (!slug) return;
    const fetchPost = async () => {
      const { data } = await supabase
        .from("blog_posts")
        .select("id,title,slug,content,excerpt,thumbnail_url,category,tags,read_time,published_at,view_count,profiles(name,bio,avatar_url)")
        .eq("slug", slug)
        .eq("status", "published")
        .single();

      if (data) {
        setPost(data as unknown as BlogPost);
        // increment view count
        await supabase.from("blog_posts").update({ view_count: (data.view_count || 0) + 1 }).eq("id", data.id);
        // fetch related
        if (data.category) {
          const { data: rel } = await supabase
            .from("blog_posts")
            .select("id,title,slug,thumbnail_url,read_time,published_at")
            .eq("status", "published")
            .eq("category", data.category)
            .neq("id", data.id)
            .limit(3);
          if (rel) setRelated(rel);
        }
      }
      setLoading(false);
    };
    fetchPost();
  }, [slug]);

  if (loading) return (
    <PublicLayout>
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full" />
      </div>
    </PublicLayout>
  );

  if (!post) return (
    <PublicLayout>
      <div className="min-h-screen flex items-center justify-center text-center px-4">
        <div>
          <AlertCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">পোস্ট পাওয়া যায়নি</h1>
          <p className="text-gray-400 mb-6">এই পোস্টটি বিদ্যমান নেই বা প্রকাশিত হয়নি।</p>
          <Link href="/blog"><button className="bg-violet-600 text-white px-6 py-3 rounded-xl">ব্লগে ফিরুন</button></Link>
        </div>
      </div>
    </PublicLayout>
  );

  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <Link href="/" className="hover:text-violet-400 transition-colors">হোম</Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/blog" className="hover:text-violet-400 transition-colors">ব্লগ</Link>
          {post.category && (
            <>
              <ChevronRight className="w-4 h-4" />
              <span className="text-violet-400">{post.category}</span>
            </>
          )}
        </nav>

        {/* Header */}
        <header className="mb-8">
          {post.category && (
            <span className="inline-flex items-center gap-1.5 text-sm text-violet-400 bg-violet-500/10 border border-violet-500/20 px-3 py-1 rounded-full mb-4">
              <Tag className="w-3.5 h-3.5" /> {post.category}
            </span>
          )}
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-5">{post.title}</h1>
          <div className="flex flex-wrap items-center gap-5 text-sm text-gray-400 mb-6">
            {post.profiles && (
              <div className="flex items-center gap-2">
                {post.profiles.avatar_url ? (
                  <img src={post.profiles.avatar_url} alt={post.profiles.name} className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                    {post.profiles.name[0]}
                  </div>
                )}
                <span className="font-medium text-white">{post.profiles.name}</span>
              </div>
            )}
            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{post.read_time} মিনিট পড়া</span>
            {post.published_at && (
              <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />{new Date(post.published_at).toLocaleDateString("bn-BD", { year: "numeric", month: "long", day: "numeric" })}</span>
            )}
            <span className="flex items-center gap-1.5"><Eye className="w-4 h-4" />{post.view_count} বার দেখা হয়েছে</span>
          </div>

          {/* Social Share */}
          <div className="flex items-center gap-3 p-4 bg-gray-900/60 border border-gray-800/60 rounded-2xl">
            <span className="text-sm text-gray-400 font-medium mr-1">শেয়ার:</span>
            <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 bg-blue-600/15 hover:bg-blue-600/30 text-blue-400 text-sm px-3 py-1.5 rounded-lg transition-colors">
              <Facebook className="w-4 h-4" /> Facebook
            </a>
            <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(post.title)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 bg-sky-600/15 hover:bg-sky-600/30 text-sky-400 text-sm px-3 py-1.5 rounded-lg transition-colors">
              <Twitter className="w-4 h-4" /> Twitter
            </a>
            <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 bg-blue-700/15 hover:bg-blue-700/30 text-blue-500 text-sm px-3 py-1.5 rounded-lg transition-colors">
              <Linkedin className="w-4 h-4" /> LinkedIn
            </a>
            <a href={`https://api.whatsapp.com/send?text=${encodeURIComponent(post.title + " " + shareUrl)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 bg-green-600/15 hover:bg-green-600/30 text-green-400 text-sm px-3 py-1.5 rounded-lg transition-colors">
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </a>
          </div>
        </header>

        {/* Thumbnail */}
        {post.thumbnail_url && (
          <div className="rounded-2xl overflow-hidden mb-10 shadow-xl">
            <img src={post.thumbnail_url} alt={post.title} className="w-full max-h-96 object-cover" />
          </div>
        )}

        {/* Content */}
        <article className="prose prose-invert prose-lg max-w-none
          prose-headings:text-white prose-headings:font-bold
          prose-p:text-gray-300 prose-p:leading-relaxed
          prose-a:text-violet-400 prose-a:no-underline hover:prose-a:underline
          prose-strong:text-white prose-strong:font-semibold
          prose-code:bg-gray-800 prose-code:text-violet-300 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
          prose-pre:bg-gray-900 prose-pre:border prose-pre:border-gray-800/60 prose-pre:rounded-xl
          prose-blockquote:border-l-violet-500 prose-blockquote:bg-gray-900/40 prose-blockquote:px-5 prose-blockquote:py-1 prose-blockquote:rounded-r-xl
          prose-img:rounded-2xl prose-img:shadow-xl
          prose-ul:text-gray-300 prose-ol:text-gray-300
          prose-li:marker:text-violet-400
          mb-12"
          dangerouslySetInnerHTML={{ __html: post.content || "<p>কনটেন্ট পাওয়া যায়নি।</p>" }}
        />

        {/* Tags */}
        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-10 pb-10 border-b border-gray-800/60">
            <span className="text-sm text-gray-500 font-medium">ট্যাগ:</span>
            {post.tags.map((tag, i) => (
              <span key={i} className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-200 px-3 py-1.5 rounded-full border border-gray-700 cursor-pointer transition-colors">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Author box */}
        {post.profiles && (
          <div className="bg-gray-900/60 border border-gray-800/60 rounded-2xl p-6 mb-10 flex items-start gap-5">
            {post.profiles.avatar_url ? (
              <img src={post.profiles.avatar_url} alt={post.profiles.name} className="w-16 h-16 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                {post.profiles.name[0]}
              </div>
            )}
            <div>
              <p className="text-xs text-gray-500 mb-1">লেখক সম্পর্কে</p>
              <h3 className="font-bold text-white text-lg">{post.profiles.name}</h3>
              {post.profiles.bio && <p className="text-sm text-gray-400 mt-1 leading-relaxed">{post.profiles.bio}</p>}
            </div>
          </div>
        )}

        {/* Share again (bottom) */}
        <div className="bg-gradient-to-br from-violet-900/20 to-indigo-900/20 border border-violet-500/20 rounded-2xl p-6 text-center mb-12">
          <p className="text-white font-semibold mb-4">এই পোস্টটি পছন্দ হলে শেয়ার করুন!</p>
          <div className="flex justify-center gap-3">
            <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2">
              <Facebook className="w-4 h-4" /> Facebook-এ শেয়ার
            </a>
            <a href={`https://api.whatsapp.com/send?text=${encodeURIComponent(post.title + " " + shareUrl)}`} target="_blank" rel="noopener noreferrer" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2">
              <MessageCircle className="w-4 h-4" /> WhatsApp-এ শেয়ার
            </a>
          </div>
        </div>

        {/* Related Posts */}
        {related.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-violet-400" /> সম্পর্কিত পোস্ট
            </h2>
            <div className="grid sm:grid-cols-3 gap-5">
              {related.map((r) => (
                <Link key={r.id} href={`/blog/${r.slug}`}>
                  <div className="group bg-gray-900/60 border border-gray-800/60 hover:border-violet-500/40 rounded-2xl overflow-hidden transition-all cursor-pointer">
                    {r.thumbnail_url ? (
                      <img src={r.thumbnail_url} alt={r.title} className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="h-36 bg-gradient-to-br from-indigo-900/40 to-purple-900/40 flex items-center justify-center">
                        <MessageSquare className="w-10 h-10 text-indigo-400/40" />
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="text-sm font-semibold text-white group-hover:text-violet-300 transition-colors line-clamp-2">{r.title}</h3>
                      <span className="text-xs text-gray-500 flex items-center gap-1 mt-2"><Clock className="w-3 h-3" />{r.read_time} মিনিট</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
