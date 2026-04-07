import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import {
  LayoutDashboard, BookOpen, Award, Users, User,
  CreditCard, Menu, X, LogOut, ChevronRight, Bell,
  Shield, MessageSquare, ExternalLink, Info, CheckCircle,
  AlertTriangle, Megaphone, Check
} from "lucide-react";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "ড্যাশবোর্ড", labelEn: "Dashboard" },
  { href: "/dashboard/courses", icon: BookOpen, label: "আমার কোর্স", labelEn: "My Courses" },
  { href: "/dashboard/certificates", icon: Award, label: "সার্টিফিকেট", labelEn: "Certificates" },
  { href: "/dashboard/community", icon: Users, label: "কমিউনিটি", labelEn: "Community" },
  { href: "/dashboard/profile", icon: User, label: "প্রোফাইল", labelEn: "Profile" },
  { href: "/dashboard/billing", icon: CreditCard, label: "বিলিং", labelEn: "Billing" },
];

const adminPanelConfig: Record<string, { href: string; label: string; sublabel: string; color: string; border: string; iconColor: string; badgeColor: string }> = {
  super_admin: {
    href: "/admin", label: "Super Admin Panel", sublabel: "সম্পূর্ণ নিয়ন্ত্রণ",
    color: "bg-rose-500/10 hover:bg-rose-500/20", border: "border-rose-500/30",
    iconColor: "text-rose-400", badgeColor: "bg-rose-500/20 text-rose-300",
  },
  admin: {
    href: "/admin", label: "Admin Panel", sublabel: "প্ল্যাটফর্ম ব্যবস্থাপনা",
    color: "bg-orange-500/10 hover:bg-orange-500/20", border: "border-orange-500/30",
    iconColor: "text-orange-400", badgeColor: "bg-orange-500/20 text-orange-300",
  },
  moderator: {
    href: "/admin/community", label: "Moderator Panel", sublabel: "কমিউনিটি মডারেশন",
    color: "bg-blue-500/10 hover:bg-blue-500/20", border: "border-blue-500/30",
    iconColor: "text-blue-400", badgeColor: "bg-blue-500/20 text-blue-300",
  },
};

const notifTypeConfig: Record<string, { icon: React.ElementType; color: string }> = {
  info: { icon: Info, color: "text-blue-400" },
  success: { icon: CheckCircle, color: "text-green-400" },
  warning: { icon: AlertTriangle, color: "text-yellow-400" },
  announcement: { icon: Megaphone, color: "text-rose-400" },
};

