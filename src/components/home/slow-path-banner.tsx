import Link from "next/link";
import { Footprints } from "lucide-react";

export function SlowPathBanner() {
  return (
    <section className="glass-strong relative overflow-hidden rounded-3xl p-6 shadow-m md:p-8">
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 55%, var(--color-mist-blue) 0%, transparent 50%), radial-gradient(circle at 80% 45%, var(--color-gold) 0%, transparent 42%)",
        }}
      />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-serif text-2xl font-medium text-ink">金陵风物收纳所</h2>
          <p className="mt-1 text-sm text-rock">
            沿玄武湖、颐和路、紫金、秦淮收纳风物，把一座城慢慢装进口袋
          </p>
        </div>
        <Link
          href="/game"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary-hover"
        >
          <Footprints className="h-4 w-4" />
          开始收纳风物 →
        </Link>
      </div>
    </section>
  );
}
