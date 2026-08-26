"use client";

import Link from "next/link";
import { Mic } from "lucide-react";

export function VoiceButton() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 py-12">
      <Link href="/flow/photo" className="group relative flex items-center justify-center">
        <span className="absolute h-36 w-36 rounded-full bg-primary/20 animate-breath" />
        <span className="relative flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-primary to-mist shadow-m transition-transform group-hover:scale-105 group-active:scale-95">
          <Mic className="h-10 w-10 text-white" strokeWidth={1.5} />
        </span>
      </Link>
      <p className="text-base text-ink">点一下，记下今天想说的话</p>
      <p className="text-xs text-rock">可跳过录音，直接进入下一站</p>
    </div>
  );
}
