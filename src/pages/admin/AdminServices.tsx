import { useEffect, useState } from "react";
import { formatShekels, getPackage, serviceAddons } from "../../data/servicePackages";
import {
  createPlanFromPackage,
  fetchAllRequests,
  fetchServiceItems,
  findProfileIdByEmail,
  serviceItemStatusLabels,
  serviceStatusLabels,
  updateServiceItem,
  updateServiceRequest,
} from "../../lib/serviceApi";
import { formatDateHe } from "../../utils/dateUtils";
import type {
  ServiceItem,
  ServiceItemStatus,
  ServiceRequest,
  ServiceRequestStatus,
} from "../../types";

// הערכת רווח גולמי אחרי תשלום לקבלני המשנה - לעדכון לפי הנתונים בפועל
const ESTIMATED_GROSS_MARGIN = 0.3;

const statusOrder = Object.keys(serviceStatusLabels) as ServiceRequestStatus[];
const itemStatuses = Object.keys(serviceItemStatusLabels) as ServiceItemStatus[];
const bookedStatuses: ServiceRequestStatus[] = ["booked", "in_progress", "completed"];

function customerWhatsapp(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const intl = digits.startsWith("0") ? `972${digits.slice(1)}` : digits;
  return `https://wa.me/${intl}`;
}

