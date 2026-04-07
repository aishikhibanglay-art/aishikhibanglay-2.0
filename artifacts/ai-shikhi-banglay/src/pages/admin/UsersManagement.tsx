import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import AdminLayout from "@/layouts/AdminLayout";
import {
  Search, Filter, MoreVertical, Shield, Ban, UserCheck,
  ChevronLeft, ChevronRight, Users, Mail, Calendar
} from "lucide-react";

type Role = "super_admin" | "admin" | "moderator" | "student";

interface User {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: Role;
  is_banned: boolean;
  created_at: string;
  avatar_url: string | null;
}

const roleOptions: { value: Role; label: string }[] = [
  { value: "student", label: "Student" },
  { value: "moderator", label: "Moderator" },
  { value: "admin", label: "Admin" },
  { value: "super_admin", label: "Super Admin" },
];

const roleColors: Record<Role, string> = {
  super_admin: "text-rose-400 bg-rose-500/10 border-rose-500/30",
  admin: "text-orange-400 bg-orange-500/10 border-orange-500/30",
  moderator: "text-blue-400 bg-blue-500/10 border-blue-500/30",
  student: "text-gray-400 bg-gray-500/10 border-gray-700",
};

export default function UsersManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 10;

  useEffect(() => { fetchUsers(); }, [page, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    let q = supabase.from("profiles").select("*", { count: "exact" });
    if (roleFilter !== "all") q = q.eq("role", roleFilter);
    if (statusFilter === "banned") q = q.eq("is_banned", true);
    if (statusFilter === "active") q = q.eq("is_banned", false);
    q = q.order("created_at", { ascending: false }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
    const { data, count } = await q;
    setUsers((data || []) as User[]);
    setTotal(count || 0);
    setLoading(false);
  };

  const updateRole = async (userId: string, role: Role) => {
    await supabase.from("profiles").update({ role }).eq("user_id", userId);
    await fetchUsers();
    setActiveMenu(null);
  };

  const toggleBan = async (userId: string, banned: boolean) => {
    await supabase.from("profiles").update({ is_banned: !banned }).eq("user_id", userId);
    await fetchUsers();
    setActiveMenu(null);
  };

  const filtered = users.filter(
    (u) => u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const formatDate = (d: string) => new Date(d).toLocaleDateString("bn-BD", { year: "numeric", month: "short", day: "numeric" });

  return (
    <AdminLayout>
      <div className="p-6 lg:p-7 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-7">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">ব্যবহারকারী ব্যবস্থাপনা</h1>
            <p className="text-gray-500 text-sm">মোট {total.toLocaleString()} জন ব্যবহারকারী</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "মোট", value: total, color: "text-white" },
            { label: "Admin", value: users.filter((u) => ["admin", "super_admin"].includes(u.role)).length, color: "text-rose-400" },
            { label: "Moderator", value: users.filter((u) => u.role === "moderator").length, color: "text-blue-400" },
            { label: "নিষিদ্ধ", value: users.filter((u) => u.is_banned).length, color: "text-red-400" },
          ].map((s) => (
            <div key={s.label} className="bg-gray-900/60 border border-gray-800 rounded-xl px-4 py-3">
              <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="নাম বা ইমেইল দিয়ে খুঁজুন..."
              className="w-full bg-gray-900 border border-gray-800 text-white text-sm placeholder-gray-600 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-rose-500 transition-all"
            />
          </div>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-gray-900 border border-gray-800 text-gray-300 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-rose-500">
            <option value="all">সব Role</option>
            <option value="student">Student</option>
            <option value="moderator">Moderator</option>
            <option value="admin">Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-gray-900 border border-gray-800 text-gray-300 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-rose-500">
            <option value="all">সব Status</option>
            <option value="active">সক্রিয়</option>
            <option value="banned">নিষিদ্ধ</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-gray-900/60 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">ব্যবহারকারী</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 hidden md:table-cell">Role</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 hidden lg:table-cell">যোগ দিয়েছেন</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      <td colSpan={5} className="px-5 py-3">
                        <div className="h-10 bg-gray-800/60 rounded-xl animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-gray-600 text-sm">
                      <Users className="w-8 h-8 mx-auto mb-2 text-gray-700" />
                      কোনো ব্যবহারকারী পাওয়া যায়নি
                    </td>
                  </tr>
                ) : filtered.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {user.name?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate">{user.name}</p>
                          <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-lg border ${roleColors[user.role]}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-5 py-3 hidden lg:table-cell">
                      <span className="text-xs text-gray-500 flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" /> {formatDate(user.created_at)}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-lg border ${
                        user.is_banned ? "text-red-400 bg-red-500/10 border-red-500/30" : "text-green-400 bg-green-500/10 border-green-500/30"
                      }`}>
                        {user.is_banned ? "নিষিদ্ধ" : "সক্রিয়"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="relative">
                        <button
                          onClick={() => setActiveMenu(activeMenu === user.id ? null : user.id)}
                          className="p-1.5 rounded-lg text-gray-600 hover:text-white hover:bg-gray-700 transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {activeMenu === user.id && (
                          <div className="absolute right-0 top-8 z-20 w-48 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
                            <div className="px-3 py-2 border-b border-gray-700">
                              <p className="text-xs font-semibold text-gray-400">Role পরিবর্তন</p>
                            </div>
                            {roleOptions.map((opt) => (
                              <button key={opt.value} onClick={() => updateRole(user.user_id, opt.value)}
                                className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-gray-700 transition-colors ${user.role === opt.value ? "text-rose-400" : "text-gray-300"}`}>
                                <Shield className="w-3.5 h-3.5" /> {opt.label}
                                {user.role === opt.value && <span className="ml-auto text-rose-400">✓</span>}
                              </button>
                            ))}
                            <div className="border-t border-gray-700">
                              <button onClick={() => toggleBan(user.user_id, user.is_banned)}
                                className={`w-full flex items-center gap-2 px-3 py-2.5 text-xs text-left transition-colors ${
                                  user.is_banned ? "text-green-400 hover:bg-green-500/10" : "text-red-400 hover:bg-red-500/10"
                                }`}>
                                {user.is_banned ? <UserCheck className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                                {user.is_banned ? "নিষেধ তুলুন" : "নিষিদ্ধ করুন"}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-gray-800">
              <p className="text-xs text-gray-500">
                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} / {total}
              </p>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  className="p-2 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="flex items-center px-3 text-sm text-gray-300">{page} / {totalPages}</span>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="p-2 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
