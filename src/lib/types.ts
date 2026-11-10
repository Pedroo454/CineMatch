export type MediaType = "movie" | "tv";
export type LibraryStatus = "want" | "watching" | "watched" | "dropped";

export interface Media {
  id: number;
  media_type: MediaType;
  title: string;
  year: number | null;
  date: string;
  poster: string | null;
  backdrop: string | null;
  rating: number;
  votes: number;
  popularity: number;
  overview: string;
  genre_ids: number[];
  reason?: string;
}

export interface FavoriteRef {
  id: number;
  media_type: MediaType;
  title: string;
  poster_path: string | null;
  genre_ids: number[];
}

export interface Preferences {
  content_type: "movie" | "tv" | "both";
  genres: string[];
  styles: string[];
  duration: "short" | "medium" | "long" | "any";
  status_pref: "finished" | "new" | "any";
  favorites: FavoriteRef[];
}

export interface LibraryItem {
  tmdb_id: number;
  media_type: MediaType;
  title: string;
  poster_path: string | null;
  year: number | null;
  genre_ids: number[];
  runtime_min: number | null;
  status: LibraryStatus | null;
  is_favorite: boolean;
  rating: number | null;
  watched_at: string | null;
  updated_at: string;
}

export type ItemPayload = {
  tmdb_id: number;
  media_type: MediaType;
  title: string;
  poster_path: string | null;
  year: number | null;
  genre_ids: number[];
  runtime_min: number | null;
};
