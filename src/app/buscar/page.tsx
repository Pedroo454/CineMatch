import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";
import PosterCard from "@/components/PosterCard";
import SetupNotice, { missingEnv } from "@/components/SetupNotice";
import { GridSkeleton } from "@/components/Skeletons";
import { COUNTRIES, GENRES, LANGUAGES, genreIdsFor } from "@/lib/genres";
import { getUser } from "@/lib/supabase/server";
import { discover, hasTmdb, normalize, safe, searchMulti } from "@/lib/tmdb";
import { genreWeights, score } from "@/lib/recommend";
import type { Media, MediaType, Preferences } from "@/lib/types";

export const metadata: Metadata = { title: "Buscar e filtrar" };

type SP = Record<string, string | undefined>;

const today = () => new Date().toISOString().slice(0, 10);

export default function Buscar({ searchParams }: { searchParams: SP }) {
  if (!hasTmdb()) return <SetupNotice missing={missingEnv()} />;
  const type = searchParams.type === "movie" || searchParams.type === "tv" ? searchParams.type : "all";

  return (
    <div className="container-x py-8">
      <h1 className="font-display text-3xl font-semibold text-white">
        {searchParams.q ? `Resultados para “${searchParams.q}”` : type === "movie" ? "Filmes" : type === "tv" ? "Séries" : "Explorar"}
      </h1>

      <FilterForm sp={searchParams} type={type} />

      <Suspense key={JSON.stringify(searchParams)} fallback={<GridSkeleton />}>
        <Results sp={searchParams} type={type} />
      </Suspense>
    </div>
  );
}

