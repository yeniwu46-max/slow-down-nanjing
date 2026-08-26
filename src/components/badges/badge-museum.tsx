"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useReducedMotion,
} from "motion/react";
import {
  ArrowRight,
  Bird,
  Building2,
  Landmark,
  Lock,
  Moon,
  Package,
  SlidersHorizontal,
  Sparkles,
  TreePine,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getArCheckinByBadge, hasArBadge } from "@/lib/ar/checkins";
import { useBadgeGestureCarousel } from "@/hooks/use-page-gesture-handlers";

type BadgeCategory = "自然" | "古迹" | "城市" | "夜晚";
type FilterOption = "全部" | BadgeCategory;

interface Badge {
  id: string;
  name: string;
  date?: string;
  obtained: boolean;
  isNew?: boolean;
  icon: LucideIcon;
  tone: "bronze" | "gold" | "jade" | "silver";
  category: BadgeCategory;
  description: string;
  route: string;
}

const FILTERS: FilterOption[] = ["全部", "自然", "古迹", "城市", "夜晚"];

const OBTAINED_BADGES: Omit<Badge, "obtained">[] = [
  {
    id: "wutong",
    name: "梧桐初遇",
    date: "2024.05.12 获得",
    icon: TreePine,
    tone: "jade",
    category: "自然",
    description: "在梧桐大道完成首次慢行路线后解锁，记录你与南京绿意的第一次相遇。",
    route: "梧桐慢行",
    isNew: true,
  },
  {
    id: "heritage",
    name: "古迹探访者",
    date: "2024.05.20 获得",
    icon: Landmark,
    tone: "gold",
    category: "古迹",
    description: "探访三处文化古迹并完成打卡任务，成为城市的温柔访客。",
    route: "台城古迹线",
  },
  {
    id: "moon",
    name: "月下慢行",
    date: "2024.06.01 获得",
    icon: Moon,
    tone: "bronze",
    category: "夜晚",
    description: "在夜间完成一条慢行路线，于月色与街灯间感受城市的另一面。",
    route: "秦淮河夜游",
  },
  {
    id: "nature",
    name: "自然聆听者",
    date: "2024.06.07 获得",
    icon: Bird,
    tone: "silver",
    category: "自然",
    description: "在玄武湖畔静听风声与水波，完成自然聆听任务后获得。",
    route: "玄武湖环线",
  },
  {
    id: "urban",
    name: "城市漫游家",
    date: "2024.06.15 获得",
    icon: Building2,
    tone: "gold",
    category: "城市",
    description: "穿梭于街巷与建筑之间，累计完成五条城市漫游路线。",
    route: "颐和路漫游",
  },
  {
    id: "canal",
    name: "秦淮听水",
    date: "2024.06.22 获得",
    icon: Sparkles,
    tone: "bronze",
    category: "城市",
    description: "沿秦淮河缓步而行，在水声与桨影间完成慢行记录。",
    route: "秦淮水岸",
  },
  {
    id: "wall",
    name: "城墙守望",
    date: "2024.07.03 获得",
    icon: Landmark,
    tone: "jade",
    category: "古迹",
    description: "登上明城墙，以慢行者的视角守望城市轮廓。",
    route: "台城段慢行",
  },
  {
    id: "dawn",
    name: "晨光拾步",
    date: "2024.07.18 获得",
    icon: Bird,
    tone: "silver",
    category: "自然",
    description: "在清晨完成一条路线，捕捉城市刚醒时的柔和光线。",
    route: "紫金山晨行",
  },
  {
    id: "lantern",
    name: "灯影随行",
    date: "2024.08.02 获得",
    icon: Moon,
    tone: "gold",
    category: "夜晚",
    description: "在老门东灯影下完成夜间慢行，记录烟火与静寂的交界。",
    route: "老门东夜游",
  },
  {
    id: "garden",
    name: "园林闲步",
    date: "2024.08.14 获得",
    icon: TreePine,
    tone: "jade",
    category: "自然",
    description: "在瞻园或莫愁湖完成一次无目的漫游，感受园林的留白。",
    route: "瞻园慢行",
  },
  {
    id: "alley",
    name: "巷弄寻迹",
    date: "2024.09.01 获得",
    icon: Building2,
    tone: "bronze",
    category: "城市",
    description: "深入街巷，发现地图之外的城市肌理与日常温度。",
    route: "南捕厅巷",
  },
  {
    id: "star",
    name: "星夜归人",
    date: "2024.09.20 获得",
    icon: Moon,
    tone: "silver",
    category: "夜晚",
    description: "在深夜完成归途路线，以慢行结束一天的城市对话。",
    route: "滨江夜行",
  },
];

