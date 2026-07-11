import { useEffect, useState } from "react";
import { useApp } from "../../store/AppContext";
import { providerCategoryLabels } from "../../data/providers";
import { formatDateHe } from "../../utils/dateUtils";
import { supabase } from "../../lib/supabaseClient";
import type { Lead, LeadStatus, ProviderCategory } from "../../types";

const statusLabels: Record<string, { label: string; className: string }> = {
  sent: { label: "נשלח", className: "bg-blue-50 text-blue-600" },
  contacted: { label: "ספק יצר קשר", className: "bg-amber-50 text-amber-600" },
  closed: { label: "נסגר", className: "bg-green-50 text-green-600" },
};

interface LeadRow {
  id: string;
  provider_id: string;
  category: ProviderCategory;
  status: LeadStatus;
  created_at: string;
  closed_price: number | null;
}

export default function AdminLeads() {
  const { state } = useApp();
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;
    supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error: err }) => {
        if (cancelled) return;
        if (err) {
          setError(err.message);
          return;
        }
        setLeads(
          (data as LeadRow[]).map((row) => ({
            id: row.id,
            providerId: row.provider_id,
            category: row.category,
            status: row.status,
            createdAt: row.created_at,
            closedPrice: row.closed_price ?? undefined,
          }))
        );
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const rows = leads ?? [];
  const totalClosedRevenue = rows
    .filter((l) => l.status === "closed" && l.closedPrice)
    .reduce((sum, l) => sum + (l.closedPrice ?? 0), 0);
  const estimatedCommission = Math.round(totalClosedRevenue * 0.08);

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-4">מעקב לידים</h1>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-extrabold text-gray-900">
            {rows.length}
          </p>
          <p className="text-xs text-gray-500 mt-1">סה&quot;כ פניות</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-extrabold text-green-600">
            {rows.filter((l) => l.status === "closed").length}
          </p>
          <p className="text-xs text-gray-500 mt-1">עסקאות שנסגרו</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-extrabold text-brand-600">
            ₪{estimatedCommission.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-1">עמלה משוערת (8%)</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm rounded-xl p-4 mb-4">
          שגיאה בטעינת לידים: {error}
        </div>
      )}

      {!leads && !error ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
          טוען לידים...
        </div>
      ) : rows.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
          עדיין אין פניות רשומות במערכת
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="text-right font-semibold px-4 py-3">ספק</th>
                <th className="text-right font-semibold px-4 py-3">קטגוריה</th>
                <th className="text-right font-semibold px-4 py-3">תאריך</th>
                <th className="text-right font-semibold px-4 py-3">סטטוס</th>
                <th className="text-right font-semibold px-4 py-3">
                  מחיר סגירה
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((l) => {
                const provider = state.providers.find(
                  (p) => p.id === l.providerId
                );
                return (
                  <tr key={l.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 font-semibold text-gray-800">
                      {provider?.name ?? "ספק לא ידוע"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {providerCategoryLabels[l.category].label}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {formatDateHe(l.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          statusLabels[l.status].className
                        }`}
                      >
                        {statusLabels[l.status].label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {l.closedPrice
                        ? `₪${l.closedPrice.toLocaleString()}`
                        : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
