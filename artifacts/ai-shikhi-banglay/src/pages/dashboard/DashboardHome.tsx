import { useAuth } from "@/contexts/AuthContext";
import { Link } from "wouter";
import { BookOpen, Award, Users, BarChart3, LogOut } from "lucide-react";

export default function DashboardHome() {
  const { profile, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-violet-500 rounded-lg flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg">AI শিখি বাংলায়</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm">{profile?.name}</span>
          <button onClick={signOut} className="flex items-center gap-2 text-gray-400 hover:text-red-400 text-sm transition-colors">
            <LogOut className="w-4 h-4" /> লগআউট
          </button>
        </div>
      </nav>
      <div className="max-w-5xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">
          স্বাগতম, {profile?.name || "শিক্ষার্থী"}! 👋
        </h1>
        <p className="text-gray-400 mb-10">আপনার লার্নিং ড্যাশবোর্ডে আপনাকে স্বাগতম।</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: BookOpen, label: "আমার কোর্স", href: "/dashboard/courses", color: "violet", count: "০টি কোর্স" },
            { icon: Award, label: "সার্টিফিকেট", href: "/dashboard/certificates", color: "yellow", count: "০টি অর্জিত" },
            { icon: Users, label: "কমিউনিটি", href: "/community", color: "blue", count: "যোগ দিন" },
          ].map((item) => (
            <Link key={item.label} href={item.href}
              className="bg-gray-900 border border-gray-800 hover:border-violet-500/50 rounded-2xl p-6 transition-all group">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-${item.color}-500/20`}>
                <item.icon className={`w-6 h-6 text-${item.color}-400`} />
              </div>
              <h3 className="font-semibold text-lg mb-1">{item.label}</h3>
              <p className="text-gray-500 text-sm">{item.count}</p>
            </Link>
          ))}
        </div>
        {(profile?.role === "admin" || profile?.role === "super_admin") && (
          <div className="mt-8 p-6 bg-violet-900/20 border border-violet-500/30 rounded-2xl">
            <div className="flex items-center gap-3 mb-3">
              <BarChart3 className="w-5 h-5 text-violet-400" />
              <span className="font-semibold text-violet-300">অ্যাডমিন প্যানেল</span>
            </div>
            <p className="text-gray-400 text-sm mb-4">আপনার কাছে অ্যাডমিন অ্যাক্সেস আছে।</p>
            <Link href="/admin" className="inline-block bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium py-2 px-5 rounded-lg transition-colors">
              অ্যাডমিন প্যানেলে যান →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
