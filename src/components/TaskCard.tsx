import type { TaskItem } from "../types";
import { formatDateHe } from "../utils/dateUtils";

interface TaskCardProps {
  task: TaskItem;
  onToggle: (id: string) => void;
  onOpen: (task: TaskItem) => void;
}

export default function TaskCard({ task, onToggle, onOpen }: TaskCardProps) {
  return (
    <div
      className={`flex items-start gap-3 rounded-xl border p-3.5 shadow-card transition-colors ${
        task.done
          ? "bg-gray-50 border-gray-100"
          : "bg-white border-gray-100"
      }`}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle(task.id);
        }}
        aria-label="סמן כבוצע"
        className={`mt-0.5 w-6 h-6 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors ${
          task.done
            ? "bg-brand-500 border-brand-500 text-white"
            : "border-gray-300 text-transparent"
        }`}
      >
        ✓
      </button>
      <button
        onClick={() => onOpen(task)}
        className="flex-1 text-right min-w-0"
      >
        <p
          className={`font-semibold text-[15px] truncate ${
            task.done ? "text-gray-400 line-through" : "text-gray-900"
          }`}
        >
          {task.title}
        </p>
        {task.dueDate && (
          <p className="text-xs text-gray-400 mt-0.5">
            {formatDateHe(task.dueDate)}
          </p>
        )}
      </button>
      {task.linkedProviderCategory && !task.done && (
        <span className="text-[10px] shrink-0 mt-1 bg-accent-500/10 text-accent-600 px-2 py-1 rounded-full font-medium">
          ספק
        </span>
      )}
    </div>
  );
}
