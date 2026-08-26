import { Nav } from "@/components/layout/nav";
import { SideRail } from "@/components/layout/side-rail";
import { BadgeMuseum } from "@/components/badges/badge-museum";

export default function BadgesPage() {
  return (
    <>
      <Nav />
      <SideRail active="badges" />
      <main className="flex-1 pt-16">
        <BadgeMuseum />
      </main>
    </>
  );
}
