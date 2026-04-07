import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import StudentLayout from "@/layouts/StudentLayout";
import {
  User, Mail, Save, Camera, Loader2, CheckCircle, Eye, EyeOff, AlertCircle
} from "lucide-react";

export default function ProfileSettings() {
  const { profile, refreshProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({ name: "", bio: "" });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [passwords, setPasswords] = useState({ newPass: "", confirm: "" });
  const [showPass, setShowPass] = useState({ newPass: false, confirm: false });
  const [passLoading, setPassLoading] = useState(false);
  const [passSaved, setPassSaved] = useState(false);
  const [passError, setPassError] = useState("");

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || "",
        bio: (profile as any).bio || "",
      });
      setAvatarUrl(profile.avatar_url || null);
    }
  }, [profile]);

  // Handle avatar file selection → preview
  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setSaveError("ছবির আকার সর্বোচ্চ ২ MB হতে পারবে।");
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setSaveError("");
  };

  // Upload avatar to Supabase Storage
  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile || !profile) return avatarUrl;
    setUploadingAvatar(true);
    try {
      const ext = avatarFile.name.split(".").pop();
      const path = `${profile.user_id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, avatarFile, { upsert: true });

      if (uploadError) {
        setSaveError("ছবি আপলোড করতে সমস্যা হয়েছে।");
        return avatarUrl;
      }

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      return data.publicUrl + `?t=${Date.now()}`; // cache bust
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError("");
    setSaved(false);
    setSaving(true);

    try {
      // 1. Upload avatar if changed
      let newAvatarUrl = avatarUrl;
      if (avatarFile) {
        newAvatarUrl = await uploadAvatar();
      }

      // 2. Update profile
      const { error } = await supabase
        .from("profiles")
        .update({
          name: form.name.trim(),
          bio: form.bio.trim(),
          ...(newAvatarUrl ? { avatar_url: newAvatarUrl } : {}),
        })
        .eq("user_id", profile?.user_id);

      if (error) {
        setSaveError(`সংরক্ষণ করতে সমস্যা: ${error.message}`);
        return;
      }

      setAvatarUrl(newAvatarUrl);
      setAvatarFile(null);
      setAvatarPreview(null);
      await refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError("");
    setPassSaved(false);

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
      if (error.message.includes("same password")) {
        setPassError("নতুন পাসওয়ার্ড আগের পাসওয়ার্ডের মতো হতে পারবে না।");
      } else if (error.message.includes("Auth")) {
        setPassError("OAuth (Google/Facebook) দিয়ে লগইন করলে পাসওয়ার্ড পরিবর্তন করা যায় না।");
      } else {
        setPassError(`সমস্যা হয়েছে: ${error.message}`);
      }
    } else {
      setPasswords({ newPass: "", confirm: "" });
      setPassSaved(true);
      setTimeout(() => setPassSaved(false), 3000);
    }
  };

  const inputClass =
    "w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 transition-all";

  return (
    <StudentLayout>
      <div className="p-6 lg:p-8 max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">প্রোফাইল সেটিংস</h1>
          <p className="text-gray-400">আপনার একাউন্ট তথ্য আপডেট করুন</p>
        </div>

        {/* ── Avatar Section ── */}
        <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">প্রোফাইল ছবি</h2>
          <div className="flex items-center gap-5">
            {/* Avatar preview */}
            <div className="relative flex-shrink-0">
              {avatarPreview || avatarUrl ? (
                <img
                  src={avatarPreview || avatarUrl!}
                  alt="Avatar"
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-violet-500/40"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
                  {profile?.name?.[0]?.toUpperCase() || "?"}
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute -bottom-1 -right-1 w-7 h-7 bg-violet-600 hover:bg-violet-500 rounded-lg flex items-center justify-center transition-colors shadow-lg"
              >
                {uploadingAvatar ? (
                  <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                ) : (
                  <Camera className="w-3.5 h-3.5 text-white" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarSelect}
              />
            </div>
            <div>
              <p className="text-white font-medium">{profile?.name}</p>
              <p className="text-sm text-gray-500">{profile?.email}</p>
              <p className="text-xs text-gray-600 mt-1">
                JPG, PNG বা WebP · সর্বোচ্চ ২ MB
              </p>
              {avatarFile && (
                <p className="text-xs text-violet-400 mt-1">✓ নতুন ছবি নির্বাচিত — সংরক্ষণ করুন</p>
              )}
            </div>
          </div>
        </div>

        {/* ── Profile Form ── */}
        <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-300 mb-5">ব্যক্তিগত তথ্য</h2>

          {saveError && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {saveError}
            </div>
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
                    required
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2">
                  ইমেইল (পরিবর্তনযোগ্য নয়)
                </label>
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
                rows={4}
                placeholder="আপনার সম্পর্কে কিছু লিখুন..."
                className={`${inputClass} resize-none`}
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-medium py-2.5 px-6 rounded-xl transition-colors text-sm disabled:opacity-60"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                সংরক্ষণ করুন
              </button>
            </div>
          </form>
        </div>

        {/* ── Password Change ── */}
        <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-gray-300 mb-1">পাসওয়ার্ড পরিবর্তন</h2>
          <p className="text-xs text-gray-600 mb-5">
            শুধুমাত্র ইমেইল/পাসওয়ার্ড দিয়ে লগইন করা অ্যাকাউন্টের জন্য প্রযোজ্য।
          </p>

          {passError && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {passError}
            </div>
          )}
          {passSaved && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে!
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4">
            {/* New Password */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">নতুন পাসওয়ার্ড</label>
              <div className="relative">
                <input
                  type={showPass.newPass ? "text" : "password"}
                  value={passwords.newPass}
                  onChange={(e) => setPasswords((p) => ({ ...p, newPass: e.target.value }))}
                  placeholder="কমপক্ষে ৮ অক্ষর"
                  className={`${inputClass} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => ({ ...s, newPass: !s.newPass }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPass.newPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {/* Strength bar */}
              {passwords.newPass && (
                <div className="mt-1.5 flex gap-1">
                  {[1, 2, 3, 4].map((i) => {
                    const strength =
                      passwords.newPass.length >= 12 ? 4 :
                      passwords.newPass.length >= 10 ? 3 :
                      passwords.newPass.length >= 8 ? 2 : 1;
                    return (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-all ${
                        i <= strength
                          ? strength >= 4 ? "bg-green-500"
                          : strength >= 3 ? "bg-yellow-500"
                          : strength >= 2 ? "bg-orange-500"
                          : "bg-red-500"
                          : "bg-gray-700"
                      }`} />
                    );
                  })}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">পাসওয়ার্ড নিশ্চিত করুন</label>
              <div className="relative">
                <input
                  type={showPass.confirm ? "text" : "password"}
                  value={passwords.confirm}
                  onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
                  placeholder="পাসওয়ার্ড আবার লিখুন"
                  className={`${inputClass} pr-10 ${
                    passwords.confirm && passwords.newPass !== passwords.confirm
                      ? "border-red-500/50"
                      : passwords.confirm && passwords.newPass === passwords.confirm
                      ? "border-green-500/50"
                      : ""
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => ({ ...s, confirm: !s.confirm }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPass.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwords.confirm && passwords.newPass !== passwords.confirm && (
                <p className="text-xs text-red-400 mt-1">পাসওয়ার্ড মিলছে না</p>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={passLoading || !passwords.newPass || !passwords.confirm}
                className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-medium py-2.5 px-6 rounded-xl transition-colors text-sm disabled:opacity-50"
              >
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
