import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import AdminLayout from "@/layouts/AdminLayout";
import { MessageSquare, CheckCircle, XCircle, Trash2, Pin, Search, Eye } from "lucide-react";

interface Post {
  id: string;
  title: string;
  content: string;
  status: string;
  is_pinned: boolean;
  category: string;
  author_name: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
}

export default function CommunityModeration() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => { fetchPosts(); }, [statusFilter]);

  const fetchPosts = async () => {
    setLoading(true);
    let q = supabase
      .from("community_posts")
      .select("id, title, content, status, is_pinned, category, likes_count, comments_count, created_at, profiles(name)")
      .order("created_at", { ascending: false });
    if (statusFilter !== "all") q = q.eq("status", statusFilter);
    const { data } = await q;
    setPosts((data || []).map((p: any) => ({
      ...p, author_name: p.profiles?.name || "Unknown",
    })));
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("community_posts").update({ status }).eq("id", id);
    await fetchPosts();
  };

  const togglePin = async (id: string, pinned: boolean) => {
    await supabase.from("community_posts").update({ is_pinned: !pinned }).eq("id", id);
    await fetchPosts();
  };

  const deletePost = async (id: string) => {
    if (!confirm("এই পোস্টটি মুছে ফেলতে চান?")) return;
    await supabase.from("community_posts").delete().eq("id", id);
    await fetchPosts();
  };

  const filtered = posts.filter((p) =>
    p.title?.toLowerCase().includes(search.toLowerCase()) ||
    p.author_name.toLowerCase().includes(search.toLowerCase())
  );

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const h = Math.floor(diff / 3600000);
    if (h < 1) return `${Math.floor(diff / 60000)}মি আগে`;
    if (h < 24) return `${h}ঘণ্টা আগে`;
    return `${Math.floor(h / 24)}দিন আগে`;
  };

  const statusColors: Record<string, string> = {
    published: "text-green-400 bg-green-500/10 border-green-500/30",
    pending: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
    removed: "text-red-400 bg-red-500/10 border-red-500/30",
  };

  return (
    <AdminLayout>
      <div className="p-6 lg:p-7 max-w-6xl mx-auto">
        <div className="mb-7">
          <h1 className="text-2xl font-bold text-white mb-1">কমিউনিটি মডারেশন</h1>
          <p className="text-gray-500 text-sm">পোস্ট পর্যালোচনা ও নিয়ন্ত্রণ</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "প্রকাশিত", value: posts.filter((p) => p.status === "published").length, color: "text-green-400" },
            { label: "অপেক্ষমান", value: posts.filter((p) => p.status === "pending").length, color: "text-yellow-400" },
            { label: "সরানো হয়েছে", value: posts.filter((p) => p.status === "removed").length, color: "text-red-400" },
          ].map((s) => (
            <div key={s.label} className="bg-gray-900/60 border border-gray-800 rounded-xl px-5 py-4">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="পোস্ট বা লেখকের নাম..."
              className="w-full bg-gray-900 border border-gray-800 text-white text-sm placeholder-gray-600 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-rose-500 transition-all" />
          </div>
          <div className="flex rounded-xl border border-gray-800 overflow-hidden bg-gray-900">
            {["all", "pending", "published", "removed"].map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-4 py-2.5 text-xs font-medium transition-colors ${
                  statusFilter === s ? "bg-rose-600 text-white" : "text-gray-400 hover:text-gray-200"
                }`}>
                {s === "all" ? "সব" : s === "pending" ? "অপেক্ষমান" : s === "published" ? "প্রকাশিত" : "সরানো"}
              </button>
            ))}
          </div>
        </div>

        {/* Posts */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="bg-gray-900 rounded-2xl h-24 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <MessageSquare className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-400">কোনো পোস্ট নেই</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((post) => (
              <div key={post.id} className="bg-gray-900/80 border border-gray-800 hover:border-gray-700 rounded-2xl p-5 transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {post.author_name[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-white text-sm">{post.title}</span>
                      {post.is_pinned && <Pin className="w-3.5 h-3.5 text-violet-400" />}
                    </div>
                    <p className="text-xs text-gray-500 mb-2">
                      {post.author_name} · {timeAgo(post.created_at)} · {post.category}
                    </p>
                    {post.content && (
                      <p className="text-xs text-gray-400 line-clamp-2 mb-3">{post.content}</p>
                    )}
                    <div className="flex items-center gap-4">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-lg border ${statusColors[post.status] || statusColors.pending}`}>
                        {post.status === "published" ? "প্রকাশিত" : post.status === "pending" ? "অপেক্ষমান" : "সরানো"}
                      </span>
                      <span className="text-xs text-gray-600">👍 {post.likes_count} · 💬 {post.comments_count}</span>
                    </div>
                  </div>
                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {post.status === "pending" && (
                      <button onClick={() => updateStatus(post.id, "published")} title="অনুমোদন"
                        className="p-2 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 transition-colors">
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                    {post.status === "published" && (
                      <button onClick={() => updateStatus(post.id, "removed")} title="সরান"
                        className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors">
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                    {post.status === "removed" && (
                      <button onClick={() => updateStatus(post.id, "published")} title="পুনরুদ্ধার"
                        className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => togglePin(post.id, post.is_pinned)} title={post.is_pinned ? "পিন সরান" : "পিন করুন"}
                      className={`p-2 rounded-lg border transition-colors ${
                        post.is_pinned
                          ? "bg-violet-500/20 border-violet-500/40 text-violet-400"
                          : "bg-gray-800 border-gray-700 text-gray-500 hover:text-violet-400"
                      }`}>
                      <Pin className="w-4 h-4" />
                    </button>
                    <button onClick={() => deletePost(post.id)} title="মুছুন"
                      className="p-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
