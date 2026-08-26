import Link from "next/link";
import {
  BarChart3,
  BookHeart,
  Compass,
  ImageIcon,
  Mic,
  Star,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RailItem {
  id: string;
  icon: LucideIcon;
  label: string;
  href: string;
}

const RAIL_ITEMS: RailItem[] = [
  { id: "explore", icon: Compass, label: "探索发现", href: "/" },
  { id: "voice", icon: Mic, label: "语音心情", href: "/flow/voice" },
  { id: "album", icon: ImageIcon, label: "我的地图", href: "/map" },
  { id: "badges", icon: Star, label: "我的徽章", href: "/badges" },
  { id: "records", icon: BarChart3, label: "慢行记录", href: "/records" },
  { id: "diary", icon: BookHeart, label: "城市日记", href: "/diary" },
];

interface SideRailProps {
  active?: string;
}

export function SideRail({ active }: SideRailProps) {
  return (
    <aside className="pointer-events-none fixed left-0 top-16 z-30 hidden h-[calc(100vh-4rem)] w-16 flex-col items-center justify-center gap-3 lg:flex">
      <nav className="pointer-events-auto flex flex-col items-center gap-3">
        {RAIL_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <Link
              key={item.id}
              href={item.href}
              title={item.label}
              aria-label={item.label}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full transition-all",
                isActive
                  ? "bg-primary text-white shadow-m"
                  : "text-rock hover:bg-white/60 hover:text-ink",
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={1.5} />
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
