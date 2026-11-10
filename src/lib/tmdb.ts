import type { Media, MediaType } from "./types";

const BASE = "https://api.themoviedb.org/3";

export const hasTmdb = () => Boolean(process.env.TMDB_READ_TOKEN || process.env.TMDB_API_KEY);

export const img = (path: string | null | undefined, size = "w500") =>
  path ? `https://image.tmdb.org/t/p/${size}${path}` : null;

type Params = Record<string, string | number | undefined>;

// Todas as chamadas ao TMDB acontecem no servidor: a chave nunca vai para o navegador.
// `revalidate` usa o cache de dados do Next.js (evita requisições repetidas).
export async function tmdb<T = any>(path: string, params: Params = {}, revalidate = 3600): Promise<T> {
  const url = new URL(BASE + path);
  url.searchParams.set("language", "pt-BR");
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
  }
  const headers: Record<string, string> = { accept: "application/json" };
  if (process.env.TMDB_READ_TOKEN) headers.Authorization = `Bearer ${process.env.TMDB_READ_TOKEN}`;
  else url.searchParams.set("api_key", process.env.TMDB_API_KEY ?? "");

  const res = await fetch(url, { headers, next: { revalidate } });
  if (!res.ok) throw new Error(`TMDB ${res.status} em ${path}`);
  return res.json();
}

export function normalize(r: any, forced?: MediaType): Media | null {
  const type: string = forced ?? r.media_type;
  if (type !== "movie" && type !== "tv") return null;
  const date: string = r.release_date ?? r.first_air_date ?? "";
  return {
    id: r.id,
    media_type: type,
    title: r.title ?? r.name ?? "Sem título",
    year: date ? Number(date.slice(0, 4)) : null,
    date,
    poster: r.poster_path ?? null,
    backdrop: r.backdrop_path ?? null,
    rating: Math.round((r.vote_average ?? 0) * 10) / 10,
    votes: r.vote_count ?? 0,
    popularity: r.popularity ?? 0,
    overview: r.overview ?? "",
    genre_ids: r.genre_ids ?? r.genres?.map((g: any) => g.id) ?? [],
  };
}

export async function listMedia(path: string, params: Params = {}, type?: MediaType, revalidate = 3600) {
  const data = await tmdb(path, params, revalidate);
  return ((data.results ?? []) as any[])
    .map((r) => normalize(r, type))
    .filter((m): m is Media => Boolean(m) && Boolean(m!.poster));
}

export async function safe<T>(p: Promise<T>, fallback: T): Promise<T> {
  try {
    return await p;
  } catch (e) {
    console.error(e);
    return fallback;
  }
}

const today = () => new Date().toISOString().slice(0, 10);
const daysAgo = (n: number) => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);

export const trending = (type: MediaType | "all" = "all") =>
  listMedia(`/trending/${type}/week`, {}, type === "all" ? undefined : type);

export const popular = (type: MediaType) => listMedia(`/${type}/popular`, {}, type);

export const topRated = (type: MediaType) => listMedia(`/${type}/top_rated`, {}, type);

export const recent = (type: MediaType) =>
  listMedia(
    "/discover/" + type,
    type === "movie"
      ? { sort_by: "popularity.desc", "primary_release_date.gte": daysAgo(75), "primary_release_date.lte": today(), "vote_count.gte": 20 }
      : { sort_by: "popularity.desc", "first_air_date.gte": daysAgo(120), "first_air_date.lte": today(), "vote_count.gte": 5 },
    type
  );

// "Joias escondidas": bem avaliadas, mas com pouca popularidade/votos.
export const hiddenGems = (type: MediaType) =>
  listMedia(
    "/discover/" + type,
    { sort_by: "vote_average.desc", "vote_average.gte": 7.6, "vote_count.gte": 300, "vote_count.lte": 3000 },
    type,
    86400
  );

export const discover = (type: MediaType, params: Params, page = 1) =>
  listMedia("/discover/" + type, { ...params, page }, type, 1800);

export async function searchMulti(q: string, page = 1) {
  const data = await tmdb("/search/multi", { query: q, include_adult: "false", page }, 600);
  return (data.results ?? []) as any[];
}

export async function getDetail(type: MediaType, id: number) {
  const append =
    type === "movie"
      ? "credits,videos,similar,recommendations,external_ids,release_dates,watch/providers,reviews"
      : "credits,videos,similar,recommendations,external_ids,content_ratings,watch/providers,reviews";
  return tmdb(`/${type}/${id}`, { append_to_response: append, include_video_language: "pt,en,null" }, 3600);
}

export const getCollection = (id: number) => tmdb(`/collection/${id}`, {}, 86400);

// Nota IMDb só entra se houver chave OMDb configurada (fonte autorizada). Nada é inventado.
export async function getImdbRating(imdbId?: string | null) {
  const key = process.env.OMDB_API_KEY;
  if (!key || !imdbId) return null;
  try {
    const res = await fetch(`https://www.omdbapi.com/?i=${imdbId}&apikey=${key}`, { next: { revalidate: 86400 } });
    const d = await res.json();
    if (d.Response === "False" || !d.imdbRating || d.imdbRating === "N/A") return null;
    return { rating: d.imdbRating as string, votes: d.imdbVotes as string };
  } catch {
    return null;
  }
}
