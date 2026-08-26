import Link from "next/link";
import { CloudSun } from "lucide-react";

export function EmotionWeatherBanner() {
  return (
    <section className="glass-strong relative overflow-hidden rounded-3xl p-6 shadow-m md:p-8">
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at 15% 60%, var(--color-mist-blue) 0%, transparent 50%), radial-gradient(circle at 85% 40%, var(--color-gold) 0%, transparent 40%)",
        }}
      />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-serif text-2xl font-medium text-ink">情绪气象局</h2>
          <p className="mt-1 text-sm text-rock">
            用手势看见心里的天气，约 3 分钟
          </p>
        </div>
        <Link
          href="/emotion-weather"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary-hover"
        >
          <CloudSun className="h-4 w-4" />
          开始慢游观测 →
        </Link>
      </div>
    </section>
  );
}
