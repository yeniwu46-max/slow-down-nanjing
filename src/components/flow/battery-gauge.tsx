interface BatteryGaugeProps {
  level: number;
  statusText: string;
}

export function BatteryGauge({ level, statusText }: BatteryGaugeProps) {
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (level / 100) * circumference;

  return (
    <div className="glass-strong relative flex h-64 w-64 flex-col items-center justify-center rounded-full shadow-m">
      <svg
        className="absolute inset-0 h-full w-full -rotate-90"
        viewBox="0 0 120 120"
        aria-hidden
      >
        <circle cx="60" cy="60" r="54" fill="none" stroke="var(--color-cloud-grey)" strokeWidth="2" />
        <circle
          cx="60"
          cy="60"
          r="54"
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500"
        />
      </svg>
      <p className="text-sm text-rock">{"\u4eca\u5929\u7684\u72b6\u6001"}</p>
      <p className="mt-1 text-5xl font-light text-ink">{level}%</p>
      <p className="mt-2 max-w-[180px] text-center text-sm leading-snug text-rock">
        {statusText}
      </p>
      <div className="mt-4 flex gap-1.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className={`h-1.5 w-1.5 rounded-full ${
              i === Math.floor(level / 25) ? "bg-primary" : "bg-cloud"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
