import { UploadZone } from "@/components/flow/upload-zone";
import { FooterBar } from "@/components/layout/footer-bar";

export default function PhotoPage() {
  return (
    <>
      <UploadZone />
      <FooterBar backHref="/flow/voice" showPrivacy />
    </>
  );
}
