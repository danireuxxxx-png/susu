import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  change?: number;
  icon: LucideIcon;
  color?: "orange" | "green" | "blue" | "purple" | "red";
}

const colorMap = {
  orange: "bg-orange-50 text-orange-600",
  green: "bg-green-50 text-green-600",
  blue: "bg-blue-50 text-blue-600",
  purple: "bg-purple-50 text-purple-600",
  red: "bg-red-50 text-red-600",
};

export function StatCard({ title, value, change, icon: Icon, color = "orange" }: StatCardProps) {
  const positive = change !== undefined && change >= 0;

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
          {change !== undefined && (
            <div className={cn("flex items-center gap-1 mt-2 text-xs font-medium", positive ? "text-green-600" : "text-red-500")}>
              {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(change)}% vs mês anterior
            </div>
          )}
        </div>
        <div className={cn("p-3 rounded-xl", colorMap[color])}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
