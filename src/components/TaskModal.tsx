import { useNavigate } from "react-router-dom";
import type { TaskItem } from "../types";
import { formatDateHe } from "../utils/dateUtils";

interface TaskModalProps {
  task: TaskItem;
  onClose: () => void;
  onToggle: (id: string) => void;
  onDelete?: (id: string) => void;
}

export default function TaskModal({
  task,
  onClose,
  onToggle,
  onDelete,
}: TaskModalProps) {
  const navigate = useNavigate();

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[480px] bg-white rounded-t-2xl p-5 pb-8 max-h-[80vh] overflow-y-auto animate-[slideup_0.2s_ease]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1.5 bg-gray-200 rounded-full mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-1">{task.title}</h2>
        {task.dueDate && (
          <p className="text-sm text-brand-600 font-medium mb-3">
            תאריך יעד: {formatDateHe(task.dueDate)}
          </p>
        )}
        <p className="text-gray-600 leading-relaxed mb-6">
          {task.description}
        </p>

        <div className="flex flex-col gap-2.5">
          <button
            onClick={() => {
              onToggle(task.id);
              onClose();
            }}
            className={`w-full py-3 rounded-xl font-semibold ${
              task.done
                ? "bg-gray-100 text-gray-600"
                : "bg-brand-500 text-white"
            }`}
          >
            {task.done ? "סמן כלא בוצע" : "סמן כבוצע ✓"}
          </button>

          {task.linkedProviderCategory && (
            <button
              onClick={() =>
                navigate(`/marketplace/${task.linkedProviderCategory}`)
              }
              className="w-full py-3 rounded-xl font-semibold bg-accent-500 text-white"
            >
              מצא ספק מומלץ 🔎
            </button>
          )}

          {task.custom && onDelete && (
            <button
              onClick={() => {
                onDelete(task.id);
                onClose();
              }}
              className="w-full py-3 rounded-xl font-semibold text-red-600 border border-red-200"
            >
              מחק משימה
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