const LOCKED_TEMPLATES: Array<{
  id: string;
  name: string;
  category: BadgeCategory;
  description: string;
  route: string;
}> = [
  { id: "l1", name: "雨巷印记", category: "城市", description: "在雨中完成一次慢行，听见城市湿润的回响。", route: "待发现" },
  { id: "l2", name: "石像低语", category: "古迹", description: "在四处石刻前驻足，完成文化聆听任务。", route: "待发现" },
  { id: "l3", name: "叶落知秋", category: "自然", description: "在秋日梧桐下完成季节限定路线。", route: "待发现" },
  { id: "l4", name: "雪夜静行", category: "夜晚", description: "在雪夜完成一次极少人走的慢行路线。", route: "待发现" },
  { id: "l5", name: "渡口余温", category: "城市", description: "沿长江岸线慢行，记录水与城市的长谈。", route: "待发现" },
  { id: "l6", name: "钟山云影", category: "自然", description: "在紫金山云雾间完成一次上行慢行。", route: "待发现" },
  { id: "l7", name: "书页之间", category: "古迹", description: "探访三处文献相关地点并完成打卡。", route: "待发现" },
  { id: "l8", name: "桥上看云", category: "城市", description: "在长江大桥完成一次远眺慢行。", route: "待发现" },
  { id: "l9", name: "萤火小径", category: "夜晚", description: "在夏夜完成限定时段的萤火虫路线。", route: "待发现" },
  { id: "l10", name: "茶烟袅袅", category: "城市", description: "在老城茶肆周边完成三次慢行记录。", route: "待发现" },
  { id: "l11", name: "苔痕深处", category: "古迹", description: "在潮湿季节探访古墙苔痕并完成记录。", route: "待发现" },
  { id: "l12", name: "风铃午后", category: "自然", description: "在湖畔风铃装置附近完成静听任务。", route: "待发现" },
  { id: "l13", name: "星河入梦", category: "夜晚", description: "在观星点完成一次深夜慢行。", route: "待发现" },
  { id: "l14", name: "旧书气味", category: "城市", description: "在旧书市场周边完成文化漫游。", route: "待发现" },
  { id: "l15", name: "碑林沉思", category: "古迹", description: "在碑林完成三次驻足阅读任务。", route: "待发现" },
  { id: "l16", name: "初雪印记", category: "自然", description: "在城市初雪日完成限定慢行。", route: "待发现" },
  {
    id: "xuanwu-lake-letter",
    name: "湖风信笺",
    category: "自然",
    description: "在玄武湖 AR 打卡并完成湖风信笺互动后解锁。",
    route: "玄武湖 AR",
  },
];

const ALL_BADGES: Badge[] = [
  ...OBTAINED_BADGES.map((b) => ({ ...b, obtained: true })),
  ...LOCKED_TEMPLATES.map((b) => ({
    ...b,
    obtained: false,
    icon: Package,
    tone: "silver" as const,
  })),
];

const TOTAL_BADGES = ALL_BADGES.length;
const OBTAINED_COUNT = OBTAINED_BADGES.length;

