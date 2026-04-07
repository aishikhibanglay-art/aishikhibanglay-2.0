import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard, Users, BookOpen, CreditCard, FileText,
  MessageSquare, Settings, Mail, Menu, X, LogOut, ChevronRight,
  Bell, Shield, Tag, BarChart3, Globe
} from "lucide-react";

const navGroups = [
  {
    label: "প্রধান",
    items: [
      { href: "/admin", icon: LayoutDashboard, label: "ড্যাশবোর্ড", exact: true },
      { href: "/admin/analytics", icon: BarChart3, label: "অ্যানালিটিক্স" },
    ],
  },
  {
    label: "ব্যবস্থাপনা",
    items: [
      { href: "/admin/users", icon: Users, label: "ব্যবহারকারী" },
      { href: "/admin/courses", icon: BookOpen, label: "কোর্স" },
      { href: "/admin/categories", icon: Tag, label: "ক্যাটাগরি" },
      { href: "/admin/payments", icon: CreditCard, label: "পেমেন্ট" },
    ],
  },
  {
    label: "কন্টেন্ট",
    items: [
      { href: "/admin/blog", icon: FileText, label: "ব্লগ" },
      { href: "/admin/community", icon: MessageSquare, label: "কমিউনিটি" },
      { href: "/admin/pages", icon: Globe, label: "কাস্টম পেজ" },
    ],
  },
  {
    label: "সিস্টেম",
    items: [
      { href: "/admin/email-templates", icon: Mail, label: "ইমেইল টেমপ্লেট" },
      { href: "/admin/settings", icon: Settings, label: "সেটিংস" },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location] = useLocation();
  const { profile, signOut } = useAuth();

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return location === href;
    return location.startsWith(href);
  };

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-gray-800/60">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-rose-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-rose-500/25">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-bold text-white text-sm leading-tight">Admin Panel</div>
            <div className="text-xs text-gray-500">AI শিখি বাংলায়</div>
          </div>
        </Link>
      </div>

      {/* Role Badge */}
      <div className="px-4 py-3 border-b border-gray-800/40">
        <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">
          <Shield className="w-3.5 h-3.5 text-rose-400" />
          <span className="text-xs font-semibold text-rose-300 capitalize">{profile?.role?.replace("_", " ") || "Admin"}</span>
        </div>
      </div>

      {/* Nav Groups */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-4">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider px-3 mb-1.5">{group.label}</p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${
                    isActive(item.href, item.exact)
                      ? "bg-rose-500/15 text-rose-300 border border-rose-500/25"
                      : "text-gray-400 hover:bg-gray-800/60 hover:text-gray-200"
                  }`}
                >
                  <item.icon className={`w-4 h-4 flex-shrink-0 ${isActive(item.href, item.exact) ? "text-rose-400" : "text-gray-600 group-hover:text-gray-400"}`} />
                  <span className="text-sm font-medium flex-1">{item.label}</span>
                  {isActive(item.href, item.exact) && <ChevronRight className="w-3.5 h-3.5 text-rose-400" />}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Switch to Student View */}
      <div className="px-3 pb-2">
        <Link href="/dashboard"
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-gray-500 hover:text-gray-300 hover:bg-gray-800/40 transition-all text-sm">
          <LayoutDashboard className="w-4 h-4" />
          Student Dashboard
        </Link>
      </div>

      {/* User */}
      <div className="px-3 py-3 border-t border-gray-800/60">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-800/40">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
            {profile?.name?.[0]?.toUpperCase() || "A"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-white truncate">{profile?.name}</div>
            <div className="text-xs text-gray-600 truncate">{profile?.email}</div>
          </div>
          <button onClick={signOut} title="লগআউট"
            className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-400/10 transition-colors">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-gray-900/90 border-r border-gray-800/60 flex-shrink-0">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="relative z-10 w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
            <div className="absolute top-3 right-3">
              <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800">
                <X className="w-4 h-4" />
              </button>
            </div>
            <Sidebar />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex-shrink-0 h-14 bg-gray-900/50 border-b border-gray-800/60 flex items-center justify-between px-5">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800">
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:block">
              <nav className="flex text-xs text-gray-600">
                <span>Admin</span>
                {location !== "/admin" && (
                  <>
                    <span className="mx-1.5">/</span>
                    <span className="text-gray-300 capitalize">{location.split("/admin/")[1] || ""}</span>
                  </>
                )}
              </nav>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full" />
            </button>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center text-white font-bold text-xs">
              {profile?.name?.[0]?.toUpperCase() || "A"}
            </div>
          </div>
        </header>

        {/* Page */}
        <main className="flex-1 overflow-y-auto bg-gray-950">
          {children}
        </main>
      </div>
    </div>
  );
}
