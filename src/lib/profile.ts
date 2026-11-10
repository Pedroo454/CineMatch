import { STYLES } from "./genres";
import type { Preferences } from "./types";

// Gera o "perfil cinematográfico" textual a partir das respostas do onboarding.
export function profileSummary(p: Preferences) {
  const g = p.genres.slice(0, 2).map((x) => x.toLowerCase());
  const styles = p.styles
    .map((k) => STYLES.find((s) => s.key === k)?.label.toLowerCase())
    .filter(Boolean)
    .slice(0, 2) as string[];

  const archetype =
    p.styles.includes("reviravoltas") || p.styles.includes("investigacoes")
      ? "Detetive de poltrona"
      : p.styles.includes("universos-fantasticos") || p.styles.includes("ficcao-cientifica")
      ? "Explorador de outros mundos"
      : p.styles.includes("fatos-reais")
      ? "Caçador de histórias reais"
      : p.styles.includes("psicologicas") || p.styles.includes("personagens-complexos")
      ? "Amante de personagens complexos"
      : p.genres.includes("Comédia")
      ? "Caçador de boas risadas"
      : "Cinéfilo curioso";

  const dur = { short: "produções curtas", medium: "duração média", long: "produções longas", any: "qualquer duração" }[p.duration];
  const kind = { movie: "filmes", tv: "séries", both: "filmes e séries" }[p.content_type];
  const status =
    p.status_pref === "finished" ? "prefere histórias já finalizadas" : p.status_pref === "new" ? "gosta de acompanhar lançamentos" : "";

  const parts = [
    `Você curte ${kind}`,
    g.length ? `com foco em ${g.join(" e ")}` : "",
    styles.length ? `e gosta de ${styles.join(" e ")}` : "",
  ].filter(Boolean);

  return {
    archetype,
    text: `${parts.join(" ")}. Prefere ${dur}${status ? ` e ${status}` : ""}.`,
  };
}