const TONE_STYLES: Record<Badge["tone"], string> = {
  bronze: "from-[#cdb187] via-[#a98a5e] to-[#8a6d44] text-[#5b4327]",
  gold: "from-[#e4cd92] via-[#c6a36b] to-[#9c7c45] text-[#5e4720]",
  jade: "from-[#b9c9b3] via-[#8aa790] to-[#5f7d6b] text-[#324036]",
  silver: "from-[#dcdcd6] via-[#b7b8b2] to-[#8f9089] text-[#4a4b46]",
};

function WaxSealPlaceholder({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "relative flex items-center justify-center rounded-full border border-dashed",
        "bg-gradient-to-br from-[#e8e4dc]/50 via-[#d4cfc4]/35 to-[#c5bfb2]/25",
        "border-[#b8b0a0]/50 shadow-inner",
        active ? "h-28 w-24 md:h-36 md:w-32" : "h-20 w-16 md:h-28 md:w-24",
      )}
    >
      <span className="absolute inset-2 rounded-full border border-[#c9c2b4]/40" />
      <Lock className={cn("text-[#9a9285]/70", active ? "h-8 w-8 md:h-10 md:w-10" : "h-5 w-5 md:h-7 md:w-7")} strokeWidth={1.2} />
    </span>
  );
}

function BadgeSeal({
  badge,
  active,
  layoutId,
  onClick,
}: {
  badge: Badge;
  active: boolean;
  layoutId?: string;
  onClick?: () => void;
}) {
  const Icon = badge.icon;
  const reduceMotion = useReducedMotion();

  if (!badge.obtained) {
    return (
      <button type="button" onClick={onClick} className="group flex flex-col items-center">
        <WaxSealPlaceholder active={active} />
        <span className="mt-3 w-full max-w-[7rem] rounded-md bg-white/30 px-1 py-1.5 text-center shadow-s backdrop-blur-sm">
          <span className="block truncate text-[11px] text-rock/80 md:text-xs">{badge.name}</span>
          <span className="mt-0.5 block text-[9px] text-rock/50 md:text-[10px]">未解锁</span>
        </span>
      </button>
    );
  }

  return (
    <button type="button" onClick={onClick} className="group flex flex-col items-center">
      <motion.span
        layoutId={layoutId}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        className={cn(
          "relative flex items-center justify-center rounded-full bg-gradient-to-br shadow-m ring-1 ring-white/50",
          TONE_STYLES[badge.tone],
          active ? "h-28 w-24 md:h-36 md:w-32" : "h-20 w-16 md:h-28 md:w-24",
          !active && "opacity-85 saturate-[0.92]",
        )}
        style={{ borderRadius: "50%" }}
        animate={active && !reduceMotion ? { scale: 1.02 } : { scale: 1 }}
      >
        <Icon
          className={cn(active ? "h-10 w-10 md:h-12 md:w-12" : "h-6 w-6 md:h-8 md:w-8")}
          strokeWidth={1.4}
        />
        {badge.isNew && active && (
          <motion.span
            initial={{ y: -48, opacity: 0, rotate: -8 }}
            animate={{ y: 0, opacity: 1, rotate: -6 }}
            transition={{ type: "spring", stiffness: 420, damping: 18, delay: 0.15 }}
            className="absolute -top-3 right-0 rounded-sm bg-primary px-1.5 py-0.5 text-[9px] font-medium tracking-wider text-white shadow-s"
          >
            新
          </motion.span>
        )}
      </motion.span>
      <span className="mt-3 w-full max-w-[7rem] rounded-md bg-gradient-to-b from-[#e9e6df] to-[#cfccc4] px-1 py-1.5 text-center shadow-s">
        <span className="block truncate text-[11px] font-medium text-ink md:text-xs">{badge.name}</span>
        <span className="mt-0.5 block truncate text-[9px] text-rock md:text-[10px]">
          {badge.date ?? "未解锁"}
        </span>
      </span>
    </button>
  );
}

