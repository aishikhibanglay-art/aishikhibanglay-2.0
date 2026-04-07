import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import PublicLayout from "@/layouts/PublicLayout";
import { FileText } from "lucide-react";

interface PolicyPageProps {
  slug: "privacy-policy" | "terms" | "refund-policy" | "cookie-policy";
  title: string;
  fallback: string;
}

export function PolicyPage({ slug, title, fallback }: PolicyPageProps) {
  const [content, setContent] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("custom_pages")
      .select("content,updated_at")
      .eq("slug", slug)
      .eq("is_published", true)
      .single()
      .then(({ data }) => {
        if (data) { setContent(data.content); setUpdatedAt(data.updated_at); }
        setLoading(false);
      });
  }, [slug]);

  return (
    <PublicLayout>
      <section className="bg-gradient-to-b from-gray-900 to-gray-950 py-16 border-b border-gray-800/60">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-violet-500/15 mb-5">
            <FileText className="w-7 h-7 text-violet-400" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">{title}</h1>
          {updatedAt && (
            <p className="text-sm text-gray-500">
              সর্বশেষ আপডেট: {new Date(updatedAt).toLocaleDateString("bn-BD", { year: "numeric", month: "long", day: "numeric" })}
            </p>
          )}
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[...Array(8)].map((_, i) => (
              <div key={i} className={`h-4 bg-gray-800 rounded ${i % 4 === 0 ? "h-6 w-2/3" : i % 4 === 3 ? "w-3/4" : "w-full"}`} />
            ))}
          </div>
        ) : content ? (
          <article className="prose prose-invert prose-base max-w-none
            prose-headings:text-white prose-headings:font-bold prose-headings:mt-8 prose-headings:mb-4
            prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg
            prose-p:text-gray-300 prose-p:leading-relaxed prose-p:mb-4
            prose-a:text-violet-400 prose-a:no-underline hover:prose-a:underline
            prose-strong:text-white prose-strong:font-semibold
            prose-ul:text-gray-300 prose-ol:text-gray-300 prose-li:marker:text-violet-400
            prose-hr:border-gray-800"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        ) : (
          <article className="prose prose-invert prose-base max-w-none
            prose-p:text-gray-300 prose-headings:text-white prose-p:leading-relaxed"
            dangerouslySetInnerHTML={{ __html: fallback }}
          />
        )}
      </div>
    </PublicLayout>
  );
}

export function PrivacyPolicyPage() {
  return (
    <PolicyPage
      slug="privacy-policy"
      title="গোপনীয়তা নীতি"
      fallback={`
        <h2>গোপনীয়তা নীতি</h2>
        <p>AI শিখি বাংলায় আপনার ব্যক্তিগত তথ্যের নিরাপত্তাকে সর্বোচ্চ গুরুত্ব দেয়।</p>
        <h3>আমরা কি তথ্য সংগ্রহ করি?</h3>
        <p>আমরা আপনার নাম, ইমেইল ঠিকানা এবং পেমেন্ট তথ্য সংগ্রহ করি যা কোর্স সেবা প্রদানের জন্য প্রয়োজন।</p>
        <h3>তথ্য ব্যবহার</h3>
        <p>সংগৃহীত তথ্য শুধুমাত্র আমাদের সেবা উন্নয়ন ও প্রদানের জন্য ব্যবহার করা হয়। তৃতীয় কোনো পক্ষের সাথে আপনার তথ্য শেয়ার করা হয় না।</p>
        <h3>নিরাপত্তা</h3>
        <p>আমরা শিল্পের মানদণ্ড অনুযায়ী আপনার তথ্য সুরক্ষিত রাখি। সকল পেমেন্ট তথ্য SSL এনক্রিপশনের মাধ্যমে সুরক্ষিত।</p>
        <h3>যোগাযোগ</h3>
        <p>গোপনীয়তা বিষয়ক যেকোনো প্রশ্নের জন্য আমাদের সাথে যোগাযোগ করুন।</p>
      `}
    />
  );
}

