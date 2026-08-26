"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { GestureModeToggle } from "@/components/gesture/gesture-mode-toggle";
import { getProfileOverrides } from "@/lib/user/local-profile";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "首页", href: "/" },
  { label: "我的地图", href: "/map" },
  { label: "风物收纳所", href: "/game" },
  { label: "徽章", href: "/badges" },
  { label: "分享", href: "/share" },
  { label: "城市日记", href: "/diary" },
];

export function Nav() {
  const pathname = usePathname();
  const [userLabel, setUserLabel] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/journiv/auth")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.authenticated && data.user) {
          const overrides = getProfileOverrides();
          setUserLabel(overrides.name ?? data.user.name ?? data.user.email?.split("@")[0]);
        } else {
          setUserLabel(null);
        }
      })
      .catch(() => setUserLabel(null));
  }, [pathname]);

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

        <nav className="hidden items-center gap-7 md:flex lg:gap-9">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "relative py-1 text-sm transition-colors",
                  isActive
                    ? "font-medium text-primary"
                    : "text-charcoal/80 hover:text-primary",
                )}
              >
                {item.label}
                {isActive && (
                  <span className="absolute -bottom-0.5 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <GestureModeToggle />
          <Link
          href={userLabel ? "/profile" : "/login"}
          className="flex items-center gap-1.5 rounded-full p-1 transition-opacity hover:opacity-80"
          aria-label={userLabel ? `${userLabel} 的个人中心` : "账户"}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cloud/60 text-rock">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </span>
          {userLabel && (
            <span className="hidden max-w-[80px] truncate text-sm text-ink md:inline">{userLabel}</span>
          )}
          <ChevronDown className="h-4 w-4 text-rock" />
        </Link>
        </div>
      </div>
    </header>
  );
}
