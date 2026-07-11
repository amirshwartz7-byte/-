import { useNavigate } from "react-router-dom";
import { useApp } from "../store/AppContext";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import { formatDateHe } from "../utils/dateUtils";

export default function Profile() {
  const navigate = useNavigate();
  const { state, signOut } = useApp();

  const handleSignOut = async () => {
    if (confirm("להתנתק מהחשבון?")) {
      await signOut();
      navigate("/");
    }
  };

  return (
    <div className="app-shell">
      <Header
        title="הפרופיל שלי"
        showProfile={false}
        onBack={() => navigate(-1)}
      />

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-card border border-gray-100 text-center">
          <div className="w-16 h-16 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center text-3xl mx-auto mb-3">
            👤
          </div>
          <p className="font-bold text-gray-900 text-lg">
            {state.user.name || "ללא שם"}
          </p>
          <p className="text-xs text-gray-400 mt-1" dir="ltr">
            {state.user.email}
          </p>
          {state.user.isAdmin && (
            <button
              onClick={() => navigate("/admin")}
              className="mt-2 text-[11px] font-semibold bg-brand-50 text-brand-600 px-2.5 py-1 rounded-full"
            >
              מעבר לפאנל ניהול
            </button>
          )}
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-card border border-gray-100 flex flex-col divide-y divide-gray-100">
          <div className="py-3 flex justify-between text-sm">
            <span className="text-gray-500">תאריך מעבר</span>
            <span className="font-semibold text-gray-800">
              {state.user.moveDate ? formatDateHe(state.user.moveDate) : "-"}
            </span>
          </div>
          <div className="py-3 flex justify-between text-sm">
            <span className="text-gray-500">מסלול</span>
            <span className="font-semibold text-gray-800">
              {state.user.fromCity} ← {state.user.toCity}
            </span>
          </div>
          <div className="py-3 flex justify-between text-sm">
            <span className="text-gray-500">גודל דירה</span>
            <span className="font-semibold text-gray-800">
              {state.user.apartmentSize}
            </span>
          </div>
        </div>

        <button
          onClick={() => navigate("/books")}
          className="bg-white rounded-2xl p-4 shadow-card border border-gray-100 flex items-center gap-3 text-right"
        >
          <span className="text-2xl">📚</span>
          <span className="font-semibold text-gray-800 flex-1">
            ספרים ומדריכים מומלצים
          </span>
          <span className="text-gray-300">←</span>
        </button>

        <button
          onClick={() => navigate("/package")}
          className="bg-white rounded-2xl p-4 shadow-card border border-gray-100 flex items-center gap-3 text-right"
        >
          <span className="text-2xl">🧩</span>
          <span className="font-semibold text-gray-800 flex-1">
            חבילת השירותים שלי
          </span>
          <span className="text-gray-300">←</span>
        </button>

        <button
          onClick={handleSignOut}
          className="mt-4 text-sm font-semibold text-red-500 py-2"
        >
          התנתקות מהחשבון
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
