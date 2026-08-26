import type { ReactNode } from "react";
import { ExperienceCameraProvider } from "@/components/experience/experience-camera-provider";
import { ExhibitionModeToggle } from "@/components/gesture/exhibition-mode-toggle";

export default function ImmersiveLayout({ children }: { children: ReactNode }) {
  return (
    <ExperienceCameraProvider>
      <div className="min-h-screen bg-paper">
        <ExhibitionModeToggle />
        {children}
      </div>
    </ExperienceCameraProvider>
  );
}