export function BadgeMuseum() {
  const [filter, setFilter] = useState<FilterOption>("全部");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selected, setSelected] = useState(0);
  const [detailOpen, setDetailOpen] = useState(false);
  const [arTick, setArTick] = useState(0);
  const filterRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    setArTick((t) => t + 1);
    const onStorage = (e: StorageEvent) => {
      if (e.key === "slowdown:ar:checkins") setArTick((t) => t + 1);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const allBadges = useMemo(() => {
    void arTick;
    return ALL_BADGES.map((badge) => {
      if (badge.id !== "xuanwu-lake-letter") return badge;
      if (!hasArBadge("xuanwu-lake-letter")) return badge;
      const checkin = getArCheckinByBadge("xuanwu-lake-letter");
      const date = checkin?.at
        ? `${new Date(checkin.at).toLocaleDateString("zh-CN")} 获得`
        : "AR 打卡获得";
      return {
        ...badge,
        obtained: true,
        icon: Bird,
        tone: "jade" as const,
        date,
        isNew: true,
      };
    });
  }, [arTick]);

  const visibleBadges = useMemo(
    () => (filter === "全部" ? allBadges : allBadges.filter((b) => b.category === filter)),
    [allBadges, filter],
  );

  const obtainedCount = useMemo(
    () => allBadges.filter((b) => b.obtained).length,
    [allBadges],
  );

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "center",
    containScroll: "trimSnaps",
    skipSnaps: false,
  });

  const focusedBadge = visibleBadges[selected] ?? visibleBadges[0];

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelected(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  useEffect(() => {
    emblaApi?.reInit();
    setSelected(0);
    setDetailOpen(false);
    emblaApi?.scrollTo(0, true);
  }, [filter, emblaApi]);

  useEffect(() => {
    if (selected >= visibleBadges.length) {
      setSelected(Math.max(0, visibleBadges.length - 1));
    }
  }, [selected, visibleBadges.length]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    }
    if (filterOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [filterOpen]);

  function selectFilter(next: FilterOption) {
    setFilter(next);
    setFilterOpen(false);
  }

  function handleBadgeClick(index: number) {
    emblaApi?.scrollTo(index);
    if (index === selected) {
      setDetailOpen((open) => !open);
    } else {
      setSelected(index);
      setDetailOpen(false);
    }
  }

  useBadgeGestureCarousel(
    () => emblaApi?.scrollPrev(),
    () => emblaApi?.scrollNext(),
    () => setDetailOpen(true),
  );

  return (
    <section className="relative min-h-[calc(100vh-4rem)] w-full overflow-hidden">
      <div className="absolute inset-0 bg-[#eef0ea]" />
      <Image
        src="/images/badge-museum-bg.png"
        alt=""
        fill
        priority
        className="object-cover object-center opacity-[0.42]"
        sizes="100vw"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#f4f2ec]/75 via-[#f4f2ec]/55 to-[#e9ece6]/80" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col px-5 pb-10 pt-8 md:px-12 lg:pl-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="animate-fade-up">
            <h1 className="flex items-center gap-2 font-serif text-3xl font-semibold text-ink md:text-4xl">
              徽章博物馆
              <TreePine className="h-6 w-6 text-primary/70" strokeWidth={1.5} />
            </h1>
            <p className="mt-2 text-sm text-rock">每一次的慢行，都是值得珍藏的记忆。</p>
            <p className="mt-3 text-sm text-rock">
              已解锁{" "}
              <span className="font-serif text-lg font-semibold text-primary">{obtainedCount}</span> /{" "}
              {TOTAL_BADGES} 枚徽章
            </p>
          </div>

          <div ref={filterRef} className="relative">
            <button
              type="button"
              onClick={() => setFilterOpen((o) => !o)}
              aria-expanded={filterOpen}
              aria-haspopup="listbox"
              className={cn(
                "flex items-center gap-2 rounded-full glass-strong px-4 py-2 text-sm text-ink shadow-s transition-colors hover:bg-white/70",
                filterOpen && "ring-2 ring-primary/30",
                filter !== "全部" && "bg-primary/10 text-primary",
              )}
            >
              <SlidersHorizontal className="h-4 w-4" />
              筛选{filter !== "全部" ? ` · ${filter}` : ""}
            </button>

            <AnimatePresence>
              {filterOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                  role="listbox"
                  aria-label="徽章分类筛选"
                  className="absolute right-0 top-full z-20 mt-2 min-w-[9rem] rounded-2xl glass-strong p-2 shadow-l"
                >
                  {FILTERS.map((f) => (
                    <button
                      key={f}
                      type="button"
                      role="option"
                      aria-selected={filter === f}
                      onClick={() => selectFilter(f)}
                      className={cn(
                        "block w-full rounded-xl px-4 py-2 text-left text-sm transition-colors",
                        filter === f
                          ? "bg-primary text-white"
                          : "text-rock hover:bg-white/60 hover:text-ink",
                      )}
                    >
                      {f}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <LayoutGroup id="badge-museum">
          <motion.div
            layout
            className="relative mt-8 flex flex-1 items-center justify-center"
            transition={{ layout: { duration: reduceMotion ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] } }}
          >
            <div className="relative w-full max-w-5xl">
              <div className="relative rounded-t-[2rem] border border-white/60 bg-gradient-to-b from-white/40 to-white/15 px-2 pb-8 pt-10 shadow-l backdrop-blur-md md:px-6">
                <div className="absolute left-1/2 top-4 -translate-x-1/2 rounded-md bg-gradient-to-b from-[#cbb489] to-[#9c7c45] px-5 py-1.5 text-xs tracking-[0.3em] text-[#4a3717] shadow-s">
                  南京 · 慢行 · 记忆
                </div>

                <div className="overflow-hidden px-2 pt-10" ref={emblaRef}>
                  <motion.div
                    layout
                    className="flex touch-pan-y"
                    transition={{ layout: { duration: reduceMotion ? 0 : 0.35 } }}
                  >
                    <AnimatePresence mode="popLayout" initial={false}>
                      {visibleBadges.map((badge, index) => (
                        <motion.div
                          key={badge.id}
                          layout
                          initial={{ opacity: 0, scale: 0.92 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.92 }}
                          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                          className="min-w-0 flex-[0_0_38%] px-1 sm:flex-[0_0_32%] md:flex-[0_0_28%] lg:flex-[0_0_24%]"
                        >
                          <BadgeSeal
                            badge={badge}
                            active={index === selected}
                            layoutId={index === selected ? `badge-seal-${badge.id}` : undefined}
                            onClick={() => handleBadgeClick(index)}
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </motion.div>
                </div>

                <div className="mx-auto mt-8 max-w-md px-4">
                  <div className="flex items-center justify-between text-[11px] tracking-widest text-rock/80">
                    <span>{selected + 1}</span>
                    <span className="font-serif text-xs text-ink/80">藏品序列</span>
                    <span>{visibleBadges.length}</span>
                  </div>
                  <div className="relative mt-2 h-1 overflow-hidden rounded-full bg-cloud/60">
                    <motion.div
                      className="absolute inset-y-0 left-0 rounded-full bg-primary/70"
                      animate={{
                        width: visibleBadges.length
                          ? `${((selected + 1) / visibleBadges.length) * 100}%`
                          : "0%",
                      }}
                      transition={{ duration: reduceMotion ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                  <p className="mt-2 text-center text-xs text-rock">
                    {filter === "全部"
                      ? `${selected + 1} / ${TOTAL_BADGES} · 藏品序列`
                      : `${selected + 1} / ${visibleBadges.length} · ${filter}`}
                  </p>
                </div>
              </div>

              <div className="h-5 rounded-b-[1.25rem] bg-gradient-to-b from-[#6f5638] to-[#4f3d27] shadow-l md:h-7" />
              <div className="mx-auto h-2 w-[92%] rounded-b-xl bg-[#3d2f1e]/80" />

              <AnimatePresence mode="wait">
                {focusedBadge && (
                  <motion.div
                    key={`${filter}-${focusedBadge.id}`}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                    className="relative mt-6"
                  >
                    <motion.div
                      animate={{
                        scale: detailOpen ? 1.01 : 1,
                        filter: detailOpen ? "blur(0px)" : "blur(0px)",
                      }}
                      className={cn(
                        "rounded-2xl glass-strong p-5 shadow-m md:p-6",
                        detailOpen && "ring-1 ring-primary/20",
                      )}
                    >
                      <AnimatePresence>
                        {detailOpen && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="pointer-events-none absolute inset-0 rounded-2xl bg-white/25 backdrop-blur-sm"
                          />
                        )}
                      </AnimatePresence>

                      <div className="relative flex flex-wrap items-start gap-4">
                        {focusedBadge.obtained && (
                          <motion.span
                            layoutId={`badge-seal-${focusedBadge.id}`}
                            transition={{ type: "spring", stiffness: 320, damping: 32 }}
                            className={cn(
                              "hidden h-16 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br shadow-m ring-1 ring-white/50 sm:flex",
                              TONE_STYLES[focusedBadge.tone],
                            )}
                          >
                            <focusedBadge.icon className="h-7 w-7" strokeWidth={1.4} />
                          </motion.span>
                        )}

                        <div className="min-w-0 flex-1">
                          <motion.h2
                            initial={{ opacity: 0.6 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: detailOpen ? 0.12 : 0, duration: 0.4 }}
                            className="font-serif text-lg font-semibold text-ink md:text-xl"
                          >
                            {focusedBadge.name}
                          </motion.h2>
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: detailOpen ? 0.18 : 0.05, duration: 0.4 }}
                            className="mt-1 text-xs text-rock"
                          >
                            {focusedBadge.obtained ? focusedBadge.date : "尚未解锁 · 继续慢行以收集"}
                          </motion.p>
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: detailOpen ? 0.24 : 0.08, duration: 0.45 }}
                            className="mt-3 text-sm leading-relaxed text-charcoal/80"
                          >
                            {focusedBadge.description}
                          </motion.p>
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: detailOpen ? 0.3 : 0.1, duration: 0.45 }}
                            className="mt-2 text-xs text-rock"
                          >
                            关联路线：
                            <span className="ml-1 font-medium text-ink">{focusedBadge.route}</span>
                          </motion.p>
                        </div>

                        {focusedBadge.obtained ? (
                          <motion.div whileHover={{ x: 2 }} whileTap={{ scale: 0.98 }}>
                            <Link
                              href="/map"
                              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-white shadow-s transition-colors hover:bg-primary-hover"
                            >
                              查看慢行路线
                              <motion.span
                                animate={{ x: detailOpen ? 4 : 0 }}
                                transition={{ duration: 0.35 }}
                              >
                                <ArrowRight className="h-4 w-4" />
                              </motion.span>
                            </Link>
                          </motion.div>
                        ) : (
                          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-cloud/80 bg-white/40 px-4 py-2 text-sm text-rock">
                            <Lock className="h-3.5 w-3.5" />
                            待解锁
                          </span>
                        )}
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </LayoutGroup>

        <p className="mt-8 flex items-center justify-center gap-2 text-center font-serif text-sm text-rock">
          <TreePine className="h-4 w-4 text-primary/60" strokeWidth={1.5} />
          慢一点，才会遇见城市的温度
          <TreePine className="h-4 w-4 text-primary/60" strokeWidth={1.5} />
        </p>
      </div>
    </section>
  );
}
