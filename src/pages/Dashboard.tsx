import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../store/AppContext";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import Countdown from "../components/Countdown";
import ProgressBar from "../components/ProgressBar";
import TaskCard from "../components/TaskCard";
import TaskModal from "../components/TaskModal";
import { daysUntil } from "../utils/dateUtils";
import type { TaskItem } from "../types";

export default function Dashboard() {
  const { state, toggleTask, deleteTask } = useApp();
  const navigate = useNavigate();
  const [openTask, setOpenTask] = useState<TaskItem | null>(null);

  const days = state.user.moveDate ? daysUntil(state.user.moveDate) : 0;

  const { doneCount, totalCount, percent } = useMemo(() => {
    const total = state.tasks.length;
    const done = state.tasks.filter((t) => t.done).length;
    return {
      doneCount: done,
      totalCount: total,
      percent: total ? Math.round((done / total) * 100) : 0,
    };
  }, [state.tasks]);

  const upcomingTasks = useMemo(() => {
    return state.tasks
      .filter((t) => !t.done)
      .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""))
      .slice(0, 3);
  }, [state.tasks]);

  return (
    <div className="app-shell">
      <Header
        title={`שלום, ${state.user.name || "משתמש/ת"} 👋`}
        subtitle={`${state.user.fromCity} ← ${state.user.toCity}`}
      />

      <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-5">
        <Countdown days={days} />

        <div className="bg-white rounded-2xl p-4 shadow-card border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <p className="font-semibold text-gray-800">התקדמות המשימות</p>
            <span className="text-sm font-bold text-brand-600">
              {percent}% Done
            </span>
          </div>
          <ProgressBar percent={percent} />
          <p className="text-xs text-gray-400 mt-2">
            {doneCount} מתוך {totalCount} משימות הושלמו
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900">
              התחנה הבאה בשבוע הקרוב
            </h2>
            <button
              onClick={() => navigate("/checklist")}
              className="text-xs font-semibold text-brand-600"
            >
              לכל המשימות
            </button>
          </div>
          {upcomingTasks.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-6 text-center text-gray-400 text-sm">
              כל הכבוד! השלמתם את כל המשימות 🎉
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {upcomingTasks.map((t) => (
                <TaskCard
                  key={t.id}
                  task={t}
                  onToggle={toggleTask}
                  onOpen={setOpenTask}
                />
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate("/package")}
            className="bg-white rounded-2xl p-4 shadow-card border border-gray-100 text-right"
          >
            <div className="text-2xl mb-1">🧩</div>
            <p className="font-semibold text-gray-900 text-sm">
              הרכיבו חבילת שירותים
            </p>
          </button>
          <button
            onClick={() => navigate("/books")}
            className="bg-white rounded-2xl p-4 shadow-card border border-gray-100 text-right"
          >
            <div className="text-2xl mb-1">📚</div>
            <p className="font-semibold text-gray-900 text-sm">
              ספרים ומדריכים מומלצים
            </p>
          </button>
        </div>
      </div>

      {openTask && (
        <TaskModal
          task={openTask}
          onClose={() => setOpenTask(null)}
          onToggle={toggleTask}
          onDelete={deleteTask}
        />
      )}

      <BottomNav />
    </div>
  );
}
