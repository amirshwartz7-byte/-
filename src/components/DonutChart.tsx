import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

interface DonutChartProps {
  used: number;
  total: number;
  overBudget: boolean;
}

export default function DonutChart({
  used,
  total,
  overBudget,
}: DonutChartProps) {
  const safeTotal = total > 0 ? total : 1;
  const usedPct = Math.min(used / safeTotal, 1);
  const remaining = Math.max(1 - usedPct, 0);
  const data = [
    { name: "used", value: usedPct },
    { name: "remaining", value: remaining },
  ];
  const usedColor = overBudget ? "#dc2626" : "#3466ff";
  const remainingColor = overBudget ? "#fecaca" : "#e5e7f0";
  const percentLabel = Math.min(Math.round((used / safeTotal) * 100), 999);

  return (
    <div className="relative w-44 h-44 mx-auto">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            innerRadius="72%"
            outerRadius="100%"
            startAngle={90}
            endAngle={-270}
            stroke="none"
          >
            <Cell fill={usedColor} />
            <Cell fill={remainingColor} />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={`text-2xl font-extrabold ${
            overBudget ? "text-red-600" : "text-gray-900"
          }`}
        >
          {percentLabel}%
        </span>
        <span className="text-xs text-gray-500">מהתקציב נוצל</span>
      </div>
    </div>
  );
}
