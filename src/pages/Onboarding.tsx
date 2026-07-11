import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../store/AppContext";
import { israeliCities } from "../data/cities";
import type { ApartmentSize } from "../types";
import { todayISO } from "../utils/dateUtils";

const sizes: { value: ApartmentSize; label: string }[] = [
  { value: "1", label: "חדר 1" },
  { value: "2", label: "2 חדרים" },
  { value: "3", label: "3 חדרים" },
  { value: "4", label: "4 חדרים" },
  { value: "5+", label: "5+ חדרים / בית פרטי" },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { completeOnboarding } = useApp();
  const [step, setStep] = useState(1);
  const [moveDate, setMoveDate] = useState("");
  const [fromCity, setFromCity] = useState("");
  const [toCity, setToCity] = useState("");
  const [apartmentSize, setApartmentSize] = useState<ApartmentSize | null>(
    null
  );

  const canProceedStep1 = !!moveDate;
  const canProceedStep2 = !!fromCity && !!toCity;
  const canFinish = !!apartmentSize;

  const handleFinish = () => {
    if (!moveDate || !fromCity || !toCity || !apartmentSize) return;
    completeOnboarding({ moveDate, fromCity, toCity, apartmentSize });
    navigate("/dashboard");
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
              מהו תאריך מעבר הדירה המתוכנן?
            </h2>
            <p className="text-gray-500 mb-6">
              נבנה עבורכם צ&apos;ק-ליסט מותאם אישית לפי התאריך הזה
            </p>
            <input
              type="date"
              value={moveDate}
              min={todayISO()}
              onChange={(e) => setMoveDate(e.target.value)}
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
              מאיזו עיר לאיזו עיר עוברים?
            </h2>
            <p className="text-gray-500 mb-6">זה יעזור לנו למצוא לכם ספקים באזור</p>
            <label className="text-sm font-semibold text-gray-700 mb-1">
              עוברים מ...
            </label>
            <input
              list="cities"
              value={fromCity}
              onChange={(e) => setFromCity(e.target.value)}
              placeholder="עיר מוצא"
              className="w-full text-lg p-4 rounded-xl border border-gray-200 focus:border-brand-500 focus:outline-none mb-4"
            />
            <label className="text-sm font-semibold text-gray-700 mb-1">
              עוברים ל...
            </label>
            <input
              list="cities"
              value={toCity}
              onChange={(e) => setToCity(e.target.value)}
              placeholder="עיר יעד"
              className="w-full text-lg p-4 rounded-xl border border-gray-200 focus:border-brand-500 focus:outline-none"
            />
            <datalist id="cities">
              {israeliCities.map((c) => (
                <option key={c} value={c} />
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
              מהו גודל הדירה הנוכחית?
            </h2>
            <p className="text-gray-500 mb-6">
              זה עוזר לנו להעריך את היקף ההובלה
            </p>
            <div className="grid grid-cols-2 gap-3">
              {sizes.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setApartmentSize(s.value)}
                  className={`p-4 rounded-xl border-2 font-semibold text-center ${
                    apartmentSize === s.value
                      ? "border-brand-500 bg-brand-50 text-brand-700"
                      : "border-gray-200 text-gray-600"
                  } ${s.value === "5+" ? "col-span-2" : ""}`}
                >
                  {s.label}
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
                disabled={!canFinish}
                onClick={handleFinish}
                className="flex-1 py-3.5 rounded-xl font-semibold bg-brand-500 text-white disabled:opacity-30"
              >
                בואו נתחיל! 🎉
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
