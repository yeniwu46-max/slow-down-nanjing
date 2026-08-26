import { Nav } from "@/components/layout/nav";
import { ShareView } from "@/components/share/share-view";

export default function SharePage() {
  return (
    <>
      <Nav />
      <main className="flex-1 pt-16">
        <ShareView />
      </main>
    </>
  );
}
