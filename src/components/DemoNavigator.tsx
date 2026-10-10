import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useApp } from "../store/AppContext";
import { DEMO_EMAIL } from "../lib/mockSupabase";
import { BRAND } from "../brand";
import Logo from "./Logo";

interface Screen {
  label: string;
  path: string;
  /** מסך שמוצג רק למי שלא מחובר */
  signedOut?: boolean;
}

const groups: { title: string; screens: Screen[] }[] = [
  {
    title: "כניסה",
    screens: [{ label: "מסך פתיחה והתחברות", path: "/", signedOut: true }],
  },
  {
    title: "האפליקציה ללקוח",
    screens: [
      { label: "דשבורד", path: "/dashboard" },
      { label: "צ'קליסט משימות", path: "/checklist" },
      { label: "ספקים", path: "/marketplace" },
      { label: "הובלות (קטגוריה)", path: "/marketplace/moving" },
      { label: "בניית חבילת ספקים", path: "/package" },
      { label: "תקציב", path: "/budget" },
      { label: "ספרים ומדריכים", path: "/books" },
      { label: "פרופיל", path: "/profile" },
    ],
  },
  {
    title: "שירות מלא",
    screens: [
      { label: "עמוד החבילות", path: "/services" },
      { label: "המעבר שלי", path: "/my-move" },
    ],
  },
  {
    title: "ניהול (אדמין)",
    screens: [
      { label: "הזמנות שירות", path: "/admin/services" },
      { label: "משתמשים", path: "/admin/users" },
      { label: "ספקים", path: "/admin/providers" },
      { label: "לידים", path: "/admin/leads" },
      { label: "תוכן", path: "/admin/content" },
    ],
  },
];

export default function DemoNavigator() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, signIn, signOut } = useApp();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.body.classList.add("demo-nav");
    return () => document.body.classList.remove("demo-nav");
  }, []);

  const go = async (screen: Screen) => {
    setOpen(false);
    if (screen.signedOut) {
      if (session) await signOut();
      navigate("/");
      return;
    }
    if (!session || session.user.email !== DEMO_EMAIL) {
      setBusy(true);
      await signIn(DEMO_EMAIL, "demo");
      // ממתינים שהסשן יתעדכן לפני המעבר, אחרת השומרים מחזירים למסך הפתיחה
      await new Promise((r) => setTimeout(r, 80));
      setBusy(false);
    }
    navigate(screen.path);
  };

  const list = (
    <div className="flex flex-col gap-4">
      {groups.map((g) => (
        <div key={g.title}>
          <p className="text-[11px] font-bold text-gray-400 mb-1.5 tracking-wide">{g.title}</p>
          <div className="flex flex-col gap-0.5">
            {g.screens.map((s) => {
              const active = location.pathname === s.path;
              return (
                <button
                  key={s.path}
                  onClick={() => go(s)}
                  disabled={busy}
                  className={`text-right text-sm px-3 py-2 rounded-lg transition-colors ${
                    active ? "bg-brand-50 text-brand-700 font-semibold" : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <p className="text-[11px] text-gray-400 leading-relaxed border-t border-gray-100 pt-3">
        גרסת הדגמה עם נתונים לדוגמה. אפשר ללחוץ, למלא טפסים ולהירשם (כל סיסמה עובדת),
        והשינויים נשמרים עד רענון הדף.
      </p>
    </div>
  );

  return (
    <>
      <aside className="hidden xl:block fixed top-4 left-4 bottom-4 w-64 bg-white rounded-2xl border border-gray-200 shadow-card p-4 overflow-y-auto z-50">
        <div className="flex items-center gap-2 mb-4">
          <Logo size={36} />
          <div>
            <p className="font-extrabold text-brand-600 leading-none">{BRAND.name}</p>
            <p className="text-[11px] text-gray-400">ניווט בין המסכים</p>
          </div>
        </div>
        {list}
      </aside>

      <button
        onClick={() => setOpen(true)}
        className="xl:hidden fixed left-4 bottom-20 z-50 bg-gray-900 text-white text-xs font-semibold rounded-full px-4 py-2.5 shadow-floating"
      >
        🧭 מסכים
      </button>

      {open && (
        <div className="xl:hidden fixed inset-0 z-[60] bg-black/40 flex items-end" onClick={() => setOpen(false)}>
          <div
            className="bg-white w-full max-h-[80vh] overflow-y-auto rounded-t-2xl p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="font-bold text-gray-900">מעבר בין המסכים</p>
              <button onClick={() => setOpen(false)} className="text-gray-400 text-lg" aria-label="סגירה">
                ✕
              </button>
            </div>
            {list}
          </div>
        </div>
      )}
    </>
  );
}
