interface ProgressBarProps {
  percent: number;
  colorClass?: string;
}

export default function ProgressBar({
  percent,
  colorClass = "bg-brand-500",
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
