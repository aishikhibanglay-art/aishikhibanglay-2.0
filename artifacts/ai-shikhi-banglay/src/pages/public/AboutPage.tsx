import { useState, useEffect } from "react";
import { Link } from "wouter";
import { supabase } from "@/lib/supabase";
import PublicLayout from "@/layouts/PublicLayout";
import { BookOpen, Users, Award, Zap, ChevronRight } from "lucide-react";

export default function AboutPage() {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("custom_pages")
      .select("content,title")
      .eq("slug", "about")
      .eq("is_published", true)
      .single()
      .then(({ data }) => {
        if (data) setContent(data.content);
        setLoading(false);
      });
  }, []);

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="bg-gradient-to-b from-gray-900 to-gray-950 py-20 border-b border-gray-800/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-violet-500/15 mb-6">
            <BookOpen className="w-8 h-8 text-violet-400" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-5">আমাদের সম্পর্কে</h1>
          <p className="text-gray-300 text-lg leading-relaxed">
            AI শিখি বাংলায় — বাংলাদেশের প্রথম এবং সেরা AI শিক্ষামূলক প্ল্যাটফর্ম
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-b border-gray-800/60 bg-gray-900/40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { icon: Users, value: "৫০,০০০+", label: "শিক্ষার্থী" },
              { icon: BookOpen, value: "১০০+", label: "কোর্স" },
              { icon: Award, value: "১৫,০০০+", label: "সার্টিফিকেট" },
              { icon: Zap, value: "২০২৩", label: "প্রতিষ্ঠিত" },
            ].map((s, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-xl bg-violet-500/15 flex items-center justify-center mb-3">
                  <s.icon className="w-6 h-6 text-violet-400" />
                </div>
                <div className="text-2xl font-extrabold text-white">{s.value}</div>
                <div className="text-sm text-gray-400 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dynamic content from admin */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[...Array(6)].map((_, i) => (
              <div key={i} className={`h-4 bg-gray-800 rounded ${i % 3 === 0 ? "w-full" : i % 3 === 1 ? "w-5/6" : "w-4/6"}`} />
            ))}
          </div>
        ) : content ? (
          <article className="prose prose-invert prose-lg max-w-none
            prose-headings:text-white prose-headings:font-bold
            prose-p:text-gray-300 prose-p:leading-relaxed
            prose-a:text-violet-400 prose-a:no-underline hover:prose-a:underline
            prose-strong:text-white
            prose-img:rounded-2xl prose-img:shadow-xl
            prose-ul:text-gray-300 prose-ol:text-gray-300
            prose-li:marker:text-violet-400"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        ) : (
          /* Fallback content if no DB content */
          <div className="space-y-10">
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">আমাদের লক্ষ্য</h2>
              <p className="text-gray-300 leading-relaxed">
                AI শিখি বাংলায়-এর লক্ষ্য হলো বাংলাদেশের প্রতিটি মানুষের কাছে কৃত্রিম বুদ্ধিমত্তার শিক্ষা পৌঁছে দেওয়া। আমরা বিশ্বাস করি যে ভাষার বাধা দূর করে, বাংলায় AI শিক্ষা প্রদান করলে বাংলাদেশের ডিজিটাল রূপান্তর আরও দ্রুত হবে।
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">কেন আমরা তৈরি হলাম</h2>
              <p className="text-gray-300 leading-relaxed">
                বাংলাদেশে AI ও প্রযুক্তি শিক্ষার চাহিদা দিন দিন বাড়ছে, কিন্তু বাংলায় মানসম্পন্ন কোর্সের অভাব ছিল। এই শূন্যতা পূরণ করতে আমরা ২০২৩ সালে AI শিখি বাংলায় প্রতিষ্ঠা করি।
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">আমাদের দল</h2>
              <p className="text-gray-300 leading-relaxed">
                আমাদের দলে রয়েছেন দেশের সেরা AI বিশেষজ্ঞ, শিক্ষক এবং প্রযুক্তি উদ্যোক্তারা, যারা বাংলাদেশের তরুণ প্রজন্মকে AI-এর মাধ্যমে বৈশ্বিক মঞ্চে প্রতিষ্ঠিত করতে নিরলস কাজ করছেন।
              </p>
            </div>
          </div>
        )}

        <div className="mt-12 p-8 bg-gradient-to-br from-violet-900/30 to-indigo-900/30 border border-violet-500/20 rounded-2xl text-center">
          <h3 className="text-xl font-bold text-white mb-3">আমাদের সাথে যোগ দিন</h3>
          <p className="text-gray-400 mb-6">আজই শুরু করুন আপনার AI শেখার যাত্রা</p>
          <div className="flex justify-center gap-3">
            <Link href="/courses">
              <button className="bg-violet-600 hover:bg-violet-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors flex items-center gap-2">
                কোর্স দেখুন <ChevronRight className="w-4 h-4" />
              </button>
            </Link>
            <Link href="/contact">
              <button className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors">
                যোগাযোগ করুন
              </button>
            </Link>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
