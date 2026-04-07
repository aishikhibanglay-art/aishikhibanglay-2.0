import { useState } from "react";
import { Link, useParams } from "wouter";
import StudentLayout from "@/layouts/StudentLayout";
import { HelpCircle, CheckCircle, XCircle, ChevronRight, ArrowLeft, Trophy } from "lucide-react";

// Demo quiz data — real data comes from Supabase quiz_questions table
const demoQuestions = [
  {
    id: "1",
    question: "Machine Learning কী?",
    options: [
      "কম্পিউটারকে ডেটা থেকে শিখতে দেওয়ার প্রক্রিয়া",
      "শুধু প্রোগ্রামিং ল্যাঙ্গুয়েজ",
      "ইন্টারনেট ব্রাউজিং",
      "গেম খেলার সফটওয়্যার",
    ],
    correct: 0,
    explanation: "Machine Learning হলো AI-এর একটি শাখা যেখানে কম্পিউটার ডেটা থেকে নিজেই শিখতে পারে।",
  },
  {
    id: "2",
    question: "Neural Network-এর মূল উপাদান কোনটি?",
    options: ["নিউরন", "ভেক্টর", "স্ট্রিং", "লুপ"],
    correct: 0,
    explanation: "Neural Network আর্টিফিশিয়াল নিউরন দিয়ে তৈরি যা মানুষের মস্তিষ্কের অনুকরণ করে।",
  },
  {
    id: "3",
    question: "Supervised Learning-এ কী থাকে?",
    options: [
      "লেবেলযুক্ত ট্রেনিং ডেটা",
      "শুধু ইনপুট ডেটা",
      "কোনো ডেটা লাগে না",
      "শুধু আউটপুট ডেটা",
    ],
    correct: 0,
    explanation: "Supervised Learning-এ ইনপুট এবং সঠিক আউটপুট উভয়ই দেওয়া থাকে।",
  },
];

export default function CourseQuiz() {
  const { id } = useParams<{ id: string }>();
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState<Record<string, number>>({});
  const [showResult, setShowResult] = useState(false);

  const question = demoQuestions[current];
  const isLast = current === demoQuestions.length - 1;
  const isAnswered = selected !== null;

  const handleSelect = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    setAnswered((a) => ({ ...a, [question.id]: idx }));
  };

  const handleNext = () => {
    if (isLast) {
      setShowResult(true);
    } else {
      setCurrent((c) => c + 1);
      setSelected(null);
    }
  };

  const score = demoQuestions.filter((q) => answered[q.id] === q.correct).length;
  const percent = Math.round((score / demoQuestions.length) * 100);

  if (showResult) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center min-h-full p-6">
          <div className="max-w-md w-full text-center">
            <div className={`w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 ${
              percent >= 70 ? "bg-green-500/20 border border-green-500/30" : "bg-red-500/20 border border-red-500/30"
            }`}>
              {percent >= 70 ? (
                <Trophy className="w-12 h-12 text-green-400" />
              ) : (
                <XCircle className="w-12 h-12 text-red-400" />
              )}
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {percent >= 70 ? "অভিনন্দন! 🎉" : "আবার চেষ্টা করুন"}
            </h2>
            <p className="text-gray-400 mb-6">
              {demoQuestions.length}টি প্রশ্নের মধ্যে {score}টি সঠিক
            </p>
            <div className="relative w-32 h-32 mx-auto mb-8">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#1f2937" strokeWidth="8" />
                <circle cx="50" cy="50" r="40" fill="none"
                  stroke={percent >= 70 ? "#22c55e" : "#ef4444"} strokeWidth="8"
                  strokeDasharray={`${percent * 2.51} 251`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-2xl font-bold ${percent >= 70 ? "text-green-400" : "text-red-400"}`}>{percent}%</span>
              </div>
            </div>
            <div className="flex gap-3 justify-center">
              <Link href={`/dashboard/courses/${id}/learn`}
                className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white font-medium py-2.5 px-5 rounded-xl text-sm transition-colors">
                <ArrowLeft className="w-4 h-4" /> কোর্সে ফিরুন
              </Link>
              <button onClick={() => { setCurrent(0); setSelected(null); setAnswered({}); setShowResult(false); }}
                className="bg-violet-600 hover:bg-violet-500 text-white font-medium py-2.5 px-5 rounded-xl text-sm transition-colors">
                আবার চেষ্টা করুন
              </button>
            </div>
          </div>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="p-6 lg:p-8 max-w-2xl mx-auto">
        <Link href={`/dashboard/courses/${id}/learn`}
          className="flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> লেসনে ফিরুন
        </Link>

        <div className="mb-6">
          <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
            <span>প্রশ্ন {current + 1} / {demoQuestions.length}</span>
            <span>{Math.round(((current) / demoQuestions.length) * 100)}% সম্পন্ন</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all"
              style={{ width: `${(current / demoQuestions.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-6 mb-4">
          <div className="flex items-center gap-2 mb-5">
            <HelpCircle className="w-5 h-5 text-violet-400" />
            <span className="text-xs text-violet-400 font-medium">কুইজ প্রশ্ন</span>
          </div>
          <h2 className="text-lg font-semibold text-white mb-6">{question.question}</h2>
          <div className="space-y-3">
            {question.options.map((opt, idx) => {
              const isCorrect = idx === question.correct;
              const isSelected = idx === selected;
              let cls = "border-gray-700 text-gray-300 hover:border-gray-600 hover:bg-gray-800/50";
              if (isAnswered) {
                if (isCorrect) cls = "border-green-500 bg-green-500/10 text-green-300";
                else if (isSelected && !isCorrect) cls = "border-red-500 bg-red-500/10 text-red-300";
                else cls = "border-gray-700 text-gray-500";
              }
              return (
                <button key={idx} onClick={() => handleSelect(idx)}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${cls} ${!isAnswered ? "cursor-pointer" : "cursor-default"}`}>
                  <div className={`w-7 h-7 rounded-lg border flex items-center justify-center flex-shrink-0 text-sm font-medium ${
                    isAnswered && isCorrect ? "bg-green-500 border-green-500 text-white" :
                    isAnswered && isSelected && !isCorrect ? "bg-red-500 border-red-500 text-white" :
                    "border-current text-current"
                  }`}>
                    {isAnswered ? (isCorrect ? <CheckCircle className="w-4 h-4" /> : isSelected ? <XCircle className="w-4 h-4" /> : String.fromCharCode(65 + idx)) : String.fromCharCode(65 + idx)}
                  </div>
                  <span className="text-sm">{opt}</span>
                </button>
              );
            })}
          </div>
          {isAnswered && (
            <div className={`mt-5 p-4 rounded-xl border text-sm ${
              selected === question.correct
                ? "bg-green-500/10 border-green-500/30 text-green-300"
                : "bg-red-500/10 border-red-500/30 text-red-300"
            }`}>
              <strong className="block mb-1">{selected === question.correct ? "✅ সঠিক!" : "❌ ভুল!"}</strong>
              {question.explanation}
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button onClick={handleNext} disabled={!isAnswered}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-medium py-2.5 px-6 rounded-xl text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            {isLast ? "ফলাফল দেখুন" : "পরের প্রশ্ন"} <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </StudentLayout>
  );
}
