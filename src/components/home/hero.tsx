import Image from "next/image";
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
        <div className="max-w-xl space-y-6">
          <h1 className="font-serif text-3xl font-semibold leading-tight text-ink md:text-4xl lg:text-[2.5rem]">
            {"\u4eca\u5929\uff0c\u4e0d\u5fc5\u7740\u7740\u62b5\u8fbe"}
          </h1>
          <p className="max-w-md text-base leading-relaxed text-rock md:text-lg">
            {"\u5728\u5357\u4eac\uff0c\u548c\u81ea\u5df1\u6162\u6162\u76f8\u5904"}
          </p>
          <div className="mt-2 grid w-fit grid-cols-2 gap-3">
            <Button href="/flow/battery" size="lg">
              开始慢一点 →
            </Button>
            <Button href="/agents/jinling" variant="secondary" size="lg">
              听金陵的故事 →
            </Button>
            <Button href="/map?poi=xuanwu-lake" variant="secondary" size="lg">
              去玄武湖 →
            </Button>
            <Button href="/game" variant="secondary" size="lg">
              风物收纳所 →
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
