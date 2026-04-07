import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import AdminLayout from "@/layouts/AdminLayout";
import { Mail, Save, Loader2, CheckCircle, Eye, EyeOff, RefreshCw } from "lucide-react";

interface Template {
  id: string;
  name: string;
  subject: string;
  body: string;
  description: string;
  variables: string[];
}

const DEFAULT_TEMPLATES: Template[] = [
  {
    id: "welcome",
    name: "স্বাগত ইমেইল",
    subject: "AI শিখি বাংলায়-এ আপনাকে স্বাগতম! 🎉",
    description: "নতুন ব্যবহারকারী সাইনআপ করলে পাঠানো হয়",
    variables: ["{{name}}", "{{email}}"],
    body: `প্রিয় {{name}},

AI শিখি বাংলায়-এ আপনাকে স্বাগতম! আমরা আনন্দিত যে আপনি আমাদের সাথে যোগ দিয়েছেন।

আমাদের প্ল্যাটফর্মে আপনি পাবেন:
✅ বাংলায় AI ও Technology কোর্স
✅ বিশেষজ্ঞ ইন্সট্রাক্টরদের গাইডেন্স
✅ কোর্স শেষে সার্টিফিকেট
✅ সক্রিয় কমিউনিটি সাপোর্ট

আজই শুরু করুন: https://www.aishikhibanglay.com/courses

ধন্যবাদ,
AI শিখি বাংলায় টিম`,
  },
  {
    id: "enrollment",
    name: "নথিভুক্তি নিশ্চিতকরণ",
    subject: "কোর্স নথিভুক্তি সফল হয়েছে - {{course_title}}",
    description: "কোর্সে সফলভাবে ভর্তি হলে পাঠানো হয়",
    variables: ["{{name}}", "{{course_title}}", "{{amount}}", "{{transaction_id}}"],
    body: `প্রিয় {{name}},

আপনার "{{course_title}}" কোর্সে নথিভুক্তি সম্পন্ন হয়েছে।

💳 পেমেন্ট বিবরণ:
পরিমাণ: ৳{{amount}}
Transaction ID: {{transaction_id}}

এখনই শুরু করুন: https://www.aishikhibanglay.com/dashboard/courses

কোনো সমস্যা হলে আমাদের সাথে যোগাযোগ করুন।

শুভকামনা,
AI শিখি বাংলায় টিম`,
  },
  {
    id: "certificate",
    name: "সার্টিফিকেট প্রদান",
    subject: "অভিনন্দন! আপনার সার্টিফিকেট প্রস্তুত 🎓",
    description: "কোর্স সম্পন্ন করলে সার্টিফিকেটের নোটিফিকেশন",
    variables: ["{{name}}", "{{course_title}}", "{{certificate_id}}"],
    body: `প্রিয় {{name}},

অভিনন্দন! আপনি সফলভাবে "{{course_title}}" কোর্স সম্পন্ন করেছেন।

আপনার সার্টিফিকেট ID: {{certificate_id}}

সার্টিফিকেট ডাউনলোড করুন: https://www.aishikhibanglay.com/dashboard/certificates

এই সাফল্যের জন্য আপনাকে অভিনন্দন!

AI শিখি বাংলায় টিম`,
  },
  {
    id: "password_reset",
    name: "পাসওয়ার্ড রিসেট",
    subject: "পাসওয়ার্ড রিসেট অনুরোধ",
    description: "পাসওয়ার্ড ভুলে গেলে পাঠানো হয়",
    variables: ["{{name}}", "{{reset_link}}"],
    body: `প্রিয় {{name}},

আপনার পাসওয়ার্ড রিসেটের অনুরোধ পেয়েছি।

নিচের লিংকে ক্লিক করে নতুন পাসওয়ার্ড সেট করুন:
{{reset_link}}

এই লিংকটি ২৪ ঘণ্টার জন্য বৈধ।

যদি আপনি এই অনুরোধ না করে থাকেন, অনুগ্রহ করে এই ইমেইলটি উপেক্ষা করুন।

AI শিখি বাংলায় টিম`,
  },
  {
    id: "course_approved",
    name: "কোর্স অনুমোদন",
    subject: "আপনার কোর্স অনুমোদিত হয়েছে ✅",
    description: "ইন্সট্রাক্টরের কোর্স অনুমোদন হলে পাঠানো হয়",
    variables: ["{{name}}", "{{course_title}}", "{{course_url}}"],
    body: `প্রিয় {{name}},

আপনার "{{course_title}}" কোর্সটি অনুমোদিত হয়েছে এবং এখন প্রকাশিত।

কোর্স দেখুন: {{course_url}}

শিক্ষার্থীরা এখন আপনার কোর্সে ভর্তি হতে পারবে।

AI শিখি বাংলায় টিম`,
  },
];

