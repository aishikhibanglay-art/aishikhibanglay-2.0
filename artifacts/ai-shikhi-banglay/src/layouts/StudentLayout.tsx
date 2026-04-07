import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard, BookOpen, Award, Users, User,
  CreditCard, Menu, X, LogOut, ChevronRight, Bell,
  Shield, MessageSquare, ExternalLink
} from "lucide-react";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "ড্যাশবোর্ড", labelEn: "Dashboard" },
  { href: "/dashboard/courses", icon: BookOpen, label: "আমার কোর্স", labelEn: "My Courses" },
  { href: "/dashboard/certificates", icon: Award, label: "সার্টিফিকেট", labelEn: "Certificates" },
  { href: "/dashboard/community", icon: Users, label: "কমিউনিটি", labelEn: "Community" },
  { href: "/dashboard/profile", icon: User, label: "প্রোফাইল", labelEn: "Profile" },
  { href: "/dashboard/billing", icon: CreditCard, label: "বিলিং", labelEn: "Billing" },
];

// Role → admin panel destination + label + style
const adminPanelConfig: Record<string, { href: string; label: string; sublabel: string; color: string; border: string; iconColor: string; badgeColor: string }> = {
  super_admin: {
    href: "/admin",
    label: "Super Admin Panel",
    sublabel: "সম্পূর্ণ নিয়ন্ত্রণ",
    color: "bg-rose-500/10 hover:bg-rose-500/20",
    border: "border-rose-500/30",
    iconColor: "text-rose-400",
    badgeColor: "bg-rose-500/20 text-rose-300",
  },
  admin: {
    href: "/admin",
    label: "Admin Panel",
    sublabel: "প্ল্যাটফর্ম ব্যবস্থাপনা",
    color: "bg-orange-500/10 hover:bg-orange-500/20",
    border: "border-orange-500/30",
    iconColor: "text-orange-400",
    badgeColor: "bg-orange-500/20 text-orange-300",
  },
  moderator: {
    href: "/admin/community",
    label: "Moderator Panel",
    sublabel: "কমিউনিটি মডারেশন",
    color: "bg-blue-500/10 hover:bg-blue-500/20",
    border: "border-blue-500/30",
    iconColor: "text-blue-400",
    badgeColor: "bg-blue-500/20 text-blue-300",
  },
};

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location] = useLocation();
  const { profile, signOut } = useAuth();

  const role = profile?.role;
  const panelConfig = role && role !== "student" ? adminPanelConfig[role] : null;

  const isActive = (href: string) => {
    if (href === "/dashboard") return location === "/dashboard";
    return location.startsWith(href);
  };

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-800/60">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/25">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-bold text-white text-sm leading-tight">AI শিখি বাংলায়</div>
            <div className="text-xs text-gray-500">Student Portal</div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${
              isActive(item.href)
                ? "bg-violet-600/20 text-violet-300 border border-violet-500/30"
                : "text-gray-400 hover:bg-gray-800/60 hover:text-gray-200"
            }`}
          >
            <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive(item.href) ? "text-violet-400" : "text-gray-500 group-hover:text-gray-300"}`} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{item.label}</div>
              <div className="text-xs text-gray-600 truncate">{item.labelEn}</div>
            </div>
            {isActive(item.href) && <ChevronRight className="w-4 h-4 text-violet-400 flex-shrink-0" />}
          </Link>
        ))}
      </nav>

      {/* ── Admin/Mod Panel Switch ── */}
      {panelConfig && (
        <div className="px-3 pb-2">
          <div className="mb-2 px-3">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">আপনার প্যানেল</p>
          </div>
          <Link
            href={panelConfig.href}
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-3 py-3 rounded-xl border transition-all group ${panelConfig.color} ${panelConfig.border}`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${panelConfig.badgeColor}`}>
              {role === "moderator"
                ? <MessageSquare className={`w-4 h-4 ${panelConfig.iconColor}`} />
                : <Shield className={`w-4 h-4 ${panelConfig.iconColor}`} />
              }
            </div>
            <div className="flex-1 min-w-0">
              <div className={`text-sm font-semibold ${panelConfig.iconColor}`}>{panelConfig.label}</div>
              <div className="text-xs text-gray-500">{panelConfig.sublabel}</div>
            </div>
            <ExternalLink className={`w-3.5 h-3.5 ${panelConfig.iconColor} opacity-60 group-hover:opacity-100 transition-opacity`} />
          </Link>
        </div>
      )}

      {/* User */}
      <div className="px-3 py-4 border-t border-gray-800/60">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-800/40">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.name}
              className="w-9 h-9 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
              {profile?.name?.[0]?.toUpperCase() || "?"}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">{profile?.name || "শিক্ষার্থী"}</div>
            <div className="text-xs text-gray-500 truncate">{profile?.email}</div>
          </div>
          <button
            onClick={signOut}
            title="লগআউট"
            className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-400/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-gray-900/80 border-r border-gray-800/60 flex-shrink-0">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="relative z-10 w-72 bg-gray-900 border-r border-gray-800 flex flex-col">
            <div className="absolute top-4 right-4">
              <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            <Sidebar />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex-shrink-0 h-16 bg-gray-900/50 border-b border-gray-800/60 flex items-center justify-between px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />

          <div className="flex items-center gap-3">
            {/* Panel Switch Button — topbar (desktop only) */}
            {panelConfig && (
              <Link href={panelConfig.href}>
                <button className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${panelConfig.color} ${panelConfig.border} ${panelConfig.iconColor}`}>
                  {role === "moderator"
                    ? <MessageSquare className="w-3.5 h-3.5" />
                    : <Shield className="w-3.5 h-3.5" />
                  }
                  {panelConfig.label}
                </button>
              </Link>
            )}

            <button className="relative p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-violet-500 rounded-full" />
            </button>

            <Link href="/dashboard/profile">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.name}
                  className="w-9 h-9 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-violet-500/50 transition-all"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm cursor-pointer hover:ring-2 hover:ring-violet-500/50 transition-all">
                  {profile?.name?.[0]?.toUpperCase() || "?"}
                </div>
              )}
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
