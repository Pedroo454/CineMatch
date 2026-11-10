import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { genreName } from "@/lib/genres";
import type { Media } from "@/lib/types";

export default function PosterCard({ item, width = "w-36 sm:w-44" }: { item: Media; width?: string }) {
  const genre = genreName(item.genre_ids[0]);
  return (
    <Link
      href={`/titulo/${item.media_type}/${item.id}`}
      className={`group block shrink-0 snap-start ${width}`}
      title={item.reason}
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl border border-ink-600/60 bg-ink-800 transition duration-300 group-hover:-translate-y-1 group-hover:border-gold/60 group-hover:shadow-[0_12px_30px_-10px_rgba(212,166,74,0.35)]">
        {item.poster ? (
          <Image
            src={`https://image.tmdb.org/t/p/w342${item.poster}`}
            alt={`Pôster de ${item.title}`}
            fill
            sizes="(max-width: 640px) 144px, 176px"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center p-3 text-center text-xs text-neutral-500">{item.title}</div>
        )}
        <span className="absolute left-2 top-2 rounded-full bg-ink-950/80 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gold backdrop-blur">
          {item.media_type === "movie" ? "Filme" : "Série"}
        </span>
        {item.rating > 0 && (
          <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-ink-950/85 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur" title="Nota TMDB">
            <Star className="h-3 w-3 fill-gold text-gold" /> {item.rating.toFixed(1)}
          </span>
        )}
      </div>
      <p className="mt-2 truncate text-sm font-medium text-neutral-100 group-hover:text-gold-soft">{item.title}</p>
      <p className="truncate text-xs text-neutral-500">{[item.year, genre].filter(Boolean).join(" · ")}</p>
      {item.reason && <p className="mt-1 line-clamp-3 text-[11px] leading-snug text-gold/80">{item.reason}</p>}
    </Link>
  );
}
