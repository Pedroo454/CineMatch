import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PosterCard from "@/components/PosterCard";
import { getCollection, normalize, safe } from "@/lib/tmdb";
import type { Media } from "@/lib/types";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const c = await safe(getCollection(Number(params.id)), null);
  return { title: c?.name ?? "Franquia" };
}

export default async function Franquia({ params }: { params: { id: string } }) {
  const c = await safe(getCollection(Number(params.id)), null);
  if (!c) notFound();

  const parts: Media[] = ((c.parts ?? []) as any[])
    .map((p) => normalize(p, "movie"))
    .filter((m): m is Media => Boolean(m))
    .sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999"));

  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-ink-700/60">
        {c.backdrop_path && (
          <Image src={`https://image.tmdb.org/t/p/w1280${c.backdrop_path}`} alt="" fill priority sizes="100vw" className="-z-20 object-cover object-top" />
        )}
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink-950 via-ink-950/70 to-ink-950/40" />
        <div className="container-x py-16 sm:py-24">
          <p className="text-xs uppercase tracking-[0.2em] text-gold">Franquia</p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-white sm:text-5xl">{c.name}</h1>
          {c.overview && <p className="mt-4 max-w-2xl text-sm text-neutral-300 sm:text-base">{c.overview}</p>}
          <p className="mt-3 text-sm text-gold">{parts.length} produções</p>
        </div>
      </section>

      <section className="container-x py-8">
        <h2 className="font-display text-xl font-semibold text-white">Ordem de lançamento</h2>
        <p className="mb-5 text-sm text-neutral-500">Na ordem em que chegaram aos cinemas.</p>
        <ol className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {parts.map((m, i) => (
            <li key={m.id} className="relative">
              <span className="absolute -left-1 -top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-gold text-xs font-bold text-ink-950">{i + 1}</span>
              <PosterCard item={m} width="w-full" />
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
