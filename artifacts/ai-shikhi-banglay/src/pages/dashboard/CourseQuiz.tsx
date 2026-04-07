import { useState, useEffect } from "react";
import { Link, useParams, useSearch } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import StudentLayout from "@/layouts/StudentLayout";
import { HelpCircle, CheckCircle, XCircle, ChevronRight, ArrowLeft, Trophy, Loader2, RotateCcw } from "lucide-react";

interface Question {
  id: string;
  question: string;
  options: string[];
  correct_option_index: number;
  explanation: string | null;
  points: number;
}

export default function CourseQuiz() {
  const { id } = useParams<{ id: string }>();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const lessonId = params.get("lesson");
  const { profile } = useAuth();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState<Record<string, number>>({});
  const [showResult, setShowResult] = useState(false);
  const [saving, setSaving] = useState(false);
  const [prevResult, setPrevResult] = useState<{ score: number; total: number; passed: boolean } | null>(null);

  useEffect(() => {
    fetchQuestions();
  }, [lessonId, id]);

  const fetchQuestions = async () => {
    setLoading(true);
    let q = supabase
      .from("quiz_questions")
      .select("id, question, options, correct_option_index, explanation, points")
      .order("created_at");

    if (lessonId) q = q.eq("lesson_id", lessonId);
    else if (id) q = q.eq("course_id", id);

    const { data } = await q;

    if (data && data.length > 0) {
      setQuestions(
        data.map((q: any) => ({
          ...q,
          options: Array.isArray(q.options) ? q.options : JSON.parse(q.options || "[]"),
          points: q.points || 1,
        }))
      );

      // Check for previous result
      if (profile && lessonId) {
        const { data: prevRes } = await supabase
          .from("quiz_results")
          .select("score, total_questions, passed")
          .eq("user_id", profile.user_id)
          .eq("lesson_id", lessonId)
          .order("completed_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (prevRes) setPrevResult(prevRes);
      }
    }
    setLoading(false);
  };

  const question = questions[current];
  const isLast = current === questions.length - 1;
  const isAnswered = selected !== null;

  const handleSelect = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    setAnswered((a) => ({ ...a, [question.id]: idx }));
  };

  const handleNext = () => {
    if (isLast) submitQuiz();
    else { setCurrent((c) => c + 1); setSelected(null); }
  };

  const score = questions.filter((q) => answered[q.id] === q.correct_option_index).length;
  const totalPoints = questions.reduce((s, q) => s + q.points, 0);
  const earnedPoints = questions.filter((q) => answered[q.id] === q.correct_option_index).reduce((s, q) => s + q.points, 0);
  const percent = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
  const passed = percent >= 70;

  const submitQuiz = async () => {
    setShowResult(true);
    if (!profile || !lessonId) return;
    setSaving(true);
    await supabase.from("quiz_results").insert({
      user_id: profile.user_id,
      lesson_id: lessonId,
      score: earnedPoints,
      total_questions: questions.length,
      passed,
      completed_at: new Date().toISOString(),
    });
    setSaving(false);
  };

  const restart = () => {
    setCurrent(0); setSelected(null); setAnswered({}); setShowResult(false);
  };

  if (loading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center min-h-full">
          <div className="text-center">
            <Loader2 className="w-10 h-10 text-violet-500 animate-spin mx-auto mb-3" />
            <p className="text-gray-400 text-sm">কুইজ লোড হচ্ছে...</p>
          </div>
        </div>
      </StudentLayout>
    );
  }

  if (questions.length === 0) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center min-h-full p-6">
          <div className="text-center max-w-sm">
            <div className="w-20 h-20 bg-gray-800 rounded-3xl flex items-center justify-center mx-auto mb-5">
              <HelpCircle className="w-10 h-10 text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">কুইজ পাওয়া যায়নি</h3>
            <p className="text-gray-400 text-sm mb-6">এই লেসনে এখনো কোনো কুইজ যোগ করা হয়নি।</p>
            <Link href={`/dashboard/courses/${id}/learn`}
              className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-medium py-2.5 px-5 rounded-xl text-sm transition-colors">
              <ArrowLeft className="w-4 h-4" /> লেসনে ফিরুন
            </Link>
          </div>
        </div>
      </StudentLayout>
    );
  }

  if (showResult) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center min-h-full p-6">
          <div className="max-w-lg w-full">
            {/* Result Card */}
            <div className="bg-gray-900/80 border border-gray-800 rounded-3xl p-8 text-center mb-6">
              <div className={`w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 ${passed ? "bg-green-500/20 border border-green-500/30" : "bg-red-500/20 border border-red-500/30"}`}>
                {passed ? <Trophy className="w-12 h-12 text-green-400" /> : <XCircle className="w-12 h-12 text-red-400" />}
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {passed ? "অভিনন্দন! 🎉" : "আবার চেষ্টা করুন"}
              </h2>
              <p className="text-gray-400 mb-6">
                {questions.length}টি প্রশ্নের মধ্যে {score}টি সঠিক
              </p>
              {/* Circular progress */}
              <div className="relative w-36 h-36 mx-auto mb-6">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#1f2937" strokeWidth="8" />
                  <circle cx="50" cy="50" r="40" fill="none"
                    stroke={passed ? "#22c55e" : "#ef4444"} strokeWidth="8"
                    strokeDasharray={`${percent * 2.51} 251`} strokeLinecap="round"
                    className="transition-all duration-1000" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-3xl font-bold ${passed ? "text-green-400" : "text-red-400"}`}>{percent}%</span>
                  <span className="text-xs text-gray-500">{passed ? "উত্তীর্ণ" : "অনুত্তীর্ণ"}</span>
                </div>
              </div>
              {saving && <p className="text-xs text-gray-600 mb-4">ফলাফল সংরক্ষণ হচ্ছে...</p>}
            </div>

            {/* Answer Review */}
            <div className="space-y-3 mb-6">
              {questions.map((q, i) => {
                const userAns = answered[q.id];
                const correct = userAns === q.correct_option_index;
                return (
                  <div key={q.id} className={`rounded-2xl p-4 border ${correct ? "bg-green-500/5 border-green-500/20" : "bg-red-500/5 border-red-500/20"}`}>
                    <div className="flex items-start gap-2 mb-2">
                      {correct ? <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" /> : <XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />}
                      <p className="text-sm text-white">{i + 1}. {q.question}</p>
                    </div>
                    {!correct && userAns !== undefined && (
                      <div className="ml-6 space-y-1 text-xs">
                        <p className="text-red-400">আপনার উত্তর: {q.options[userAns]}</p>
                        <p className="text-green-400">সঠিক উত্তর: {q.options[q.correct_option_index]}</p>
                      </div>
                    )}
                    {q.explanation && (
                      <p className="ml-6 mt-1 text-xs text-gray-500">{q.explanation}</p>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3">
              <Link href={`/dashboard/courses/${id}/learn`}
                className="flex-1 flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white font-medium py-2.5 rounded-xl text-sm transition-colors">
                <ArrowLeft className="w-4 h-4" /> কোর্সে ফিরুন
              </Link>
              <button onClick={restart}
                className="flex-1 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-medium py-2.5 rounded-xl text-sm transition-colors">
                <RotateCcw className="w-4 h-4" /> আবার চেষ্টা
              </button>
            </div>
          </div>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="p-4 lg:p-8 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link href={`/dashboard/courses/${id}/learn`}
            className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" /> লেসনে ফিরুন
          </Link>
          {prevResult && (
            <div className={`text-xs px-2.5 py-1 rounded-lg border ${prevResult.passed ? "text-green-400 bg-green-500/10 border-green-500/30" : "text-red-400 bg-red-500/10 border-red-500/30"}`}>
              আগের ফলাফল: {Math.round((prevResult.score / prevResult.total_questions) * 100)}%
            </div>
          )}
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
            <span>প্রশ্ন {current + 1} / {questions.length}</span>
            <span>{Object.keys(answered).length}/{questions.length} উত্তর দেওয়া</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${((current + (isAnswered ? 1 : 0)) / questions.length) * 100}%` }} />
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-6 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
              <HelpCircle className="w-4 h-4 text-violet-400" />
            </div>
            <span className="text-xs text-violet-400 font-medium">প্রশ্ন {current + 1}</span>
            <span className="ml-auto text-xs text-gray-600">{question.points} পয়েন্ট</span>
          </div>

          <h2 className="text-base font-semibold text-white mb-5 leading-relaxed">{question.question}</h2>

          <div className="space-y-2.5">
            {question.options.map((opt, idx) => {
              const isCorrect = idx === question.correct_option_index;
              const isSelected = idx === selected;
              let cls = "border-gray-700 text-gray-300 hover:border-violet-500/50 hover:bg-violet-500/5 cursor-pointer";
              if (isAnswered) {
                if (isCorrect) cls = "border-green-500 bg-green-500/10 text-green-300 cursor-default";
                else if (isSelected) cls = "border-red-500 bg-red-500/10 text-red-300 cursor-default";
                else cls = "border-gray-800 text-gray-600 cursor-default opacity-60";
              }
              return (
                <button key={idx} onClick={() => handleSelect(idx)}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${cls}`}>
                  <div className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center flex-shrink-0 text-sm font-bold ${
                    isAnswered && isCorrect ? "border-green-500 bg-green-500 text-white" :
                    isAnswered && isSelected ? "border-red-500 bg-red-500 text-white" :
                    "border-current"
                  }`}>
                    {isAnswered
                      ? isCorrect ? <CheckCircle className="w-4 h-4" /> : isSelected ? <XCircle className="w-4 h-4" /> : String.fromCharCode(65 + idx)
                      : String.fromCharCode(65 + idx)
                    }
                  </div>
                  <span className="text-sm leading-relaxed">{opt}</span>
                </button>
              );
            })}
          </div>

          {isAnswered && (
            <div className={`mt-5 p-4 rounded-xl border text-sm ${
              selected === question.correct_option_index
                ? "bg-green-500/10 border-green-500/30 text-green-300"
                : "bg-red-500/10 border-red-500/30 text-red-300"
            }`}>
              <strong className="block mb-1">
                {selected === question.correct_option_index ? "✅ সঠিক!" : "❌ ভুল!"}
              </strong>
              {question.explanation && <p className="text-xs opacity-90 mt-1">{question.explanation}</p>}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center">
          <div className="text-xs text-gray-600">
            {Object.keys(answered).length > 0 && (
              <>✅ {questions.filter((q) => answered[q.id] === q.correct_option_index).length} সঠিক</>
            )}
          </div>
          <button onClick={handleNext} disabled={!isAnswered}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-medium py-2.5 px-6 rounded-xl text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            {isLast ? "ফলাফল দেখুন" : "পরের প্রশ্ন"} <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </StudentLayout>
  );
}