function Select({ name, label, value, options }: { name: string; label: string; value?: string; options: [string, string][] }) {
  return (
    <label className="block text-xs text-neutral-500">
      <span className="mb-1 block">{label}</span>
      <select name={name} defaultValue={value ?? ""} className="input !py-2">
        <option value="">Todos</option>
        {options.map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
    </label>
  );
}

function FilterForm({ sp, type }: { sp: SP; type: "movie" | "tv" | "all" }) {
  const years: [string, string][] = Array.from({ length: 40 }, (_, i) => {
    const y = String(new Date().getFullYear() - i);
    return [y, y];
  });
  return (
    <form method="get" className="panel mt-5 grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-6">
      <label className="col-span-2 block text-xs text-neutral-500 sm:col-span-3 lg:col-span-2">
        <span className="mb-1 block">Busca</span>
        <input name="q" defaultValue={sp.q} placeholder="Título, ator, diretor…" className="input !py-2" />
      </label>
      <Select name="type" label="Tipo" value={type === "all" ? "" : type} options={[["movie", "Filmes"], ["tv", "Séries"]]} />
      <Select name="genre" label="Gênero" value={sp.genre} options={GENRES.map((g) => [g.label, g.label])} />
      <Select name="year" label="Ano" value={sp.year} options={years} />
      <Select name="min" label="Nota mínima" value={sp.min} options={[["6", "6+"], ["7", "7+"], ["7.5", "7.5+"], ["8", "8+"]]} />
      <Select name="lang" label="Idioma" value={sp.lang} options={LANGUAGES.map((l) => [l.code, l.label])} />
      <Select name="country" label="País" value={sp.country} options={COUNTRIES.map((c) => [c.code, c.label])} />
      {type !== "tv" && (
        <Select name="runtime" label="Duração (filmes)" value={sp.runtime} options={[["90", "Até 90 min"], ["120", "Até 2 h"], ["150", "Até 2h30"]]} />
      )}
      {type !== "tv" && (
        <Select name="cert" label="Classificação (BR)" value={sp.cert} options={[["L", "Livre"], ["10", "10"], ["12", "12"], ["14", "14"], ["16", "16"], ["18", "18"]]} />
      )}
      {type !== "movie" && (
        <Select name="status" label="Status (séries)" value={sp.status} options={[["ended", "Finalizada"], ["running", "Em andamento"], ["canceled", "Cancelada"]]} />
      )}
      <Select
        name="sort"
        label="Ordenar por"
        value={sp.sort}
        options={[["popularity", "Popularidade"], ["rating", "Melhor avaliação"], ["release", "Lançamento"], ["perfil", "Relevância para o meu perfil"]]}
      />
      <div className="col-span-2 flex items-end gap-2 sm:col-span-3 lg:col-span-6">
        <button className="btn btn-gold">Aplicar filtros</button>
        <Link href="/buscar" className="btn btn-ghost">Limpar</Link>
      </div>
    </form>
  );
}

async function Results({ sp, type }: { sp: SP; type: "movie" | "tv" | "all" }) {
  const page = Math.max(1, Number(sp.page) || 1);
  const types: MediaType[] = type === "all" ? ["movie", "tv"] : [type];
  const sort = sp.sort ?? "popularity";

  let items: Media[] = [];
  let people: any[] = [];
  let hasMore = false;

  if (sp.q) {
    const raw = await safe(searchMulti(sp.q, page), []);
    people = page === 1 ? raw.filter((r) => r.media_type === "person").slice(0, 4) : [];
    items = raw
      .map((r) => normalize(r))
      .filter((m): m is Media => Boolean(m) && types.includes(m!.media_type))
      .filter((m) => {
        if (sp.genre && !types.some((t) => genreIdsFor(sp.genre!, t).some((g) => m.genre_ids.includes(g)))) return false;
        if (sp.year && String(m.year) !== sp.year) return false;
        if (sp.min && m.rating < Number(sp.min)) return false;
        return true;
      });
    hasMore = raw.length >= 20;
  } else {
    const lists = await Promise.all(
      types.map((t) => {
        const p: Record<string, string | number> = {};
        const ids = sp.genre ? genreIdsFor(sp.genre, t) : [];
        if (ids.length) p.with_genres = ids.join("|");
        if (sp.min) {
          p["vote_average.gte"] = sp.min;
          p["vote_count.gte"] = 150;
        }
        if (sp.lang) p.with_original_language = sp.lang;
        if (sp.country) p.with_origin_country = sp.country;
        if (sort === "rating") {
          p.sort_by = "vote_average.desc";
          p["vote_count.gte"] = Math.max(Number(p["vote_count.gte"] ?? 0), 300);
        } else if (sort === "release") {
          p.sort_by = t === "movie" ? "primary_release_date.desc" : "first_air_date.desc";
          p[t === "movie" ? "primary_release_date.lte" : "first_air_date.lte"] = today();
          p["vote_count.gte"] = Math.max(Number(p["vote_count.gte"] ?? 0), 20);
        } else {
          p.sort_by = "popularity.desc";
        }
        if (t === "movie") {
          if (sp.year) p.primary_release_year = sp.year;
          if (sp.runtime) p["with_runtime.lte"] = sp.runtime;
          if (sp.cert) {
            p.certification_country = "BR";
            p.certification = sp.cert;
          }
        } else {
          if (sp.year) p.first_air_date_year = sp.year;
          if (sp.status) p.with_status = { ended: 3, running: 0, canceled: 4 }[sp.status] ?? "";
        }
        return safe(discover(t, p, page), []);
      })
    );
    items = lists.flat();
    hasMore = lists.some((l) => l.length >= 18);
  }

  if (types.length > 1 || sp.q) {
    if (sort === "rating") items.sort((a, b) => b.rating - a.rating);
    else if (sort === "release") items.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    else if (!sp.q) items.sort((a, b) => b.popularity - a.popularity);
  }

  if (sort === "perfil") {
    const { supabase, user } = await getUser();
    if (supabase && user) {
      const { data } = await supabase.from("preferences").select("*").eq("user_id", user.id).maybeSingle();
      if (data) {
        const prefs = data as Preferences;
        const w = genreWeights(prefs);
        items = items.map((m) => ({ m, s: score(m, w, prefs) })).sort((a, b) => b.s - a.s).map(({ m }) => m);
      }
    }
  }

  const qs = (n: number) => {
    const u = new URLSearchParams();
    Object.entries(sp).forEach(([k, v]) => v && k !== "page" && u.set(k, v));
    u.set("page", String(n));
    return `/buscar?${u.toString()}`;
  };

  return (
    <div className="mt-6">
      {people.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 font-display text-lg text-white">Pessoas</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {people.map((p) => (
              <div key={p.id} className="panel flex gap-3 p-3">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-ink-700">
                  {p.profile_path && <Image src={`https://image.tmdb.org/t/p/w185${p.profile_path}`} alt={p.name} fill sizes="64px" className="object-cover" />}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">{p.name}</p>
                  <p className="text-xs text-neutral-500">{p.known_for_department}</p>
                  <p className="mt-1 text-xs">
                    {(p.known_for ?? []).slice(0, 2).map((k: any, i: number) => (
                      <span key={k.id}>
                        {i > 0 && " · "}
                        <Link href={`/titulo/${k.media_type}/${k.id}`} className="text-gold hover:underline">{k.title ?? k.name}</Link>
                      </span>
                    ))}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {sp.q && (sp.lang || sp.country || sp.runtime || sp.cert || sp.status) && (
        <p className="mb-4 text-xs text-neutral-500">
          Idioma, país, duração, classificação e status só se aplicam à exploração sem texto de busca.
        </p>
      )}

      {items.length === 0 ? (
        <div className="panel p-10 text-center">
          <p className="text-neutral-300">Nenhuma produção encontrada com esses filtros.</p>
          <p className="mt-1 text-sm text-neutral-500">Tente remover algum filtro ou buscar por outro termo.</p>
          <Link href="/buscar" className="btn btn-ghost mt-5">Limpar filtros</Link>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {items.map((m) => (
            <li key={`${m.media_type}-${m.id}`}>
              <PosterCard item={m} width="w-full" />
            </li>
          ))}
        </ul>
      )}

      <div className="mt-10 flex items-center justify-center gap-3">
        {page > 1 && <Link href={qs(page - 1)} className="btn btn-ghost">← Anterior</Link>}
        <span className="text-sm text-neutral-500">Página {page}</span>
        {hasMore && <Link href={qs(page + 1)} className="btn btn-ghost">Próxima →</Link>}
      </div>
    </div>
  );
}
