import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useApp } from "../store/AppContext";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import ProviderCard from "../components/ProviderCard";
import { providerCategoryLabels } from "../data/providers";
import type { Lead, Provider, ProviderCategory } from "../types";
import { formatDateHe } from "../utils/dateUtils";

export default function MarketplaceCategory() {
  const { category } = useParams<{ category: ProviderCategory }>();
  const navigate = useNavigate();
  const { state, requestLead, updateLeadStatus } = useApp();
  const [quoteProvider, setQuoteProvider] = useState<Provider | null>(null);
  const [sent, setSent] = useState(false);
  const [manageLead, setManageLead] = useState<{
    provider: Provider;
    lead: Lead;
  } | null>(null);
  const [closePrice, setClosePrice] = useState("");

  if (!category || !providerCategoryLabels[category]) {
    navigate("/marketplace");
    return null;
  }

  const info = providerCategoryLabels[category];
  const list = state.providers.filter((p) => p.category === category);

  const findLead = (providerId: string) =>
    state.leads.find(
      (l) => l.providerId === providerId && l.status !== "closed"
    ) ?? state.leads.find((l) => l.providerId === providerId);

  const confirmRequest = () => {
    if (!quoteProvider) return;
    requestLead(quoteProvider.id, category);
    setSent(true);
  };

  return (
    <div className="app-shell">
      <Header
        title={`${info.emoji} ${info.label}`}
        onBack={() => navigate("/marketplace")}
      />

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        {list.map((p) => (
          <ProviderCard
            key={p.id}
            provider={p}
            lead={findLead(p.id)}
            onRequestQuote={setQuoteProvider}
            onManageLead={(provider, lead) => {
              setManageLead({ provider, lead });
              setClosePrice(String(provider.avgPrice));
            }}
          />
        ))}
      </div>

      {quoteProvider && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
          onClick={() => {
            setQuoteProvider(null);
            setSent(false);
          }}
        >
          <div
            className="w-full max-w-[480px] bg-white rounded-t-2xl p-5 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1.5 bg-gray-200 rounded-full mx-auto mb-4" />
            {!sent ? (
              <>
                <h2 className="text-lg font-bold text-gray-900 mb-1">
                  בקשת הצעת מחיר מ־{quoteProvider.name}
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                  נשלח לספק את הפרטים הבאים שכבר מילאתם:
                </p>
                <div className="bg-gray-50 rounded-xl p-3.5 flex flex-col gap-1.5 text-sm mb-5">
                  <div className="flex justify-between">
                    <span className="text-gray-500">תאריך מעבר</span>
                    <span className="font-semibold text-gray-800">
                      {state.user.moveDate
                        ? formatDateHe(state.user.moveDate)
                        : "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">מסלול</span>
                    <span className="font-semibold text-gray-800">
                      {state.user.fromCity} ← {state.user.toCity}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">גודל דירה</span>
                    <span className="font-semibold text-gray-800">
                      {state.user.apartmentSize}
                    </span>
                  </div>
                </div>
                <button
                  onClick={confirmRequest}
                  className="w-full py-3.5 rounded-xl font-semibold bg-brand-500 text-white"
                >
                  שלח בקשה לספק 📲
                </button>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="text-4xl mb-2">✅</div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">
                  הבקשה נשלחה!
                </h2>
                <p className="text-sm text-gray-500 mb-5">
                  {quoteProvider.name} יצור איתכם קשר בקרוב. תוכלו לעקוב אחר
                  הסטטוס במרקטפלייס.
                </p>
                <button
                  onClick={() => {
                    setQuoteProvider(null);
                    setSent(false);
                  }}
                  className="w-full py-3.5 rounded-xl font-semibold bg-gray-100 text-gray-700"
                >
                  סגירה
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {manageLead && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
          onClick={() => setManageLead(null)}
        >
          <div
            className="w-full max-w-[480px] bg-white rounded-t-2xl p-5 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1.5 bg-gray-200 rounded-full mx-auto mb-4" />
            <h2 className="text-lg font-bold text-gray-900 mb-1">
              עדכון סטטוס פנייה - {manageLead.provider.name}
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              עדכנו את הסטטוס בהתאם למצב הפנייה שלכם מול הספק.
            </p>
            <div className="flex flex-col gap-2.5 mb-4">
              <button
                onClick={() => {
                  updateLeadStatus(manageLead.lead.id, "contacted");
                  setManageLead(null);
                }}
                className="w-full py-3 rounded-xl font-semibold bg-amber-50 text-amber-600"
              >
                הספק יצר קשר
              </button>
            </div>
            <div className="border-t border-gray-100 pt-4">
              <p className="text-sm font-semibold text-gray-700 mb-2">
                סגרתם עסקה? הזינו את המחיר הסופי
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={closePrice}
                  onChange={(e) => setClosePrice(e.target.value)}
                  className="flex-1 p-3 rounded-xl border border-gray-200 focus:border-brand-500 focus:outline-none"
                />
                <button
                  onClick={() => {
                    const price = Number(closePrice);
                    if (!Number.isNaN(price) && price >= 0) {
                      updateLeadStatus(manageLead.lead.id, "closed", price);
                    }
                    setManageLead(null);
                  }}
                  className="px-4 py-3 rounded-xl bg-green-600 text-white font-semibold"
                >
                  סגירה ✓
                </button>
              </div>
              <p className="text-[11px] text-gray-400 mt-2">
                הסכום יעודכן אוטומטית במחשבון התקציב.
              </p>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
