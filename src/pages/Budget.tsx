import { useMemo, useState } from "react";
import { useApp } from "../store/AppContext";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import DonutChart from "../components/DonutChart";

export default function Budget() {
  const { state, setTotalBudget, setCategoryPlanned } = useApp();
  const [editingTotal, setEditingTotal] = useState(false);
  const [totalInput, setTotalInput] = useState(
    String(state.budget.totalBudget || "")
  );

  const totalActual = useMemo(
    () => state.budget.categories.reduce((sum, c) => sum + c.actual, 0),
    [state.budget.categories]
  );
  const totalPlanned = useMemo(
    () => state.budget.categories.reduce((sum, c) => sum + c.planned, 0),
    [state.budget.categories]
  );
  const overBudget =
    state.budget.totalBudget > 0 && totalActual > state.budget.totalBudget;
  const chartTotal =
    state.budget.totalBudget > 0
      ? state.budget.totalBudget
      : Math.max(totalActual, totalPlanned, 1);

  const saveTotal = () => {
    const val = Number(totalInput);
    if (!Number.isNaN(val) && val >= 0) {
      setTotalBudget(val);
    }
    setEditingTotal(false);
  };

  return (
    <div className="app-shell">
      <Header title="מחשבון תקציב" subtitle="עקבו אחרי ההוצאות שלכם לחופשת הסקי" />

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-5 pb-8">
        <div className="bg-white rounded-2xl p-5 shadow-card border border-gray-100">
          <DonutChart
            used={totalActual}
            total={chartTotal}
            overBudget={overBudget}
          />
          <div className="text-center mt-3">
            <p
              className={`text-sm font-semibold ${
                overBudget ? "text-red-600" : "text-gray-600"
              }`}
            >
              ₪{totalActual.toLocaleString()} מתוך ₪
              {state.budget.totalBudget.toLocaleString()}
            </p>
            {overBudget && (
              <p className="text-xs text-red-500 mt-1">
                ⚠️ חרגתם מהתקציב שהגדרתם
              </p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-card border border-gray-100">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-gray-800">תקציב גג</p>
            {!editingTotal && (
              <button
                onClick={() => setEditingTotal(true)}
                className="text-xs font-semibold text-brand-600"
              >
                עריכה
              </button>
            )}
          </div>
          {editingTotal ? (
            <div className="flex items-center gap-2 mt-2">
              <input
                type="number"
                autoFocus
                value={totalInput}
                onChange={(e) => setTotalInput(e.target.value)}
                className="flex-1 p-3 rounded-xl border border-gray-200 focus:border-brand-500 focus:outline-none"
                placeholder="לדוגמה: 15000"
              />
              <button
                onClick={saveTotal}
                className="px-4 py-3 rounded-xl bg-brand-500 text-white font-semibold"
              >
                שמור
              </button>
            </div>
          ) : (
            <p className="text-2xl font-extrabold text-gray-900 mt-1">
              ₪{state.budget.totalBudget.toLocaleString()}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2.5">
          <p className="font-semibold text-gray-800 px-1">הוצאות לפי סעיף</p>
          {state.budget.categories.map((c) => {
            const catOver = c.planned > 0 && c.actual > c.planned;
            return (
              <div
                key={c.key}
                className="bg-white rounded-xl p-4 shadow-card border border-gray-100"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-gray-900">{c.label}</p>
                  <span
                    className={`text-sm font-bold ${
                      catOver ? "text-red-600" : "text-gray-700"
                    }`}
                  >
                    ₪{c.actual.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 shrink-0">
                    מתוכנן:
                  </span>
                  <input
                    type="number"
                    value={c.planned || ""}
                    onChange={(e) =>
                      setCategoryPlanned(c.key, Number(e.target.value) || 0)
                    }
                    placeholder="0"
                    className="w-full text-sm p-2 rounded-lg border border-gray-200 focus:border-brand-500 focus:outline-none"
                  />
                  <span className="text-xs text-gray-400">₪</span>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-[11px] text-gray-400 text-center leading-relaxed px-4">
          עלויות בפועל מתעדכנות אוטומטית כאשר אתם סוגרים דיל עם ספק
          במועדון. ניתן גם לעדכן את הסכום המתוכנן ידנית בכל סעיף.
        </p>
      </div>

      <BottomNav />
    </div>
  );
}
