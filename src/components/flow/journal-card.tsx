"use client";

import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { useState } from "react";

export function JournalCard() {
  const [text, setText] = useState("");

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="relative rounded-sm bg-[#f5f0e8] p-8 shadow-l">
        <div className="absolute -top-3 left-1/2 h-8 w-24 -translate-x-1/2 rounded-sm bg-mist/60 opacity-80" />
        <div className="absolute -right-2 -top-2 h-16 w-16 rotate-12 opacity-40">
          <svg viewBox="0 0 64 64" className="h-full w-full text-primary/30" aria-hidden>
            <path
              d="M32 4C20 20 8 28 8 40c0 8 6 14 14 14 10 0 18-8 22-18 4 10 12 18 22 18 8 0 14-6 14-14 0-12-12-20-24-36-4-6-8-10-12-14z"
              fill="currentColor"
            />
          </svg>
        </div>

        <h2 className="mb-8 text-center font-serif text-xl text-ink">
          {"\u4eca\u5929\u53d1\u751f\u4e86\u4ec0\u4e48\uff1f"}
        </h2>

        <div className="relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            className="w-full resize-none bg-transparent font-serif text-base leading-[2.5rem] text-ink outline-none"
            style={{
              backgroundImage:
                "repeating-linear-gradient(transparent, transparent 2.4rem, var(--color-cloud-grey) 2.4rem, var(--color-cloud-grey) calc(2.4rem + 1px))",
            }}
          />
        </div>

        <Button href="/flow/voice" size="lg" className="mt-8 w-full">
          {"\u53d1\u9001"}
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
