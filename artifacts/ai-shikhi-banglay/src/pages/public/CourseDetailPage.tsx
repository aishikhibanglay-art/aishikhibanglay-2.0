import { useState, useEffect } from "react";
import { Link, useParams } from "wouter";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import PublicLayout from "@/layouts/PublicLayout";
import { SEO } from "@/components/SEO";
import {
  BookOpen, Star, Clock, Users, Award, Lock, Play, ChevronDown,
  CheckCircle, Share2, Facebook, Twitter, Linkedin, MessageCircle,
  Tag, AlertCircle, ChevronRight
} from "lucide-react";

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  short_desc: string | null;
  type: string;
  category: string | null;
  thumbnail_url: string | null;
  trailer_url: string | null;
  price_bdt: number;
  price_usd: number;
  is_free: boolean;
  what_you_learn: string[];
  requirements: string[];
  certificate_enabled: boolean;
  total_duration: number;
  is_published: boolean;
  profiles: { id: string; name: string; bio: string | null; avatar_url: string | null } | null;
}

interface Section {
  id: string;
  title: string;
  order_index: number;
  lessons: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  type: string;
  duration_seconds: number;
  is_free_preview: boolean;
  order_index: number;
}

interface Review {
  id: string;
  rating: number;
  review: string | null;
  created_at: string;
  profiles: { name: string; avatar_url: string | null } | null;
}

function formatDuration(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h > 0) return `${h}ঘ ${m}মি`;
  return `${m}মি`;
}

function StarRow({ rating, count }: { rating: number; count?: number }) {
  return (
    <div className="flex items-center gap-1">
      {[...Array(5)].map((_, i) => (
        <Star key={i} className={`w-4 h-4 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-600"}`} />
      ))}
      {count !== undefined && <span className="text-xs text-gray-500 ml-1">({count})</span>}
    </div>
  );
}

