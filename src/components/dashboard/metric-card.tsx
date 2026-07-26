import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    positive: boolean;
  };
  accentColor?: "emerald" | "blue" | "amber" | "rose";
  className?: string;
}

const accentStyles = {
  emerald: {
    iconBg: "bg-emerald-500/10",
    iconText: "text-emerald-500",
    glow: "shadow-emerald-500/5",
    gradient: "from-emerald-500/20 to-transparent",
  },
  blue: {
    iconBg: "bg-blue-500/10",
    iconText: "text-blue-500",
    glow: "shadow-blue-500/5",
    gradient: "from-blue-500/20 to-transparent",
  },
  amber: {
    iconBg: "bg-amber-500/10",
    iconText: "text-amber-500",
    glow: "shadow-amber-500/5",
    gradient: "from-amber-500/20 to-transparent",
  },
  rose: {
    iconBg: "bg-rose-500/10",
    iconText: "text-rose-500",
    glow: "shadow-rose-500/5",
    gradient: "from-rose-500/20 to-transparent",
  },
};

export function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  accentColor = "emerald",
  className,
}: MetricCardProps) {
  const styles = accentStyles[accentColor];

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02]",
        styles.glow,
        className
      )}
    >
      {/* Subtle gradient accent */}
      <div
        className={cn(
          "absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl rounded-full -translate-y-1/2 translate-x-1/2 opacity-50",
          styles.gradient
        )}
      />

      <CardContent className="relative">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {title}
            </span>
            <span className="text-2xl font-bold tracking-tight text-foreground">
              {value}
            </span>
            {description && (
              <span className="text-xs text-muted-foreground mt-0.5">
                {description}
              </span>
            )}
            {trend && (
              <span
                className={cn(
                  "text-xs font-medium mt-1",
                  trend.positive ? "text-emerald-500" : "text-rose-500"
                )}
              >
                {trend.positive ? "↑" : "↓"} {trend.value}
              </span>
            )}
          </div>
          <div
            className={cn(
              "flex items-center justify-center w-9 h-9 rounded-lg",
              styles.iconBg
            )}
          >
            <Icon className={cn("w-5 h-5", styles.iconText)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
