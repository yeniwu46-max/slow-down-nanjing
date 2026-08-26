import { FlowLayout } from "@/components/layout/flow-layout";

export default function FlowRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <FlowLayout>{children}</FlowLayout>;
}
