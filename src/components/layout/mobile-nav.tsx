"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  CalendarCheck,
  FileText,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Início", href: "/", icon: LayoutDashboard },
  { label: "Família", href: "/familiares", icon: Users },
  { label: "Médicos", href: "/medicos", icon: Stethoscope },
  { label: "Consultas", href: "/consultas", icon: CalendarCheck },
  { label: "Exames", href: "/exames", icon: FileText },
  { label: "Sair", href: "#", icon: LogOut, action: "logout" },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      {/* Glassmorphism backdrop */}
      <div className="border-t border-border/50 bg-card/80 backdrop-blur-xl backdrop-saturate-150 supports-[backdrop-filter]:bg-card/60">
        {/* Safe area bottom for notch devices */}
        <div className="flex items-center justify-around px-1 h-16 pb-safe">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            if (item.action === "logout") {
              return (
                <button
                  key={item.label}
                  onClick={async () => {
                    const { supabase } = await import("@/lib/supabase");
                    await supabase.auth.signOut();
                    window.location.href = "/login";
                  }}
                  className="flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 py-1.5 px-1 rounded-xl transition-all duration-200 text-muted-foreground active:scale-95 hover:text-destructive"
                >
                  <div className="flex items-center justify-center w-10 h-7 rounded-lg transition-all duration-200">
                    <item.icon className="w-5 h-5 transition-all duration-200" />
                  </div>
                  <span className="text-[10px] font-medium truncate max-w-full transition-all duration-200">
                    {item.label}
                  </span>
                </button>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 py-1.5 px-1 rounded-xl transition-all duration-200",
                  isActive
                    ? "text-emerald-500"
                    : "text-muted-foreground active:scale-95"
                )}
              >
                <div
                  className={cn(
                    "flex items-center justify-center w-10 h-7 rounded-lg transition-all duration-200",
                    isActive && "bg-emerald-500/15"
                  )}
                >
                  <item.icon
                    className={cn(
                      "w-5 h-5 transition-all duration-200",
                      isActive && "scale-110"
                    )}
                  />
                </div>
                <span
                  className={cn(
                    "text-[10px] font-medium truncate max-w-full transition-all duration-200",
                    isActive && "font-semibold"
                  )}
                >
                  {item.label}
                </span>
                {isActive && (
                  <span className="absolute -bottom-0 w-8 h-0.5 rounded-full bg-emerald-500" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
