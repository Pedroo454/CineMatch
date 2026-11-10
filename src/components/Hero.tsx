import Image from "next/image";
import Link from "next/link";
import { Info, Star } from "lucide-react";
import { genreName } from "@/lib/genres";
import type { Media } from "@/lib/types";

export default function Hero({ item }: { item: Media }) {
  const bg = item.backdrop ?? item.poster;
  return (
    <section className="relative isolate overflow-hidden border-b border-ink-700/60">
      {bg && (
        <Image
          src={`https://image.tmdb.org/t/p/${item.backdrop ? "w1280" : "w780"}${bg}`}
          alt=""
          fill
          priority
          sizes="100vw"
          className="-z-20 object-cover object-top"
        />
      )}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink-950 via-ink-950/75 to-transparent" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink-950 via-transparent to-ink-950/30" />

      <div className="container-x flex min-h-[52vh] flex-col justify-end pb-10 pt-24 sm:min-h-[62vh] sm:pb-16">
        <div className="max-w-2xl animate-fade-up">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-gold">Destaque da semana</p>
          <h1 className="font-display text-3xl font-semibold leading-tight text-white sm:text-5xl">{item.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-neutral-300">
            {item.rating > 0 && (
              <span className="flex items-center gap-1" title="Nota TMDB">
                <Star className="h-4 w-4 fill-gold text-gold" /> {item.rating.toFixed(1)} <span className="text-xs text-neutral-500">TMDB</span>
              </span>
            )}
            {item.year && <span>{item.year}</span>}
            <span className="chip">{item.media_type === "movie" ? "Filme" : "Série"}</span>
            {genreName(item.genre_ids[0]) && <span className="chip">{genreName(item.genre_ids[0])}</span>}
          </div>
          <p className="mt-4 line-clamp-3 text-sm text-neutral-300 sm:text-base">{item.overview}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={`/titulo/${item.media_type}/${item.id}`} className="btn btn-gold">
              <Info className="h-4 w-4" /> Ver detalhes e trailer
            </Link>
            <Link href={`/buscar?type=${item.media_type}`} className="btn btn-ghost">
              Explorar {item.media_type === "movie" ? "filmes" : "séries"}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
