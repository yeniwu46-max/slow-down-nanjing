import { Nav } from "@/components/layout/nav";
import { ProfileView } from "@/components/profile/profile-view";

export default function ProfilePage() {
  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-7xl flex-1 pt-20 md:pt-24">
        <ProfileView />
      </main>
    </>
  );
}
