import { useEffect, useState } from "react";
import { Link } from "wouter";
import { supabase } from "@/lib/supabase";
import AdminLayout from "@/layouts/AdminLayout";
import {
  Plus, Search, Edit2, Trash2, Eye, FileText,
  Clock, CheckCircle, Pin, MoreVertical
} from "lucide-react";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  status: "draft" | "published";
  is_featured: boolean;
  cover_image_url: string | null;
  author_name: string;
  category: string | null;
  view_count: number;
  created_at: string;
  published_at: string | null;
}

const statusConfig = {
  published: { label: "প্রকাশিত", color: "text-green-400 bg-green-500/10 border-green-500/30", icon: CheckCircle },
  draft: { label: "ড্রাফট", color: "text-gray-400 bg-gray-500/10 border-gray-700", icon: Clock },
};

export default function BlogManagement() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => { fetchPosts(); }, [statusFilter]);

  const fetchPosts = async () => {
    setLoading(true);
    let q = supabase
      .from("blog_posts")
      .select(`id, title, slug, status, is_featured, cover_image_url, category, view_count, created_at, published_at, profiles(name)`)
      .order("created_at", { ascending: false });
    if (statusFilter !== "all") q = q.eq("status", statusFilter);
    const { data } = await q;
    setPosts(
      (data || []).map((p: any) => ({
        ...p,
        author_name: p.profiles?.name || "Unknown",
      }))
    );
    setLoading(false);
  };

  const toggleStatus = async (post: BlogPost) => {
    const newStatus = post.status === "published" ? "draft" : "published";
    await supabase.from("blog_posts").update({
      status: newStatus,
      published_at: newStatus === "published" ? new Date().toISOString() : null,
    }).eq("id", post.id);
    await fetchPosts();
    setActiveMenu(null);
  };

  const toggleFeatured = async (post: BlogPost) => {
    await supabase.from("blog_posts").update({ is_featured: !post.is_featured }).eq("id", post.id);
    await fetchPosts();
    setActiveMenu(null);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("blog_posts").delete().eq("id", id);
    setDeleteId(null);
    await fetchPosts();
  };

  const filtered = posts.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    (p.category || "").toLowerCase().includes(search.toLowerCase())
  );

  const counts = { all: posts.length, published: posts.filter((p) => p.status === "published").length, draft: posts.filter((p) => p.status === "draft").length };
  const timeAgo = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const h = Math.floor(diff / 3600000);
    if (h < 1) return `${Math.floor(diff / 60000)} মি আগে`;
    if (h < 24) return `${h} ঘণ্টা আগে`;
    return `${Math.floor(h / 24)} দিন আগে`;
  };

  return (
    <AdminLayout>
      <div className="p-6 lg:p-7 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-7">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">ব্লগ ব্যবস্থাপনা</h1>
            <p className="text-gray-500 text-sm">{posts.length}টি পোস্ট</p>
          </div>
          <Link href="/admin/blog/new">
            <button className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-medium py-2.5 px-4 rounded-xl text-sm transition-colors">
              <Plus className="w-4 h-4" /> নতুন পোস্ট
            </button>
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {[
            { value: "all", label: `সব (${counts.all})` },
            { value: "published", label: `প্রকাশিত (${counts.published})` },
            { value: "draft", label: `ড্রাফট (${counts.draft})` },
          ].map((tab) => (
            <button key={tab.value} onClick={() => setStatusFilter(tab.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${statusFilter === tab.value ? "bg-rose-600 text-white" : "bg-gray-900 border border-gray-800 text-gray-400 hover:text-white"}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="শিরোনাম বা ক্যাটাগরি দিয়ে খুঁজুন..."
            className="w-full bg-gray-900 border border-gray-800 text-white text-sm placeholder-gray-600 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-rose-500 transition-all" />
        </div>

        {/* Delete Confirm */}
        {deleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl">
              <div className="w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">পোস্ট মুছবেন?</h3>
              <p className="text-gray-400 text-sm mb-5">এই ব্লগ পোস্টটি মুছে গেলে আর ফেরত আনা যাবে না।</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 text-sm hover:text-white transition-colors">বাতিল</button>
                <button onClick={() => handleDelete(deleteId)}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-colors">মুছুন</button>
              </div>
            </div>
          </div>
        )}

        {/* Posts List */}
        <div className="bg-gray-900/60 border border-gray-800 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-5 space-y-3">
              {[1,2,3,4,5].map((i) => <div key={i} className="h-16 bg-gray-800/60 rounded-xl animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="w-12 h-12 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-400">কোনো পোস্ট পাওয়া যায়নি</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800/60">
              {filtered.map((post) => {
                const sc = statusConfig[post.status];
                const SIcon = sc.icon;
                return (
                  <div key={post.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-800/30 transition-colors">
                    {/* Thumbnail */}
                    <div className="w-16 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-gray-800">
                      {post.cover_image_url ? (
                        <img src={post.cover_image_url} alt={post.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FileText className="w-5 h-5 text-gray-700" />
                        </div>
                      )}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="text-sm font-medium text-white truncate">{post.title}</h3>
                        {post.is_featured && (
                          <span className="text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 px-1.5 py-0.5 rounded-lg flex items-center gap-1 flex-shrink-0">
                            <Pin className="w-2.5 h-2.5" /> Featured
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>{post.author_name}</span>
                        {post.category && <span>· {post.category}</span>}
                        <span>· {timeAgo(post.created_at)}</span>
                        <span>· {post.view_count || 0} ভিউ</span>
                      </div>
                    </div>
                    {/* Status */}
                    <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg border ${sc.color} flex-shrink-0`}>
                      <SIcon className="w-3 h-3" /> {sc.label}
                    </span>
                    {/* Actions */}
                    <div className="relative flex-shrink-0">
                      <button onClick={() => setActiveMenu(activeMenu === post.id ? null : post.id)}
                        className="p-1.5 rounded-lg text-gray-600 hover:text-white hover:bg-gray-700 transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {activeMenu === post.id && (
                        <div className="absolute right-0 top-8 z-20 w-44 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
                          <Link href={`/admin/blog/${post.id}/edit`}>
                            <button className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-gray-300 hover:bg-gray-700 hover:text-white text-left">
                              <Edit2 className="w-3.5 h-3.5" /> সম্পাদনা করুন
                            </button>
                          </Link>
                          <Link href={`/blog/${post.slug}`}>
                            <button className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-gray-300 hover:bg-gray-700 hover:text-white text-left">
                              <Eye className="w-3.5 h-3.5" /> লাইভ দেখুন
                            </button>
                          </Link>
                          <button onClick={() => toggleStatus(post)}
                            className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-left hover:bg-gray-700 transition-colors text-blue-400 hover:text-blue-300">
                            {post.status === "published" ? <Clock className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                            {post.status === "published" ? "ড্রাফটে নামান" : "প্রকাশ করুন"}
                          </button>
                          <button onClick={() => toggleFeatured(post)}
                            className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-yellow-400 hover:bg-yellow-500/10 text-left">
                            <Pin className="w-3.5 h-3.5" /> {post.is_featured ? "Featured সরান" : "Featured করুন"}
                          </button>
                          <div className="border-t border-gray-700">
                            <button onClick={() => { setDeleteId(post.id); setActiveMenu(null); }}
                              className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-red-400 hover:bg-red-500/10 text-left">
                              <Trash2 className="w-3.5 h-3.5" /> মুছে ফেলুন
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
