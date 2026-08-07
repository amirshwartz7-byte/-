interface CountdownProps {
  days: number;
}

export default function Countdown({ days }: CountdownProps) {
  const isPast = days < 0;
  const isToday = days === 0;
  return (
    <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-500 text-white p-5 shadow-floating">
      <p className="text-sm opacity-80 mb-1">
        {isPast ? "הטיסה כבר הייתה" : isToday ? "היום!" : "עד הטיסה לשלג"}
      </p>
      {!isPast && !isToday ? (
        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-extrabold leading-none">
            {days}
          </span>
          <span className="text-xl font-semibold">ימים</span>
        </div>
      ) : (
        <div className="text-3xl font-extrabold">
          {isToday ? "בהצלחה בשלג! ⛷️" : "מקווים שהייתה חופשה מעולה 🎉"}
        </div>
      )}
    </div>
  );
}
