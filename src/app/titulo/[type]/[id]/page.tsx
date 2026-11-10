import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Star } from "lucide-react";
import LibraryButtons from "@/components/LibraryButtons";
import Row from "@/components/Row";
import SetupNotice, { missingEnv } from "@/components/SetupNotice";
import { getUser } from "@/lib/supabase/server";
import { getDetail, getImdbRating, hasTmdb, normalize, safe } from "@/lib/tmdb";
import type { ItemPayload, Media, MediaType } from "@/lib/types";

type Props = { params: { type: string; id: string } };

const STATUS_PT: Record<string, string> = {
  "Returning Series": "Em andamento",
  Ended: "Finalizada",
  Canceled: "Cancelada",
  "In Production": "Em produção",
  Planned: "Planejada",
  Pilot: "Piloto",
};

const region = (code: string) => {
  try {
    return new Intl.DisplayNames(["pt-BR"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
};

const fmtDate = (d?: string | null) => (d ? new Date(d + "T12:00:00").toLocaleDateString("pt-BR") : null);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (!hasTmdb() || (params.type !== "movie" && params.type !== "tv")) return { title: "Título" };
  const d = await safe(getDetail(params.type, Number(params.id)), null);
  return { title: d?.title ?? d?.name ?? "Título", description: d?.overview?.slice(0, 160) };
}

export default async function Titulo({ params }: Props) {
  if (!hasTmdb()) return <SetupNotice missing={missingEnv()} />;
  const type = params.type as MediaType;
  if (type !== "movie" && type !== "tv") notFound();
  const id = Number(params.id);
  if (!Number.isFinite(id)) notFound();

  const d = await safe(getDetail(type, id), null);
  if (!d) notFound();

  const title: string = d.title ?? d.name;
  const original: string = d.original_title ?? d.original_name;
  const date: string = d.release_date ?? d.first_air_date ?? "";
  const year = date ? Number(date.slice(0, 4)) : null;
  const isMovie = type === "movie";

  // Classificação indicativa (Brasil)
  const cert = isMovie
    ? (d.release_dates?.results ?? []).find((r: any) => r.iso_3166_1 === "BR")?.release_dates?.find((x: any) => x.certification)?.certification
    : (d.content_ratings?.results ?? []).find((r: any) => r.iso_3166_1 === "BR")?.rating;

  const countries: string[] = isMovie
    ? (d.production_countries ?? []).map((c: any) => region(c.iso_3166_1))
    : (d.origin_country ?? []).map((c: string) => region(c));

  const crew: any[] = d.credits?.crew ?? [];
  const directors = isMovie
    ? crew.filter((c) => c.job === "Director").map((c) => c.name)
    : (d.created_by ?? []).map((c: any) => c.name);
  const writers = Array.from(new Set(crew.filter((c) => ["Screenplay", "Writer", "Story", "Novel"].includes(c.job)).map((c) => c.name))).slice(0, 4);
  const cast: any[] = (d.credits?.cast ?? []).slice(0, 12);

  const videos: any[] = (d.videos?.results ?? []).filter((v: any) => v.site === "YouTube");
  const trailer =
    videos.find((v) => v.type === "Trailer" && v.iso_639_1 === "pt") ??
    videos.find((v) => v.type === "Trailer" && v.official) ??
    videos.find((v) => v.type === "Trailer") ??
    videos.find((v) => v.type === "Teaser");

  const providers = d["watch/providers"]?.results?.BR;
  const provGroups: [string, any[]][] = [
    ["Na assinatura", providers?.flatrate ?? []],
    ["Aluguel", providers?.rent ?? []],
    ["Compra digital", providers?.buy ?? []],
  ];

  const reviews: any[] = (d.reviews?.results ?? []).slice(0, 3);
  const recs: Media[] = (d.recommendations?.results?.length >= 4 ? d.recommendations.results : d.similar?.results ?? [])
    .map((r: any) => normalize(r, type))
    .filter((m: Media | null): m is Media => Boolean(m && m.poster));

  const imdb = await getImdbRating(d.external_ids?.imdb_id);

  const runtime = isMovie
    ? d.runtime || null
    : (() => {
        const ep = d.episode_run_time?.[0] ?? d.last_episode_to_air?.runtime;
        return ep && d.number_of_episodes ? ep * d.number_of_episodes : null;
      })();

  const payload: ItemPayload = {
    tmdb_id: id,
    media_type: type,
    title,
    poster_path: d.poster_path ?? null,
    year,
    genre_ids: (d.genres ?? []).map((g: any) => g.id),
    runtime_min: runtime,
  };

  const { supabase, user } = await getUser();
  let initial = { status: null as any, is_favorite: false, rating: null as number | null };
  if (supabase && user) {
    const { data } = await supabase
      .from("library_items")
      .select("status,is_favorite,rating")
      .eq("user_id", user.id)
      .eq("tmdb_id", id)
      .eq("media_type", type)
      .maybeSingle();
    if (data) initial = { status: data.status, is_favorite: data.is_favorite, rating: data.rating ? Number(data.rating) : null };
  }

  const meta = [
    year,
    isMovie && d.runtime ? `${Math.floor(d.runtime / 60)}h ${d.runtime % 60}min` : null,
    cert ? `Classificação ${cert}` : null,
  ].filter(Boolean);

  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-ink-700/60">
        {d.backdrop_path && (
          <Image src={`https://image.tmdb.org/t/p/w1280${d.backdrop_path}`} alt="" fill priority sizes="100vw" className="-z-20 object-cover object-top opacity-60" />
        )}
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink-950 via-ink-950/80 to-ink-950/40" />

        <div className="container-x grid gap-8 py-10 md:grid-cols-[260px_1fr] md:py-16">
          <div className="relative mx-auto aspect-[2/3] w-48 overflow-hidden rounded-xl border border-ink-500 shadow-2xl md:w-full">
            {d.poster_path ? (
              <Image src={`https://image.tmdb.org/t/p/w500${d.poster_path}`} alt={`Pôster de ${title}`} fill priority sizes="260px" className="object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center bg-ink-800 p-4 text-center text-sm text-neutral-500">{title}</div>
            )}
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gold">{isMovie ? "Filme" : "Série"}</p>
            <h1 className="mt-1 font-display text-3xl font-semibold text-white sm:text-4xl">{title}</h1>
            {original && original !== title && <p className="text-sm text-neutral-400">Título original: {original}</p>}
            <p className="mt-2 text-sm text-neutral-300">{meta.join(" · ")}</p>
            {d.tagline && <p className="mt-2 font-display text-base italic text-gold-soft">“{d.tagline}”</p>}

            <div className="mt-3 flex flex-wrap gap-2">
              {(d.genres ?? []).map((g: any) => (
                <span key={g.id} className="chip">{g.name}</span>
              ))}
            </div>

            {/* Notas separadas por fonte */}
            <div className="mt-5 flex flex-wrap gap-3" aria-label="Avaliações">
              <div className="panel px-4 py-2.5">
                <p className="text-[10px] uppercase tracking-wide text-neutral-500">TMDB</p>
                <p className="flex items-center gap-1 text-lg font-semibold text-white">
                  <Star className="h-4 w-4 fill-gold text-gold" /> {d.vote_average ? d.vote_average.toFixed(1) : "—"}
                  <span className="text-xs font-normal text-neutral-500">/10 · {d.vote_count ?? 0} votos</span>
                </p>
              </div>
              <div className="panel px-4 py-2.5">
                <p className="text-[10px] uppercase tracking-wide text-neutral-500">IMDb</p>
                {imdb ? (
                  <p className="flex items-center gap-1 text-lg font-semibold text-white">
                    <Star className="h-4 w-4 fill-gold text-gold" /> {imdb.rating}
                    <span className="text-xs font-normal text-neutral-500">/10 · {imdb.votes} votos</span>
                  </p>
                ) : (
                  <p className="text-sm text-neutral-500">Não disponível</p>
                )}
              </div>
              <div className="panel px-4 py-2.5">
                <p className="text-[10px] uppercase tracking-wide text-neutral-500">Sua nota</p>
                <p className="text-lg font-semibold text-white">{initial.rating ? `${initial.rating}/10` : <span className="text-sm font-normal text-neutral-500">Ainda não avaliou</span>}</p>
              </div>
            </div>

            <h2 className="mt-6 font-display text-lg text-white">Sinopse</h2>
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-neutral-300 sm:text-base">{d.overview || "Sinopse ainda não disponível em português."}</p>

            <div className="mt-6">
              <LibraryButtons item={payload} initial={initial} loggedIn={Boolean(user)} nextPath={`/titulo/${type}/${id}`} />
            </div>
          </div>
        </div>
      </section>

      <div className="container-x grid gap-10 py-10 lg:grid-cols-[1fr_320px]">
        <div className="space-y-12">
          {trailer && (
            <section aria-label="Trailer">
              <h2 className="mb-3 font-display text-xl font-semibold text-white">Trailer</h2>
              <div className="aspect-video overflow-hidden rounded-xl border border-ink-600 bg-black">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${trailer.key}`}
                  title={`Trailer de ${title}`}
                  loading="lazy"
                  allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                  allowFullScreen
                  className="h-full w-full"
                />
              </div>
            </section>
          )}

          {cast.length > 0 && (
            <section aria-label="Elenco">
              <h2 className="mb-3 font-display text-xl font-semibold text-white">Elenco principal</h2>
              <ul className="scrollbar-hide flex gap-4 overflow-x-auto pb-2">
                {cast.map((c) => (
                  <li key={c.credit_id ?? c.id} className="w-28 shrink-0">
                    <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-ink-800">
                      {c.profile_path && <Image src={`https://image.tmdb.org/t/p/w185${c.profile_path}`} alt={c.name} fill sizes="112px" className="object-cover" />}
                    </div>
                    <p className="mt-1.5 truncate text-xs font-medium text-neutral-100">{c.name}</p>
                    <p className="truncate text-xs text-neutral-500">{c.character}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {!isMovie && (d.seasons ?? []).filter((s: any) => s.season_number > 0).length > 0 && (
            <section aria-label="Temporadas">
              <h2 className="mb-3 font-display text-xl font-semibold text-white">Temporadas</h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {(d.seasons as any[]).filter((s) => s.season_number > 0).map((s) => (
                  <li key={s.id} className="panel flex gap-3 p-3">
                    <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded bg-ink-700">
                      {s.poster_path && <Image src={`https://image.tmdb.org/t/p/w154${s.poster_path}`} alt="" fill sizes="56px" className="object-cover" />}
                    </div>
                    <div className="min-w-0 text-sm">
                      <p className="font-medium text-white">{s.name}</p>
                      <p className="text-xs text-neutral-500">
                        {s.episode_count} episódios{s.air_date ? ` · ${new Date(s.air_date + "T12:00:00").getFullYear()}` : ""}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {reviews.length > 0 && (
            <section aria-label="Críticas de usuários">
              <h2 className="mb-1 font-display text-xl font-semibold text-white">O que estão dizendo</h2>
              <p className="mb-3 text-xs text-neutral-500">Avaliações de usuários do TMDB. Podem conter spoilers: leia por sua conta.</p>
              <div className="space-y-2">
                {reviews.map((r) => (
                  <details key={r.id} className="panel group p-4">
                    <summary className="cursor-pointer list-none text-sm text-neutral-200">
                      <span className="font-medium text-white">{r.author}</span>
                      {r.author_details?.rating ? <span className="ml-2 text-gold">★ {r.author_details.rating}/10</span> : null}
                      <span className="ml-2 text-xs text-cine-soft">⚠ pode conter spoilers · toque para ler</span>
                    </summary>
                    <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-neutral-400">
                      {String(r.content).slice(0, 900)}
                      {String(r.content).length > 900 ? "…" : ""}
                    </p>
                  </details>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-6 text-sm">
          <section className="panel p-5" aria-label="Onde assistir">
            <h2 className="font-display text-lg text-white">Onde assistir no Brasil</h2>
            {provGroups.some(([, l]) => l.length) ? (
              <div className="mt-3 space-y-4">
                {provGroups.map(([label, list]) =>
                  list.length ? (
                    <div key={label}>
                      <p className="mb-1.5 text-[11px] uppercase tracking-wide text-neutral-500">{label}</p>
                      <ul className="flex flex-wrap gap-2">
                        {list.map((p: any) => (
                          <li key={p.provider_id} title={p.provider_name} className="relative h-10 w-10 overflow-hidden rounded-lg bg-ink-700">
                            {p.logo_path && <Image src={`https://image.tmdb.org/t/p/w92${p.logo_path}`} alt={p.provider_name} fill sizes="40px" className="object-cover" />}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null
                )}
                {providers?.link && (
                  <a href={providers.link} target="_blank" rel="noopener noreferrer" className="inline-block text-xs text-gold hover:underline">
                    Ver links dos serviços ↗
                  </a>
                )}
              </div>
            ) : (
              <p className="mt-2 text-neutral-500">Sem informação de disponibilidade no Brasil no momento.</p>
            )}
            <p className="mt-4 text-[10px] text-neutral-600">Dados de disponibilidade: JustWatch, via TMDB.</p>
          </section>

          <section className="panel space-y-2.5 p-5" aria-label="Ficha técnica">
            <h2 className="font-display text-lg text-white">Ficha técnica</h2>
            {directors.length > 0 && <Fact label={isMovie ? "Direção" : "Criação"} value={directors.join(", ")} />}
            {writers.length > 0 && <Fact label="Roteiro" value={writers.join(", ")} />}
            {countries.length > 0 && <Fact label="País de origem" value={countries.join(", ")} />}
            {d.original_language && <Fact label="Idioma original" value={d.original_language.toUpperCase()} />}
            {!isMovie && (
              <>
                <Fact label="Status" value={STATUS_PT[d.status] ?? d.status} />
                <Fact label="Temporadas" value={String(d.number_of_seasons)} />
                <Fact label="Episódios" value={String(d.number_of_episodes)} />
                {d.episode_run_time?.[0] && <Fact label="Duração média" value={`${d.episode_run_time[0]} min`} />}
                {fmtDate(d.first_air_date) && <Fact label="Estreia" value={fmtDate(d.first_air_date)!} />}
                {d.status === "Ended" && fmtDate(d.last_air_date) && <Fact label="Encerramento" value={fmtDate(d.last_air_date)!} />}
                {d.next_episode_to_air?.air_date && <Fact label="Próximo episódio" value={fmtDate(d.next_episode_to_air.air_date)!} />}
              </>
            )}
            {d.belongs_to_collection && (
              <p className="pt-1">
                <Link href={`/franquia/${d.belongs_to_collection.id}`} className="text-gold hover:underline">
                  Parte da franquia: {d.belongs_to_collection.name} →
                </Link>
              </p>
            )}
          </section>
        </aside>
      </div>

      <div id="semelhantes">
        <Row title="Produções semelhantes" items={recs.slice(0, 20)} />
      </div>
    </>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <p className="flex justify-between gap-4 border-b border-ink-700 pb-2 last:border-0">
      <span className="text-neutral-500">{label}</span>
      <span className="text-right text-neutral-200">{value}</span>
    </p>
  );
}
