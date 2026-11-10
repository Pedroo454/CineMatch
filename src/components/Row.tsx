"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import PosterCard from "./PosterCard";
import type { Media } from "@/lib/types";

export default function Row({ title, subtitle, items }: { title: string; subtitle?: string; items: Media[] }) {
  const ref = useRef<HTMLDivElement>(null);
  if (items.length === 0) return null;

  const scroll = (dir: 1 | -1) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };

  return (
    <section className="container-x py-5" aria-label={title}>
      <div className="mb-3 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold text-white sm:text-2xl">{title}</h2>
          {subtitle && <p className="text-xs text-neutral-500 sm:text-sm">{subtitle}</p>}
        </div>
        <div className="hidden gap-2 sm:flex">
          <button onClick={() => scroll(-1)} aria-label="Anterior" className="rounded-full border border-ink-500 p-1.5 text-neutral-400 transition hover:border-gold hover:text-gold">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={() => scroll(1)} aria-label="Próximo" className="rounded-full border border-ink-500 p-1.5 text-neutral-400 transition hover:border-gold hover:text-gold">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div ref={ref} className="scrollbar-hide -mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-3 pt-1 sm:gap-4">
        {items.map((m) => (
          <PosterCard key={`${m.media_type}-${m.id}`} item={m} />
        ))}
      </div>
    </section>
  );
}
