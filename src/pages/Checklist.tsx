import { useMemo, useState } from "react";
import { useApp } from "../store/AppContext";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import TaskCard from "../components/TaskCard";
import TaskModal from "../components/TaskModal";
import type { TaskItem, TaskStage } from "../types";

const stages: { key: TaskStage; label: string }[] = [
  { key: "2mo", label: "חודשיים לפני" },
  { key: "1mo", label: "חודש לפני" },
  { key: "week", label: "שבוע הנסיעה" },
  { key: "afterWeek", label: "אחרי החזרה" },
];

export default function Checklist() {
  const { state, toggleTask, deleteTask, addCustomTask } = useApp();
  const [activeStage, setActiveStage] = useState<TaskStage>("2mo");
  const [openTask, setOpenTask] = useState<TaskItem | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const tasksForStage = useMemo(() => {
    return state.tasks
      .filter((t) => t.stage === activeStage)
      .sort((a, b) => {
        if (a.done !== b.done) return a.done ? 1 : -1;
        return (a.dueDate ?? "").localeCompare(b.dueDate ?? "");
      });
  }, [state.tasks, activeStage]);

  const handleAddCustom = () => {
    if (!newTitle.trim()) return;
    addCustomTask({
      title: newTitle.trim(),
      description: newDesc.trim() || "משימה אישית שהוספתם.",
      stage: activeStage,
      offsetDays: 0,
      category: "general",
      dueDate: state.user.tripDate ?? undefined,
    });
    setNewTitle("");
    setNewDesc("");
    setShowAdd(false);
  };

  return (
    <div className="app-shell">
      <Header title="צ'ק-ליסט ההכנה" subtitle="כל המשימות לחופשת הסקי במקום אחד" />

      <div className="px-3 pt-3 flex gap-1.5 overflow-x-auto no-scrollbar">
        {stages.map((s) => (
          <button
            key={s.key}
            onClick={() => setActiveStage(s.key)}
            className={`px-3.5 py-2 rounded-full text-sm font-semibold whitespace-nowrap shrink-0 ${
              activeStage === s.key
                ? "bg-brand-500 text-white"
                : "bg-white text-gray-500 border border-gray-200"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 relative">
        {tasksForStage.length === 0 ? (
          <div className="text-center text-gray-400 text-sm mt-10">
            אין משימות בשלב הזה
          </div>
        ) : (
          <div className="flex flex-col gap-2.5 pb-20">
            {tasksForStage.map((t) => (
              <TaskCard
                key={t.id}
                task={t}
                onToggle={toggleTask}
                onOpen={setOpenTask}
              />
            ))}
          </div>
        )}

        <button
          onClick={() => setShowAdd(true)}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 max-w-[480px] w-full flex justify-end px-5 pointer-events-none"
        >
          <span className="pointer-events-auto w-14 h-14 rounded-full bg-accent-500 text-white text-2xl flex items-center justify-center shadow-floating">
            +
          </span>
        </button>
      </div>

      {showAdd && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
          onClick={() => setShowAdd(false)}
        >
          <div
            className="w-full max-w-[480px] bg-white rounded-t-2xl p-5 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1.5 bg-gray-200 rounded-full mx-auto mb-4" />
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              הוספת משימה אישית
            </h2>
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="כותרת המשימה"
              className="w-full p-3.5 rounded-xl border border-gray-200 mb-3 focus:border-brand-500 focus:outline-none"
            />
            <textarea
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="הערות (אופציונלי)"
              rows={3}
              className="w-full p-3.5 rounded-xl border border-gray-200 mb-4 focus:border-brand-500 focus:outline-none resize-none"
            />
            <button
              onClick={handleAddCustom}
              disabled={!newTitle.trim()}
              className="w-full py-3.5 rounded-xl font-semibold bg-brand-500 text-white disabled:opacity-30"
            >
              הוספה לשלב &quot;{stages.find((s) => s.key === activeStage)?.label}&quot;
            </button>
          </div>
        </div>
      )}

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
