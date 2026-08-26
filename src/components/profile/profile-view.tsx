"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Camera,
  Heart,
  Loader2,
  LogOut,
  MapPin,
  Plus,
  Route,
  Save,
  User,
  X,
} from "lucide-react";
import { MapMini } from "@/components/map/map-mini";
import { Button } from "@/components/ui/button";
import { useUserProfile } from "@/hooks/use-user-profile";
import { cn } from "@/lib/utils";

const T = {
  title: "\u4E2A\u4EBA\u4E2D\u5FC3",
  loginHint: "\u767B\u5F55\u540E\u53EF\u7F16\u8F91\u8D44\u6599\u3001\u67E5\u770B\u6536\u85CF\u7684\u8DEF\u7EBF",
  login: "\u53BB\u767B\u5F55",
  subtitle: "\u7F16\u8F91\u57FA\u672C\u4FE1\u606F\uFF0C\u7BA1\u7406\u6536\u85CF\u7684\u6162\u884C\u8DEF\u7EBF",
  basicInfo: "\u57FA\u672C\u4FE1\u606F",
  avatar: "\u5934\u50CF",
  avatarHint: "\u70B9\u51FB\u66F4\u6362\u7167\u7247",
  nickname: "\u6635\u79F0",
  nicknamePh: "\u4F60\u7684\u6635\u79F0",
  signature: "\u4E2A\u6027\u7B7E\u540D",
  signaturePh: "\u5199\u4E00\u53E5\u4F60\u7684\u6162\u884C\u5FC3\u5F97\u2026",
  tags: "\u6807\u7B7E",
  tagPh: "\u6DFB\u52A0\u6807\u7B7E\uFF0C\u56DE\u8F66\u786E\u8BA4",
  save: "\u4FDD\u5B58",
  saved: "\u5DF2\u4FDD\u5B58",
  collected: "\u6536\u85CF\u8DEF\u7EBF",
  noRoutes: "\u8FD8\u6CA1\u6709\u6536\u85CF\u8DEF\u7EBF",
  discover: "\u53BB\u53D1\u73B0\u8DEF\u7EBF",
  uncollect: "\u53D6\u6D88\u6536\u85CF",
  openMap: "\u6253\u5F00\u5730\u56FE",
  logout: "\u9000\u51FA\u767B\u5F55",
  hello: "\u4F60\u597D\uFF0C",
  viewRecords: "\u67E5\u770B\u6162\u884C\u8BB0\u5F55",
  dot: " \u00B7 ",
} as const;

const MAX_AVATAR_BYTES = 512_000;

