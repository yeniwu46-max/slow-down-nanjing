import Link from "next/link";
import { ArrowLeft, HelpCircle, Lock } from "lucide-react";

interface FooterBarProps {
  backHref?: string;
  showPrivacy?: boolean;
  slogan?: string;
}

export function FooterBar({
  backHref = "/flow/photo",
  showPrivacy = false,
  slogan,
}: FooterBarProps) {
  return (
    <footer className="mt-auto flex items-center justify-between py-6">
      <Link
        href={backHref}
        className="flex h-10 w-10 items-center justify-center rounded-full glass text-rock transition-colors hover:text-ink"
        aria-label="\u8fd4\u56de"
      >
        <ArrowLeft className="h-5 w-5" />
      </Link>

      {showPrivacy ? (
        <p className="flex max-w-md items-center gap-2 px-4 text-center text-xs text-rock">
          <Lock className="h-3.5 w-3.5 shrink-0" />
          {"照片只用来对照今日风景，我们会保护你的隐私"}
        </p>
      ) : slogan ? (
        <p className="flex items-center gap-2 text-sm text-rock">{slogan}</p>
      ) : (
        <span />
      )}

      <button
        type="button"
        className="flex h-10 w-10 items-center justify-center rounded-full glass text-rock transition-colors hover:text-ink"
        aria-label="\u5e2e\u52a9"
      >
        <HelpCircle className="h-5 w-5" />
      </button>
    </footer>
  );
}
