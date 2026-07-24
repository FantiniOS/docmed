"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  CalendarCheck,
  FileText,
  Heart,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Familiares", href: "/familiares", icon: Users },
  { label: "Médicos", href: "/medicos", icon: Stethoscope },
  { label: "Consultas", href: "/consultas", icon: CalendarCheck },
  { label: "Exames", href: "/exames", icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:z-50 border-r border-border bg-card">
      {/* Logo / Branding */}
      <div className="flex items-center gap-3 px-6 h-16 border-b border-border">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20">
          <Heart className="w-5 h-5 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-base font-bold tracking-tight text-foreground">
            DOCMED
          </span>
          <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            Prontuário Familiar
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-emerald-500/10 text-emerald-500 shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <item.icon
                className={cn(
                  "w-5 h-5 shrink-0 transition-colors duration-200",
                  isActive ? "text-emerald-500" : "text-muted-foreground"
                )}
              />
              <span>{item.label}</span>
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-border">
        <button
          onClick={async () => {
            const { supabase } = await import("@/lib/supabase");
            await supabase.auth.signOut();
            window.location.href = "/login";
          }}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span>Sair da conta</span>
        </button>
      </div>
    </aside>
  );
}
