import { useState } from "react";
import { useApp } from "../../store/AppContext";

const stageLabels: Record<string, string> = {
  "2mo": "חודשיים לפני",
  "1mo": "חודש לפני",
  week: "שבוע הנסיעה",
  afterWeek: "אחרי החזרה",
};

export default function AdminContent() {
  const { state, updateTaskTemplateContent } = useApp();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftDesc, setDraftDesc] = useState("");

  const startEdit = (id: string) => {
    const content = state.taskTemplateContent.find((c) => c.id === id);
    if (!content) return;
    setEditingId(id);
    setDraftTitle(content.title);
    setDraftDesc(content.description);
  };

  const save = () => {
    if (!editingId) return;
    const existing = state.taskTemplateContent.find(
      (c) => c.id === editingId
    );
    if (!existing) return;
    updateTaskTemplateContent({
      ...existing,
      title: draftTitle,
      description: draftDesc,
    });
    setEditingId(null);
  };

  const templates = [...state.taskTemplateContent].sort(
    (a, b) => a.offsetDays - b.offsetDays
  );

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-1">
        ניהול תוכן - צ&apos;ק-ליסט ברירת מחדל
      </h1>
      <p className="text-sm text-gray-500 mb-4">
        עריכת כותרות והסברים של המשימות שנוצרות אוטומטית לכל משתמש חדש
        (שינויים חלים על משתמשים חדשים בלבד).
      </p>

      {templates.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
          טוען תבניות...
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {templates.map((tpl) => {
            const isEditing = editingId === tpl.id;
            return (
              <div
                key={tpl.id}
                className="bg-white rounded-xl border border-gray-200 p-3.5"
              >
                {isEditing ? (
                  <div className="flex flex-col gap-2">
                    <input
                      value={draftTitle}
                      onChange={(e) => setDraftTitle(e.target.value)}
                      className="p-2.5 rounded-lg border border-gray-200 text-sm font-semibold"
                    />
                    <textarea
                      value={draftDesc}
                      onChange={(e) => setDraftDesc(e.target.value)}
                      rows={3}
                      className="p-2.5 rounded-lg border border-gray-200 text-sm resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={save}
                        className="px-4 py-1.5 rounded-lg bg-brand-500 text-white text-xs font-semibold"
                      >
                        שמירה
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-4 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-semibold"
                      >
                        ביטול
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-800">
                        {tpl.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        {tpl.description}
                      </p>
                      <span className="inline-block mt-2 text-[10px] font-semibold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                        {stageLabels[tpl.stage]}
                      </span>
                    </div>
                    <button
                      onClick={() => startEdit(tpl.id)}
                      className="shrink-0 text-xs font-semibold text-brand-600 px-3 py-1.5 border border-brand-200 rounded-lg"
                    >
                      עריכה
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
