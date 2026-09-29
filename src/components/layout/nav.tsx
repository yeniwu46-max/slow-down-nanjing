"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "智能路线规划", href: "/planner" },
  { label: "经典路线", href: "/map" },
  { label: "项目原理", href: "/about" },
];

export function Nav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 h-16 border-b border-white/50 glass">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-5 md:px-10">
        <Link href="/" className="flex shrink-0 flex-col leading-none">
          <span className="font-serif text-lg font-semibold tracking-wide text-ink md:text-xl">
            宁可慢一点
            <span className="ml-0.5 text-gold">.</span>
          </span>
          <span className="mt-0.5 text-[10px] tracking-[0.18em] text-rock uppercase">
            Slow down, Feel Nanjing.
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex lg:gap-9" aria-label="主导航">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);

            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "relative py-1 text-sm transition-colors",
                  active
                    ? "font-medium text-primary"
                    : "text-charcoal/80 hover:text-primary",
                )}
              >
                {item.label}
                {active && (
                  <span className="absolute -bottom-0.5 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-white/60 md:hidden"
          aria-label={menuOpen ? "关闭导航" : "打开导航"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {menuOpen && (
        <nav
          className="border-t border-white/50 bg-paper/95 px-5 py-3 shadow-m backdrop-blur-md md:hidden"
          aria-label="移动端主导航"
        >
          <div className="mx-auto grid max-w-7xl gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "rounded-xl px-3 py-2.5 text-sm transition-colors",
                  isActive(item.href)
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-charcoal/80 hover:bg-white/60 hover:text-primary",
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
