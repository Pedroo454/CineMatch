import { NextResponse } from "next/server";
import { hasTmdb, searchMulti } from "@/lib/tmdb";

// Sugestões de busca enquanto o usuário digita (e seletor de favoritos no onboarding).
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2 || !hasTmdb()) return NextResponse.json({ results: [] });

  try {
    const raw = await searchMulti(q);
    const results = raw
      .filter((r) => r.media_type === "movie" || r.media_type === "tv" || r.media_type === "person")
      .slice(0, 8)
      .map((r) => {
        if (r.media_type === "person") {
          return { type: "person", id: r.id, title: r.name, sub: r.known_for_department ?? "Pessoa", poster: r.profile_path ?? null, genre_ids: [] };
        }
        const date: string = r.release_date ?? r.first_air_date ?? "";
        return {
          type: r.media_type,
          id: r.id,
          title: r.title ?? r.name,
          sub: [date.slice(0, 4), r.media_type === "movie" ? "Filme" : "Série"].filter(Boolean).join(" · "),
          poster: r.poster_path ?? null,
          genre_ids: r.genre_ids ?? [],
        };
      });
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] }, { status: 200 });
  }
}
