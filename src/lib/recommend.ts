import { discover, listMedia, safe } from "./tmdb";
import { GENRES, STYLES, genreIdsFor, genreName } from "./genres";
import type { FavoriteRef, LibraryItem, Media, MediaType, Preferences } from "./types";

export interface RecRow {
  key: string;
  title: string;
  subtitle?: string;
  items: Media[];
}

// Peso de cada gênero (ID do TMDB) no gosto do usuário:
// gêneros escolhidos (3) + estilos de produção (1.5) + gêneros dos favoritos (2).
export function genreWeights(prefs: Preferences): Map<number, number> {
  const w = new Map<number, number>();
  const add = (id: number, v: number) => w.set(id, (w.get(id) ?? 0) + v);

  for (const label of prefs.genres) {
    for (const t of ["movie", "tv"] as MediaType[]) genreIdsFor(label, t).forEach((id) => add(id, 3));
  }
  for (const key of prefs.styles) {
    const style = STYLES.find((s) => s.key === key);
    style?.genres.forEach((label) => {
      for (const t of ["movie", "tv"] as MediaType[]) genreIdsFor(label, t).forEach((id) => add(id, 1.5));
    });
  }
  for (const fav of prefs.favorites) fav.genre_ids?.forEach((id) => add(id, 2));
  return w;
}

// Pontuação de afinidade: não é só popularidade.
// Combina gêneros em comum + qualidade (nota com mínimo de votos) + preferência por lançamentos.
export function score(item: Media, weights: Map<number, number>, prefs: Preferences): number {
  const overlap = item.genre_ids.reduce((s, id) => s + (weights.get(id) ?? 0), 0);
  const quality = item.votes >= 100 ? item.rating * 0.6 : item.rating * 0.2;
  const fresh =
    prefs.status_pref === "new" && item.year && item.year >= new Date().getFullYear() - 1 ? 2 : 0;
  return overlap + quality + fresh;
}

export function reasonFor(item: Media, weights: Map<number, number>): string {
  const shared = item.genre_ids
    .filter((id) => (weights.get(id) ?? 0) > 0)
    .sort((a, b) => (weights.get(b) ?? 0) - (weights.get(a) ?? 0))
    .map(genreName)
    .filter(Boolean);
  const unique = Array.from(new Set(shared)).slice(0, 2);
  if (unique.length === 0) return "Bem avaliado e popular entre quem assiste ao que você curte.";
  return `Combina com seu gosto por ${unique.join(" e ").toLowerCase()}.`;
}

function topGenreIds(weights: Map<number, number>, type: MediaType, n = 3): number[] {
  const valid = new Set<number>(GENRES.flatMap((g) => g[type]));
  return Array.from(weights.entries())
    .filter(([id]) => valid.has(id))
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([id]) => id);
}

function discoverParams(prefs: Preferences, type: MediaType, ids: number[]) {
  const p: Record<string, string | number> = {
    with_genres: ids.join("|"),
    sort_by: "popularity.desc",
    "vote_count.gte": 300,
    "vote_average.gte": 6.6,
  };
  if (type === "movie") {
    if (prefs.duration === "short") p["with_runtime.lte"] = 100;
    if (prefs.duration === "medium") {
      p["with_runtime.gte"] = 90;
      p["with_runtime.lte"] = 140;
    }
    if (prefs.duration === "long") p["with_runtime.gte"] = 130;
  }
  if (type === "tv" && prefs.status_pref === "finished") p.with_status = 3;
  return p;
}

const keyOf = (m: { id?: number; tmdb_id?: number; media_type: MediaType }) => `${m.media_type}:${m.id ?? m.tmdb_id}`;

export async function buildPersonalRows(prefs: Preferences, library: LibraryItem[]): Promise<RecRow[]> {
  const weights = genreWeights(prefs);
  const seen = new Set(library.filter((l) => l.status === "watched" || l.status === "dropped").map(keyOf));
  const types: MediaType[] = prefs.content_type === "both" ? ["movie", "tv"] : [prefs.content_type];
  const rows: RecRow[] = [];

  // 1) Feito para você: descoberta por gêneros + pontuação de afinidade.
  const pools = await Promise.all(
    types.map(async (t) => {
      const ids = topGenreIds(weights, t);
      if (ids.length === 0) return [] as Media[];
      const [a, b] = await Promise.all([
        safe(discover(t, discoverParams(prefs, t, ids), 1), []),
        safe(discover(t, discoverParams(prefs, t, ids), 2), []),
      ]);
      return [...a, ...b];
    })
  );
  const ranked = pools
    .flat()
    .filter((m) => !seen.has(keyOf(m)))
    .map((m) => ({ m, s: score(m, weights, prefs) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, 20)
    .map(({ m }) => ({ ...m, reason: reasonFor(m, weights) }));
  if (ranked.length) {
    rows.push({ key: "for-you", title: "Feito para você", subtitle: "Calculado a partir do seu perfil cinematográfico", items: ranked });
  }

  // 2) "Porque você gostou de X": recomendações do TMDB a partir de até 3 favoritos/bem avaliados.
  const favs: FavoriteRef[] = [
    ...library
      .filter((l) => l.is_favorite || (l.rating ?? 0) >= 8)
      .map((l) => ({ id: l.tmdb_id, media_type: l.media_type, title: l.title, poster_path: l.poster_path, genre_ids: l.genre_ids })),
    ...prefs.favorites,
  ].filter((f, i, arr) => arr.findIndex((x) => keyOf(x) === keyOf(f)) === i);

  const picked = favs.slice(0, 3);
  const favRows = await Promise.all(
    picked.map(async (fav) => {
      const items = await safe(listMedia(`/${fav.media_type}/${fav.id}/recommendations`, {}, fav.media_type), []);
      const favGenres = new Set(fav.genre_ids);
      const out = items
        .filter((m) => !seen.has(keyOf(m)) && !favs.some((f) => keyOf(f) === keyOf(m)))
        .map((m) => {
          const shared = m.genre_ids.filter((g) => favGenres.has(g)).map(genreName).filter(Boolean);
          const uniq = Array.from(new Set(shared)).slice(0, 2);
          return {
            ...m,
            reason: uniq.length
              ? `Você gostou de ${fav.title}. Esta também tem ${uniq.join(" e ").toLowerCase()}.`
              : `Recomendada a quem gostou de ${fav.title}.`,
          };
        })
        .slice(0, 16);
      return { key: `fav-${keyOf(fav)}`, title: `Porque você gostou de ${fav.title}`, items: out } as RecRow;
    })
  );
  rows.push(...favRows.filter((r) => r.items.length >= 4));

  return rows;
}
