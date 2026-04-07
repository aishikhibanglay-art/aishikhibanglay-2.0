import { useEffect, useState } from "react";
import { Link } from "wouter";
import { supabase } from "@/lib/supabase";
import AdminLayout from "@/layouts/AdminLayout";
import {
  Search, Plus, Eye, Edit, Trash2, CheckCircle, XCircle,
  Clock, BookOpen, MoreVertical, Star
} from "lucide-react";

interface Course {
  id: string;
  title: string;
  status: "draft" | "pending" | "published" | "rejected";
  price: number;
  level: string;
  thumbnail_url: string | null;
  instructor_name: string;
  created_at: string;
  enrolled_count: number;
  is_featured: boolean;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  published: { label: "প্রকাশিত", color: "text-green-400 bg-green-500/10 border-green-500/30", icon: CheckCircle },
  pending: { label: "অপেক্ষমান", color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30", icon: Clock },
  draft: { label: "ড্রাফট", color: "text-gray-400 bg-gray-500/10 border-gray-700", icon: Edit },
  rejected: { label: "প্রত্যাখ্যাত", color: "text-red-400 bg-red-500/10 border-red-500/30", icon: XCircle },
};

export default function CoursesManagement() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  useEffect(() => { fetchCourses(); }, [statusFilter]);

  const fetchCourses = async () => {
    setLoading(true);
    let q = supabase
      .from("courses")
      .select(`id, title, status, price, level, thumbnail_url, is_featured, created_at,
        profiles!courses_instructor_id_fkey(name),
        enrollments(count)
      `)
      .order("created_at", { ascending: false });
    if (statusFilter !== "all") q = q.eq("status", statusFilter);
    const { data } = await q;
    setCourses((data || []).map((c: any) => ({
      id: c.id, title: c.title, status: c.status, price: c.price, level: c.level,
      thumbnail_url: c.thumbnail_url, is_featured: c.is_featured, created_at: c.created_at,
      instructor_name: c.profiles?.name || "N/A",
      enrolled_count: c.enrollments?.[0]?.count || 0,
    })));
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("courses").update({ status }).eq("id", id);
    await fetchCourses();
    setActiveMenu(null);
  };

  const toggleFeatured = async (id: string, featured: boolean) => {
    await supabase.from("courses").update({ is_featured: !featured }).eq("id", id);
    await fetchCourses();
    setActiveMenu(null);
  };

  const deleteCourse = async (id: string) => {
    if (!confirm("এই কোর্সটি মুছে ফেলতে চান?")) return;
    await supabase.from("courses").delete().eq("id", id);
    await fetchCourses();
    setActiveMenu(null);
  };

