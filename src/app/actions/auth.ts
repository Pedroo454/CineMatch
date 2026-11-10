"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const err = (path: string, msg: string): never => redirect(`${path}?error=${encodeURIComponent(msg)}`);
const origin = () => process.env.NEXT_PUBLIC_SITE_URL || headers().get("origin") || "";

export async function login(fd: FormData) {
  const supabase = createClient();
  const next = String(fd.get("next") || "/");
  const { error } = await supabase.auth.signInWithPassword({
    email: String(fd.get("email") || "").trim(),
    password: String(fd.get("password") || ""),
  });
  if (error) err("/login", "E-mail ou senha incorretos.");
  redirect(next.startsWith("/") ? next : "/");
}

export async function signup(fd: FormData) {
  const supabase = createClient();
  const username = String(fd.get("username") || "").trim();
  const password = String(fd.get("password") || "");
  if (password.length < 8) err("/cadastro", "A senha precisa ter pelo menos 8 caracteres.");

  const { data, error } = await supabase.auth.signUp({
    email: String(fd.get("email") || "").trim(),
    password,
    options: { data: { username }, emailRedirectTo: `${origin()}/auth/callback?next=/onboarding` },
  });
  if (error) err("/cadastro", error.message.includes("registered") ? "Este e-mail já está cadastrado." : "Não foi possível criar a conta. Verifique os dados.");
  if (data.session) redirect("/onboarding");
  redirect("/login?msg=" + encodeURIComponent("Conta criada! Confirme seu e-mail para entrar."));
}

export async function logout() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function requestReset(fd: FormData) {
  const supabase = createClient();
  await supabase.auth.resetPasswordForEmail(String(fd.get("email") || "").trim(), {
    redirectTo: `${origin()}/auth/callback?next=/redefinir-senha`,
  });
  // Mesma resposta exista ou não a conta (não revela quem está cadastrado).
  redirect("/recuperar-senha?msg=" + encodeURIComponent("Se o e-mail existir, enviamos um link para redefinir a senha."));
}

export async function updatePassword(fd: FormData) {
  const supabase = createClient();
  const password = String(fd.get("password") || "");
  if (password.length < 8) err("/redefinir-senha", "A senha precisa ter pelo menos 8 caracteres.");
  const { error } = await supabase.auth.updateUser({ password });
  if (error) err("/redefinir-senha", "Não foi possível alterar a senha. Peça um novo link.");
  redirect("/?msg=senha-alterada");
}
