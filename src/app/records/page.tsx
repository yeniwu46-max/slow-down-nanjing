import { Nav } from "@/components/layout/nav";
import { SideRail } from "@/components/layout/side-rail";
import { RecordsView } from "@/components/records/records-view";

export default function RecordsPage() {
  return (
    <>
      <Nav />
      <SideRail active="records" />
      <main className="flex-1 pt-16">
        <RecordsView />
      </main>
    </>
  );
}