export default function CourseDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const { user, profile } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [couponMsg, setCouponMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [myRating, setMyRating] = useState(0);
  const [myReview, setMyReview] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    const fetchData = async () => {
      const [courseRes, sectionsRes, reviewsRes] = await Promise.all([
        supabase.from("courses").select("*,profiles(id,name,bio,avatar_url)").eq("slug", slug).single(),
        supabase.from("sections").select("id,title,order_index,lessons(id,title,type,duration_seconds,is_free_preview,order_index)").eq("course_id", "(select id from courses where slug = $1)").order("order_index"),
        supabase.from("course_reviews").select("id,rating,review,created_at,profiles(name,avatar_url)").eq("course_id", "(select id from courses where slug = $1)").order("created_at", { ascending: false }).limit(10),
      ]);

      if (courseRes.data) {
        setCourse(courseRes.data as unknown as Course);
        const courseId = courseRes.data.id;
        // fetch sections with the actual course id
        const [sec, rev] = await Promise.all([
          supabase.from("sections").select("id,title,order_index,lessons(id,title,type,duration_seconds,is_free_preview,order_index)").eq("course_id", courseId).order("order_index"),
          supabase.from("course_reviews").select("id,rating,review,created_at,profiles(name,avatar_url)").eq("course_id", courseId).order("created_at", { ascending: false }).limit(10),
        ]);
        if (sec.data) {
          const s = (sec.data as unknown as Section[]).map(section => ({
            ...section,
            lessons: (section.lessons || []).sort((a, b) => a.order_index - b.order_index),
          })).sort((a, b) => a.order_index - b.order_index);
          setSections(s);
          if (s.length > 0) setOpenSection(s[0].id);
        }
        if (rev.data) setReviews(rev.data as unknown as Review[]);

        if (user && profile) {
          const { data: enr } = await supabase
            .from("enrollments")
            .select("id")
            .eq("user_id", profile.id)
            .eq("course_id", courseId)
            .maybeSingle();
          setIsEnrolled(!!enr);
        }
      }
      setLoading(false);
    };
    fetchData();
  }, [slug, user, profile]);

  const totalLessons = sections.reduce((acc, s) => acc + (s.lessons?.length || 0), 0);
  const avgRating = reviews.length ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0;

  const checkCoupon = async () => {
    if (!couponCode.trim()) return;
    const { data } = await supabase.from("coupons").select("*").eq("code", couponCode.toUpperCase()).eq("is_active", true).maybeSingle();
    if (data) {
      let discountText = "";
      if (data.discount_type === "percentage") discountText = `${data.discount_value}% ছাড়`;
      else if (data.discount_type === "flat_bdt") discountText = `৳${data.discount_value} ছাড়`;
      setCouponMsg({ type: "success", text: `কুপন প্রযোজ্য! ${discountText}` });
    } else {
      setCouponMsg({ type: "error", text: "এই কুপনটি বৈধ নয় বা মেয়াদ শেষ হয়ে গেছে।" });
    }
  };

  const submitReview = async () => {
    if (!myRating || !profile || !course) return;
    setSubmittingReview(true);
    await supabase.from("course_reviews").upsert({
      user_id: profile.id, course_id: course.id, rating: myRating, review: myReview
    });
    setSubmittingReview(false);
    setMyRating(0); setMyReview("");
    const { data } = await supabase.from("course_reviews").select("id,rating,review,created_at,profiles(name,avatar_url)").eq("course_id", course.id).order("created_at", { ascending: false }).limit(10);
    if (data) setReviews(data as unknown as Review[]);
  };

  const shareUrl = window.location.href;

  if (loading) return (
    <PublicLayout>
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full" />
      </div>
    </PublicLayout>
  );

  if (!course) return (
    <PublicLayout>
      <div className="min-h-screen flex items-center justify-center text-center px-4">
        <div>
          <AlertCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">কোর্স পাওয়া যায়নি</h1>
          <p className="text-gray-400 mb-6">এই কোর্সটি বিদ্যমান নেই বা প্রকাশিত হয়নি।</p>
          <Link href="/courses"><button className="bg-violet-600 text-white px-6 py-3 rounded-xl">সব কোর্স দেখুন</button></Link>
        </div>
      </div>
    </PublicLayout>
  );

  const courseSchema = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.short_desc || course.description || course.title,
    url: `https://aishikhibanglay.com/courses/${course.slug}`,
    image: course.thumbnail_url || "https://aishikhibanglay.com/opengraph.jpg",
    provider: {
      "@type": "Organization",
      name: "AI শিখি বাংলায়",
      sameAs: "https://aishikhibanglay.com",
    },
    instructor: course.profiles ? {
      "@type": "Person",
      name: course.profiles.name,
    } : undefined,
    offers: {
      "@type": "Offer",
      price: course.is_free ? 0 : course.price_bdt,
      priceCurrency: "BDT",
      availability: "https://schema.org/InStock",
      url: `https://aishikhibanglay.com/courses/${course.slug}`,
    },
    courseLanguage: "Bengali",
    educationalLevel: "Beginner to Advanced",
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "Online",
      courseWorkload: course.total_duration > 0 ? `PT${Math.round(course.total_duration / 3600)}H` : undefined,
    },
  };

  return (
    <PublicLayout>
      <SEO
        title={`${course.title} — বাংলায় শিখুন`}
        description={course.short_desc || `${course.title} কোর্সটি বাংলায় শিখুন AI শিখি বাংলায়তে। ভেরিফাইড সার্টিফিকেট, আজীবন অ্যাক্সেস।`}
        keywords={`${course.title}, ${course.category || ""}, AI কোর্স বাংলাদেশ, বাংলায় কোর্স, অনলাইন কোর্স`}
        image={course.thumbnail_url || undefined}
        url={`/courses/${course.slug}`}
        schema={courseSchema}
      />
      {/* Hero */}
      <section className="bg-gradient-to-b from-gray-900 to-gray-950 border-b border-gray-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid lg:grid-cols-3 gap-10">
            {/* Left: course info */}
            <div className="lg:col-span-2">
              <div className="flex flex-wrap gap-2 mb-4">
                {course.category && <span className="text-xs text-violet-400 bg-violet-500/10 px-3 py-1 rounded-full border border-violet-500/20">{course.category}</span>}
                <span className="text-xs text-gray-400 bg-gray-800 px-3 py-1 rounded-full capitalize">{course.type}</span>
                {course.is_free && <span className="text-xs text-green-400 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">বিনামূল্যে</span>}
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white mb-4 leading-tight">{course.title}</h1>
              {course.short_desc && <p className="text-gray-300 text-lg mb-6 leading-relaxed">{course.short_desc}</p>}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-6">
                <span className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-yellow-400 font-semibold">{avgRating.toFixed(1)}</span>
                  <span>({reviews.length} রিভিউ)</span>
                </span>
                <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-violet-400" /> শিক্ষার্থী</span>
                {course.total_duration > 0 && <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-violet-400" />{formatDuration(course.total_duration)}</span>}
                <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-violet-400" />{totalLessons} লেসন</span>
              </div>
              {course.profiles && (
                <div className="flex items-center gap-3">
                  {course.profiles.avatar_url ? (
                    <img src={course.profiles.avatar_url} alt={course.profiles.name} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                      {course.profiles.name[0]}
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-500">ইন্সট্রাক্টর</p>
                    <p className="text-sm font-medium text-white">{course.profiles.name}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Right: buy card */}
            <div className="lg:col-span-1">
              <div className="bg-gray-900 border border-gray-700/60 rounded-2xl overflow-hidden sticky top-24">
                {course.thumbnail_url ? (
                  <div className="relative">
                    <img src={course.thumbnail_url} alt={course.title} className="w-full h-48 object-cover" />
                    {course.trailer_url && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                          <Play className="w-7 h-7 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-48 bg-gradient-to-br from-violet-900/40 to-indigo-900/40 flex items-center justify-center">
                    <BookOpen className="w-14 h-14 text-violet-400/40" />
                  </div>
                )}
                <div className="p-6">
                  <div className="mb-4">
                    {course.is_free ? (
                      <span className="text-3xl font-extrabold text-green-400">বিনামূল্যে</span>
                    ) : (
                      <div>
                        <span className="text-3xl font-extrabold text-white">৳{course.price_bdt.toLocaleString()}</span>
                        <span className="text-gray-500 text-sm ml-2">(${course.price_usd})</span>
                      </div>
                    )}
                  </div>

                  {isEnrolled ? (
                    <Link href={`/dashboard/courses`}>
                      <button className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2">
                        <CheckCircle className="w-5 h-5" /> কোর্স শুরু করুন
                      </button>
                    </Link>
                  ) : (
                    <Link href={user ? `/checkout/${course.slug}` : `/login?redirect=/checkout/${course.slug}`}>
                      <button className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-violet-500/20 flex items-center justify-center gap-2 mb-3">
                        {course.is_free ? "ফ্রিতে ভর্তি হন" : "এখনই কিনুন"}
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </Link>
                  )}

                  {!course.is_free && !isEnrolled && (
                    <div className="mt-3">
                      <div className="flex gap-2">
                        <input
                          value={couponCode}
                          onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponMsg(null); }}
                          placeholder="কুপন কোড"
                          className="flex-1 bg-gray-800 border border-gray-700 focus:border-violet-500 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none"
                        />
                        <button onClick={checkCoupon} className="bg-gray-700 hover:bg-gray-600 text-white text-sm px-4 py-2.5 rounded-xl transition-colors flex items-center gap-1">
                          <Tag className="w-4 h-4" /> প্রয়োগ
                        </button>
                      </div>
                      {couponMsg && (
                        <p className={`text-xs mt-2 ${couponMsg.type === "success" ? "text-green-400" : "text-red-400"}`}>{couponMsg.text}</p>
                      )}
                    </div>
                  )}

                  <div className="mt-5 space-y-2.5 text-sm text-gray-400 border-t border-gray-700/60 pt-5">
                    <div className="flex items-center gap-2.5"><BookOpen className="w-4 h-4 text-violet-400" />{totalLessons} টি লেসন</div>
                    {course.total_duration > 0 && <div className="flex items-center gap-2.5"><Clock className="w-4 h-4 text-violet-400" />{formatDuration(course.total_duration)}</div>}
                    {course.certificate_enabled && <div className="flex items-center gap-2.5"><Award className="w-4 h-4 text-violet-400" />সার্টিফিকেট দেওয়া হবে</div>}
                    <div className="flex items-center gap-2.5"><CheckCircle className="w-4 h-4 text-violet-400" />আজীবন অ্যাক্সেস</div>
                  </div>

                  {/* Social Share */}
                  <div className="mt-5 border-t border-gray-700/60 pt-5">
                    <p className="text-xs text-gray-500 mb-3">শেয়ার করুন</p>
                    <div className="flex gap-2">
                      <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-blue-600/15 hover:bg-blue-600/30 text-blue-400 transition-colors"><Facebook className="w-4 h-4" /></a>
                      <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(course.title)}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-sky-600/15 hover:bg-sky-600/30 text-sky-400 transition-colors"><Twitter className="w-4 h-4" /></a>
                      <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-blue-700/15 hover:bg-blue-700/30 text-blue-500 transition-colors"><Linkedin className="w-4 h-4" /></a>
                      <a href={`https://api.whatsapp.com/send?text=${encodeURIComponent(course.title + " " + shareUrl)}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-green-600/15 hover:bg-green-600/30 text-green-400 transition-colors"><MessageCircle className="w-4 h-4" /></a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-10">

            {/* What you'll learn */}
            {course.what_you_learn?.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-white mb-5">আপনি যা শিখবেন</h2>
                <div className="bg-gray-900/60 border border-gray-800/60 rounded-2xl p-6 grid sm:grid-cols-2 gap-3">
                  {course.what_you_learn.map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-300">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Curriculum */}
            {sections.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-white mb-5">কোর্স কারিকুলাম</h2>
                <div className="space-y-3">
                  {sections.map((section) => (
                    <div key={section.id} className="bg-gray-900/60 border border-gray-800/60 rounded-2xl overflow-hidden">
                      <button
                        onClick={() => setOpenSection(openSection === section.id ? null : section.id)}
                        className="w-full flex items-center justify-between gap-4 p-4 text-left"
                      >
                        <div>
                          <h3 className="font-semibold text-white">{section.title}</h3>
                          <p className="text-xs text-gray-500 mt-0.5">{section.lessons?.length || 0} লেসন</p>
                        </div>
                        <ChevronDown className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${openSection === section.id ? "rotate-180" : ""}`} />
                      </button>
                      {openSection === section.id && section.lessons && (
                        <div className="border-t border-gray-800/60">
                          {section.lessons.map((lesson) => (
                            <div key={lesson.id} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-800/40 transition-colors">
                              <div className="flex items-center gap-3">
                                {lesson.is_free_preview ? (
                                  <Play className="w-4 h-4 text-green-400 flex-shrink-0" />
                                ) : (
                                  <Lock className="w-4 h-4 text-gray-600 flex-shrink-0" />
                                )}
                                <span className={`text-sm ${lesson.is_free_preview ? "text-green-400" : "text-gray-300"}`}>{lesson.title}</span>
                                {lesson.is_free_preview && (
                                  <span className="text-xs bg-green-500/15 text-green-400 px-2 py-0.5 rounded-full">ফ্রি প্রিভিউ</span>
                                )}
                              </div>
                              {lesson.duration_seconds > 0 && (
                                <span className="text-xs text-gray-500 flex-shrink-0">{formatDuration(lesson.duration_seconds)}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Requirements */}
            {course.requirements?.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-white mb-5">পূর্বশর্ত</h2>
                <ul className="space-y-2">
                  {course.requirements.map((req, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                      <ChevronRight className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Description */}
            {course.description && (
              <div>
                <h2 className="text-xl font-bold text-white mb-5">কোর্সের বিবরণ</h2>
                <div className="prose prose-invert prose-sm max-w-none text-gray-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: course.description }} />
              </div>
            )}

            {/* Instructor */}
            {course.profiles && (
              <div>
                <h2 className="text-xl font-bold text-white mb-5">ইন্সট্রাক্টর সম্পর্কে</h2>
                <div className="bg-gray-900/60 border border-gray-800/60 rounded-2xl p-6 flex items-start gap-5">
                  {course.profiles.avatar_url ? (
                    <img src={course.profiles.avatar_url} alt={course.profiles.name} className="w-16 h-16 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                      {course.profiles.name[0]}
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-white text-lg">{course.profiles.name}</h3>
                    {course.profiles.bio && <p className="text-sm text-gray-400 mt-2 leading-relaxed">{course.profiles.bio}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Reviews */}
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold text-white">শিক্ষার্থীদের রিভিউ</h2>
                {reviews.length > 0 && (
                  <div className="flex items-center gap-2">
                    <StarRow rating={Math.round(avgRating)} />
                    <span className="text-white font-semibold">{avgRating.toFixed(1)}</span>
                    <span className="text-gray-500 text-sm">({reviews.length})</span>
                  </div>
                )}
              </div>

              {/* Submit review */}
              {isEnrolled && (
                <div className="bg-gray-900/60 border border-gray-800/60 rounded-2xl p-5 mb-6">
                  <p className="text-sm font-medium text-white mb-3">আপনার রিভিউ দিন</p>
                  <div className="flex gap-1 mb-3">
                    {[1,2,3,4,5].map((n) => (
                      <button key={n} onClick={() => setMyRating(n)}>
                        <Star className={`w-6 h-6 transition-colors ${n <= myRating ? "fill-yellow-400 text-yellow-400" : "text-gray-600 hover:text-yellow-400"}`} />
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={myReview}
                    onChange={(e) => setMyReview(e.target.value)}
                    placeholder="আপনার অভিজ্ঞতা লিখুন..."
                    rows={3}
                    className="w-full bg-gray-800 border border-gray-700 focus:border-violet-500 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition-colors resize-none mb-3"
                  />
                  <button
                    onClick={submitReview}
                    disabled={!myRating || submittingReview}
                    className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
                  >
                    {submittingReview ? "জমা হচ্ছে..." : "রিভিউ জমা দিন"}
                  </button>
                </div>
              )}

              {reviews.length === 0 ? (
                <div className="text-center py-10 text-gray-500 bg-gray-900/40 rounded-2xl border border-gray-800/60">
                  <Star className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>এখনো কোনো রিভিউ নেই</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((r) => (
                    <div key={r.id} className="bg-gray-900/60 border border-gray-800/60 rounded-2xl p-5">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {r.profiles?.name[0] || "?"}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-white text-sm">{r.profiles?.name}</span>
                            <span className="text-xs text-gray-500">{new Date(r.created_at).toLocaleDateString("bn-BD")}</span>
                          </div>
                          <StarRow rating={r.rating} />
                          {r.review && <p className="text-sm text-gray-300 mt-2">{r.review}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Certificate info (desktop sidebar) */}
          <div className="hidden lg:block">
            {course.certificate_enabled && (
              <div className="bg-gradient-to-br from-violet-900/30 to-indigo-900/30 border border-violet-500/20 rounded-2xl p-6 mb-6">
                <Award className="w-10 h-10 text-violet-400 mb-3" />
                <h3 className="font-semibold text-white mb-2">সার্টিফিকেট পাবেন</h3>
                <p className="text-sm text-gray-400">কোর্স সম্পন্ন ও কুইজে পাস করলে ভেরিফাইড ডিজিটাল সার্টিফিকেট পাবেন।</p>
              </div>
            )}
            <div className="bg-gray-900/60 border border-gray-800/60 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">কোর্সে যা আছে</h3>
              <ul className="space-y-3 text-sm text-gray-400">
                <li className="flex items-center gap-2.5"><BookOpen className="w-4 h-4 text-violet-400" />{totalLessons} টি লেসন</li>
                {course.total_duration > 0 && <li className="flex items-center gap-2.5"><Clock className="w-4 h-4 text-violet-400" />{formatDuration(course.total_duration)}</li>}
                <li className="flex items-center gap-2.5"><CheckCircle className="w-4 h-4 text-violet-400" />আজীবন অ্যাক্সেস</li>
                <li className="flex items-center gap-2.5"><Share2 className="w-4 h-4 text-violet-400" />মোবাইল ও ডেস্কটপে</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