export function ProfileView() {
  const router = useRouter();
  const {
    authenticated,
    displayName,
    avatar,
    tags,
    signature,
    routes,
    loading,
    updateProfile,
    uncollectRoute,
  } = useUserProfile();
  const [nameInput, setNameInput] = useState("");
  const [signatureInput, setSignatureInput] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [localTags, setLocalTags] = useState<string[]>([]);
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && authenticated) {
      setNameInput(displayName);
      setSignatureInput(signature);
      setLocalTags(tags);
      setAvatarPreview(avatar);
    }
  }, [loading, authenticated, displayName, signature, tags, avatar]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!authenticated) {
    return (
      <section className="mx-auto max-w-lg px-5 py-16 text-center">
        <User className="mx-auto h-12 w-12 text-primary/60" />
        <h1 className="mt-4 font-serif text-2xl font-semibold text-ink">{T.title}</h1>
        <p className="mt-2 text-sm text-rock">{T.loginHint}</p>
        <Button href="/login?redirect=/profile" size="lg" className="mt-6">
          {T.login}
        </Button>
      </section>
    );
  }

  function addTag() {
    const next = tagInput.trim();
    if (!next || localTags.includes(next) || localTags.length >= 8) return;
    setLocalTags((prev) => [...prev, next]);
    setTagInput("");
  }

  function removeTag(tag: string) {
    setLocalTags((prev) => prev.filter((t) => t !== tag));
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    if (file.size > MAX_AVATAR_BYTES) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    updateProfile({
      name: nameInput || displayName,
      signature: signatureInput.trim(),
      tags: localTags,
      avatar: avatarPreview,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleLogout() {
    await fetch("/api/journiv/auth", { method: "DELETE" });
    router.push("/login");
  }

  const currentName = nameInput || displayName;

  return (
    <section className="mx-auto max-w-3xl px-5 pb-16 pt-8 md:px-10">
      <div className="animate-fade-up">
        <h1 className="font-serif text-3xl font-semibold text-ink">{T.title}</h1>
        <p className="mt-1 text-sm text-rock">{T.subtitle}</p>
      </div>

      <form
        onSubmit={handleSave}
        className="glass-strong mt-8 space-y-5 rounded-3xl p-6 shadow-m"
      >
        <h2 className="text-sm font-medium text-ink">{T.basicInfo}</h2>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-full border border-cloud/80 bg-white/70 shadow-s"
            aria-label={T.avatarHint}
          >
            {avatarPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarPreview} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center bg-primary/10 text-primary">
                <User className="h-8 w-8" />
              </span>
            )}
            <span className="absolute inset-0 flex items-center justify-center bg-ink/0 transition group-hover:bg-ink/25">
              <Camera className="h-5 w-5 text-white opacity-0 transition group-hover:opacity-100" />
            </span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
          <div>
            <p className="text-xs font-medium text-ink">{T.avatar}</p>
            <p className="mt-1 text-xs text-rock">{T.avatarHint}</p>
          </div>
        </div>

        <label className="block">
          <span className="text-xs text-rock">{T.nickname}</span>
          <input
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder={T.nicknamePh}
            className="mt-1 w-full rounded-xl border border-cloud/80 bg-white/70 px-3 py-2 text-sm text-ink outline-none focus:border-primary/50"
          />
        </label>

        <label className="block">
          <span className="text-xs text-rock">{T.signature}</span>
          <textarea
            value={signatureInput}
            onChange={(e) => setSignatureInput(e.target.value)}
            placeholder={T.signaturePh}
            rows={2}
            maxLength={120}
            className="mt-1 w-full resize-none rounded-xl border border-cloud/80 bg-white/70 px-3 py-2 text-sm text-ink outline-none focus:border-primary/50"
          />
        </label>

        <div>
          <span className="text-xs text-rock">{T.tags}</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {localTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs text-primary"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="rounded-full p-0.5 transition hover:bg-primary/20"
                  aria-label={`\u79FB\u9664\u6807\u7B7E ${tag}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag();
                }
              }}
              placeholder={T.tagPh}
              className="flex-1 rounded-xl border border-cloud/80 bg-white/70 px-3 py-2 text-sm text-ink outline-none focus:border-primary/50"
            />
            <button
              type="button"
              onClick={addTag}
              disabled={!tagInput.trim() || localTags.length >= 8}
              className={cn(
                "inline-flex h-10 w-10 items-center justify-center rounded-xl border border-primary/30 text-primary transition",
                "hover:bg-primary/10 disabled:opacity-40",
              )}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <Button type="submit" size="md" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {T.save}
          </Button>
          {saved && <span className="text-xs text-primary">{T.saved}</span>}
        </div>
      </form>

      <div className="glass-strong mt-6 rounded-3xl p-6 shadow-m">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-medium text-ink">
            <Heart className="h-4 w-4 text-primary" />
            {T.collected}
            <span className="text-rock">({routes.length})</span>
          </h2>
        </div>

        {routes.length === 0 ? (
          <div className="rounded-2xl bg-white/50 py-10 text-center">
            <Route className="mx-auto h-8 w-8 text-primary/40" />
            <p className="mt-3 text-sm text-rock">{T.noRoutes}</p>
            <Button href="/flow/result" variant="secondary" size="md" className="mt-4">
              {T.discover}
            </Button>
          </div>
        ) : (
          <ul className="space-y-3">
            {routes.map((route) => (
              <li
                key={route.id}
                className="flex gap-4 rounded-2xl bg-white/50 p-4 transition hover:bg-white/70"
              >
                <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl">
                  <MapMini className="h-full w-full" showRoute zoom={11.8} pitch={35} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-serif font-medium text-ink">{route.name}</p>
                  {route.nameEn && (
                    <p className="text-xs italic text-gold">{route.nameEn}</p>
                  )}
                  <p className="mt-1 text-xs text-rock">
                    {route.duration}
                    {T.dot}
                    {route.distance}
                  </p>
                  {route.tagline && (
                    <p className="mt-1 line-clamp-1 text-xs text-rock">{route.tagline}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => uncollectRoute(route.id)}
                  className="shrink-0 self-start text-xs text-rock transition hover:text-red-500"
                >
                  {T.uncollect}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button variant="secondary" href="/map">
          <MapPin className="h-4 w-4" />
          {T.openMap}
        </Button>
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-rock transition hover:text-ink"
        >
          <LogOut className="h-4 w-4" />
          {T.logout}
        </button>
      </div>

      {currentName && (
        <p className="mt-6 text-center text-xs text-rock">
          {T.hello}
          {currentName}
          <Link href="/records" className="ml-2 text-primary hover:underline">
            {T.viewRecords}
          </Link>
        </p>
      )}
    </section>
  );
}