export default function EmailTemplates() {
  const [templates, setTemplates] = useState<Template[]>(DEFAULT_TEMPLATES);
  const [selectedId, setSelectedId] = useState<string>("welcome");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [preview, setPreview] = useState(false);
  const [previewName, setPreviewName] = useState("রহিম");
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchTemplates(); }, []);

  const fetchTemplates = async () => {
    const { data } = await supabase.from("email_templates").select("*");
    if (data && data.length > 0) {
      setTemplates((prev) =>
        prev.map((t) => {
          const db = data.find((d: any) => d.name === t.id);
          return db ? { ...t, subject: db.subject, body: db.body } : t;
        })
      );
    }
    setLoading(false);
  };

  const selected = templates.find((t) => t.id === selectedId)!;

  const setField = (k: keyof Template, v: string) =>
    setTemplates((prev) => prev.map((t) => t.id === selectedId ? { ...t, [k]: v } : t));

  const handleSave = async () => {
    setSaving(true);
    await supabase.from("email_templates").upsert({
      name: selected.id,
      subject: selected.subject,
      body: selected.body,
      updated_at: new Date().toISOString(),
    }, { onConflict: "name" });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const renderPreview = (text: string) =>
    text.replace(/\{\{name\}\}/g, previewName)
        .replace(/\{\{course_title\}\}/g, "AI দিয়ে ব্যবসা শুরু")
        .replace(/\{\{amount\}\}/g, "৳১,৯৯৯")
        .replace(/\{\{transaction_id\}\}/g, "TXN123456")
        .replace(/\{\{certificate_id\}\}/g, "CERT-2024-001")
        .replace(/\{\{reset_link\}\}/g, "https://www.aishikhibanglay.com/reset")
        .replace(/\{\{course_url\}\}/g, "https://www.aishikhibanglay.com/courses/ai")
        .replace(/\{\{email\}\}/g, "user@example.com");

  const inputCls = "w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-rose-500 transition-all placeholder-gray-600";
  const labelCls = "block text-xs font-medium text-gray-400 mb-2";

  return (
    <AdminLayout>
      <div className="p-6 lg:p-7 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-7">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">ইমেইল টেমপ্লেট</h1>
            <p className="text-gray-500 text-sm">স্বয়ংক্রিয় ইমেইলের বিষয়বস্তু সম্পাদনা করুন</p>
          </div>
          <div className="flex items-center gap-2">
            {saved && (
              <span className="flex items-center gap-1.5 text-xs text-green-400">
                <CheckCircle className="w-3.5 h-3.5" /> সংরক্ষিত
              </span>
            )}
            <button onClick={() => setPreview(!preview)}
              className="flex items-center gap-2 bg-gray-800 border border-gray-700 text-gray-300 text-sm py-2 px-3 rounded-xl hover:bg-gray-700 transition-colors">
              {preview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {preview ? "সম্পাদনা" : "প্রিভিউ"}
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-medium py-2 px-4 rounded-xl text-sm transition-colors disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              সংরক্ষণ করুন
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Template List */}
          <div className="space-y-2">
            {templates.map((t) => (
              <button key={t.id} onClick={() => setSelectedId(t.id)}
                className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all ${selectedId === t.id ? "bg-rose-500/15 border border-rose-500/30 text-white" : "bg-gray-900/60 border border-gray-800 text-gray-400 hover:text-gray-200 hover:bg-gray-800/60"}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${selectedId === t.id ? "bg-rose-500/20" : "bg-gray-800"}`}>
                  <Mail className={`w-4 h-4 ${selectedId === t.id ? "text-rose-400" : "text-gray-600"}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-tight">{t.name}</p>
                  <p className="text-xs text-gray-600 mt-0.5 leading-tight line-clamp-2">{t.description}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Editor / Preview */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="flex items-center justify-center h-64 bg-gray-900/60 border border-gray-800 rounded-2xl">
                <Loader2 className="w-8 h-8 text-rose-400 animate-spin" />
              </div>
            ) : preview ? (
              /* Preview Mode */
              <div className="bg-gray-900/60 border border-gray-800 rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800 bg-gray-800/40">
                  <p className="text-xs text-gray-400">ইমেইল প্রিভিউ</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">প্রিভিউ নাম:</span>
                    <input value={previewName} onChange={(e) => setPreviewName(e.target.value)}
                      className="bg-gray-700 text-white text-xs rounded-lg px-2 py-1 w-24 focus:outline-none" />
                    <button onClick={() => setPreviewName("রহিম")}
                      className="p-1 rounded text-gray-500 hover:text-white transition-colors">
                      <RefreshCw className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <div className="bg-white rounded-xl overflow-hidden max-w-2xl mx-auto shadow-2xl">
                    <div className="bg-gradient-to-r from-violet-600 to-rose-600 px-6 py-8 text-center">
                      <div className="text-3xl font-bold text-white mb-1">AI শিখি বাংলায়</div>
                      <div className="text-violet-200 text-sm">বাংলায় AI শিখুন, ভবিষ্যৎ গড়ুন</div>
                    </div>
                    <div className="px-8 py-6">
                      <div className="mb-4">
                        <p className="text-xs text-gray-400 mb-1">বিষয়:</p>
                        <p className="text-gray-900 font-medium">{renderPreview(selected.subject)}</p>
                      </div>
                      <div className="border-t border-gray-200 pt-4">
                        <pre className="text-gray-700 text-sm whitespace-pre-wrap font-sans leading-relaxed">
                          {renderPreview(selected.body)}
                        </pre>
                      </div>
                    </div>
                    <div className="bg-gray-50 px-8 py-4 text-center border-t border-gray-100">
                      <p className="text-xs text-gray-400">© 2024 AI শিখি বাংলায় · aishikhibanglay.com</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Editor Mode */
              <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5 space-y-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-white">{selected.name}</h2>
                    <p className="text-xs text-gray-500 mt-0.5">{selected.description}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 justify-end">
                    {selected.variables.map((v) => (
                      <span key={v} className="text-xs font-mono bg-violet-500/10 text-violet-300 border border-violet-500/30 px-2 py-0.5 rounded-lg">{v}</span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={labelCls}>ইমেইল বিষয় (Subject)</label>
                  <input className={inputCls} value={selected.subject}
                    onChange={(e) => setField("subject", e.target.value)} />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className={labelCls.replace("mb-2","")}>ইমেইল বডি</label>
                    <span className="text-xs text-gray-600">{selected.body.length} অক্ষর</span>
                  </div>
                  <textarea className={`${inputCls} resize-none font-mono text-xs leading-relaxed`} rows={18}
                    value={selected.body} onChange={(e) => setField("body", e.target.value)} />
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3">
                  <p className="text-xs text-blue-300 font-medium mb-1">ব্যবহারযোগ্য ভেরিয়েবল:</p>
                  <p className="text-xs text-blue-400">
                    {selected.variables.join(" · ")}
                  </p>
                  <p className="text-xs text-blue-500 mt-1">এই ভেরিয়েবলগুলো ইমেইল পাঠানোর সময় স্বয়ংক্রিয়ভাবে প্রতিস্থাপিত হবে।</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
