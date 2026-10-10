import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../store/AppContext";
import { israeliCities } from "../data/cities";
import {
  apartmentSizeOptions,
  availableAddons,
  calculateQuote,
  formatShekels,
  getPackage,
  INTERCITY_SURCHARGE,
  servicePackages,
  whatsappLink,
  type ServicePackageId,
} from "../data/servicePackages";
import { submitServiceRequest } from "../lib/serviceApi";
import { todayISO } from "../utils/dateUtils";
import type { ApartmentSize } from "../types";
import { BRAND } from "../brand";
import Logo from "../components/Logo";

const howItWorks = [
  { emoji: "📝", title: "בוחרים חבילה", text: "מקבלים הערכת מחיר מיידית לפי גודל הדירה" },
  { emoji: "📞", title: "שיחת תיאום", text: "מנהל מעבר מתאם איתכם את כל הפרטים ומחיר סופי" },
  { emoji: "🔑", title: "אתם רק מקבלים מפתח", text: "אנחנו מתאמים את כל הספקים ומעדכנים באפליקציה" },
];

export default function Services() {
  const navigate = useNavigate();
  const { session, state } = useApp();
  const user = session ? state.user : null;

  const [packageId, setPackageId] = useState<ServicePackageId>("full");
  const [apartmentSize, setApartmentSize] = useState<ApartmentSize>(
    user?.apartmentSize ?? "3"
  );
  const [addonIds, setAddonIds] = useState<string[]>([]);
  const [fromCity, setFromCity] = useState(user?.fromCity ?? "");
  const [toCity, setToCity] = useState(user?.toCity ?? "");
  const [moveDate, setMoveDate] = useState(user?.moveDate ?? "");
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const intercity =
    fromCity.trim() !== "" &&
    toCity.trim() !== "" &&
    fromCity.trim() !== toCity.trim();

  const addons = useMemo(() => availableAddons(packageId), [packageId]);
  const selectedAddonIds = addonIds.filter((id) => addons.some((a) => a.id === id));
  const quote = calculateQuote({
    packageId,
    apartmentSize,
    addonIds: selectedAddonIds,
    intercity,
  });
  const pkg = getPackage(packageId);

  const toggleAddon = (id: string) =>
    setAddonIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  const phoneValid = phone.replace(/\D/g, "").length >= 9;
  const canSubmit = name.trim() !== "" && phoneValid && consent && !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    const err = await submitServiceRequest({
      userId: session?.user.id ?? null,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      fromCity: fromCity.trim(),
      toCity: toCity.trim(),
      moveDate: moveDate || null,
      apartmentSize,
      packageId,
      addons: selectedAddonIds,
      quotedPrice: quote,
    });
    setSubmitting(false);
    if (err) {
      setError("לא הצלחנו לשלוח את הבקשה. נסו שוב בעוד רגע.");
      console.error("submitServiceRequest failed", err);
      return;
    }
    setSubmitted(true);
  };

  if (submitted) {
    const wa = whatsappLink(
      `היי, השארתי בקשה לחבילת ${pkg?.name} ב-${BRAND.name} (${name}). אשמח לתאם שיחה.`
    );
    return (
      <div className="app-shell">
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-10 gap-4">
          <div className="text-5xl">🎉</div>
          <h1 className="text-2xl font-extrabold text-gray-900">הבקשה התקבלה!</h1>
          <p className="text-gray-500 leading-relaxed">
            מנהל מעבר יחזור אליכם תוך יום עסקים כדי לתאם את הפרטים ולקבוע מחיר סופי.
          </p>
          {wa && (
            <a
              href={wa}
              target="_blank"
              rel="noreferrer"
              className="w-full py-3.5 rounded-xl font-semibold bg-green-500 text-white"
            >
              לא רוצים לחכות? דברו איתנו בוואטסאפ
            </a>
          )}
          {session ? (
            <button
              onClick={() => navigate("/my-move")}
              className="w-full py-3.5 rounded-xl font-semibold bg-brand-500 text-white"
            >
              למעקב אחרי המעבר שלי
            </button>
          ) : (
            <p className="text-sm text-gray-500 bg-white rounded-xl border border-gray-100 p-4">
              רוצים לעקוב אחרי המעבר באפליקציה?{" "}
              <button
                onClick={() => navigate("/")}
                className="font-semibold text-brand-600"
              >
                הירשמו
              </button>{" "}
              עם אותו אימייל, ונחבר את ההזמנה לחשבון שלכם.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Logo size={30} />
          <span className="font-extrabold text-brand-600">{BRAND.name}</span>
        </div>
        <button
          onClick={() => navigate(session ? "/dashboard" : "/")}
          className="text-xs font-semibold text-gray-500 border border-gray-200 rounded-full px-3 py-1.5"
        >
          {session ? "חזרה לאפליקציה" : "התחברות"}
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-8">
        <section className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 leading-tight mb-2">
            עוברים דירה
            <br />
            <span className="text-brand-600">בלי לעשות כלום</span>
          </h1>
          <p className="text-gray-500 leading-relaxed">
            מחיר אחד, מנהל מעבר אחד, וכל הספקים מתואמים בשבילכם:
            הובלה, אריזה, ניקיון, אינטרנט ועוד.
          </p>
        </section>

        <section className="grid grid-cols-3 gap-2">
          {howItWorks.map((s, i) => (
            <div
              key={s.title}
              className="bg-white rounded-2xl p-3 shadow-card border border-gray-100 text-center"
            >
              <div className="text-2xl mb-1">{s.emoji}</div>
              <p className="text-[11px] font-bold text-brand-600">שלב {i + 1}</p>
              <p className="text-sm font-semibold text-gray-900 leading-tight mb-1">
                {s.title}
              </p>
              <p className="text-[11px] text-gray-500 leading-snug">{s.text}</p>
            </div>
          ))}
        </section>

        <section>
          <h2 className="font-bold text-gray-900 mb-3">1. בחרו חבילה</h2>
          <div className="flex flex-col gap-3">
            {servicePackages.map((p) => {
              const selected = p.id === packageId;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPackageId(p.id)}
                  className={`relative text-right bg-white rounded-2xl p-4 border-2 transition-colors ${
                    selected ? "border-brand-500 shadow-floating" : "border-gray-100 shadow-card"
                  }`}
                >
                  {p.highlight && (
                    <span className="absolute -top-2.5 left-4 bg-accent-500 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                      הכי פופולרי
                    </span>
                  )}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <p className="text-lg font-extrabold text-gray-900">{p.name}</p>
                      <p className="text-sm text-gray-500">{p.tagline}</p>
                    </div>
                    <div className="text-left shrink-0">
                      <p className="text-[11px] text-gray-400">החל מ-</p>
                      <p className="text-lg font-extrabold text-brand-600">
                        {formatShekels(p.prices["1"])}
                      </p>
                    </div>
                  </div>
                  <ul className="flex flex-col gap-1">
                    {p.includes.map((line) => (
                      <li key={line} className="text-sm text-gray-700 flex gap-2">
                        <span className="text-green-500">✓</span>
                        {line}
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>
        </section>

        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          <section className="flex flex-col gap-3">
            <h2 className="font-bold text-gray-900">2. פרטי המעבר</h2>
            <div className="flex flex-wrap gap-2">
              {apartmentSizeOptions.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setApartmentSize(s.value)}
                  className={`px-3.5 py-2 rounded-full text-sm font-semibold border ${
                    apartmentSize === s.value
                      ? "bg-brand-500 text-white border-brand-500"
                      : "bg-white text-gray-600 border-gray-200"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                list="service-cities"
                value={fromCity}
                onChange={(e) => setFromCity(e.target.value)}
                placeholder="עוברים מ..."
                className="w-full p-3.5 rounded-xl border border-gray-200 focus:border-brand-500 focus:outline-none bg-white"
              />
              <input
                list="service-cities"
                value={toCity}
                onChange={(e) => setToCity(e.target.value)}
                placeholder="עוברים ל..."
                className="w-full p-3.5 rounded-xl border border-gray-200 focus:border-brand-500 focus:outline-none bg-white"
              />
            </div>
            <datalist id="service-cities">
              {israeliCities.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
            <label className="text-sm font-semibold text-gray-700 -mb-2">
              תאריך מעבר משוער
            </label>
            <input
              type="date"
              value={moveDate}
              min={todayISO()}
              onChange={(e) => setMoveDate(e.target.value)}
              className="w-full p-3.5 rounded-xl border border-gray-200 focus:border-brand-500 focus:outline-none bg-white"
            />

            {addons.length > 0 && (
              <>
                <p className="text-sm font-semibold text-gray-700 mt-1">תוספות</p>
                <div className="grid grid-cols-2 gap-2">
                  {addons.map((a) => {
                    const on = selectedAddonIds.includes(a.id);
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => toggleAddon(a.id)}
                        className={`text-right p-3 rounded-xl border-2 bg-white ${
                          on ? "border-brand-500" : "border-gray-100"
                        }`}
                      >
                        <p className="text-sm font-semibold text-gray-800">
                          {a.emoji} {a.label}
                        </p>
                        <p className="text-xs text-gray-500">+{formatShekels(a.price)}</p>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </section>

          <section className="bg-brand-600 text-white rounded-2xl p-5 shadow-floating">
            <p className="text-sm opacity-80">הערכת מחיר לחבילת {pkg?.name}</p>
            <p className="text-4xl font-extrabold my-1">{formatShekels(quote)}</p>
            <p className="text-xs opacity-80 leading-relaxed">
              {intercity && `כולל תוספת מעבר בין ערים (${formatShekels(INTERCITY_SURCHARGE)}). `}
              המחיר הסופי נקבע בשיחת התיאום, לפי כמות התכולה, קומות ונגישות.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="font-bold text-gray-900">3. איך חוזרים אליכם?</h2>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="שם מלא"
              required
              className="w-full p-3.5 rounded-xl border border-gray-200 focus:border-brand-500 focus:outline-none bg-white"
            />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="טלפון"
              required
              dir="ltr"
              className="w-full p-3.5 rounded-xl border border-gray-200 focus:border-brand-500 focus:outline-none bg-white text-right"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="אימייל (לא חובה)"
              dir="ltr"
              className="w-full p-3.5 rounded-xl border border-gray-200 focus:border-brand-500 focus:outline-none bg-white text-right"
            />
            <label className="flex items-start gap-2 text-xs text-gray-500 leading-relaxed">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5"
              />
              אני מאשר/ת ל-{BRAND.name} ליצור איתי קשר ולשתף את פרטי המעבר עם הספקים שיבצעו
              את השירותים בחבילה.
            </label>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg p-2.5 text-center">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full py-3.5 rounded-xl font-semibold bg-accent-500 text-white disabled:opacity-40"
            >
              {submitting ? "שולחים..." : "שלחו לי הצעה מסודרת"}
            </button>
            <p className="text-[11px] text-gray-400 text-center">
              בלי התחייבות. נחזור אליכם תוך יום עסקים.
            </p>
          </section>
        </form>
      </div>
    </div>
  );
}
