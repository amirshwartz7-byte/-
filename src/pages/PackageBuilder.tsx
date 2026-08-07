import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../store/AppContext";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import ProviderCard from "../components/ProviderCard";
import { providerCategoryLabels } from "../data/providers";
import type { Provider, ProviderCategory } from "../types";

const categories = Object.keys(providerCategoryLabels) as ProviderCategory[];

export default function PackageBuilder() {
  const navigate = useNavigate();
  const { state, setPackageSelection, clearPackageSelection } = useApp();
  const [confirmed, setConfirmed] = useState(false);

  const selectedProviders = useMemo(() => {
    return categories
      .map((cat) => {
        const providerId = state.packageSelections[cat];
        if (!providerId) return null;
        const provider = state.providers.find((p) => p.id === providerId);
        return provider ? { category: cat, provider } : null;
      })
      .filter(Boolean) as { category: ProviderCategory; provider: Provider }[];
  }, [state.packageSelections, state.providers]);

  const total = selectedProviders.reduce(
    (sum, s) => sum + s.provider.avgPrice,
    0
  );

  const handleToggleSelect = (
    category: ProviderCategory,
    providerId: string
  ) => {
    if (state.packageSelections[category] === providerId) {
      clearPackageSelection(category);
    } else {
      setPackageSelection(category, providerId);
    }
  };

  return (
    <div className="app-shell">
      <Header
        title="בניית חבילת החופשה"
        subtitle="בחרו ספק אחד מכל קטגוריה: טיסה, לינה, שיעורים וציוד"
        onBack={() => navigate("/marketplace")}
      />

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-6 pb-28">
        {categories.map((cat) => {
          const info = providerCategoryLabels[cat];
          const list = state.providers.filter((p) => p.category === cat);
          return (
            <div key={cat}>
              <h2 className="font-bold text-gray-900 mb-2.5 flex items-center gap-2">
                <span>{info.emoji}</span> {info.label}
              </h2>
              <div className="flex flex-col gap-2.5">
                {list.map((p) => (
                  <ProviderCard
                    key={p.id}
                    provider={p}
                    onRequestQuote={() => {}}
                    selectMode
                    selected={state.packageSelections[cat] === p.id}
                    onSelect={() => handleToggleSelect(cat, p.id)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="fixed bottom-16 left-1/2 -translate-x-1/2 max-w-[480px] w-full px-4">
        <div className="bg-white rounded-2xl shadow-floating border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">
              {selectedProviders.length} ספקים נבחרו
            </span>
            <span className="font-bold text-gray-900">
              הערכת עלות: ₪{total.toLocaleString()}
            </span>
          </div>
          <button
            disabled={selectedProviders.length === 0}
            onClick={() => setConfirmed(true)}
            className="w-full py-3.5 rounded-xl font-semibold bg-brand-500 text-white disabled:opacity-30"
          >
            שליחת בקשות לכל הספקים שנבחרו
          </button>
        </div>
      </div>

      {confirmed && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
          onClick={() => setConfirmed(false)}
        >
          <div
            className="w-full max-w-[480px] bg-white rounded-t-2xl p-5 pb-8 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-4xl mb-2">🎉</div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">
              החבילה נשלחה בהצלחה!
            </h2>
            <p className="text-sm text-gray-500 mb-5">
              כל הספקים שבחרתם קיבלו בקשה ליצירת קשר. ניתן לעקוב אחר הסטטוס
              בעמוד המרקטפלייס, וההוצאות המוערכות עודכנו במחשבון התקציב.
            </p>
            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => navigate("/budget")}
                className="w-full py-3.5 rounded-xl font-semibold bg-brand-500 text-white"
              >
                למחשבון התקציב
              </button>
              <button
                onClick={() => navigate("/marketplace")}
                className="w-full py-3.5 rounded-xl font-semibold bg-gray-100 text-gray-700"
              >
                חזרה למרקטפלייס
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
