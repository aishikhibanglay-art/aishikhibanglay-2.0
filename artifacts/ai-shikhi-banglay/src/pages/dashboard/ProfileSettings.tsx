import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import StudentLayout from "@/layouts/StudentLayout";
import { User, Mail, Phone, MapPin, Save, Camera, Loader2, CheckCircle } from "lucide-react";

export default function ProfileSettings() {
  const { profile, refreshProfile } = useAuth();
  const [form, setForm] = useState({
    name: "",
    bio: "",
    phone: "",
    location: "",
  });
  const [passwords, setPasswords] = useState({ current: "", newPass: "", confirm: "" });
  const [loading, setSaving] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [passError, setPassError] = useState("");
  const [passSaved, setPassSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || "",
        bio: (profile as any).bio || "",
        phone: (profile as any).phone || "",
        location: (profile as any).location || "",
      });
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ name: form.name, bio: form.bio })
      .eq("user_id", profile?.user_id);
    setSaving(false);
    if (error) {
      setError("সংরক্ষণ করতে সমস্যা হয়েছে।");
    } else {
      await refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError("");
    if (passwords.newPass !== passwords.confirm) {
      setPassError("নতুন পাসওয়ার্ড দুটি মিলছে না।");
      return;
    }
    if (passwords.newPass.length < 8) {
      setPassError("পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।");
      return;
    }
    setPassLoading(true);
    const { error } = await supabase.auth.updateUser({ password: passwords.newPass });
    setPassLoading(false);
    if (error) {
      setPassError("পাসওয়ার্ড পরিবর্তন করতে সমস্যা হয়েছে।");
    } else {
      setPasswords({ current: "", newPass: "", confirm: "" });
      setPassSaved(true);
      setTimeout(() => setPassSaved(false), 3000);
    }
  };

  return (
    <StudentLayout>
      <div className="p-6 lg:p-8 max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">প্রোফাইল সেটিংস</h1>
          <p className="text-gray-400">আপনার একাউন্ট তথ্য আপডেট করুন</p>
        </div>

        {/* Avatar */}
        <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">প্রোফাইল ছবি</h2>
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
                {profile?.name?.[0]?.toUpperCase() || "?"}
              </div>
              <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-violet-600 hover:bg-violet-500 rounded-lg flex items-center justify-center transition-colors">
                <Camera className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
            <div>
              <p className="text-white font-medium">{profile?.name}</p>
              <p className="text-sm text-gray-500">{profile?.email}</p>
              <p className="text-xs text-gray-600 mt-1 capitalize">{profile?.role}</p>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-300 mb-5">ব্যক্তিগত তথ্য</h2>
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>
          )}
          {saved && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> সফলভাবে সংরক্ষিত হয়েছে!
            </div>
          )}
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2">পুরো নাম</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2">ইমেইল (পরিবর্তন যোগ্য নয়)</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                  <input
                    type="email"
                    value={profile?.email || ""}
                    disabled
                    className="w-full bg-gray-800/50 border border-gray-700/50 text-gray-500 rounded-xl pl-10 pr-4 py-2.5 text-sm cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">পরিচিতি (Bio)</label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                rows={3}
                placeholder="আপনার সম্পর্কে কিছু লিখুন..."
                className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 transition-all resize-none"
              />
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={loading}
                className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-medium py-2.5 px-6 rounded-xl transition-colors text-sm disabled:opacity-60">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                সংরক্ষণ করুন
              </button>
            </div>
          </form>
        </div>

        {/* Password Change */}
        <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-gray-300 mb-5">পাসওয়ার্ড পরিবর্তন</h2>
          {passError && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{passError}</div>
          )}
          {passSaved && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> পাসওয়ার্ড পরিবর্তন হয়েছে!
            </div>
          )}
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">নতুন পাসওয়ার্ড</label>
              <input
                type="password"
                value={passwords.newPass}
                onChange={(e) => setPasswords((p) => ({ ...p, newPass: e.target.value }))}
                placeholder="নতুন পাসওয়ার্ড"
                className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">পাসওয়ার্ড নিশ্চিত করুন</label>
              <input
                type="password"
                value={passwords.confirm}
                onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
                placeholder="পাসওয়ার্ড আবার লিখুন"
                className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 transition-all"
              />
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={passLoading}
                className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-medium py-2.5 px-6 rounded-xl transition-colors text-sm disabled:opacity-60">
                {passLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                পাসওয়ার্ড পরিবর্তন করুন
              </button>
            </div>
          </form>
        </div>
      </div>
    </StudentLayout>
  );
}
