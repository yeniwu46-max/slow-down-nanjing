"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Leaf, Loader2, Lock, Mail, User } from "lucide-react";
import {
  normalizeEmail,
  resolveLoginEmail,
  validateLoginInput,
  validateRegisterInput,
} from "@/lib/journiv/auth-validation";
import { cn } from "@/lib/utils";

export function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/";
  const initialMode = searchParams.get("mode") === "register" ? "register" : "login";

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function switchMode(next: "login" | "register") {
    setMode(next);
    setError(null);
    setPassword("");
    setConfirmPassword("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const clientError =
      mode === "register"
        ? validateRegisterInput({
            email,
            password,
            confirmPassword,
            name: displayName,
          })
        : validateLoginInput({ email: username, password });

    if (clientError) {
      setError(clientError);
      setLoading(false);
      return;
    }

    try {
      const payload =
        mode === "register"
          ? {
              mode: "register" as const,
              email: normalizeEmail(email),
              password,
              confirmPassword,
              name: displayName.trim(),
            }
          : {
              mode: "login" as const,
              email: resolveLoginEmail(username),
              password,
            };

      const res = await fetch("/api/journiv/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as { error?: string; registered?: boolean };

      if (!res.ok) {
        throw new Error(data.error ?? (mode === "register" ? "注册失败" : "登录失败"));
      }

      router.push(redirect);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : mode === "register" ? "注册失败" : "登录失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-paper">
      {/* Left atmospheric panel */}
      <div className="relative hidden min-h-screen w-[58%] lg:block">
        <Image
          src="/images/login-bg.jpg"
          alt=""
          fill
          className="object-cover"
          priority
          sizes="58vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent" />

        <div className="relative z-10 flex h-full flex-col justify-between p-10 xl:p-14">
          <div className="pt-8">
            <h1 className="font-serif text-5xl leading-[1.35] tracking-wide text-[#3d4a42] xl:text-[3.25rem]">
              <span className="block">{"\u5b81"}</span>
              <span className="ml-10 flex items-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full border border-[#c5d5c8]/80 bg-white/30 text-4xl backdrop-blur-sm">
                  {"\u53ef"}
                </span>
              </span>
              <span className="ml-20 flex items-center gap-3">
                {"\u6162"}
                <Leaf className="h-7 w-7 text-primary" strokeWidth={1.5} />
              </span>
              <span className="ml-32 block">{"\u4e00\u70b9"}</span>
            </h1>
            <p className="mt-10 max-w-xs font-serif text-lg leading-relaxed text-[#5a6b62]">
              {"\u5728\u6162\u4e2d\uff0c\u9047\u89c1\u57ce\u5e02\u7684\u6e29\u5ea6"}
            </p>
          </div>
          <p className="text-xs tracking-[0.25em] text-[#6b7a72] uppercase">
            Slow down, Feel Nanjing.
          </p>
        </div>
      </div>

      {/* Curved divider + center leaf badge */}
      <div
        className="pointer-events-none absolute left-[58%] top-1/2 z-20 hidden -translate-x-1/2 -translate-y-1/2 lg:block"
        aria-hidden
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-paper shadow-l">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-logo-green)]">
            <Leaf className="h-5 w-5 text-white" strokeWidth={1.5} />
          </span>
        </div>
      </div>

      {/* Right form panel */}
      <div className="relative flex min-h-screen flex-1 flex-col">
        <div className="absolute inset-0 bg-paper lg:[clip-path:polygon(8%_0,100%_0,100%_100%,0_100%)]" />
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 80% 20%, rgba(127,167,155,0.15) 0%, transparent 50%), radial-gradient(ellipse at 20% 80%, rgba(127,167,155,0.1) 0%, transparent 40%)",
          }}
        />

        <div className="relative z-10 flex flex-1 flex-col px-8 py-10 sm:px-12 lg:px-16 lg:py-14">
          <div className="flex justify-end">
            <Image
              src="/logos/logo-seal.png"
              alt="\u5b81\u53ef\u6162\u4e00\u70b9"
              width={56}
              height={56}
              className="h-14 w-14 object-contain"
            />
          </div>

          {/* Mobile branding */}
          <div className="mb-10 mt-6 lg:hidden">
            <h1 className="font-serif text-3xl text-ink">{"\u5b81\u53ef\u6162\u4e00\u70b9"}</h1>
            <p className="mt-2 text-sm text-rock">
              {"\u5728\u6162\u4e2d\uff0c\u9047\u89c1\u57ce\u5e02\u7684\u6e29\u5ea6"}
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center"
          >
            <div className="mb-8 text-center lg:text-left">
              <h2 className="font-serif text-2xl text-ink">
                {mode === "login" ? "欢迎回来" : "创建 Journiv 账户"}
              </h2>
              <p className="mt-2 text-sm text-rock">
                {mode === "login"
                  ? "登录后可同步城市日记至云端"
                  : "注册后即可开始记录你的慢生活"}
              </p>
            </div>

            <div className="space-y-8">
              {mode === "login" ? (
                <label className="block">
                  <span className="flex items-center gap-3 border-b border-cloud pb-3">
                    <User className="h-5 w-5 shrink-0 text-rock" strokeWidth={1.5} />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder={"\u7528\u6237\u540d / \u90ae\u7bb1"}
                      className="w-full bg-transparent text-base text-charcoal outline-none placeholder:text-rock/70"
                      autoComplete="username"
                    />
                  </span>
                </label>
              ) : (
                <>
                  <label className="block">
                    <span className="flex items-center gap-3 border-b border-cloud pb-3">
                      <Mail className="h-5 w-5 shrink-0 text-rock" strokeWidth={1.5} />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="邮箱"
                        className="w-full bg-transparent text-base text-charcoal outline-none placeholder:text-rock/70"
                        autoComplete="email"
                      />
                    </span>
                  </label>

                  <label className="block">
                    <span className="flex items-center gap-3 border-b border-cloud pb-3">
                      <User className="h-5 w-5 shrink-0 text-rock" strokeWidth={1.5} />
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="昵称"
                        className="w-full bg-transparent text-base text-charcoal outline-none placeholder:text-rock/70"
                        autoComplete="name"
                      />
                    </span>
                  </label>
                </>
              )}

              <label className="block">
                <span className="flex items-center gap-3 border-b border-cloud pb-3">
                  <Lock className="h-5 w-5 shrink-0 text-rock" strokeWidth={1.5} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={"\u5bc6\u7801"}
                    className="w-full bg-transparent text-base text-charcoal outline-none placeholder:text-rock/70"
                    autoComplete={mode === "register" ? "new-password" : "current-password"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="shrink-0 text-rock transition-colors hover:text-ink"
                    aria-label={showPassword ? "\u9690\u85cf\u5bc6\u7801" : "\u663e\u793a\u5bc6\u7801"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" strokeWidth={1.5} />
                    ) : (
                      <Eye className="h-5 w-5" strokeWidth={1.5} />
                    )}
                  </button>
                </span>
              </label>

              {mode === "register" && (
                <label className="block">
                  <span className="flex items-center gap-3 border-b border-cloud pb-3">
                    <Lock className="h-5 w-5 shrink-0 text-rock" strokeWidth={1.5} />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="确认密码"
                      className="w-full bg-transparent text-base text-charcoal outline-none placeholder:text-rock/70"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      className="shrink-0 text-rock transition-colors hover:text-ink"
                      aria-label={showConfirmPassword ? "\u9690\u85cf\u5bc6\u7801" : "\u663e\u793a\u5bc6\u7801"}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5" strokeWidth={1.5} />
                      ) : (
                        <Eye className="h-5 w-5" strokeWidth={1.5} />
                      )}
                    </button>
                  </span>
                </label>
              )}
            </div>

            {mode === "register" && (
              <p className="mt-4 text-xs text-rock/80">密码至少 8 位，需包含字母和数字</p>
            )}

            {error && <p className="mt-6 text-center text-sm text-red-600">{error}</p>}

            <div className="mt-14 flex flex-col items-center">
              <div className="relative">
                <span
                  className="absolute inset-0 rounded-full border border-dashed border-primary/40"
                  aria-hidden
                />
                <span
                  className="absolute -left-1 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-primary/50"
                  aria-hidden
                />
                <span
                  className="absolute -right-1 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-primary/50"
                  aria-hidden
                />
                <button
                  type="submit"
                  disabled={loading}
                  className={cn(
                    "relative m-2 flex h-16 w-16 items-center justify-center rounded-full",
                    "bg-[var(--color-logo-green)] text-white shadow-m",
                    "transition-transform hover:scale-105 active:scale-95 disabled:opacity-60",
                  )}
                  aria-label={mode === "login" ? "\u767b\u5f55" : "\u6ce8\u518c"}
                >
                  {loading ? (
                    <Loader2 className="h-6 w-6 animate-spin" strokeWidth={1.5} />
                  ) : (
                    <ArrowRight className="h-6 w-6" strokeWidth={1.5} />
                  )}
                </button>
              </div>

              <button
                type="button"
                onClick={() => switchMode(mode === "login" ? "register" : "login")}
                className="mt-4 text-sm text-rock transition-colors hover:text-primary"
              >
                {mode === "login" ? "没有账号？注册 Journiv 账户" : "已有账号？去登录"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
