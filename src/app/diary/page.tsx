import { Nav } from "@/components/layout/nav";
import { SideRail } from "@/components/layout/side-rail";
import { DiaryView } from "@/components/diary/diary-view";

export default function DiaryPage() {
  return (
    <>
      <Nav />
      <SideRail active="diary" />
      <main className="flex-1 pt-16">
        <DiaryView />
      </main>
    </>
  );
}
