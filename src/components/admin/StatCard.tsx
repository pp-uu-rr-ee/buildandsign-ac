import type { LucideIcon } from "lucide-react";

type Props = {
  label: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  color: "blue" | "green" | "orange" | "purple";
};

const colorMap = {
  blue:   { bg: "bg-blue-50",   icon: "bg-blue-600",   text: "text-blue-700" },
  green:  { bg: "bg-green-50",  icon: "bg-green-600",  text: "text-green-700" },
  orange: { bg: "bg-orange-50", icon: "bg-orange-500", text: "text-orange-700" },
  purple: { bg: "bg-purple-50", icon: "bg-purple-600", text: "text-purple-700" },
};

export function StatCard({ label, value, sub, icon: Icon, color }: Props) {
  const c = colorMap[color];
  return (
    <div className={`rounded-xl p-5 ${c.bg} flex items-start justify-between`}>
      <div>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className={`text-3xl font-bold mt-1 ${c.text}`}>{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
      <div className={`${c.icon} p-2.5 rounded-lg`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
    </div>
  );
}
