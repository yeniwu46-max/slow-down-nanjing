import Image from "next/image";
import { Nav } from "@/components/layout/nav";
import { Stepper } from "@/components/layout/stepper";

export function FlowLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 -z-10">
        <Image
          src="/images/mist-bg.jpg"
          alt=""
          fill
          className="object-cover opacity-45"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-paper/45" />
      </div>

      <Nav />

      <div className="mx-auto flex max-w-7xl gap-8 px-5 pb-12 pt-16 md:px-10 lg:pt-20">
        <Stepper />
        <div className="flex min-h-[calc(100vh-5rem)] flex-1 flex-col justify-center py-6 md:py-10">
          {children}
        </div>
      </div>
    </div>
  );
}
