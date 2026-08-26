import { Nav } from "@/components/layout/nav";
import { HomeContent } from "@/components/home/home-content";

export default function HomePage() {
  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-7xl flex-1 px-5 pb-16 pt-20 md:px-10 md:pt-24">
        <HomeContent />
      </main>
    </>
  );
}
