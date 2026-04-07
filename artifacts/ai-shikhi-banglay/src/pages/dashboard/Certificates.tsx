import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import StudentLayout from "@/layouts/StudentLayout";
import { Award, Download, Share2, BookOpen } from "lucide-react";

interface Certificate {
  id: string;
  course_title: string;
  issued_at: string;
  certificate_url: string | null;
}

export default function Certificates() {
  const { profile } = useAuth();
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      if (!profile) return;
      const { data } = await supabase
        .from("certificates")
        .select("id, issued_at, certificate_url, courses(title)")
        .eq("user_id", profile.user_id)
        .order("issued_at", { ascending: false });
      if (data) {
        setCerts(data.map((c: any) => ({
          id: c.id,
          course_title: c.courses?.title || "কোর্স",
          issued_at: c.issued_at,
          certificate_url: c.certificate_url,
        })));
      }
      setLoading(false);
    };
    fetch();
  }, [profile]);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("bn-BD", { year: "numeric", month: "long", day: "numeric" });

  return (
    <StudentLayout>
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">আমার সার্টিফিকেট</h1>
          <p className="text-gray-400">সফলভাবে সম্পন্ন কোর্সের সার্টিফিকেট</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[1, 2].map((i) => <div key={i} className="bg-gray-900 rounded-2xl h-48 animate-pulse" />)}
          </div>
        ) : certs.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-yellow-500/10 rounded-3xl flex items-center justify-center mx-auto mb-5">
              <Award className="w-12 h-12 text-yellow-500/40" />
            </div>
            <h3 className="text-lg font-semibold text-gray-400 mb-2">এখনো কোনো সার্টিফিকেট নেই</h3>
            <p className="text-gray-600 text-sm mb-6">কোর্স সম্পন্ন করলে সার্টিফিকেট পাবেন</p>
            <a href="/courses" className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-medium py-2.5 px-6 rounded-xl transition-colors text-sm">
              <BookOpen className="w-4 h-4" /> কোর্স শুরু করুন
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {certs.map((cert) => (
              <div key={cert.id} className="bg-gray-900/80 border border-gray-800 hover:border-yellow-500/30 rounded-2xl overflow-hidden transition-all group">
                {/* Certificate Preview */}
                <div className="relative bg-gradient-to-br from-yellow-900/30 via-amber-900/20 to-gray-900 p-8 border-b border-gray-800">
                  <div className="absolute top-4 right-4 opacity-10">
                    <Award className="w-20 h-20 text-yellow-400" />
                  </div>
                  <div className="relative z-10">
                    <div className="w-12 h-12 bg-yellow-500/20 border border-yellow-500/30 rounded-2xl flex items-center justify-center mb-4">
                      <Award className="w-6 h-6 text-yellow-400" />
                    </div>
                    <h3 className="font-bold text-white text-base mb-1 line-clamp-2">{cert.course_title}</h3>
                    <p className="text-xs text-gray-500">সার্টিফিকেট অফ কমপ্লিশন</p>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">প্রদানের তারিখ</p>
                      <p className="text-sm text-gray-300 font-medium">{formatDate(cert.issued_at)}</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors" title="শেয়ার করুন">
                        <Share2 className="w-4 h-4" />
                      </button>
                      {cert.certificate_url && (
                        <a href={cert.certificate_url} download target="_blank" rel="noreferrer"
                          className="flex items-center gap-2 bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-500/30 text-yellow-300 text-xs font-medium py-2 px-3 rounded-xl transition-colors">
                          <Download className="w-3.5 h-3.5" /> ডাউনলোড
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
