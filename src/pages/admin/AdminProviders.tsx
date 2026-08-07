import { useState } from "react";
import { useApp } from "../../store/AppContext";
import { providerCategoryLabels } from "../../data/providers";
import type { Provider, ProviderCategory } from "../../types";

const emptyForm = {
  name: "",
  category: "flights" as ProviderCategory,
  rating: 4.5,
  priceTag: "$$" as Provider["priceTag"],
  avgPrice: 500,
  dealTag: "",
  description: "",
  phone: "",
  logoEmoji: "🏢",
};

export default function AdminProviders() {
  const { state, addProvider, updateProvider, deleteProvider } = useApp();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const startEdit = (p: Provider) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      category: p.category,
      rating: p.rating,
      priceTag: p.priceTag,
      avgPrice: p.avgPrice,
      dealTag: p.dealTag ?? "",
      description: p.description,
      phone: p.phone,
      logoEmoji: p.logoEmoji,
    });
    setShowForm(true);
  };

  const startNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const save = () => {
    if (!form.name.trim()) return;
    const payload = {
      ...form,
      dealTag: form.dealTag.trim() || undefined,
    };
    if (editingId) {
      updateProvider(editingId, payload);
    } else {
      addProvider(payload);
    }
    setShowForm(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">ניהול ספקים</h1>
        <button
          onClick={startNew}
          className="text-sm font-semibold bg-brand-500 text-white px-4 py-2 rounded-lg"
        >
          + ספק חדש
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-5">
          <h2 className="font-bold text-gray-800 mb-3">
            {editingId ? "עריכת ספק" : "הוספת ספק חדש"}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="שם העסק"
              className="p-2.5 rounded-lg border border-gray-200 text-sm"
            />
            <select
              value={form.category}
              onChange={(e) =>
                setForm({
                  ...form,
                  category: e.target.value as ProviderCategory,
                })
              }
              className="p-2.5 rounded-lg border border-gray-200 text-sm"
            >
              {(
                Object.keys(providerCategoryLabels) as ProviderCategory[]
              ).map((c) => (
                <option key={c} value={c}>
                  {providerCategoryLabels[c].label}
                </option>
              ))}
            </select>
            <input
              type="number"
              step="0.1"
              min="1"
              max="5"
              value={form.rating}
              onChange={(e) =>
                setForm({ ...form, rating: Number(e.target.value) })
              }
              placeholder="דירוג (1-5)"
              className="p-2.5 rounded-lg border border-gray-200 text-sm"
            />
            <select
              value={form.priceTag}
              onChange={(e) =>
                setForm({
                  ...form,
                  priceTag: e.target.value as Provider["priceTag"],
                })
              }
              className="p-2.5 rounded-lg border border-gray-200 text-sm"
            >
              <option value="$">$</option>
              <option value="$$">$$</option>
              <option value="$$$">$$$</option>
            </select>
            <input
              type="number"
              value={form.avgPrice}
              onChange={(e) =>
                setForm({ ...form, avgPrice: Number(e.target.value) })
              }
              placeholder="מחיר ממוצע (₪)"
              className="p-2.5 rounded-lg border border-gray-200 text-sm"
            />
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="טלפון"
              className="p-2.5 rounded-lg border border-gray-200 text-sm"
            />
            <input
              value={form.logoEmoji}
              onChange={(e) =>
                setForm({ ...form, logoEmoji: e.target.value })
              }
              placeholder="אימוג'י לוגו"
              className="p-2.5 rounded-lg border border-gray-200 text-sm"
            />
            <input
              value={form.dealTag}
              onChange={(e) => setForm({ ...form, dealTag: e.target.value })}
              placeholder="תג דיל (אופציונלי)"
              className="p-2.5 rounded-lg border border-gray-200 text-sm"
            />
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="תיאור"
              rows={2}
              className="p-2.5 rounded-lg border border-gray-200 text-sm col-span-2"
            />
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={save}
              className="px-4 py-2 rounded-lg bg-brand-500 text-white text-sm font-semibold"
            >
              שמירה
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-lg bg-gray-100 text-gray-600 text-sm font-semibold"
            >
              ביטול
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {state.providers.map((p) => (
          <div
            key={p.id}
            className="bg-white rounded-xl border border-gray-200 p-3.5 flex items-center gap-3"
          >
            <span className="text-2xl">{p.logoEmoji}</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-800 truncate">
                {p.name}{" "}
                <span className="text-xs text-gray-400 font-normal">
                  · {providerCategoryLabels[p.category].label}
                </span>
              </p>
              <p className="text-xs text-gray-500">
                ★ {p.rating} · {p.priceTag} · ₪{p.avgPrice}
                {p.dealTag ? ` · 🎁 ${p.dealTag}` : ""}
              </p>
            </div>
            <button
              onClick={() => startEdit(p)}
              className="text-xs font-semibold text-brand-600 px-3 py-1.5 border border-brand-200 rounded-lg"
            >
              עריכה
            </button>
            <button
              onClick={() => deleteProvider(p.id)}
              className="text-xs font-semibold text-red-600 px-3 py-1.5 border border-red-200 rounded-lg"
            >
              מחיקה
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