  const filtered = courses.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.instructor_name.toLowerCase().includes(search.toLowerCase())
  );

  const counts = {
    all: courses.length,
    published: courses.filter((c) => c.status === "published").length,
    pending: courses.filter((c) => c.status === "pending").length,
    draft: courses.filter((c) => c.status === "draft").length,
  };

  return (
    <AdminLayout>
      <div className="p-6 lg:p-7 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-7">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">কোর্স ব্যবস্থাপনা</h1>
            <p className="text-gray-500 text-sm">{courses.length}টি কোর্স</p>
          </div>
          <Link href="/admin/courses/new">
            <button className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-medium py-2.5 px-4 rounded-xl text-sm transition-colors">
              <Plus className="w-4 h-4" /> নতুন কোর্স
            </button>
          </Link>
        </div>

        {/* Status tabs */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {[
            { value: "all", label: `সব (${counts.all})` },
            { value: "published", label: `প্রকাশিত (${counts.published})` },
            { value: "pending", label: `অপেক্ষমান (${counts.pending})` },
            { value: "draft", label: `ড্রাফট (${counts.draft})` },
          ].map((tab) => (
            <button key={tab.value} onClick={() => setStatusFilter(tab.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                statusFilter === tab.value
                  ? "bg-rose-600 text-white"
                  : "bg-gray-900 border border-gray-800 text-gray-400 hover:text-white"
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="কোর্স বা ইন্সট্রাক্টর নামে খুঁজুন..."
            className="w-full bg-gray-900 border border-gray-800 text-white text-sm placeholder-gray-600 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-rose-500 transition-all" />
        </div>

        {/* Courses Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-gray-900 rounded-2xl overflow-hidden animate-pulse">
                <div className="h-36 bg-gray-800" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-800 rounded w-3/4" />
                  <div className="h-3 bg-gray-800 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-400">কোনো কোর্স পাওয়া যায়নি</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((course) => {
              const sc = statusConfig[course.status] || statusConfig.draft;
              const SIcon = sc.icon;
              return (
                <div key={course.id} className="bg-gray-900/80 border border-gray-800 hover:border-gray-700 rounded-2xl overflow-hidden transition-all group">
                  {/* Thumbnail */}
                  <div className="relative h-36 bg-gray-800">
                    {course.thumbnail_url ? (
                      <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-8 h-8 text-gray-700" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent" />
                    <div className="absolute top-2 left-2 flex gap-1.5">
                      <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-lg border ${sc.color}`}>
                        <SIcon className="w-3 h-3" /> {sc.label}
                      </span>
                      {course.is_featured && (
                        <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-lg border text-yellow-400 bg-yellow-500/10 border-yellow-500/30">
                          <Star className="w-3 h-3" /> Featured
                        </span>
                      )}
                    </div>
                    {/* Price */}
                    <div className="absolute bottom-2 right-2">
                      <span className="text-white font-bold text-sm">
                        {course.price === 0 ? "ফ্রি" : `৳${course.price.toLocaleString()}`}
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-white text-sm mb-1 line-clamp-2">{course.title}</h3>
                    <p className="text-xs text-gray-500 mb-3">{course.instructor_name} · {course.level}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">{course.enrolled_count} জন নথিভুক্ত</span>
                      {/* Actions */}
                      <div className="relative">
                        <button onClick={() => setActiveMenu(activeMenu === course.id ? null : course.id)}
                          className="p-1.5 rounded-lg text-gray-600 hover:text-white hover:bg-gray-700 transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {activeMenu === course.id && (
                          <div className="absolute right-0 bottom-8 z-20 w-44 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
                            <Link href={`/admin/courses/${course.id}`}>
                              <button className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-gray-300 hover:bg-gray-700 hover:text-white text-left">
                                <Eye className="w-3.5 h-3.5" /> দেখুন/সম্পাদনা
                              </button>
                            </Link>
                            {course.status !== "published" && (
                              <button onClick={() => updateStatus(course.id, "published")}
                                className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-green-400 hover:bg-green-500/10 text-left">
                                <CheckCircle className="w-3.5 h-3.5" /> অনুমোদন করুন
                              </button>
                            )}
                            {course.status === "published" && (
                              <button onClick={() => updateStatus(course.id, "draft")}
                                className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-yellow-400 hover:bg-yellow-500/10 text-left">
                                <Clock className="w-3.5 h-3.5" /> ড্রাফটে নামান
                              </button>
                            )}
                            {course.status === "pending" && (
                              <button onClick={() => updateStatus(course.id, "rejected")}
                                className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-orange-400 hover:bg-orange-500/10 text-left">
                                <XCircle className="w-3.5 h-3.5" /> প্রত্যাখ্যান করুন
                              </button>
                            )}
                            <button onClick={() => toggleFeatured(course.id, course.is_featured)}
                              className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-yellow-400 hover:bg-yellow-500/10 text-left">
                              <Star className="w-3.5 h-3.5" /> {course.is_featured ? "Featured সরান" : "Featured করুন"}
                            </button>
                            <div className="border-t border-gray-700">
                              <button onClick={() => deleteCourse(course.id)}
                                className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-red-400 hover:bg-red-500/10 text-left">
                                <Trash2 className="w-3.5 h-3.5" /> মুছে ফেলুন
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
