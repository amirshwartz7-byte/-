import type { Lead, Provider } from "../types";

interface ProviderCardProps {
  provider: Provider;
  lead?: Lead;
  onRequestQuote: (provider: Provider) => void;
  selectMode?: boolean;
  selected?: boolean;
  onSelect?: (provider: Provider) => void;
  onManageLead?: (provider: Provider, lead: Lead) => void;
}

const statusLabels: Record<string, { label: string; className: string }> = {
  sent: { label: "נשלח", className: "bg-blue-50 text-blue-600" },
  contacted: { label: "ספק יצר קשר", className: "bg-amber-50 text-amber-600" },
  closed: { label: "נסגר", className: "bg-green-50 text-green-600" },
};

export default function ProviderCard({
  provider,
  lead,
  onRequestQuote,
  selectMode,
  selected,
  onSelect,
  onManageLead,
}: ProviderCardProps) {
  return (
    <div
      className={`rounded-xl border p-4 shadow-card bg-white ${
        selected ? "border-brand-500 ring-2 ring-brand-100" : "border-gray-100"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center text-2xl shrink-0">
          {provider.logoEmoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-bold text-gray-900 truncate">
              {provider.name}
            </h3>
            <span className="text-xs font-semibold text-gray-500 shrink-0">
              {provider.priceTag}
            </span>
          </div>
          <div className="flex items-center gap-1 text-amber-500 text-sm mt-0.5">
            {"★".repeat(Math.round(provider.rating))}
            <span className="text-gray-400 text-xs">
              {provider.rating.toFixed(1)}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
            {provider.description}
          </p>
          {provider.dealTag && (
            <span className="inline-block mt-2 text-[11px] font-semibold bg-accent-500/10 text-accent-600 px-2 py-1 rounded-full">
              🎁 {provider.dealTag}
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        {selectMode ? (
          <button
            onClick={() => onSelect?.(provider)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold ${
              selected
                ? "bg-brand-500 text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {selected ? "נבחר לחבילה ✓" : "בחר לחבילה"}
          </button>
        ) : lead ? (
          <button
            onClick={() => onManageLead?.(provider, lead)}
            disabled={!onManageLead || lead.status === "closed"}
            className={`flex-1 text-center py-2.5 rounded-lg text-sm font-semibold ${
              statusLabels[lead.status].className
            }`}
          >
            {statusLabels[lead.status].label}
            {onManageLead && lead.status !== "closed" ? " · עדכן" : ""}
          </button>
        ) : (
          <button
            onClick={() => onRequestQuote(provider)}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-brand-500 text-white"
          >
            בקש הצעת מחיר
          </button>
        )}
      </div>
    </div>
  );
}
