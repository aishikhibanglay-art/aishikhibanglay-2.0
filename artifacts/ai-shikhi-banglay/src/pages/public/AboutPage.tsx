import { useState, useEffect } from "react";
import { Link } from "wouter";
import { supabase } from "@/lib/supabase";
import PublicLayout from "@/layouts/PublicLayout";
import { SEO } from "@/components/SEO";
import {
  BookOpen, Users, Award, Zap, ChevronRight, Target, Heart,
  Globe, Shield, TrendingUp, Star, CheckCircle, GraduationCap
} from "lucide-react";

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

  const aboutSchema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "AI শিখি বাংলায় — আমাদের সম্পর্কে",
    description: "AI শিখি বাংলায় বাংলাদেশের #১ AI শিক্ষামূলক প্ল্যাটফর্ম। ২০২৩ সালে প্রতিষ্ঠিত এই প্ল্যাটফর্মে ৫০,০০০+ শিক্ষার্থী বাংলায় AI শিখছেন।",
    url: "https://aishikhibanglay.com/about",
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "হোম", item: "https://aishikhibanglay.com" },
        { "@type": "ListItem", position: 2, name: "আমাদের সম্পর্কে", item: "https://aishikhibanglay.com/about" },
      ],
    },
  };

  const teamMembers = [
    { name: "ড. রাশেদ করিম", role: "প্রতিষ্ঠাতা ও CEO", expertise: "AI ও Machine Learning বিশেষজ্ঞ, ১০+ বছরের অভিজ্ঞতা" },
    { name: "নাজমা বেগম", role: "Chief Education Officer", expertise: "শিক্ষা পদ্ধতি ও কারিকুলাম ডিজাইনে ৮ বছরের অভিজ্ঞতা" },
    { name: "আরিফুল ইসলাম", role: "Lead Instructor", expertise: "Python, Data Science ও Deep Learning বিশেষজ্ঞ" },
    { name: "সুমাইয়া হাসান", role: "Head of Community", expertise: "ডিজিটাল কমিউনিটি ম্যানেজমেন্ট ও শিক্ষার্থী সহায়তা" },
  ];

  const values = [
    { icon: Globe, title: "সহজলভ্যতা", desc: "প্রত্যন্ত এলাকার মানুষের কাছেও AI শিক্ষা পৌঁছে দেওয়া আমাদের লক্ষ্য।" },
    { icon: Shield, title: "মানসম্পন্নতা", desc: "আন্তর্জাতিক মানের কনটেন্ট তৈরি করে বাংলায় প্রদান করা হয়।" },
    { icon: Heart, title: "সম্প্রদায়", desc: "শুধু শিক্ষা নয়, একটি শক্তিশালী শিক্ষার্থী সম্প্রদায় গড়ে তোলা।" },
    { icon: TrendingUp, title: "উদ্ভাবন", desc: "সর্বশেষ AI প্রযুক্তি ও শিক্ষা পদ্ধতি ব্যবহার করে শিখানো হয়।" },
  ];

  return (
    <PublicLayout>
      <SEO
        title="আমাদের সম্পর্কে — AI শিখি বাংলায়ের মিশন, দল ও মূল্যবোধ"
        description="AI শিখি বাংলায় বাংলাদেশের #১ AI শিক্ষামূলক প্ল্যাটফর্ম। ২০২৩ সালে প্রতিষ্ঠিত এই প্ল্যাটফর্মে বিশেষজ্ঞ শিক্ষকরা বাংলায় AI, ChatGPT, Python, Machine Learning শেখান। আমাদের মিশন, দল ও মূল্যবোধ সম্পর্কে জানুন।"
        keywords="AI শিখি বাংলায় সম্পর্কে, AI শিক্ষা বাংলাদেশ, অনলাইন শিক্ষা প্ল্যাটফর্ম, বাংলাদেশ AI কোম্পানি, AI শিক্ষা মিশন"
        url="/about"
        schema={aboutSchema}
      />

      {/* Hero */}
      <section className="bg-gradient-to-b from-gray-900 to-gray-950 py-20 border-b border-gray-800/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-violet-500/15 mb-6">
            <BookOpen className="w-8 h-8 text-violet-400" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-5">আমাদের সম্পর্কে</h1>
          <p className="text-gray-300 text-lg leading-relaxed max-w-2xl mx-auto">
            AI শিখি বাংলায় — বাংলাদেশের প্রথম ও সেরা AI শিক্ষামূলক প্ল্যাটফর্ম। আমরা বিশ্বাস করি প্রতিটি বাংলাভাষী মানুষের AI শিক্ষার অধিকার আছে।
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-b border-gray-800/60 bg-gray-900/40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { icon: Users, value: "৫০,০০০+", label: "সক্রিয় শিক্ষার্থী" },
              { icon: BookOpen, value: "১০০+", label: "প্রকাশিত কোর্স" },
              { icon: Award, value: "১৫,০০০+", label: "ভেরিফাইড সার্টিফিকেট" },
              { icon: Star, value: "৪.৯/৫", label: "শিক্ষার্থী রেটিং" },
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

      {/* Mission & Vision */}
      <section className="py-16 bg-gray-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gray-900/60 border border-gray-800/60 rounded-2xl p-8">
              <div className="w-12 h-12 rounded-xl bg-violet-500/15 flex items-center justify-center mb-5">
                <Target className="w-6 h-6 text-violet-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-4">আমাদের লক্ষ্য (Mission)</h2>
              <p className="text-gray-300 leading-relaxed">
                বাংলাদেশের প্রতিটি মানুষের কাছে কৃত্রিম বুদ্ধিমত্তার শিক্ষা পৌঁছে দেওয়া। ভাষার বাধা দূর করে, বাংলায় বিশ্বমানের AI শিক্ষা প্রদান করাই আমাদের মূল লক্ষ্য। আমরা চাই বাংলাদেশের তরুণ প্রজন্ম AI-এর মাধ্যমে বৈশ্বিক কর্মবাজারে নিজেদের প্রতিষ্ঠিত করুক।
              </p>
            </div>
            <div className="bg-gray-900/60 border border-gray-800/60 rounded-2xl p-8">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/15 flex items-center justify-center mb-5">
                <Zap className="w-6 h-6 text-indigo-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-4">আমাদের দৃষ্টিভঙ্গি (Vision)</h2>
              <p className="text-gray-300 leading-relaxed">
                ২০৩০ সালের মধ্যে বাংলাদেশের ১ কোটি মানুষকে AI দক্ষ করে গড়ে তোলা। আমরা স্বপ্ন দেখি এমন একটি বাংলাদেশের, যেখানে AI প্রযুক্তির সুবিধা থেকে কেউ বঞ্চিত নয় — শহর হোক বা গ্রাম, ধনী হোক বা গরিব।
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-16 bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">আমাদের যাত্রার গল্প</h2>
          <div className="space-y-5 text-gray-300 leading-relaxed">
            <p>
              ২০২৩ সালে, যখন বিশ্বজুড়ে AI বিপ্লব শুরু হচ্ছিল, আমরা লক্ষ্য করলাম যে বাংলাদেশের মানুষ এই বিপ্লব থেকে পিছিয়ে পড়ছে — শুধুমাত্র ভাষার কারণে। ইংরেজিতে AI শিক্ষার প্রচুর সম্পদ থাকলেও, বাংলায় মানসম্পন্ন কিছু ছিল না।
            </p>
            <p>
              এই সমস্যা সমাধানের জন্যই জন্ম হলো <strong className="text-white">AI শিখি বাংলায়</strong>-এর। আমাদের প্রতিষ্ঠাতা দল — অভিজ্ঞ AI গবেষক, শিক্ষাবিদ ও প্রযুক্তি উদ্যোক্তাদের সমন্বয়ে — একটি লক্ষ্য নিয়ে কাজ শুরু করলেন: বাংলায় বিশ্বমানের AI শিক্ষা।
            </p>
            <p>
              মাত্র এক বছরে আমরা ৫০,০০০ শিক্ষার্থীর বিশ্বাস অর্জন করেছি। আমাদের শিক্ষার্থীরা ফ্রিল্যান্সিং করছেন, নতুন চাকরি পাচ্ছেন, ব্যবসা বাড়াচ্ছেন — AI-এর শক্তিকে কাজে লাগিয়ে।
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 bg-gray-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-white mb-10 text-center">আমাদের মূল্যবোধ</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v, i) => (
              <div key={i} className="bg-gray-900/60 border border-gray-800/60 rounded-2xl p-6 text-center hover:border-violet-500/30 transition-all">
                <div className="w-12 h-12 rounded-xl bg-violet-500/15 flex items-center justify-center mx-auto mb-4">
                  <v.icon className="w-6 h-6 text-violet-400" />
                </div>
                <h3 className="font-bold text-white mb-2">{v.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16 bg-gray-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-white mb-3 text-center">আমাদের দল</h2>
          <p className="text-gray-400 text-center mb-10 max-w-2xl mx-auto">অভিজ্ঞ AI বিশেষজ্ঞ, শিক্ষাবিদ ও প্রযুক্তি উদ্যোক্তাদের একটি নিবেদিতপ্রাণ দল</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {teamMembers.map((m, i) => (
              <div key={i} className="bg-gray-900/60 border border-gray-800/60 rounded-2xl p-6 text-center hover:border-violet-500/30 transition-all">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold mx-auto mb-4">
                  {m.name[0]}
                </div>
                <h3 className="font-bold text-white mb-1">{m.name}</h3>
                <p className="text-xs text-violet-400 font-medium mb-3">{m.role}</p>
                <p className="text-xs text-gray-400 leading-relaxed">{m.expertise}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Section */}
      <section className="py-16 bg-gray-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-white mb-10 text-center">কেন আমরা আলাদা?</h2>
          <div className="space-y-4">
            {[
              { title: "সম্পূর্ণ বাংলায় কোর্স", desc: "সকল ভিডিও লেসন, কুইজ ও সহায়ক সামগ্রী বাংলায় তৈরি। ইংরেজি না জানলেও AI শিখতে পারবেন।" },
              { title: "বিশেষজ্ঞ শিক্ষকমণ্ডলী", desc: "বাস্তব অভিজ্ঞতাসম্পন্ন AI পেশাদাররা পড়ান। তারা শুধু শিক্ষাবিদ নন, ইন্ডাস্ট্রিতে কাজ করেন।" },
              { title: "প্র্যাকটিক্যাল প্রজেক্ট", desc: "শুধু তাত্ত্বিক নয়, বাস্তব প্রজেক্টের মাধ্যমে শেখানো হয়। শিক্ষার্থীরা সরাসরি প্রয়োগ করতে পারে।" },
              { title: "সাশ্রয়ী মূল্য", desc: "আন্তর্জাতিক মানের কোর্স বাংলাদেশের ক্রয়ক্ষমতার মধ্যে। বিকাশ, নগদ, রকেটে পেমেন্ট।" },
              { title: "আজীবন অ্যাক্সেস", desc: "একবার কিনলে আজীবন অ্যাক্সেস। কোর্স আপডেট হলেও নতুন বিষয়বস্তু পাবেন।" },
              { title: "কমিউনিটি সাপোর্ট", desc: "হাজারো শিক্ষার্থীর সক্রিয় কমিউনিটি। যেকোনো সমস্যায় দ্রুত সাহায্য পাবেন।" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4 p-5 bg-gray-900/60 border border-gray-800/60 rounded-xl hover:border-violet-500/20 transition-all">
                <CheckCircle className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-white mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dynamic content from admin */}
      {!loading && content && (
        <section className="py-14 bg-gray-900">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <article className="prose prose-invert prose-lg max-w-none
              prose-headings:text-white prose-headings:font-bold
              prose-p:text-gray-300 prose-p:leading-relaxed
              prose-a:text-violet-400 prose-a:no-underline hover:prose-a:underline
              prose-strong:text-white prose-img:rounded-2xl
              prose-ul:text-gray-300 prose-ol:text-gray-300
              prose-li:marker:text-violet-400"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </div>
        </section>
      )}

      {/* CTA */}
      <div className="py-14 bg-gradient-to-br from-violet-900/30 to-indigo-900/30 border-t border-violet-500/20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <GraduationCap className="w-12 h-12 text-violet-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white mb-3">আমাদের সাথে যোগ দিন</h3>
          <p className="text-gray-400 mb-6">আজই শুরু করুন আপনার AI শেখার যাত্রা — বিনামূল্যে</p>
          <div className="flex flex-wrap justify-center gap-3">
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
