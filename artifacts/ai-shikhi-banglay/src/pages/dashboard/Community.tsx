import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import StudentLayout from "@/layouts/StudentLayout";
import TipTapEditor from "@/components/TipTapEditor";
import { MessageSquare, Heart, Plus, Send, Pin, X, Loader2, AlertCircle } from "lucide-react";

interface Post {
  id: string;
  title: string;
  content: string;
  author_name: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  is_pinned: boolean;
  category: string;
  liked: boolean;
}

const categoryLabels: Record<string, string> = {
  general: "সাধারণ",
  question: "প্রশ্ন",
  showcase: "প্রজেক্ট",
  announcement: "ঘোষণা",
};

const categoryColors: Record<string, string> = {
  general: "text-gray-400 bg-gray-800",
  question: "text-blue-400 bg-blue-500/10 border border-blue-500/20",
  showcase: "text-green-400 bg-green-500/10 border border-green-500/20",
  announcement: "text-yellow-400 bg-yellow-500/10 border border-yellow-500/20",
};

export default function Community() {
  const { profile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newPost, setNewPost] = useState({ title: "", content: "", category: "general" });
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => { fetchPosts(); }, []);

  const fetchPosts = async () => {
    const { data } = await supabase
      .from("community_posts")
      .select(`id, title, content, created_at, likes_count, comments_count, is_pinned, category, profiles(name)`)
      .eq("status", "published")
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(30);

    if (data) {
      setPosts(data.map((p: any) => ({
        id: p.id,
        title: p.title,
        content: p.content || "",
        author_name: p.profiles?.name || "অজানা",
        created_at: p.created_at,
        likes_count: p.likes_count || 0,
        comments_count: p.comments_count || 0,
        is_pinned: p.is_pinned || false,
        category: p.category || "general",
        liked: false,
      })));
    }
    setLoading(false);
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setPostError("");

    if (!newPost.title.trim()) {
      setPostError("শিরোনাম দেওয়া আবশ্যক।");
      return;
    }

    const plainText = newPost.content.replace(/<[^>]*>/g, "").trim();
    if (!plainText) {
      setPostError("পোস্টের বিষয়বস্তু লিখুন।");
      return;
    }

    setPosting(true);
    const { error } = await supabase.from("community_posts").insert({
      title: newPost.title.trim(),
      content: newPost.content,
      category: newPost.category,
      user_id: profile.user_id,
      status: "published",
    });

    if (error) {
      setPostError(`পোস্ট করতে সমস্যা: ${error.message}`);
      setPosting(false);
      return;
    }

    setNewPost({ title: "", content: "", category: "general" });
    setShowForm(false);
    await fetchPosts();
    setPosting(false);
  };

  const handleLike = async (postId: string, liked: boolean, count: number) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, liked: !liked, likes_count: liked ? count - 1 : count + 1 }
          : p
      )
    );
    await supabase
      .from("community_posts")
      .update({ likes_count: liked ? count - 1 : count + 1 })
      .eq("id", postId);
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "এইমাত্র";
    if (mins < 60) return `${mins} মি আগে`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} ঘণ্টা আগে`;
    return `${Math.floor(hours / 24)} দিন আগে`;
  };

  const filtered = activeTab === "all" ? posts : posts.filter((p) => p.category === activeTab);

  return (
    <StudentLayout>
      <div className="p-6 lg:p-8 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">কমিউনিটি</h1>
            <p className="text-gray-400 text-sm">অন্য শিক্ষার্থীদের সাথে আলোচনা করুন</p>
          </div>
          <button
            onClick={() => { setShowForm(!showForm); setPostError(""); }}
            className={`flex items-center gap-2 font-medium py-2.5 px-4 rounded-xl transition-all text-sm ${
              showForm
                ? "bg-gray-800 border border-gray-700 text-gray-300"
                : "bg-violet-600 hover:bg-violet-500 text-white"
            }`}
          >
            {showForm ? <><X className="w-4 h-4" /> বাতিল</> : <><Plus className="w-4 h-4" /> পোস্ট করুন</>}
          </button>
        </div>

        {/* ── New Post Form ── */}
        {showForm && (
          <form onSubmit={handlePost} className="bg-gray-900/90 border border-violet-500/30 rounded-2xl p-5 mb-6 shadow-xl">
            <h2 className="font-semibold text-white mb-4 text-sm">নতুন পোস্ট তৈরি করুন</h2>

            {postError && (
              <div className="mb-3 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {postError}
              </div>
            )}

            <div className="space-y-3">
              {/* Category */}
              <div className="flex gap-2 flex-wrap">
                {Object.entries(categoryLabels).map(([v, l]) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setNewPost((p) => ({ ...p, category: v }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      newPost.category === v
                        ? "bg-violet-600 border-violet-500 text-white"
                        : "border-gray-700 bg-gray-800 text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>

              {/* Title */}
              <input
                type="text"
                placeholder="পোস্টের শিরোনাম লিখুন *"
                value={newPost.title}
                onChange={(e) => setNewPost((p) => ({ ...p, title: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 transition-all"
              />

              {/* TipTap Editor */}
              <TipTapEditor
                content={newPost.content}
                onChange={(html) => setNewPost((p) => ({ ...p, content: html }))}
                placeholder="আপনার চিন্তা বিস্তারিত লিখুন... (Bold, Italic, List ব্যবহার করতে পারবেন)"
                minHeight="140px"
              />

              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setPostError(""); }}
                  className="text-sm text-gray-400 hover:text-white px-4 py-2 rounded-xl hover:bg-gray-800 transition-colors"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={posting}
                  className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium py-2 px-5 rounded-xl transition-colors disabled:opacity-60"
                >
                  {posting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  পোস্ট করুন
                </button>
              </div>
            </div>
          </form>
        )}

        {/* ── Filter Tabs ── */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {[["all", "সব পোস্ট"], ["question", "প্রশ্ন"], ["showcase", "প্রজেক্ট"], ["general", "সাধারণ"]].map(([v, l]) => (
            <button
              key={v}
              onClick={() => setActiveTab(v)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                activeTab === v ? "bg-violet-600 text-white" : "bg-gray-900 border border-gray-800 text-gray-400 hover:text-white"
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        {/* ── Posts ── */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <div key={i} className="bg-gray-900 rounded-2xl h-28 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <MessageSquare className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-400">কোনো পোস্ট নেই। প্রথম পোস্টটি করুন!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((post) => (
              <div
                key={post.id}
                className={`bg-gray-900/80 border rounded-2xl p-5 transition-all hover:border-gray-700 ${
                  post.is_pinned ? "border-violet-500/40" : "border-gray-800"
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {post.author_name[0]?.toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Badges */}
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      {post.is_pinned && (
                        <span className="flex items-center gap-1 text-xs text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-lg">
                          <Pin className="w-3 h-3" /> পিন করা
                        </span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-lg ${categoryColors[post.category] || categoryColors.general}`}>
                        {categoryLabels[post.category] || post.category}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="font-semibold text-white text-sm mb-1">{post.title}</h3>

                    {/* Content — render HTML from TipTap */}
                    {post.content && post.content !== "<p></p>" && (
                      <div
                        className="text-gray-400 text-xs line-clamp-3 mb-3 prose-render"
                        dangerouslySetInnerHTML={{ __html: post.content }}
                      />
                    )}

                    {/* Meta */}
                    <div className="flex items-center gap-4 text-xs text-gray-600">
                      <span className="font-medium text-gray-500">{post.author_name}</span>
                      <span>{timeAgo(post.created_at)}</span>
                      <button
                        onClick={() => handleLike(post.id, post.liked, post.likes_count)}
                        className={`flex items-center gap-1 transition-colors ${
                          post.liked ? "text-red-400" : "hover:text-red-400"
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${post.liked ? "fill-red-400" : ""}`} />
                        {post.likes_count}
                      </button>
                      <span className="flex items-center gap-1 hover:text-blue-400 transition-colors cursor-pointer">
                        <MessageSquare className="w-3.5 h-3.5" /> {post.comments_count}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Inline styles for rendered HTML content */}
      <style>{`
        .prose-render strong { font-weight: 700; color: #e5e7eb; }
        .prose-render em { font-style: italic; }
        .prose-render ul { list-style: disc; padding-left: 1rem; }
        .prose-render ol { list-style: decimal; padding-left: 1rem; }
        .prose-render code { background: rgba(139,92,246,0.15); color: #a78bfa; padding: 1px 4px; border-radius: 3px; font-size: 0.8em; }
        .prose-render blockquote { border-left: 2px solid #7c3aed; padding-left: 0.5rem; color: #9ca3af; }
        .prose-render h2 { font-weight: 700; color: #f9fafb; }
      `}</style>
    </StudentLayout>
  );
}
