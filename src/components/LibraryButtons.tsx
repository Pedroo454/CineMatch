"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Bookmark, CheckCheck, Heart, Play, Share2, Sparkles, Star } from "lucide-react";
import clsx from "clsx";
import { saveItem } from "@/app/actions/library";
import type { ItemPayload, LibraryStatus } from "@/lib/types";

type State = { status: LibraryStatus | null; is_favorite: boolean; rating: number | null };

export default function LibraryButtons({
  item,
  initial,
  loggedIn,
  nextPath,
}: {
  item: ItemPayload;
  initial: State;
  loggedIn: boolean;
  nextPath: string;
}) {
  const [state, setState] = useState<State>(initial);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");

  const apply = (patch: Partial<State>) => {
    const prev = state;
    setState({ ...state, ...patch });
    start(async () => {
      const res = await saveItem(item, patch);
      if (res && "error" in res && res.error) {
        setState(prev);
        setMsg(res.error === "login" ? "Entre na sua conta para salvar." : res.error);
      } else setMsg("");
    });
  };

  const toggleStatus = (s: LibraryStatus) => apply({ status: state.status === s ? null : s });

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: item.title, url });
      else {
        await navigator.clipboard.writeText(url);
        setMsg("Link copiado!");
      }
    } catch {
      /* cancelado */
    }
  };

  const btn = (active: boolean) => clsx("btn !px-4 !py-2", active ? "btn-gold" : "btn-ghost");
  const gate = (children: React.ReactNode, key: string) =>
    loggedIn ? null : (
      <Link key={key} href={`/login?next=${encodeURIComponent(nextPath)}`} className="btn btn-ghost !px-4 !py-2">
        {children}
      </Link>
    );

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {loggedIn ? (
          <>
            <button disabled={pending} onClick={() => toggleStatus("want")} className={btn(state.status === "want")} aria-pressed={state.status === "want"}>
              <Bookmark className="h-4 w-4" /> Quero assistir
            </button>
            {item.media_type === "tv" && (
              <button disabled={pending} onClick={() => toggleStatus("watching")} className={btn(state.status === "watching")} aria-pressed={state.status === "watching"}>
                <Play className="h-4 w-4" /> Assistindo
              </button>
            )}
            <button disabled={pending} onClick={() => toggleStatus("watched")} className={btn(state.status === "watched")} aria-pressed={state.status === "watched"}>
              <CheckCheck className="h-4 w-4" /> {state.status === "watched" ? "Assistido" : "Marcar como assistido"}
            </button>
            <button disabled={pending} onClick={() => apply({ is_favorite: !state.is_favorite })} className={btn(state.is_favorite)} aria-pressed={state.is_favorite}>
              <Heart className={clsx("h-4 w-4", state.is_favorite && "fill-current")} /> Favorito
            </button>
            <label className="btn btn-ghost !px-3 !py-2">
              <Star className="h-4 w-4" />
              <span className="sr-only">Minha nota</span>
              <select
                value={state.rating ?? ""}
                onChange={(e) => apply({ rating: e.target.value === "" ? null : Number(e.target.value) })}
                className="cursor-pointer bg-transparent text-sm focus:outline-none"
              >
                <option value="" className="bg-ink-800">Avaliar</option>
                {Array.from({ length: 10 }, (_, i) => 10 - i).map((n) => (
                  <option key={n} value={n} className="bg-ink-800">{n}/10</option>
                ))}
              </select>
            </label>
          </>
        ) : (
          <>
            {gate(<><Bookmark className="h-4 w-4" /> Quero assistir</>, "w")}
            {gate(<><CheckCheck className="h-4 w-4" /> Marcar como assistido</>, "a")}
            {gate(<><Heart className="h-4 w-4" /> Favorito</>, "f")}
            {gate(<><Star className="h-4 w-4" /> Avaliar</>, "r")}
          </>
        )}
        <button onClick={share} className="btn btn-ghost !px-4 !py-2">
          <Share2 className="h-4 w-4" /> Compartilhar
        </button>
        <a href="#semelhantes" className="btn btn-ghost !px-4 !py-2">
          <Sparkles className="h-4 w-4" /> Ver semelhantes
        </a>
      </div>
      {!loggedIn && <p className="mt-2 text-xs text-neutral-500">Entre na sua conta para salvar na biblioteca, favoritar e avaliar.</p>}
      {msg && <p role="status" className="mt-2 text-xs text-gold">{msg}</p>}
    </div>
  );
}
