"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ItemPayload, LibraryStatus } from "@/lib/types";

export type LibraryPatch = {
  status?: LibraryStatus | null;
  is_favorite?: boolean;
  rating?: number | null;
};

// Salva (cria ou atualiza) um título na biblioteca do usuário logado.
export async function saveItem(item: ItemPayload, patch: LibraryPatch) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "login" as const };

  if (patch.rating !== undefined && patch.rating !== null && (patch.rating < 0 || patch.rating > 10)) {
    return { error: "Nota inválida." };
  }

  const now = new Date().toISOString();
  const row: Record<string, unknown> = { ...item, user_id: user.id, ...patch, updated_at: now };
  if (patch.status === "watched") row.watched_at = now;
  if (patch.status && patch.status !== "watched") row.watched_at = null;

  const { error } = await supabase.from("library_items").upsert(row, { onConflict: "user_id,tmdb_id,media_type" });
  if (error) return { error: "Não foi possível salvar. Tente novamente." };

  revalidatePath("/biblioteca");
  revalidatePath("/perfil");
  return { ok: true as const };
}
