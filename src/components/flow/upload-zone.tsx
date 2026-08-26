import Link from "next/link";
import { Plus } from "lucide-react";

export function UploadZone() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-8">
      <Link
        href="/flow/analyzing"
        className="glass flex w-full max-w-md flex-col items-center justify-center rounded-3xl border-2 border-dashed border-cloud px-8 py-16 transition-colors hover:border-primary hover:bg-white/50"
      >
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-s">
          <Plus className="h-8 w-8 text-rock" strokeWidth={1.5} />
        </span>
        <p className="mt-6 text-base text-ink">留下一张路边的风景</p>
        <p className="mt-2 text-xs text-rock">
          点这里继续匹配慢路，照片仅在本地用于演示
        </p>
      </Link>
    </div>
  );
}
