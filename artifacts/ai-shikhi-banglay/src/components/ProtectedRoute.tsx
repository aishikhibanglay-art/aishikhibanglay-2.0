import { Redirect } from "wouter";
import { useAuth } from "@/contexts/AuthContext";

type Role = "super_admin" | "admin" | "moderator" | "student";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  if (profile?.is_banned) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center text-white p-8 bg-red-900/30 rounded-2xl border border-red-500/30 max-w-md">
          <div className="text-5xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold mb-2">অ্যাকাউন্ট বন্ধ করা হয়েছে</h2>
          <p className="text-gray-400">আপনার অ্যাকাউন্ট নিষিদ্ধ করা হয়েছে। বিস্তারিত জানতে সাপোর্টে যোগাযোগ করুন।</p>
        </div>
      </div>
    );
  }

  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    return <Redirect to="/dashboard" />;
  }

  return <>{children}</>;
}
