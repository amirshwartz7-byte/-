import { useNavigate } from "react-router-dom";
import { useApp } from "../store/AppContext";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import { providerCategoryLabels } from "../data/providers";
import type { ProviderCategory } from "../types";

export default function Marketplace() {
  const navigate = useNavigate();
  const { state } = useApp();

  const categories = Object.keys(
    providerCategoryLabels
  ) as ProviderCategory[];

  const leadCountFor = (cat: ProviderCategory) =>
    state.leads.filter((l) => l.category === cat).length;

  return (
    <div className="app-shell">
      <Header title="מרקטפלייס ספקים" subtitle="השוואת מחירים ודילים בלעדיים" />

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
        <button
          onClick={() => navigate("/package")}
          className="w-full rounded-2xl bg-gradient-to-l from-brand-600 to-brand-500 text-white p-4 flex items-center justify-between shadow-floating"
        >
          <div className="text-right">
            <p className="font-bold">🧩 הרכיבו חבילת שירותים משלכם</p>
            <p className="text-xs opacity-80 mt-1">
              בחרו ספק אחד מכל קטגוריה וקבלו הצעת מחיר כוללת
            </p>
          </div>
          <span className="text-2xl">←</span>
        </button>

        <div className="flex flex-col gap-3">
          {categories.map((cat) => {
            const info = providerCategoryLabels[cat];
            const count = state.providers.filter(
              (p) => p.category === cat
            ).length;
            const leads = leadCountFor(cat);
            return (
              <button
                key={cat}
                onClick={() => navigate(`/marketplace/${cat}`)}
                className="bg-white rounded-2xl p-4 shadow-card border border-gray-100 flex items-center gap-3.5 text-right"
              >
                <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center text-2xl shrink-0">
                  {info.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900">{info.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {info.description}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {count} ספקים זמינים
                    {leads > 0 && ` · ${leads} פניות שלחתם`}
                  </p>
                </div>
                <span className="text-gray-300 text-xl">←</span>
              </button>
            );
          })}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
