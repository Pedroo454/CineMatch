import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import PosterCard from "@/components/PosterCard";
import { getUser } from "@/lib/supabase/server";
import type { LibraryItem, Media } from "@/lib/types";

export const metadata: Metadata = { title: "Minha biblioteca" };

const TABS = [
  { key: "want", label: "Quero assistir" },
  { key: "watching", label: "Estou assistindo" },
  { key: "watched", label: "Já assisti" },
  { key: "dropped", label: "Abandonei" },
  { key: "favorites", label: "Favoritos" },
  { key: "ratings", label: "Minhas avaliações" },
] as const;

const toMedia = (l: LibraryItem): Media => ({
  id: l.tmdb_id,
  media_type: l.media_type,
  title: l.title,
  year: l.year,
  date: "",
  poster: l.poster_path,
  backdrop: null,
  rating: l.rating ?? 0,
  votes: 0,
  popularity: 0,
  overview: "",
  genre_ids: l.genre_ids,
});

export default async function Biblioteca({ searchParams }: { searchParams: { tab?: string } }) {
  const { supabase, user } = await getUser();
  if (!supabase || !user) redirect("/login?next=/biblioteca");

  const { data } = await supabase.from("library_items").select("*").eq("user_id", user.id).order("updated_at", { ascending: false });
  const all = (data as LibraryItem[] | null) ?? [];

  const tab = TABS.find((t) => t.key === searchParams.tab)?.key ?? "want";
  const filter = (key: string) =>
    key === "favorites" ? all.filter((i) => i.is_favorite) : key === "ratings" ? all.filter((i) => i.rating != null) : all.filter((i) => i.status === key);

  const items = filter(tab);

  return (
    <div className="container-x py-8">
      <h1 className="font-display text-3xl font-semibold text-white">Minha biblioteca</h1>

      <nav className="scrollbar-hide mt-5 flex gap-2 overflow-x-auto pb-1" aria-label="Categorias">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/biblioteca?tab=${t.key}`}
            aria-current={t.key === tab ? "page" : undefined}
            className={`shrink-0 rounded-full border px-4 py-1.5 text-sm transition ${t.key === tab ? "border-gold bg-gold/10 text-gold-soft" : "border-ink-500 text-neutral-400 hover:border-gold/50"}`}
          >
            {t.label} <span className="ml-1 text-xs opacity-60">{filter(t.key).length}</span>
          </Link>
        ))}
      </nav>

      {items.length === 0 ? (
        <div className="panel mt-8 p-10 text-center">
          <p className="text-neutral-300">Nada por aqui ainda.</p>
          <p className="mt-1 text-sm text-neutral-500">Abra um filme ou série e use os botões para montar sua biblioteca.</p>
          <Link href="/buscar" className="btn btn-gold mt-5">Explorar produções</Link>
        </div>
      ) : (
        <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {items.map((i) => (
            <li key={`${i.media_type}-${i.tmdb_id}`}>
              <PosterCard item={toMedia(i)} width="w-full" />
              {tab === "ratings" && i.rating != null && <p className="mt-1 text-xs text-gold">Sua nota: {Number(i.rating)}/10</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
