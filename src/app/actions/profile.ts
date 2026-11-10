"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { FavoriteRef, Preferences } from "@/lib/types";

export async function savePreferences(prefs: Preferences) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/onboarding");

  const favorites = prefs.favorites.slice(0, 12);
  const { error } = await supabase.from("preferences").upsert({
    user_id: user.id,
    content_type: prefs.content_type,
    genres: prefs.genres,
    styles: prefs.styles,
    duration: prefs.duration,
    status_pref: prefs.status_pref,
    favorites,
    updated_at: new Date().toISOString(),
  });
  if (error) return { error: "Não foi possível salvar suas preferências." };

  // Sincroniza os favoritos escolhidos com a biblioteca.
  if (favorites.length) {
    await supabase.from("library_items").upsert(
      favorites.map((f: FavoriteRef) => ({
        user_id: user.id,
        tmdb_id: f.id,
        media_type: f.media_type,
        title: f.title,
        poster_path: f.poster_path,
        genre_ids: f.genre_ids,
        is_favorite: true,
        updated_at: new Date().toISOString(),
      })),
      { onConflict: "user_id,tmdb_id,media_type" }
    );
  }

  revalidatePath("/", "layout");
  return { ok: true as const };
}

export async function updateProfile(fd: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const username = String(fd.get("username") || "").trim().slice(0, 30);
  const bio = String(fd.get("bio") || "").trim().slice(0, 280);
  const { error } = await supabase.from("profiles").update({ username: username || null, bio: bio || null }).eq("id", user.id);
  if (error) redirect("/perfil?error=" + encodeURIComponent("Nome de usuário já em uso ou inválido."));
  revalidatePath("/perfil");
  redirect("/perfil?msg=" + encodeURIComponent("Perfil atualizado."));
}
