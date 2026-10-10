import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../store/AppContext";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import ProgressBar from "../components/ProgressBar";
import { formatShekels, getPackage, whatsappLink } from "../data/servicePackages";
import {
  fetchMyLatestRequest,
  serviceItemStatusLabels,
  serviceStatusLabels,
} from "../lib/serviceApi";
import { formatDateHe } from "../utils/dateUtils";
import type { ServiceItem, ServiceRequest, ServiceRequestStatus } from "../types";

const journey: { status: ServiceRequestStatus; label: string }[] = [
  { status: "new", label: "בקשה" },
  { status: "contacted", label: "תיאום" },
  { status: "booked", label: "הוזמן" },
  { status: "in_progress", label: "בביצוע" },
  { status: "completed", label: "הושלם" },
];

export default function MyMove() {
  const navigate = useNavigate();
  const { session } = useApp();
  const [data, setData] = useState<
    { request: ServiceRequest; items: ServiceItem[] } | null | undefined
  >(undefined);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    fetchMyLatestRequest(session.user.id).then((res) => {
      if (!cancelled) setData(res);
    });
    return () => {
      cancelled = true;
    };
  }, [session]);

  if (data === undefined) {
    return (
      <div className="app-shell">
        <Header title="המעבר שלי" />
        <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
          טוען...
        </div>
        <BottomNav />
      </div>
    );
  }

  if (data === null) {
    return (
      <div className="app-shell">
        <Header title="המעבר שלי" />
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6 gap-4">
          <div className="text-5xl">🚚</div>
          <h2 className="text-xl font-bold text-gray-900">
            רוצים שנעשה את כל המעבר בשבילכם?
          </h2>
          <p className="text-gray-500 leading-relaxed">
            מחיר אחד, מנהל מעבר צמוד, וכל הספקים מתואמים. אתם רק מקבלים מפתח.
          </p>
          <button
            onClick={() => navigate("/services")}
            className="w-full py-3.5 rounded-xl font-semibold bg-brand-500 text-white"
          >
            לחבילות ולהערכת מחיר
          </button>
          <p className="text-xs text-gray-400">
            כבר השארתם בקשה בלי להתחבר? נחבר אותה לחשבון שלכם אחרי שיחת התיאום.
          </p>
        </div>
        <BottomNav />
      </div>
    );
  }

  const { request, items } = data;
  const pkg = getPackage(request.packageId);
  const statusInfo = serviceStatusLabels[request.status];
  const journeyIndex = journey.findIndex((j) => j.status === request.status);
  const doneCount = items.filter((i) => i.status === "done").length;
  const percent = items.length ? Math.round((doneCount / items.length) * 100) : 0;
  const wa = whatsappLink(`היי, זה ${request.name}. יש לי שאלה לגבי המעבר שלי.`);

  return (
    <div className="app-shell">
      <Header
        title="המעבר שלי"
        subtitle={
          request.fromCity && request.toCity
            ? `${request.fromCity} ← ${request.toCity}`
            : undefined
        }
      />

      <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-5">
        <div className="bg-white rounded-2xl p-4 shadow-card border border-gray-100">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <p className="text-xs text-gray-400">חבילה</p>
              <p className="text-lg font-extrabold text-gray-900">{pkg?.name ?? request.packageId}</p>
              {request.moveDate && (
                <p className="text-sm text-gray-500">{formatDateHe(request.moveDate)}</p>
              )}
            </div>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusInfo.className}`}>
              {statusInfo.label}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm border-t border-gray-100 pt-3">
            <span className="text-gray-500">
              {request.finalPrice !== null ? "מחיר סופי" : "הערכת מחיר"}
            </span>
            <span className="font-bold text-gray-900">
              {formatShekels(request.finalPrice ?? request.quotedPrice)}
            </span>
          </div>
        </div>

        {request.status !== "cancelled" && (
          <div className="flex items-center justify-between px-1">
            {journey.map((j, i) => {
              const reached = i <= journeyIndex;
              return (
                <div key={j.status} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      reached ? "bg-brand-500 text-white" : "bg-gray-200 text-gray-400"
                    }`}
                  >
                    {i < journeyIndex ? "✓" : i + 1}
                  </div>
                  <span className={`text-[11px] ${reached ? "text-brand-600 font-semibold" : "text-gray-400"}`}>
                    {j.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {items.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center text-sm text-gray-500 leading-relaxed">
            תוכנית המעבר המפורטת תופיע כאן אחרי שיחת התיאום עם מנהל המעבר.
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-4 shadow-card border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-gray-800">תוכנית המעבר</p>
              <span className="text-sm font-bold text-brand-600">{percent}%</span>
            </div>
            <ProgressBar percent={percent} />
            <ul className="mt-4 flex flex-col">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-3 py-3 border-t border-gray-100 first:border-t-0"
                >
                  <span className="text-xl w-8 text-center">{item.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-semibold ${
                        item.status === "done" ? "text-gray-400 line-through" : "text-gray-800"
                      }`}
                    >
                      {item.label}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {[
                        item.scheduledDate ? formatDateHe(item.scheduledDate) : null,
                        item.vendorName || null,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "מועד ייקבע בקרוב"}
                    </p>
                  </div>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                      item.status === "done"
                        ? "bg-green-50 text-green-600"
                        : item.status === "scheduled"
                        ? "bg-brand-50 text-brand-600"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {serviceItemStatusLabels[item.status]}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {wa && (
          <a
            href={wa}
            target="_blank"
            rel="noreferrer"
            className="w-full py-3.5 rounded-xl font-semibold bg-green-500 text-white text-center"
          >
            💬 דברו עם מנהל המעבר
          </a>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
