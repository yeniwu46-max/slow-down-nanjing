import Image from "next/image";
import { BookOpenText, Map, Route } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative -mx-5 min-h-[60vh] overflow-hidden rounded-3xl md:-mx-10">
      <div className="absolute inset-0">
        <Image
          src="/images/hero-bg.png"
          alt=""
          fill
          className="object-cover object-center"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-paper/92 via-paper/78 to-paper/55" />
        <div className="absolute inset-0 bg-paper/20 backdrop-blur-[1px]" />
      </div>

      <div className="relative z-10 flex min-h-[60vh] items-center px-8 py-16 md:px-14 lg:px-20">
        <div className="max-w-2xl space-y-6">
          <p className="text-xs font-medium tracking-[0.28em] text-primary uppercase">
            Slow down · Feel Nanjing
          </p>
          <h1 className="font-serif text-3xl font-semibold leading-tight text-ink md:text-4xl lg:text-[2.5rem]">
            在有限时间里，走一条更适合你的南京
          </h1>
          <div className="mt-2 flex max-w-2xl flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button href="/planner" size="lg" className="sm:min-w-44">
              <Route className="h-4 w-4" />
              智能路线规划
            </Button>
            <Button href="/map" variant="secondary" size="lg" className="sm:min-w-40">
              <Map className="h-4 w-4" />
              经典路线
            </Button>
            <Button href="/about" variant="ghost" size="lg" className="sm:min-w-52">
              <BookOpenText className="h-4 w-4" />
              项目原理
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
