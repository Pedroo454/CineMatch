"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";

type Suggestion = { type: "movie" | "tv" | "person"; id: number; title: string; sub: string; poster: string | null };

export default function SearchBox() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (q.trim().length < 2) {
      setItems([]);
      return;
    }
    setLoading(true);
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`, { signal: ctrl.signal });
        const data = await res.json();
        setItems(data.results ?? []);
      } catch {
        /* cancelado */
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    setOpen(false);
    router.push(`/buscar?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <div ref={box} className="relative w-full">
      <form onSubmit={submit} role="search">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Buscar filmes, séries, atores…"
          aria-label="Buscar"
          className="w-full rounded-full border border-ink-600 bg-ink-800/80 py-2 pl-9 pr-4 text-sm text-neutral-100 placeholder:text-neutral-500 transition focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
        />
      </form>

      {open && q.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-ink-600 bg-ink-900/95 shadow-2xl backdrop-blur">
          {loading && items.length === 0 && <p className="px-4 py-3 text-sm text-neutral-500">Buscando…</p>}
          {!loading && items.length === 0 && <p className="px-4 py-3 text-sm text-neutral-500">Nada encontrado para “{q}”.</p>}
          <ul>
            {items.map((s) => {
              const href = s.type === "person" ? `/buscar?q=${encodeURIComponent(s.title)}` : `/titulo/${s.type}/${s.id}`;
              const size = s.type === "person" ? "w185" : "w92";
              return (
                <li key={`${s.type}-${s.id}`}>
                  <Link href={href} onClick={() => setOpen(false)} className="flex items-center gap-3 px-3 py-2 transition hover:bg-ink-700">
                    <div className="relative h-12 w-8 shrink-0 overflow-hidden rounded bg-ink-700">
                      {s.poster && <Image src={`https://image.tmdb.org/t/p/${size}${s.poster}`} alt="" fill sizes="32px" className="object-cover" />}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm text-neutral-100">{s.title}</p>
                      <p className="truncate text-xs text-neutral-500">{s.sub}</p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
          {items.length > 0 && (
            <button onClick={submit} className="w-full border-t border-ink-600 px-4 py-2.5 text-left text-xs text-gold hover:bg-ink-700">
              Ver todos os resultados para “{q}”
            </button>
          )}
        </div>
      )}
    </div>
  );
}
