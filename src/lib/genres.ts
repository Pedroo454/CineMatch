import type { MediaType } from "./types";

// Gêneros oferecidos no onboarding e nos filtros, com os IDs equivalentes no TMDB.
export const GENRES: { label: string; movie: number[]; tv: number[] }[] = [
  { label: "Ação", movie: [28], tv: [10759] },
  { label: "Aventura", movie: [12], tv: [10759] },
  { label: "Comédia", movie: [35], tv: [35] },
  { label: "Drama", movie: [18], tv: [18] },
  { label: "Ficção científica", movie: [878], tv: [10765] },
  { label: "Fantasia", movie: [14], tv: [10765] },
  { label: "Terror", movie: [27], tv: [9648] },
  { label: "Suspense", movie: [53], tv: [9648] },
  { label: "Mistério", movie: [9648], tv: [9648] },
  { label: "Crime", movie: [80], tv: [80] },
  { label: "Romance", movie: [10749], tv: [18] },
  { label: "Documentário", movie: [99], tv: [99] },
  { label: "Animação", movie: [16], tv: [16] },
  { label: "Guerra", movie: [10752], tv: [10768] },
  { label: "Histórico", movie: [36], tv: [10768] },
  { label: "Policial", movie: [80], tv: [80] },
];

// Nomes para exibir a partir de IDs do TMDB (filmes + séries).
export const GENRE_NAMES: Record<number, string> = {
  28: "Ação", 12: "Aventura", 16: "Animação", 35: "Comédia", 80: "Crime",
  99: "Documentário", 18: "Drama", 10751: "Família", 14: "Fantasia", 36: "História",
  27: "Terror", 10402: "Música", 9648: "Mistério", 10749: "Romance",
  878: "Ficção científica", 10770: "Cinema TV", 53: "Suspense", 10752: "Guerra",
  37: "Faroeste", 10759: "Ação e aventura", 10762: "Infantil", 10763: "Notícias",
  10764: "Reality", 10765: "Ficção e fantasia", 10766: "Novela", 10767: "Talk show",
  10768: "Guerra e política",
};

export const genreName = (id?: number) => (id ? GENRE_NAMES[id] ?? "" : "");

export function genreIdsFor(label: string, type: MediaType): number[] {
  return GENRES.find((g) => g.label === label)?.[type] ?? [];
}

// Cada "estilo de produção" do onboarding aponta para gêneros afins.
export const STYLES: { key: string; label: string; genres: string[] }[] = [
  { key: "reviravoltas", label: "Histórias com reviravoltas", genres: ["Mistério", "Suspense", "Crime"] },
  { key: "investigacoes", label: "Investigações e mistérios", genres: ["Mistério", "Crime", "Policial"] },
  { key: "estrategia", label: "Estratégia e inteligência", genres: ["Crime", "Suspense", "Guerra"] },
  { key: "sobrevivencia", label: "Sobrevivência", genres: ["Aventura", "Terror", "Ação"] },
  { key: "fatos-reais", label: "Histórias baseadas em fatos reais", genres: ["Histórico", "Documentário", "Drama"] },
  { key: "universos-fantasticos", label: "Universos fantásticos", genres: ["Fantasia", "Aventura", "Ficção científica"] },
  { key: "ficcao-cientifica", label: "Ficção científica", genres: ["Ficção científica"] },
  { key: "psicologicas", label: "Tramas psicológicas", genres: ["Suspense", "Drama", "Terror"] },
  { key: "personagens-complexos", label: "Personagens complexos", genres: ["Drama", "Crime"] },
];

export const COUNTRIES = [
  { code: "US", label: "Estados Unidos" }, { code: "BR", label: "Brasil" },
  { code: "GB", label: "Reino Unido" }, { code: "KR", label: "Coreia do Sul" },
  { code: "JP", label: "Japão" }, { code: "FR", label: "França" },
  { code: "ES", label: "Espanha" }, { code: "DE", label: "Alemanha" },
];

export const LANGUAGES = [
  { code: "pt", label: "Português" }, { code: "en", label: "Inglês" },
  { code: "es", label: "Espanhol" }, { code: "ja", label: "Japonês" },
  { code: "ko", label: "Coreano" }, { code: "fr", label: "Francês" },
];
