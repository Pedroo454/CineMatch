import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { updateProfile } from "@/app/actions/profile";
import { genreName } from "@/lib/genres";
import { profileSummary } from "@/lib/profile";
import { getUser } from "@/lib/supabase/server";
import type { LibraryItem, Preferences } from "@/lib/types";

export const metadata: Metadata = { title: "Perfil e estatísticas" };

export default async function Perfil({ searchParams }: { searchParams: { error?: string; msg?: string } }) {
  const { supabase, user } = await getUser();
  if (!supabase || !user) redirect("/login?next=/perfil");

  const [prof, pref, lib] = await Promise.all([
    supabase.from("profiles").select("username,bio").eq("id", user.id).maybeSingle(),
    supabase.from("preferences").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("library_items").select("*").eq("user_id", user.id),
  ]);
  const profile = prof.data as { username: string | null; bio: string | null } | null;
  const prefs = pref.data as Preferences | null;
  const items = (lib.data as LibraryItem[] | null) ?? [];

  const watched = items.filter((i) => i.status === "watched");
  const movies = watched.filter((i) => i.media_type === "movie");
  const shows = watched.filter((i) => i.media_type === "tv");
  const minutes = watched.reduce((s, i) => s + (i.runtime_min ?? 0), 0);
  const rated = items.filter((i) => i.rating != null);
  const avg = rated.length ? rated.reduce((s, i) => s + Number(i.rating), 0) / rated.length : null;
  const best = [...rated].sort((a, b) => Number(b.rating) - Number(a.rating))[0];

  const genreCount = new Map<number, number>();
  watched.forEach((i) => i.genre_ids.forEach((g) => genreCount.set(g, (genreCount.get(g) ?? 0) + 1)));
  const topGenre = [...genreCount.entries()].sort((a, b) => b[1] - a[1])[0];

  // Evolução mensal (últimos 6 meses) pelos títulos marcados como assistidos.
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return { key: d.toISOString().slice(0, 7), label: d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "") };
  });
  const perMonth = months.map((m) => ({ ...m, n: watched.filter((i) => i.watched_at?.startsWith(m.key)).length }));
  const max = Math.max(1, ...perMonth.map((m) => m.n));

  const summary = prefs ? profileSummary(prefs) : null;
  const name = profile?.username || user.email?.split("@")[0] || "Cinéfilo";

  const stats: [string, string][] = [
    ["Filmes assistidos", String(movies.length)],
    ["Séries concluídas", String(shows.length)],
    ["Horas de conteúdo", minutes ? `${Math.round(minutes / 60)} h` : "0 h"],
    ["Nota média", avg != null ? avg.toFixed(1) : "—"],
    ["Gênero mais assistido", topGenre ? genreName(topGenre[0]) : "—"],
    ["Mais bem avaliada", best ? `${best.title} (${Number(best.rating)})` : "—"],
  ];

  return (
    <div className="container-x max-w-5xl py-8">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-gold bg-ink-800 font-display text-2xl text-gold">
          {name.slice(0, 1).toUpperCase()}
        </div>
        <div>
          <h1 className="font-display text-3xl font-semibold text-white">{name}</h1>
          {summary && <p className="text-sm text-gold">{summary.archetype}</p>}
        </div>
      </div>

      {searchParams.error && <p role="alert" className="mt-4 text-sm text-red-300">{searchParams.error}</p>}
      {searchParams.msg && <p role="status" className="mt-4 text-sm text-gold">{searchParams.msg}</p>}

      <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="Estatísticas">
        {stats.map(([l, v]) => (
          <div key={l} className="panel p-4">
            <p className="text-xs uppercase tracking-wide text-neutral-500">{l}</p>
            <p className="mt-1 truncate font-display text-2xl text-white">{v}</p>
          </div>
        ))}
      </section>

      <section className="panel mt-6 p-5" aria-label="Evolução mensal">
        <h2 className="font-display text-lg text-white">Evolução mensal</h2>
        <p className="text-xs text-neutral-500">Títulos marcados como assistidos nos últimos 6 meses.</p>
        <div className="mt-4 flex h-40 items-end gap-3">
          {perMonth.map((m) => (
            <div key={m.key} className="flex flex-1 flex-col items-center gap-1.5">
              <span className="text-xs text-neutral-400">{m.n}</span>
              <div className="w-full rounded-t-md bg-gradient-to-t from-gold-deep to-gold" style={{ height: `${Math.max(4, (m.n / max) * 100)}%` }} />
              <span className="text-xs capitalize text-neutral-500">{m.label}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="panel p-5">
          <h2 className="font-display text-lg text-white">Perfil cinematográfico</h2>
          {summary && prefs ? (
            <>
              <p className="mt-2 text-sm text-neutral-300">{summary.text}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {prefs.genres.map((g) => <span key={g} className="chip border-gold/40 text-gold-soft">{g}</span>)}
              </div>
              <Link href="/onboarding" className="btn btn-ghost mt-4 !py-2">Editar preferências</Link>
            </>
          ) : (
            <>
              <p className="mt-2 text-sm text-neutral-500">Você ainda não respondeu ao questionário.</p>
              <Link href="/onboarding" className="btn btn-gold mt-4 !py-2">Descobrir meu perfil</Link>
            </>
          )}
        </section>

        <section className="panel p-5">
          <h2 className="font-display text-lg text-white">Dados do perfil</h2>
          <form action={updateProfile} className="mt-3 space-y-3">
            <label className="block text-xs text-neutral-500">
              <span className="mb-1 block">Nome de usuário</span>
              <input name="username" defaultValue={profile?.username ?? ""} maxLength={30} className="input" />
            </label>
            <label className="block text-xs text-neutral-500">
              <span className="mb-1 block">Descrição pessoal</span>
              <textarea name="bio" defaultValue={profile?.bio ?? ""} maxLength={280} rows={3} className="input" />
            </label>
            <button className="btn btn-gold !py-2">Salvar</button>
          </form>
        </section>
      </div>

      {prefs && prefs.favorites.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 font-display text-lg text-white">Produções favoritas</h2>
          <div className="flex flex-wrap gap-2">
            {prefs.favorites.map((f) => (
              <Link key={`${f.media_type}-${f.id}`} href={`/titulo/${f.media_type}/${f.id}`} className="chip hover:border-gold hover:text-gold-soft">{f.title}</Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
