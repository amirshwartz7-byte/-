import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../store/AppContext";
import { israeliCities, skiResorts } from "../data/cities";
import type { SkiLevel } from "../types";
import { todayISO } from "../utils/dateUtils";

const levels: { value: SkiLevel; label: string }[] = [
  { value: "beginner", label: "מתחיל/ה" },
  { value: "intermediate", label: "בינוני/ת" },
  { value: "advanced", label: "מתקדם/ת" },
  { value: "expert", label: "מקצוען/ית" },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { completeOnboarding } = useApp();
  const [step, setStep] = useState(1);
  const [tripDate, setTripDate] = useState("");
  const [departureCity, setDepartureCity] = useState("");
  const [resort, setResort] = useState("");
  const [skiLevel, setSkiLevel] = useState<SkiLevel | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canProceedStep1 = !!tripDate;
  const canProceedStep2 = !!departureCity && !!resort;
  const canFinish = !!skiLevel;

  const handleFinish = async () => {
    if (!tripDate || !departureCity || !resort || !skiLevel) return;
    setSubmitting(true);
    try {
      await completeOnboarding({ tripDate, departureCity, resort, skiLevel });
      navigate("/dashboard");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-shell">
      <div className="px-5 pt-6 pb-3">
        <div className="flex gap-1.5">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full ${
                s <= step ? "bg-brand-500" : "bg-gray-100"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col px-6 py-4">
        {step === 1 && (
          <div className="flex-1 flex flex-col">
            <p className="text-brand-600 font-semibold text-sm mb-2">
              שאלה 1 מתוך 3
            </p>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              מהו תאריך הטיסה לחופשת הסקי?
            </h2>
            <p className="text-gray-500 mb-6">
              נבנה עבורכם צ&apos;ק-ליסט הכנה מותאם אישית לפי התאריך הזה
            </p>
            <input
              type="date"
              value={tripDate}
              min={todayISO()}
              onChange={(e) => setTripDate(e.target.value)}
              className="w-full text-lg p-4 rounded-xl border border-gray-200 focus:border-brand-500 focus:outline-none"
            />
            <div className="flex-1" />
            <button
              disabled={!canProceedStep1}
              onClick={() => setStep(2)}
              className="w-full py-3.5 rounded-xl font-semibold bg-brand-500 text-white disabled:opacity-30"
            >
              המשך
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="flex-1 flex flex-col">
            <p className="text-brand-600 font-semibold text-sm mb-2">
              שאלה 2 מתוך 3
            </p>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              מאיפה יוצאים ולאן טסים?
            </h2>
            <p className="text-gray-500 mb-6">
              זה יעזור לנו להתאים לכם טיסות, ספקים ודילים באזור
            </p>
            <label className="text-sm font-semibold text-gray-700 mb-1">
              יוצאים מ...
            </label>
            <input
              list="departure-cities"
              value={departureCity}
              onChange={(e) => setDepartureCity(e.target.value)}
              placeholder="עיר יציאה"
              className="w-full text-lg p-4 rounded-xl border border-gray-200 focus:border-brand-500 focus:outline-none mb-4"
            />
            <label className="text-sm font-semibold text-gray-700 mb-1">
              טסים ל...
            </label>
            <input
              list="ski-resorts"
              value={resort}
              onChange={(e) => setResort(e.target.value)}
              placeholder="אתר הסקי"
              className="w-full text-lg p-4 rounded-xl border border-gray-200 focus:border-brand-500 focus:outline-none"
            />
            <datalist id="departure-cities">
              {israeliCities.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
            <datalist id="ski-resorts">
              {skiResorts.map((r) => (
                <option key={r} value={r} />
              ))}
            </datalist>
            <div className="flex-1" />
            <div className="flex gap-2.5">
              <button
                onClick={() => setStep(1)}
                className="px-5 py-3.5 rounded-xl font-semibold bg-gray-100 text-gray-600"
              >
                חזרה
              </button>
              <button
                disabled={!canProceedStep2}
                onClick={() => setStep(3)}
                className="flex-1 py-3.5 rounded-xl font-semibold bg-brand-500 text-white disabled:opacity-30"
              >
                המשך
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex-1 flex flex-col">
            <p className="text-brand-600 font-semibold text-sm mb-2">
              שאלה 3 מתוך 3
            </p>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              מהי רמת הגלישה שלכם?
            </h2>
            <p className="text-gray-500 mb-6">
              זה עוזר לנו להתאים לכם שיעורים, מדריכים והמלצות מסלולים
            </p>
            <div className="grid grid-cols-2 gap-3">
              {levels.map((l) => (
                <button
                  key={l.value}
                  onClick={() => setSkiLevel(l.value)}
                  className={`p-4 rounded-xl border-2 font-semibold text-center ${
                    skiLevel === l.value
                      ? "border-brand-500 bg-brand-50 text-brand-700"
                      : "border-gray-200 text-gray-600"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
            <div className="flex-1" />
            <div className="flex gap-2.5">
              <button
                onClick={() => setStep(2)}
                className="px-5 py-3.5 rounded-xl font-semibold bg-gray-100 text-gray-600"
              >
                חזרה
              </button>
              <button
                disabled={!canFinish || submitting}
                onClick={handleFinish}
                className="flex-1 py-3.5 rounded-xl font-semibold bg-brand-500 text-white disabled:opacity-30"
              >
                {submitting ? "רגע, בונים את הצ'ק-ליסט..." : "בואו נתחיל! ⛷️"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
