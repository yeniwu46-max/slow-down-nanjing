"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check } from "lucide-react";
import { FLOW_STEPS, getStepIndex, type FlowStepId } from "@/lib/flow/steps";
import { cn } from "@/lib/utils";

function resolveCurrentStep(pathname: string): FlowStepId | null {
  const match = FLOW_STEPS.find((step) => pathname.startsWith(step.href));
  return match?.id ?? null;
}

export function Stepper() {
  const pathname = usePathname();
  const currentId = resolveCurrentStep(pathname);
  const currentIndex = currentId ? getStepIndex(currentId) : -1;

  return (
    <>
      <aside className="hidden w-56 shrink-0 lg:block">
        <ol className="relative space-y-6 pl-2">
          <div className="absolute bottom-4 left-[11px] top-4 w-px bg-cloud" aria-hidden />
          {FLOW_STEPS.map((step, index) => {
            const isDone = currentIndex > index;
            const isCurrent = currentIndex === index;

            return (
              <li key={step.id} className="relative flex items-start gap-3">
                <span
                  className={cn(
                    "relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs transition-colors",
                    isDone && "border-primary bg-primary text-white",
                    isCurrent && "border-primary bg-primary text-white",
                    !isDone && !isCurrent && "border-cloud bg-white/70 text-rock",
                  )}
                >
                  {isDone ? <Check className="h-3.5 w-3.5" /> : index + 1}
                </span>
                <Link
                  href={step.href}
                  className={cn(
                    "pt-0.5 text-sm leading-snug transition-colors",
                    isCurrent ? "font-medium text-ink" : "text-rock hover:text-ink",
                  )}
                >
                  <span className="mr-1 text-xs text-rock">{step.number}</span>
                  {step.label}
                </Link>
              </li>
            );
          })}
        </ol>
      </aside>

      <nav
        className="mb-6 flex items-center justify-center gap-2 lg:hidden"
        aria-label={"\u6d41\u7a0b\u6b65\u9aa4"}
      >
        {FLOW_STEPS.map((step, index) => {
          const isDone = currentIndex > index;
          const isCurrent = currentIndex === index;

          return (
            <Link
              key={step.id}
              href={step.href}
              aria-label={step.label}
              className={cn(
                "h-2.5 rounded-full transition-all",
                isCurrent ? "w-8 bg-primary" : "w-2.5",
                isDone && !isCurrent && "bg-primary/60",
                !isDone && !isCurrent && "bg-cloud",
              )}
            />
          );
        })}
      </nav>
    </>
  );
}
