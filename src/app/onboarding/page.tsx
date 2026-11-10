import type { Metadata } from "next";
import { redirect } from "next/navigation";
import OnboardingWizard from "@/components/OnboardingWizard";
import { getUser } from "@/lib/supabase/server";
import type { Preferences } from "@/lib/types";

export const metadata: Metadata = { title: "Seu perfil cinematográfico" };

const EMPTY: Preferences = { content_type: "both", genres: [], styles: [], duration: "any", status_pref: "any", favorites: [] };

export default async function Onboarding() {
  const { supabase, user } = await getUser();
  if (!supabase || !user) redirect("/login?next=/onboarding");

  const { data } = await supabase.from("preferences").select("*").eq("user_id", user.id).maybeSingle();
  const initial = (data as Preferences | null) ?? EMPTY;

  return (
    <div className="container-x max-w-3xl py-10">
      <p className="text-xs uppercase tracking-[0.2em] text-gold">{data ? "Editar preferências" : "Primeiro acesso"}</p>
      <h1 className="mb-6 mt-2 font-display text-3xl font-semibold text-white">Vamos descobrir o seu gosto</h1>
      <OnboardingWizard initial={initial} />
    </div>
  );
}
