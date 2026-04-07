import { useEffect } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const [, navigate] = useLocation();

  useEffect(() => {
    const handleCallback = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session) {
        navigate("/login");
        return;
      }

      // Fetch user role to redirect accordingly
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", session.user.id)
        .single();

      const role = profile?.role;

      if (role === "super_admin" || role === "admin") {
        navigate("/admin");
      } else if (role === "moderator") {
        navigate("/admin/community");
      } else {
        navigate("/dashboard");
      }
    };

    handleCallback();
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400">লগইন হচ্ছে...</p>
      </div>
    </div>
  );
}
