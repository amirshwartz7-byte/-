import { useNavigate } from "react-router-dom";

interface HeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  showProfile?: boolean;
}

export default function Header({
  title,
  subtitle,
  onBack,
  showProfile = true,
}: HeaderProps) {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-gray-100 px-4 py-3 flex items-center gap-3">
      {onBack && (
        <button
          onClick={onBack}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-lg shrink-0"
          aria-label="חזור"
        >
          ←
        </button>
      )}
      <div className="flex-1 min-w-0">
        <h1 className="text-lg font-bold text-gray-900 truncate">{title}</h1>
        {subtitle && (
          <p className="text-xs text-gray-500 truncate">{subtitle}</p>
        )}
      </div>
      {showProfile && (
        <button
          onClick={() => navigate("/profile")}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-brand-50 text-brand-600 shrink-0"
          aria-label="פרופיל"
        >
          👤
        </button>
      )}
    </header>
  );
}
