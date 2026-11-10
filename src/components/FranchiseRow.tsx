import Image from "next/image";
import Link from "next/link";
import { FRANCHISE_IDS } from "@/lib/franchises";
import { getCollection, safe } from "@/lib/tmdb";

export default async function FranchiseRow({ limit = 12, title = "Franquias em destaque" }: { limit?: number; title?: string }) {
  const cols = (await Promise.all(FRANCHISE_IDS.slice(0, limit).map((id) => safe(getCollection(id), null)))).filter(Boolean) as any[];
  if (cols.length === 0) return null;

  return (
    <section className="container-x py-5" aria-label={title}>
      <h2 className="mb-3 font-display text-xl font-semibold text-white sm:text-2xl">{title}</h2>
      <div className="scrollbar-hide flex snap-x gap-4 overflow-x-auto pb-3">
        {cols.map((c) => (
          <Link key={c.id} href={`/franquia/${c.id}`} className="group relative aspect-video w-64 shrink-0 snap-start overflow-hidden rounded-xl border border-ink-600/60 bg-ink-800 transition hover:border-gold/60 sm:w-72">
            {(c.backdrop_path || c.poster_path) && (
              <Image
                src={`https://image.tmdb.org/t/p/w780${c.backdrop_path ?? c.poster_path}`}
                alt=""
                fill
                sizes="288px"
                className="object-cover transition duration-500 group-hover:scale-105"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/40 to-transparent" />
            <div className="absolute bottom-0 p-3">
              <p className="font-display text-base font-semibold text-white">{String(c.name).replace(/ - Coleção| \(Coleção\)/i, "")}</p>
              <p className="text-xs text-gold">{c.parts?.length ?? 0} produções</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