export default function AdminServices() {
  const [requests, setRequests] = useState<ServiceRequest[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ServiceRequestStatus | "all">("all");
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchAllRequests().then((res) => {
      if (cancelled) return;
      setRequests(res.requests);
      setError(res.error);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const rows = requests ?? [];
  const visible = filter === "all" ? rows : rows.filter((r) => r.status === filter);
  const booked = rows.filter((r) => bookedStatuses.includes(r.status));
  const bookedRevenue = booked.reduce((sum, r) => sum + (r.finalPrice ?? r.quotedPrice), 0);
  const pipeline = rows
    .filter((r) => r.status === "new" || r.status === "contacted")
    .reduce((sum, r) => sum + r.quotedPrice, 0);

  const patchLocal = (id: string, patch: Partial<ServiceRequest>) =>
    setRequests((list) => list?.map((r) => (r.id === id ? { ...r, ...patch } : r)) ?? null);

  const kpis = [
    { label: "בקשות חדשות", value: String(rows.filter((r) => r.status === "new").length), className: "text-blue-600" },
    { label: "בצנרת (הערכה)", value: formatShekels(pipeline), className: "text-gray-900" },
    { label: "הזמנות סגורות", value: formatShekels(bookedRevenue), className: "text-brand-600" },
    {
      label: `רווח גולמי משוער (${ESTIMATED_GROSS_MARGIN * 100}%)`,
      value: formatShekels(bookedRevenue * ESTIMATED_GROSS_MARGIN),
      className: "text-green-600",
    },
  ];

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-4">הזמנות שירות מלא</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {kpis.map((k) => (
          <div key={k.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className={`text-xl font-extrabold ${k.className}`}>{k.value}</p>
            <p className="text-xs text-gray-500 mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4">
        {(["all", ...statusOrder] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border ${
              filter === s ? "bg-brand-500 text-white border-brand-500" : "bg-white text-gray-600 border-gray-200"
            }`}
          >
            {s === "all" ? `הכול (${rows.length})` : serviceStatusLabels[s].label}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm rounded-xl p-4 mb-4">
          שגיאה בטעינת הזמנות: {error}
        </div>
      )}

      {!requests && !error ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
          טוען הזמנות...
        </div>
      ) : visible.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
          אין הזמנות להצגה
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {visible.map((r) => (
            <RequestCard
              key={r.id}
              request={r}
              open={openId === r.id}
              onToggle={() => setOpenId(openId === r.id ? null : r.id)}
              onChange={(patch) => patchLocal(r.id, patch)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RequestCard({
  request: r,
  open,
  onToggle,
  onChange,
}: {
  request: ServiceRequest;
  open: boolean;
  onToggle: () => void;
  onChange: (patch: Partial<ServiceRequest>) => void;
}) {
  const pkg = getPackage(r.packageId);
  const status = serviceStatusLabels[r.status];
  const [finalPrice, setFinalPrice] = useState(r.finalPrice?.toString() ?? "");
  const [notes, setNotes] = useState(r.notes);
  const [items, setItems] = useState<ServiceItem[] | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open || items) return;
    let cancelled = false;
    fetchServiceItems(r.id).then((res) => {
      if (!cancelled) setItems(res);
    });
    return () => {
      cancelled = true;
    };
  }, [open, items, r.id]);

  const report = (err: string | null, ok: string) => setMessage(err ? `שגיאה: ${err}` : ok);

  const saveStatus = async (next: ServiceRequestStatus) => {
    onChange({ status: next });
    report(await updateServiceRequest(r.id, { status: next }), "הסטטוס עודכן");
  };

  const saveDetails = async () => {
    const parsed = finalPrice.trim() === "" ? null : Number(finalPrice);
    if (parsed !== null && Number.isNaN(parsed)) {
      setMessage("מחיר לא תקין");
      return;
    }
    onChange({ finalPrice: parsed, notes });
    report(await updateServiceRequest(r.id, { finalPrice: parsed, notes }), "נשמר");
  };

  const linkUser = async () => {
    const userId = await findProfileIdByEmail(r.email);
    if (!userId) {
      setMessage("לא נמצא משתמש רשום עם האימייל הזה");
      return;
    }
    onChange({ userId });
    report(await updateServiceRequest(r.id, { userId }), "ההזמנה שויכה לחשבון הלקוח");
  };

  const createPlan = async () => {
    const res = await createPlanFromPackage(r);
    setItems(res.items);
    report(res.error, "תוכנית המעבר נוצרה");
  };

  const saveItem = async (id: string, patch: Partial<ServiceItem>) => {
    setItems((list) => list?.map((i) => (i.id === id ? { ...i, ...patch } : i)) ?? null);
    const err = await updateServiceItem(id, {
      status: patch.status,
      vendorName: patch.vendorName,
      scheduledDate: patch.scheduledDate,
    });
    if (err) setMessage(`שגיאה: ${err}`);
  };

  const addonLabels = r.addons
    .map((id) => serviceAddons.find((a) => a.id === id)?.label ?? id)
    .join(", ");

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <button onClick={onToggle} className="w-full text-right p-4 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate">
            {r.name} · חבילת {pkg?.name ?? r.packageId}
          </p>
          <p className="text-xs text-gray-500 truncate">
            {[r.fromCity && r.toCity ? `${r.fromCity} ← ${r.toCity}` : null,
              r.moveDate ? formatDateHe(r.moveDate) : null,
              `נשלח ${formatDateHe(r.createdAt)}`]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <span className="font-bold text-gray-800 text-sm">
          {formatShekels(r.finalPrice ?? r.quotedPrice)}
        </span>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${status.className}`}>
          {status.label}
        </span>
      </button>

      {open && (
        <div className="border-t border-gray-100 p-4 flex flex-col gap-4 text-sm">
          <div className="flex flex-wrap gap-2">
            <a href={`tel:${r.phone}`} className="px-3 py-1.5 rounded-full border border-gray-200 font-semibold text-gray-700">
              📞 {r.phone}
            </a>
            <a
              href={customerWhatsapp(r.phone)}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-full bg-green-50 text-green-700 font-semibold"
            >
              💬 וואטסאפ
            </a>
            {r.email && (
              <a href={`mailto:${r.email}`} className="px-3 py-1.5 rounded-full border border-gray-200 text-gray-700" dir="ltr">
                {r.email}
              </a>
            )}
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-gray-600">
            <span>גודל דירה: {r.apartmentSize}</span>
            <span>הערכה: {formatShekels(r.quotedPrice)}</span>
            <span className="col-span-2">תוספות: {addonLabels || "ללא"}</span>
            <span className="col-span-2">
              חשבון באפליקציה:{" "}
              {r.userId ? (
                <span className="text-green-600 font-semibold">מחובר</span>
              ) : r.email ? (
                <button onClick={linkUser} className="text-brand-600 font-semibold">
                  שייך לפי אימייל
                </button>
              ) : (
                "אין (נשלח בלי אימייל)"
              )}
            </span>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-gray-500">סטטוס</span>
              <select
                value={r.status}
                onChange={(e) => saveStatus(e.target.value as ServiceRequestStatus)}
                className="p-2.5 rounded-lg border border-gray-200 bg-white"
              >
                {statusOrder.map((s) => (
                  <option key={s} value={s}>
                    {serviceStatusLabels[s].label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-gray-500">מחיר סופי (₪)</span>
              <input
                type="number"
                min={0}
                value={finalPrice}
                onChange={(e) => setFinalPrice(e.target.value)}
                placeholder={String(r.quotedPrice)}
                className="p-2.5 rounded-lg border border-gray-200"
              />
            </label>
            <label className="flex flex-col gap-1 sm:col-span-3">
              <span className="text-xs font-semibold text-gray-500">הערות פנימיות</span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="p-2.5 rounded-lg border border-gray-200"
              />
            </label>
          </div>
          <button
            onClick={saveDetails}
            className="self-start px-4 py-2 rounded-lg bg-brand-500 text-white font-semibold"
          >
            שמירת מחיר והערות
          </button>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-gray-800">תוכנית המעבר</p>
              {items && items.length === 0 && (
                <button
                  onClick={createPlan}
                  className="px-3 py-1.5 rounded-lg bg-accent-500 text-white text-xs font-semibold"
                >
                  יצירת תוכנית מהחבילה
                </button>
              )}
            </div>
            {!items ? (
              <p className="text-gray-400">טוען...</p>
            ) : items.length === 0 ? (
              <p className="text-gray-400">
                עדיין אין תוכנית. אחרי סגירת ההזמנה, צרו אותה כדי שהלקוח יראה אותה באפליקציה.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px]">
                  <thead className="text-gray-500 text-xs">
                    <tr>
                      <th className="text-right font-semibold py-2">שירות</th>
                      <th className="text-right font-semibold py-2">תאריך</th>
                      <th className="text-right font-semibold py-2">ספק</th>
                      <th className="text-right font-semibold py-2">סטטוס</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className="border-t border-gray-100">
                        <td className="py-2 pl-2">
                          {item.emoji} {item.label}
                        </td>
                        <td className="py-2 pl-2">
                          <input
                            type="date"
                            defaultValue={item.scheduledDate ?? ""}
                            onBlur={(e) => {
                              const v = e.target.value || null;
                              if (v !== item.scheduledDate) saveItem(item.id, { scheduledDate: v });
                            }}
                            className="p-1.5 rounded border border-gray-200"
                          />
                        </td>
                        <td className="py-2 pl-2">
                          <input
                            defaultValue={item.vendorName}
                            placeholder="שם הספק"
                            onBlur={(e) => {
                              const v = e.target.value.trim();
                              if (v !== item.vendorName) saveItem(item.id, { vendorName: v });
                            }}
                            className="p-1.5 rounded border border-gray-200 w-full"
                          />
                        </td>
                        <td className="py-2">
                          <select
                            value={item.status}
                            onChange={(e) =>
                              saveItem(item.id, { status: e.target.value as ServiceItemStatus })
                            }
                            className="p-1.5 rounded border border-gray-200 bg-white"
                          >
                            {itemStatuses.map((s) => (
                              <option key={s} value={s}>
                                {serviceItemStatusLabels[s]}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {message && <p className="text-xs text-gray-500">{message}</p>}
        </div>
      )}
    </div>
  );
}
