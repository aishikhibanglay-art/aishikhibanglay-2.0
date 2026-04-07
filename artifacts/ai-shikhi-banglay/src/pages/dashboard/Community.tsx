import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import StudentLayout from "@/layouts/StudentLayout";
import { Users, MessageSquare, Heart, Plus, Send, TrendingUp, Pin } from "lucide-react";

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
}

export default function Community() {
  const { profile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newPost, setNewPost] = useState({ title: "", content: "", category: "general" });
  const [posting, setPosting] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const { data } = await supabase
      .from("community_posts")
      .select(`
        id, title, content, created_at, likes_count, comments_count, is_pinned, category,
        profiles(name)
      `)
      .eq("status", "published")
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(20);

    if (data) {
      setPosts(data.map((p: any) => ({
        id: p.id,
        title: p.title,
        content: p.content,
        author_name: p.profiles?.name || "অজানা",
        created_at: p.created_at,
        likes_count: p.likes_count || 0,
        comments_count: p.comments_count || 0,
        is_pinned: p.is_pinned || false,
        category: p.category || "general",
      })));
    }
    setLoading(false);
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !newPost.title.trim()) return;
    setPosting(true);
    await supabase.from("community_posts").insert({
      title: newPost.title,
      content: newPost.content,
      category: newPost.category,
      user_id: profile.user_id,
      status: "published",
    });
    setNewPost({ title: "", content: "", category: "general" });
    setShowForm(false);
    await fetchPosts();
    setPosting(false);
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} মিনিট আগে`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} ঘণ্টা আগে`;
    return `${Math.floor(hours / 24)} দিন আগে`;
  };

  const categoryLabels: Record<string, string> = {
    general: "সাধারণ", question: "প্রশ্ন", showcase: "প্রজেক্ট", announcement: "ঘোষণা"
  };

  const filtered = activeTab === "all" ? posts : posts.filter((p) => p.category === activeTab);

  return (
    <StudentLayout>
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">কমিউনিটি</h1>
            <p className="text-gray-400">অন্য শিক্ষার্থীদের সাথে আলোচনা করুন</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-medium py-2.5 px-4 rounded-xl transition-colors text-sm"
          >
            <Plus className="w-4 h-4" /> পোস্ট করুন
          </button>
        </div>

        {/* New Post Form */}
        {showForm && (
          <form onSubmit={handlePost} className="bg-gray-900/80 border border-violet-500/30 rounded-2xl p-5 mb-6">
            <h2 className="font-semibold text-white mb-4">নতুন পোস্ট</h2>
            <div className="space-y-3">
              <select
                value={newPost.category}
                onChange={(e) => setNewPost((p) => ({ ...p, category: e.target.value }))}
                className="bg-gray-800 border border-gray-700 text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-violet-500 w-full"
              >
                {Object.entries(categoryLabels).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="পোস্টের শিরোনাম"
                value={newPost.title}
                onChange={(e) => setNewPost((p) => ({ ...p, title: e.target.value }))}
                required
                className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 transition-all"
              />
              <textarea
                placeholder="আপনার চিন্তা শেয়ার করুন..."
                value={newPost.content}
                onChange={(e) => setNewPost((p) => ({ ...p, content: e.target.value }))}
                rows={3}
                className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 transition-all resize-none"
              />
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowForm(false)}
                  className="text-sm text-gray-400 hover:text-white px-4 py-2 rounded-xl hover:bg-gray-800 transition-colors">
                  বাতিল
                </button>
                <button type="submit" disabled={posting}
                  className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium py-2 px-5 rounded-xl transition-colors disabled:opacity-60">
                  <Send className="w-3.5 h-3.5" /> পোস্ট করুন
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {[["all", "সব"], ["question", "প্রশ্ন"], ["showcase", "প্রজেক্ট"], ["general", "সাধারণ"]].map(([v, l]) => (
            <button key={v} onClick={() => setActiveTab(v)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                activeTab === v ? "bg-violet-600 text-white" : "bg-gray-900 border border-gray-800 text-gray-400 hover:text-white"
              }`}>
              {l}
            </button>
          ))}
        </div>

        {/* Posts */}
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
              <div key={post.id} className={`bg-gray-900/80 border rounded-2xl p-5 transition-all hover:border-gray-700 ${post.is_pinned ? "border-violet-500/40" : "border-gray-800"}`}>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {post.author_name[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {post.is_pinned && (
                        <span className="flex items-center gap-1 text-xs text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-lg">
                          <Pin className="w-3 h-3" /> পিন করা
                        </span>
                      )}
                      <span className="text-xs text-gray-600 bg-gray-800 px-2 py-0.5 rounded-lg">
                        {categoryLabels[post.category] || post.category}
                      </span>
                    </div>
                    <h3 className="font-semibold text-white text-sm mb-1">{post.title}</h3>
                    {post.content && (
                      <p className="text-gray-400 text-xs line-clamp-2 mb-3">{post.content}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-600">
                      <span className="font-medium text-gray-500">{post.author_name}</span>
                      <span>{timeAgo(post.created_at)}</span>
                      <button className="flex items-center gap-1 hover:text-red-400 transition-colors">
                        <Heart className="w-3.5 h-3.5" /> {post.likes_count}
                      </button>
                      <button className="flex items-center gap-1 hover:text-blue-400 transition-colors">
                        <MessageSquare className="w-3.5 h-3.5" /> {post.comments_count}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
