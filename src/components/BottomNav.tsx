import { NavLink } from "react-router-dom";

const items = [
  { to: "/dashboard", label: "בית", icon: "🏠" },
  { to: "/checklist", label: "משימות", icon: "✅" },
  { to: "/marketplace", label: "ספקים", icon: "🛒" },
  { to: "/budget", label: "תקציב", icon: "💰" },
];

export default function BottomNav() {
  return (
    <nav className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-stretch z-40 pb-[env(safe-area-inset-bottom)]">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-xs font-medium transition-colors ${
              isActive ? "text-brand-600" : "text-gray-400"
            }`
          }
        >
          <span className="text-xl leading-none">{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
