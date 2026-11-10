import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import Hero from "@/components/Hero";
import Row from "@/components/Row";
import FranchiseRow from "@/components/FranchiseRow";
import SetupNotice, { missingEnv } from "@/components/SetupNotice";
import { RowSkeleton } from "@/components/Skeletons";
import { getUser } from "@/lib/supabase/server";
import { hasTmdb, hiddenGems, popular, recent, safe, topRated, trending } from "@/lib/tmdb";
import { buildPersonalRows } from "@/lib/recommend";
import type { LibraryItem, Preferences } from "@/lib/types";

export default async function Home({ searchParams }: { searchParams: { skip?: string; msg?: string } }) {
  const missing = missingEnv();
  const { supabase, user } = await getUser();

  let prefs: Preferences | null = null;
  let library: LibraryItem[] = [];
  if (supabase && user) {
    const [p, l] = await Promise.all([
      supabase.from("preferences").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("library_items").select("*").eq("user_id", user.id),
    ]);
    prefs = (p.data as Preferences | null) ?? null;
    library = (l.data as LibraryItem[] | null) ?? [];
    // Primeiro acesso: leva ao questionário (pode ser pulado).
    if (!prefs && !searchParams.skip) redirect("/onboarding");
  }

  if (!hasTmdb()) return <SetupNotice missing={missing} />;

  const [hero, popMovies, popTv, newMovies, newTv, topMovies, gemsMovies, gemsTv] = await Promise.all([
    safe(trending("all"), []),
    safe(popular("movie"), []),
    safe(popular("tv"), []),
    safe(recent("movie"), []),
    safe(recent("tv"), []),
    safe(topRated("movie"), []),
    safe(hiddenGems("movie"), []),
    safe(hiddenGems("tv"), []),
  ]);
  const featured = hero.find((m) => m.backdrop) ?? hero[0];
  const gems = [...gemsMovies.slice(0, 10), ...gemsTv.slice(0, 10)].sort((a, b) => b.rating - a.rating);
  const recents = [...newMovies.slice(0, 10), ...newTv.slice(0, 10)].sort((a, b) => b.popularity - a.popularity);

  return (
    <>
      {featured && <Hero item={featured} />}
      <SetupNotice missing={missing} />

      {searchParams.msg === "senha-alterada" && (
        <p className="container-x pt-4 text-sm text-gold">Senha alterada com sucesso.</p>
      )}

      {prefs ? (
        <Suspense fallback={<RowSkeleton rows={2} />}>
          <PersonalRows prefs={prefs} library={library} />
        </Suspense>
      ) : (
        <section className="container-x py-6">
          <div className="panel flex flex-col items-start justify-between gap-4 border-gold/30 p-6 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-display text-xl font-semibold text-white">Recomendações feitas para o seu gosto</h2>
              <p className="mt-1 text-sm text-neutral-400">
                Responda a um questionário rápido e receba sugestões com explicação do porquê de cada uma.
              </p>
            </div>
            <Link href={user ? "/onboarding" : "/cadastro"} className="btn btn-gold shrink-0">
              {user ? "Descobrir meu perfil" : "Criar conta grátis"}
            </Link>
          </div>
        </section>
      )}

      <Row title="Filmes populares" items={popMovies} />
      <Row title="Séries populares" items={popTv} />
      <Row title="Lançamentos recentes" subtitle="Estreias dos últimos meses" items={recents} />
      <Row title="Mais bem avaliados" subtitle="Filmes com as melhores notas no TMDB" items={topMovies} />
      <Row title="Joias escondidas" subtitle="Notas altas, mas pouco badaladas" items={gems} />
      <Suspense fallback={null}>
        <FranchiseRow />
      </Suspense>
    </>
  );
}

async function PersonalRows({ prefs, library }: { prefs: Preferences; library: LibraryItem[] }) {
  const rows = await safe(buildPersonalRows(prefs, library), []);
  return (
    <>
      {rows.map((r) => (
        <Row key={r.key} title={r.title} subtitle={r.subtitle} items={r.items} />
      ))}
    </>
  );
}
