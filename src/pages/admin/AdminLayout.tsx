import { NavLink, Outlet, useNavigate } from "react-router-dom";

const tabs = [
  { to: "/admin/users", label: "משתמשים", icon: "👥" },
  { to: "/admin/services", label: "הזמנות שירות", icon: "🚚" },
  { to: "/admin/providers", label: "ספקים", icon: "🏢" },
  { to: "/admin/leads", label: "לידים", icon: "📊" },
  { to: "/admin/content", label: "תוכן", icon: "📝" },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <span className="text-xl">📦</span>
          <div>
            <p className="font-extrabold text-brand-600 leading-none">Done</p>
            <p className="text-[10px] text-gray-400">ממשק ניהול</p>
          </div>
        </div>
        <button
          onClick={() => navigate("/")}
          className="text-xs font-semibold text-gray-500 border border-gray-200 rounded-full px-3 py-1.5"
        >
          יציאה
        </button>
      </header>

      <nav className="bg-white border-b border-gray-200 px-2 flex gap-1 overflow-x-auto no-scrollbar sticky top-[57px] z-20">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            className={({ isActive }) =>
              `px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 flex items-center gap-1.5 ${
                isActive
                  ? "border-brand-500 text-brand-600"
                  : "border-transparent text-gray-500"
              }`
            }
          >
            <span>{t.icon}</span> {t.label}
          </NavLink>
        ))}
      </nav>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
