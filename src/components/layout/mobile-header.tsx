"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Heart, LayoutDashboard, Users, Stethoscope, CalendarCheck, FileText, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Familiares", href: "/familiares", icon: Users },
  { label: "Médicos", href: "/medicos", icon: Stethoscope },
  { label: "Consultas", href: "/consultas", icon: CalendarCheck },
  { label: "Exames", href: "/exames", icon: FileText },
];

export function MobileHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur-xl lg:hidden">
      <div className="flex items-center gap-2">
        <Link href="/">
          <img 
            src="/logo.svg" 
            alt="DocMed Logo" 
            className="h-8 w-auto object-contain"
          />
        </Link>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger render={<Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-foreground" />}>
            <Menu className="w-6 h-6" />
            <span className="sr-only">Abrir menu</span>
        </SheetTrigger>
        <SheetContent side="right" className="flex flex-col p-0 border-l border-border bg-card w-[280px]">
          <SheetHeader className="p-6 text-left border-b border-border">
            <SheetTitle className="flex items-center gap-2 border-b border-border pb-4">
              <img 
                src="/logo.svg" 
                alt="DocMed Logo" 
                className="h-8 w-auto object-contain"
              />
            </SheetTitle>
          </SheetHeader>
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-emerald-500/10 text-emerald-500"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  <item.icon className={cn("w-5 h-5", isActive ? "text-emerald-500" : "text-muted-foreground")} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          
          {/* Footer (Logout) */}
          <div className="p-4 border-t border-border">
            <button
              onClick={async () => {
                const { supabase } = await import("@/lib/supabase");
                await supabase.auth.signOut();
                window.location.href = "/login";
              }}
              className="flex items-center gap-3 px-3 py-3 w-full rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Sair da conta</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
