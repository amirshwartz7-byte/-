import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import { books } from "../data/books";

export default function Books() {
  const navigate = useNavigate();
  const [activeTopic, setActiveTopic] = useState<string>("הכל");

  const topics = useMemo(
    () => ["הכל", ...Array.from(new Set(books.map((b) => b.topic)))],
    []
  );

  const filtered = books.filter(
    (b) => activeTopic === "הכל" || b.topic === activeTopic
  );

  return (
    <div className="app-shell">
      <Header
        title="ספרים ומדריכים"
        subtitle="קריאה מומלצת לכל שלב במעבר"
        onBack={() => navigate(-1)}
      />

      <div className="px-3 pt-3 flex gap-1.5 overflow-x-auto no-scrollbar">
        {topics.map((t) => (
          <button
            key={t}
            onClick={() => setActiveTopic(t)}
            className={`px-3.5 py-2 rounded-full text-sm font-semibold whitespace-nowrap shrink-0 ${
              activeTopic === t
                ? "bg-brand-500 text-white"
                : "bg-white text-gray-500 border border-gray-200"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        {filtered.map((b) => (
          <div
            key={b.id}
            className="bg-white rounded-xl p-4 shadow-card border border-gray-100 flex gap-3.5"
          >
            <div className="w-14 h-14 rounded-xl bg-brand-50 flex items-center justify-center text-3xl shrink-0">
              {b.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900">{b.title}</p>
              <p className="text-xs text-gray-500">{b.author}</p>
              <span className="inline-block mt-1.5 text-[11px] font-semibold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                {b.topic}
              </span>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                {b.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      <BottomNav />
    </div>
  );
}
