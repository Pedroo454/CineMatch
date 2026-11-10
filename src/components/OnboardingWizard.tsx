"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Check, X } from "lucide-react";
import clsx from "clsx";
import { GENRES, STYLES } from "@/lib/genres";
import { profileSummary } from "@/lib/profile";
import { savePreferences } from "@/app/actions/profile";
import type { FavoriteRef, Preferences } from "@/lib/types";

const STEPS = ["Preferência", "Gêneros", "Estilo", "Duração", "Status", "Favoritos"];

function Option({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={clsx(
        "flex items-center justify-between gap-2 rounded-xl border px-4 py-3 text-left text-sm transition",
        active ? "border-gold bg-gold/10 text-gold-soft" : "border-ink-500 bg-ink-800/60 text-neutral-300 hover:border-gold/50"
      )}
    >
      <span>{children}</span>
      {active && <Check className="h-4 w-4 shrink-0" />}
    </button>
  );
}

export default function OnboardingWizard({ initial }: { initial: Preferences }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [prefs, setPrefs] = useState<Preferences>(initial);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);

  const set = <K extends keyof Preferences>(k: K, v: Preferences[K]) => setPrefs((p) => ({ ...p, [k]: v }));
  const toggle = (k: "genres" | "styles", v: string) =>
    set(k, prefs[k].includes(v) ? prefs[k].filter((x) => x !== v) : [...prefs[k], v]);

  const canNext = step === 1 ? prefs.genres.length > 0 : true;

  const finish = () =>
    start(async () => {
      const res = await savePreferences(prefs);
      if (res && "error" in res && res.error) setError(res.error);
      else setSaved(true);
    });

  const summary = profileSummary(prefs);

  if (saved) {
    return (
      <div className="panel animate-fade-up p-7 text-center sm:p-10">
        <p className="text-xs uppercase tracking-[0.2em] text-gold">Seu perfil cinematográfico</p>
        <h2 className="mt-3 font-display text-3xl font-semibold text-white">{summary.archetype}</h2>
        <p className="mx-auto mt-3 max-w-lg text-neutral-300">{summary.text}</p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {prefs.genres.map((g) => (
            <span key={g} className="chip border-gold/40 text-gold-soft">{g}</span>
          ))}
        </div>
        <button onClick={() => { router.push("/"); router.refresh(); }} className="btn btn-gold mt-8">
          Ver minhas recomendações
        </button>
      </div>
    );
  }

  return (
    <div className="panel p-5 sm:p-8">
      <ol className="mb-6 flex gap-1.5" aria-label="Progresso">
        {STEPS.map((s, i) => (
          <li key={s} className="flex-1">
            <div className={clsx("h-1 rounded-full transition-all", i <= step ? "bg-gold" : "bg-ink-600")} />
            <span className={clsx("mt-1.5 hidden text-[10px] uppercase tracking-wide sm:block", i === step ? "text-gold" : "text-neutral-600")}>{s}</span>
          </li>
        ))}
      </ol>

      <div className="min-h-[320px] animate-fade-up" key={step}>
        {step === 0 && (
          <>
            <h2 className="font-display text-2xl text-white">O que você mais gosta de assistir?</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {([["movie", "Filmes"], ["tv", "Séries"], ["both", "Ambos"]] as const).map(([v, l]) => (
                <Option key={v} active={prefs.content_type === v} onClick={() => set("content_type", v)}>{l}</Option>
              ))}
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h2 className="font-display text-2xl text-white">Quais são seus gêneros favoritos?</h2>
            <p className="mt-1 text-sm text-neutral-500">Escolha quantos quiser (pelo menos 1).</p>
            <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {GENRES.map((g) => (
                <Option key={g.label} active={prefs.genres.includes(g.label)} onClick={() => toggle("genres", g.label)}>{g.label}</Option>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="font-display text-2xl text-white">Que estilo de história te prende?</h2>
            <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
              {STYLES.map((s) => (
                <Option key={s.key} active={prefs.styles.includes(s.key)} onClick={() => toggle("styles", s.key)}>{s.label}</Option>
              ))}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="font-display text-2xl text-white">Qual duração prefere?</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {([["short", "Produções curtas"], ["medium", "Duração média"], ["long", "Produções longas"], ["any", "Sem preferência"]] as const).map(([v, l]) => (
                <Option key={v} active={prefs.duration === v} onClick={() => set("duration", v)}>{l}</Option>
              ))}
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h2 className="font-display text-2xl text-white">Finalizadas ou em andamento?</h2>
            <div className="mt-5 grid gap-3">
              {([["finished", "Prefiro produções finalizadas"], ["new", "Gosto de acompanhar lançamentos"], ["any", "Não tenho preferência"]] as const).map(([v, l]) => (
                <Option key={v} active={prefs.status_pref === v} onClick={() => set("status_pref", v)}>{l}</Option>
              ))}
            </div>
          </>
        )}

        {step === 5 && <FavoritesPicker value={prefs.favorites} onChange={(f) => set("favorites", f)} />}
      </div>

      {error && <p role="alert" className="mt-3 text-sm text-red-300">{error}</p>}

      <div className="mt-6 flex items-center justify-between border-t border-ink-600 pt-5">
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => setStep((s) => s - 1)} disabled={step === 0} className="btn btn-ghost !py-2 disabled:invisible">
            Voltar
          </button>
          <Link href="/?skip=1" className="text-xs text-neutral-500 hover:text-neutral-300">Pular por agora</Link>
        </div>
        {step < STEPS.length - 1 ? (
          <button type="button" onClick={() => setStep((s) => s + 1)} disabled={!canNext} className="btn btn-gold">
            Continuar
          </button>
        ) : (
          <button type="button" onClick={finish} disabled={pending} className="btn btn-gold">
            {pending ? "Gerando perfil…" : "Gerar meu perfil"}
          </button>
        )}
      </div>
    </div>
  );
}

type Result = { type: "movie" | "tv" | "person"; id: number; title: string; sub: string; poster: string | null; genre_ids: number[] };

function FavoritesPicker({ value, onChange }: { value: FavoriteRef[]; onChange: (f: FavoriteRef[]) => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[]>([]);

  useEffect(() => {
    if (q.trim().length < 2) return setResults([]);
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`, { signal: ctrl.signal });
        const data = await res.json();
        setResults((data.results ?? []).filter((r: Result) => r.type !== "person"));
      } catch {
        /* cancelado */
      }
    }, 250);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  const add = (r: Result) => {
    if (r.type === "person" || value.length >= 12 || value.some((f) => f.id === r.id && f.media_type === r.type)) return;
    onChange([...value, { id: r.id, media_type: r.type, title: r.title, poster_path: r.poster, genre_ids: r.genre_ids }]);
    setQ("");
  };

  return (
    <>
      <h2 className="font-display text-2xl text-white">Quais são seus filmes e séries favoritos?</h2>
      <p className="mt-1 text-sm text-neutral-500">Busque e adicione até 12. Isso deixa as recomendações bem mais precisas.</p>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ex.: Prison Break, Interestelar…" className="input mt-5" aria-label="Buscar favoritos" />

      {results.length > 0 && (
        <ul className="mt-2 divide-y divide-ink-600 overflow-hidden rounded-xl border border-ink-600">
          {results.map((r) => (
            <li key={`${r.type}-${r.id}`}>
              <button type="button" onClick={() => add(r)} className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-ink-700">
                <span className="relative h-12 w-8 shrink-0 overflow-hidden rounded bg-ink-700">
                  {r.poster && <Image src={`https://image.tmdb.org/t/p/w92${r.poster}`} alt="" fill sizes="32px" className="object-cover" />}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm text-neutral-100">{r.title}</span>
                  <span className="block text-xs text-neutral-500">{r.sub}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        {value.map((f) => (
          <span key={`${f.media_type}-${f.id}`} className="chip gap-1.5 border-gold/40 text-gold-soft">
            {f.title}
            <button type="button" aria-label={`Remover ${f.title}`} onClick={() => onChange(value.filter((x) => !(x.id === f.id && x.media_type === f.media_type)))}>
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        {value.length === 0 && <p className="text-sm text-neutral-600">Nenhum favorito ainda — você pode pular esta etapa.</p>}
      </div>
    </>
  );
}