interface UserNotif {
  id: string;
  notification_id: string;
  is_read: boolean;
  created_at: string;
  title: string;
  message: string;
  type: string;
}

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location] = useLocation();
  const { profile, signOut } = useAuth();

  // Notifications
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState<UserNotif[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (profile) fetchNotifs();
  }, [profile]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchNotifs = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from("user_notifications")
      .select("id, is_read, created_at, notification_id, notifications(title, message, type)")
      .eq("user_id", profile.user_id)
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) {
      const mapped = data.map((n: any) => ({
        id: n.id,
        notification_id: n.notification_id,
        is_read: n.is_read,
        created_at: n.created_at,
        title: n.notifications?.title || "",
        message: n.notifications?.message || "",
        type: n.notifications?.type || "info",
      }));
      setNotifs(mapped);
      setUnreadCount(mapped.filter((n) => !n.is_read).length);
    }
  };

  const markAllRead = async () => {
    if (!profile || notifs.filter((n) => !n.is_read).length === 0) return;
    const unreadIds = notifs.filter((n) => !n.is_read).map((n) => n.id);
    await supabase.from("user_notifications").update({ is_read: true }).in("id", unreadIds);
    setNotifs((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const markOneRead = async (id: string) => {
    await supabase.from("user_notifications").update({ is_read: true }).eq("id", id);
    setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const timeAgo = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "এইমাত্র";
    if (mins < 60) return `${mins}মি আগে`;
    const h = Math.floor(mins / 60);
    if (h < 24) return `${h}ঘণ্টা আগে`;
    return `${Math.floor(h / 24)}দিন আগে`;
  };

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
          <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${
              isActive(item.href)
                ? "bg-violet-600/20 text-violet-300 border border-violet-500/30"
                : "text-gray-400 hover:bg-gray-800/60 hover:text-gray-200"
            }`}>
            <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive(item.href) ? "text-violet-400" : "text-gray-500 group-hover:text-gray-300"}`} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{item.label}</div>
              <div className="text-xs text-gray-600 truncate">{item.labelEn}</div>
            </div>
            {isActive(item.href) && <ChevronRight className="w-4 h-4 text-violet-400 flex-shrink-0" />}
          </Link>
        ))}
      </nav>

      {/* Admin Panel Switch */}
      {panelConfig && (
        <div className="px-3 pb-2">
          <div className="mb-2 px-3">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">আপনার প্যানেল</p>
          </div>
          <Link href={panelConfig.href} onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-3 py-3 rounded-xl border transition-all group ${panelConfig.color} ${panelConfig.border}`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${panelConfig.badgeColor}`}>
              {role === "moderator" ? <MessageSquare className={`w-4 h-4 ${panelConfig.iconColor}`} /> : <Shield className={`w-4 h-4 ${panelConfig.iconColor}`} />}
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
            <img src={profile.avatar_url} alt={profile.name} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
              {profile?.name?.[0]?.toUpperCase() || "?"}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">{profile?.name || "শিক্ষার্থী"}</div>
            <div className="text-xs text-gray-500 truncate">{profile?.email}</div>
          </div>
          <button onClick={signOut} title="লগআউট"
            className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-400/10 transition-colors">
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
        <header className="flex-shrink-0 h-14 bg-gray-900/50 border-b border-gray-800/60 flex items-center justify-between px-5">
          <button onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />

          <div className="flex items-center gap-2">
            {panelConfig && (
              <Link href={panelConfig.href}>
                <button className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${panelConfig.color} ${panelConfig.border} ${panelConfig.iconColor}`}>
                  {role === "moderator" ? <MessageSquare className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                  {panelConfig.label}
                </button>
              </Link>
            )}

            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button onClick={() => { setNotifOpen(!notifOpen); if (!notifOpen) markAllRead(); }}
                className="relative p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-violet-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {notifOpen && (
                <div className="absolute right-0 top-11 w-80 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                    <span className="text-sm font-semibold text-white">নোটিফিকেশন</span>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors">
                        <Check className="w-3 h-3" /> সব পড়লাম
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-gray-800/60">
                    {notifs.length === 0 ? (
                      <div className="text-center py-10">
                        <Bell className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">কোনো নোটিফিকেশন নেই</p>
                      </div>
                    ) : notifs.map((n) => {
                      const tc = notifTypeConfig[n.type] || notifTypeConfig.info;
                      const TypeIcon = tc.icon;
                      return (
                        <div key={n.id}
                          className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-800/40 transition-colors cursor-pointer ${!n.is_read ? "bg-violet-500/5" : ""}`}
                          onClick={() => !n.is_read && markOneRead(n.id)}>
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${tc.color} bg-gray-800`}>
                            <TypeIcon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-medium ${n.is_read ? "text-gray-300" : "text-white"} leading-tight mb-0.5`}>{n.title}</p>
                            <p className="text-xs text-gray-500 line-clamp-2">{n.message}</p>
                            <p className="text-xs text-gray-700 mt-1">{timeAgo(n.created_at)}</p>
                          </div>
                          {!n.is_read && <div className="w-2 h-2 bg-violet-500 rounded-full flex-shrink-0 mt-1" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Avatar */}
            <Link href="/dashboard/profile">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.name}
                  className="w-9 h-9 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-violet-500/50 transition-all" />
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
