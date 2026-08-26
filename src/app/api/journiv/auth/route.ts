import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  normalizeEmail,
  resolveLoginEmail,
  validateLoginInput,
  validateRegisterInput,
} from "@/lib/journiv/auth-validation";
import {
  clearLocalUser,
  getLocalUser,
  localLoginUser,
  setLocalUserCookie,
} from "@/lib/journiv/local-store";
import { getJournivMode } from "@/lib/journiv/mode";
import {
  JOURNIV_ACCESS_COOKIE,
  JOURNIV_REFRESH_COOKIE,
  getValidAccessToken,
  journivFetch,
  journivLogin,
  journivRegister,
} from "@/lib/journiv/server";
import { journivErrorResponse } from "@/lib/journiv/route-utils";
import type { JournivUser } from "@/lib/journiv/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
      confirmPassword?: string;
      name?: string;
      mode?: "login" | "register";
    };

    const journivMode = await getJournivMode();

    if (journivMode === "local") {
      const validationError =
        body.mode === "register"
          ? validateRegisterInput({
              email: body.email ?? "",
              password: body.password ?? "",
              confirmPassword: body.confirmPassword,
              name: body.name ?? "",
            })
          : validateLoginInput({ email: body.email ?? "", password: body.password ?? "" });
      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 });
      }

      const email = resolveLoginEmail(body.email!);
      const user = localLoginUser(email, body.name?.trim());
      await setLocalUserCookie(user);
      return NextResponse.json({
        user,
        mode: "local",
        registered: body.mode === "register",
      });
    }

    if (body.mode === "register") {
      const validationError = validateRegisterInput({
        email: body.email ?? "",
        password: body.password ?? "",
        confirmPassword: body.confirmPassword,
        name: body.name ?? "",
      });
      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 });
      }

      const data = await journivRegister(
        normalizeEmail(body.email!),
        body.password!,
        body.name!.trim(),
      );

      const jar = await cookies();
      jar.set(JOURNIV_ACCESS_COOKIE, data.access_token, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 15,
      });
      jar.set(JOURNIV_REFRESH_COOKIE, data.refresh_token, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });

      return NextResponse.json({ user: data.user, mode: "remote", registered: true });
    }

    const validationError = validateLoginInput({
      email: body.email ?? "",
      password: body.password ?? "",
    });
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const data = await journivLogin(resolveLoginEmail(body.email!), body.password!);

    const jar = await cookies();
    jar.set(JOURNIV_ACCESS_COOKIE, data.access_token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 15,
    });
    jar.set(JOURNIV_REFRESH_COOKIE, data.refresh_token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return NextResponse.json({ user: data.user, mode: "remote" });
  } catch (error) {
    return journivErrorResponse(error);
  }
}

export async function GET() {
  const journivMode = await getJournivMode();

  if (journivMode === "local") {
    const user = await getLocalUser();
    if (!user) {
      return NextResponse.json({ authenticated: false, mode: "local" }, { status: 401 });
    }
    return NextResponse.json({ authenticated: true, user, mode: "local" });
  }

  try {
    const token = await getValidAccessToken();
    if (!token) {
      return NextResponse.json({ authenticated: false, mode: "remote" }, { status: 401 });
    }
    const user = await journivFetch<JournivUser>("/users/me", { token });
    return NextResponse.json({ authenticated: true, user, mode: "remote" });
  } catch {
    return NextResponse.json({ authenticated: false, mode: "remote" }, { status: 401 });
  }
}

export async function DELETE() {
  const jar = await cookies();
  jar.delete(JOURNIV_ACCESS_COOKIE);
  jar.delete(JOURNIV_REFRESH_COOKIE);
  await clearLocalUser();
  return NextResponse.json({ ok: true });
}