export function TermsPage() {
  return (
    <PolicyPage
      slug="terms"
      title="শর্তাবলী"
      fallback={`
        <h2>ব্যবহারের শর্তাবলী</h2>
        <p>এই ওয়েবসাইট ব্যবহার করে আপনি আমাদের শর্তাবলীতে সম্মত হচ্ছেন।</p>
        <h3>একাউন্ট তৈরি</h3>
        <p>আমাদের প্ল্যাটফর্ম ব্যবহার করতে আপনাকে একটি একাউন্ট তৈরি করতে হবে। সঠিক তথ্য প্রদান করা আবশ্যক।</p>
        <h3>কোর্স অ্যাক্সেস</h3>
        <p>একবার কোর্স কিনলে আপনি ব্যক্তিগত ব্যবহারের জন্য আজীবন অ্যাক্সেস পাবেন। কোনো তৃতীয় পক্ষের সাথে শেয়ার করা নিষিদ্ধ।</p>
        <h3>বৌদ্ধিক সম্পদ</h3>
        <p>প্ল্যাটফর্মের সকল কনটেন্ট AI শিখি বাংলায়-এর বৌদ্ধিক সম্পদ। অনুমতি ছাড়া পুনরায় বিতরণ নিষিদ্ধ।</p>
        <h3>নিষিদ্ধ কার্যক্রম</h3>
        <p>স্প্যাম, হ্যাকিং বা অন্য কোনো অবৈধ কার্যক্রম কঠোরভাবে নিষিদ্ধ। লঙ্ঘনের ক্ষেত্রে একাউন্ট বন্ধ করা হবে।</p>
      `}
    />
  );
}

export function RefundPolicyPage() {
  return (
    <PolicyPage
      slug="refund-policy"
      title="রিফান্ড নীতি"
      fallback={`
        <h2>রিফান্ড নীতি</h2>
        <p>আমরা চাই আপনি আমাদের সেবায় সন্তুষ্ট হন। তাই আমাদের সুস্পষ্ট রিফান্ড নীতি রয়েছে।</p>
        <h3>রিফান্ডের যোগ্যতা</h3>
        <p>পেমেন্টের ৭ দিনের মধ্যে রিফান্ডের আবেদন করা যাবে, যদি:</p>
        <ul>
          <li>কোর্সের কনটেন্ট বিজ্ঞাপনের সাথে মিলছে না</li>
          <li>কোর্সে কোনো প্রযুক্তিগত সমস্যা আছে</li>
          <li>অন্য কোনো সঠিক কারণ থাকে</li>
        </ul>
        <h3>রিফান্ড প্রক্রিয়া</h3>
        <p>রিফান্ডের আবেদন করতে আমাদের সাথে ইমেইলে যোগাযোগ করুন। ৭ কার্যদিবসের মধ্যে রিফান্ড প্রক্রিয়া সম্পন্ন হবে।</p>
        <h3>রিফান্ড যোগ্য নয়</h3>
        <ul>
          <li>কোর্সের ৫০%+ সম্পন্ন করার পরে</li>
          <li>সার্টিফিকেট ডাউনলোডের পরে</li>
          <li>৭ দিনের বেশি সময় পরে</li>
        </ul>
      `}
    />
  );
}

export function CookiePolicyPage() {
  return (
    <PolicyPage
      slug="cookie-policy"
      title="কুকি নীতি"
      fallback={`
        <h2>কুকি নীতি</h2>
        <p>এই নীতি বর্ণনা করে আমরা কিভাবে কুকি এবং অনুরূপ প্রযুক্তি ব্যবহার করি।</p>
        <h3>কুকি কি?</h3>
        <p>কুকি হলো ছোট টেক্সট ফাইল যা আপনার ব্রাউজারে সংরক্ষিত হয়। এগুলো আমাদের সেবার মান উন্নয়নে সহায়তা করে।</p>
        <h3>আমরা কি ধরনের কুকি ব্যবহার করি?</h3>
        <ul>
          <li><strong>প্রয়োজনীয় কুকি:</strong> লগইন সেশন ও নিরাপত্তার জন্য</li>
          <li><strong>বিশ্লেষণ কুকি:</strong> ওয়েবসাইটের ব্যবহার বিশ্লেষণের জন্য</li>
          <li><strong>পছন্দ কুকি:</strong> আপনার ভাষা ও থিম পছন্দ মনে রাখার জন্য</li>
        </ul>
        <h3>কুকি নিয়ন্ত্রণ</h3>
        <p>আপনার ব্রাউজার সেটিংস থেকে কুকি বন্ধ করতে পারেন, তবে কিছু সেবা সঠিকভাবে কাজ নাও করতে পারে।</p>
        <h3>তৃতীয় পক্ষের কুকি</h3>
        <p>Google Analytics এবং অন্যান্য বিশ্লেষণ টুল থেকে তৃতীয় পক্ষের কুকি ব্যবহার করা হতে পারে।</p>
      `}
    />
  );
}
