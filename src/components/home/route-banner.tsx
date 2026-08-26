import Link from "next/link";
import { MapPin } from "lucide-react";

export function RouteBanner() {
  return (
    <section className="glass-strong relative overflow-hidden rounded-3xl p-6 shadow-m md:p-8">
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 50%, var(--color-mist-blue) 0%, transparent 50%), radial-gradient(circle at 80% 30%, var(--color-primary) 0%, transparent 40%)",
        }}
      />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-serif text-2xl font-medium text-ink">{"\u6162\u884c\u00b7\u5357\u4eac"}</h2>
          <p className="mt-1 text-sm text-rock">{"\u7cbe\u9009\u8def\u7ebf\u63a8\u8350"}</p>
        </div>
        <Link
          href="/flow/result"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary-hover"
        >
          <MapPin className="h-4 w-4" />
          {"\u67e5\u770b\u5168\u90e8\u8def\u7ebf \u2192"}
        </Link>
      </div>
    </section>
  );
}
