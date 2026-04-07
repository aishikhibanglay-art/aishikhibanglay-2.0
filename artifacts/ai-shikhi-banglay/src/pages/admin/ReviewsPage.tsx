import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import AdminLayout from "@/layouts/AdminLayout";
import {
  Star, Search, CheckCircle, XCircle, Trash2, Eye, EyeOff,
  ChevronLeft, ChevronRight, MessageSquare, MoreVertical
} from "lucide-react";

interface Review {
  id: string;
  rating: number;
  comment: string;
  is_approved: boolean;
  is_hidden: boolean;
  user_name: string;
  user_email: string;
  course_title: string;
  created_at: string;
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState(0);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const PAGE_SIZE = 15;

  useEffect(() => { fetchReviews(); }, [page, filter, ratingFilter]);

  const fetchReviews = async () => {
    setLoading(true);
    let q = supabase
      .from("course_reviews")
      .select(`
        id, rating, comment, is_approved, is_hidden, created_at,
        profiles(name, email), courses(title)
      `, { count: "exact" })
      .order("created_at", { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
    if (filter === "approved") q = q.eq("is_approved", true);
    if (filter === "pending") q = q.eq("is_approved", false);
    if (filter === "hidden") q = q.eq("is_hidden", true);
    if (ratingFilter > 0) q = q.eq("rating", ratingFilter);
    const { data, count } = await q;
    setReviews(
      (data || []).map((r: any) => ({
        id: r.id, rating: r.rating, comment: r.comment,
        is_approved: r.is_approved, is_hidden: r.is_hidden,
        user_name: r.profiles?.name || "Unknown",
        user_email: r.profiles?.email || "",
        course_title: r.courses?.title || "Unknown",
        created_at: r.created_at,
      }))
    );
    setTotal(count || 0);
    setLoading(false);
  };

  const approve = async (id: string, approved: boolean) => {
    await supabase.from("course_reviews").update({ is_approved: !approved }).eq("id", id);
    await fetchReviews();
    setActiveMenu(null);
  };

  const toggleHidden = async (id: string, hidden: boolean) => {
    await supabase.from("course_reviews").update({ is_hidden: !hidden }).eq("id", id);
    await fetchReviews();
    setActiveMenu(null);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("course_reviews").delete().eq("id", id);
    setDeleteId(null);
    await fetchReviews();
  };

  const filtered = reviews.filter(
    (r) => r.user_name.toLowerCase().includes(search.toLowerCase()) ||
      r.course_title.toLowerCase().includes(search.toLowerCase()) ||
      r.comment.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const timeAgo = (d: string) => new Date(d).toLocaleDateString("bn-BD", { year: "numeric", month: "short", day: "numeric" });

  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : "0.0";
  const pending = reviews.filter((r) => !r.is_approved).length;

  return (
    <AdminLayout>
      <div className="p-6 lg:p-7 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-7">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">রিভিউ মডারেশন</h1>
            <p className="text-gray-500 text-sm">মোট {total} রিভিউ</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: "মোট রিভিউ", value: total, icon: MessageSquare, color: "text-white", bg: "bg-gray-900/60", border: "border-gray-800" },
            { label: "গড় রেটিং", value: `⭐ ${avgRating}`, icon: Star, color: "text-yellow-400", bg: "bg-yellow-500/5", border: "border-yellow-500/20" },
            { label: "অনুমোদনের অপেক্ষায়", value: pending, icon: CheckCircle, color: "text-orange-400", bg: "bg-orange-500/5", border: "border-orange-500/20" },
            { label: "অনুমোদিত", value: reviews.filter((r) => r.is_approved).length, icon: CheckCircle, color: "text-green-400", bg: "bg-green-500/5", border: "border-green-500/20" },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} border ${s.border} rounded-2xl px-4 py-4`}>
              <div className={`text-xl font-bold ${s.color} mb-0.5`}>{s.value}</div>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Delete Confirm */}
        {deleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl">
              <div className="w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 className="w-6 h-6 text-red-400" /></div>
              <h3 className="text-lg font-bold text-white mb-2">রিভিউ মুছবেন?</h3>
              <p className="text-gray-400 text-sm mb-5">এই রিভিউটি স্থায়ীভাবে মুছে যাবে।</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 text-sm">বাতিল</button>
                <button onClick={() => handleDelete(deleteId)} className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-medium">মুছুন</button>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="নাম, কোর্স বা মন্তব্য খুঁজুন..."
              className="w-full bg-gray-900 border border-gray-800 text-white text-sm placeholder-gray-600 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-rose-500" />
          </div>
          <div className="flex rounded-xl border border-gray-800 overflow-hidden bg-gray-900">
            {[{ v: "all", l: "সব" }, { v: "pending", l: "অপেক্ষমান" }, { v: "approved", l: "অনুমোদিত" }, { v: "hidden", l: "লুকানো" }].map((f) => (
              <button key={f.v} onClick={() => { setFilter(f.v); setPage(1); }}
                className={`px-3 py-2.5 text-xs font-medium transition-colors ${filter === f.v ? "bg-rose-600 text-white" : "text-gray-400 hover:text-gray-200"}`}>
                {f.l}
              </button>
            ))}
          </div>
          <div className="flex rounded-xl border border-gray-800 overflow-hidden bg-gray-900">
            <button onClick={() => setRatingFilter(0)} className={`px-3 py-2 text-xs transition-colors ${ratingFilter === 0 ? "bg-rose-600 text-white" : "text-gray-400 hover:text-gray-200"}`}>সব</button>
            {[5, 4, 3, 2, 1].map((r) => (
              <button key={r} onClick={() => setRatingFilter(r === ratingFilter ? 0 : r)}
                className={`px-2.5 py-2 text-xs transition-colors ${ratingFilter === r ? "bg-rose-600 text-white" : "text-gray-400 hover:text-gray-200"}`}>
                {r}⭐
              </button>
            ))}
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-3">
          {loading ? (
            [...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-900 rounded-2xl animate-pulse" />)
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 bg-gray-900/60 border border-gray-800 rounded-2xl">
              <Star className="w-12 h-12 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-400">কোনো রিভিউ পাওয়া যায়নি</p>
            </div>
          ) : filtered.map((review) => (
            <div key={review.id} className={`bg-gray-900/60 border rounded-2xl p-5 transition-all ${review.is_hidden ? "border-gray-800 opacity-60" : review.is_approved ? "border-gray-800" : "border-yellow-500/30 bg-yellow-500/5"}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {review.user_name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-medium text-white">{review.user_name}</span>
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map((s) => (
                          <Star key={s} className={`w-3.5 h-3.5 ${s <= review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-700"}`} />
                        ))}
                      </div>
                      {!review.is_approved && (
                        <span className="text-xs text-orange-400 bg-orange-500/10 border border-orange-500/30 px-2 py-0.5 rounded-lg">অপেক্ষমান</span>
                      )}
                      {review.is_hidden && (
                        <span className="text-xs text-gray-500 bg-gray-800 border border-gray-700 px-2 py-0.5 rounded-lg">লুকানো</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mb-2">{review.course_title} · {timeAgo(review.created_at)}</p>
                    <p className="text-sm text-gray-300 leading-relaxed">{review.comment}</p>
                  </div>
                </div>

                <div className="relative flex-shrink-0">
                  <button onClick={() => setActiveMenu(activeMenu === review.id ? null : review.id)}
                    className="p-1.5 rounded-lg text-gray-600 hover:text-white hover:bg-gray-700 transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  {activeMenu === review.id && (
                    <div className="absolute right-0 top-8 z-20 w-48 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
                      <button onClick={() => approve(review.id, review.is_approved)}
                        className={`w-full flex items-center gap-2 px-3 py-2.5 text-xs text-left transition-colors ${review.is_approved ? "text-orange-400 hover:bg-orange-500/10" : "text-green-400 hover:bg-green-500/10"}`}>
                        {review.is_approved ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                        {review.is_approved ? "অনুমোদন বাতিল" : "অনুমোদন করুন"}
                      </button>
                      <button onClick={() => toggleHidden(review.id, review.is_hidden)}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-gray-300 hover:bg-gray-700 text-left">
                        {review.is_hidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        {review.is_hidden ? "দৃশ্যমান করুন" : "লুকিয়ে রাখুন"}
                      </button>
                      <div className="border-t border-gray-700">
                        <button onClick={() => { setDeleteId(review.id); setActiveMenu(null); }}
                          className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-red-400 hover:bg-red-500/10 text-left">
                          <Trash2 className="w-3.5 h-3.5" /> মুছে ফেলুন
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-5">
            <p className="text-xs text-gray-500">{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} / {total}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="p-2 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:bg-gray-700 disabled:opacity-30 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="flex items-center px-3 text-sm text-gray-300">{page}/{totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="p-2 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:bg-gray-700 disabled:opacity-30 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
