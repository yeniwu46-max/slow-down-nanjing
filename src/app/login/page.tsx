import { Suspense } from "react";
import { LoginPage } from "@/components/auth/login-page";

export default function LoginRoute() {
  return (
    <Suspense>
      <LoginPage />
    </Suspense>
  );
}
