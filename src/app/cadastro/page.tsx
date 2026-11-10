import Link from "next/link";
import type { Metadata } from "next";
import AuthShell from "@/components/AuthShell";
import { signup } from "@/app/actions/auth";

export const metadata: Metadata = { title: "Criar conta" };

export default function Cadastro({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <AuthShell title="Crie sua conta" subtitle="Grátis. Leva menos de um minuto." error={searchParams.error}>
      <form action={signup} className="space-y-4">
        <label className="block text-sm">
          <span className="mb-1 block text-neutral-400">Nome de usuário</span>
          <input name="username" required minLength={3} maxLength={30} autoComplete="username" className="input" />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-neutral-400">E-mail</span>
          <input name="email" type="email" required autoComplete="email" className="input" />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-neutral-400">Senha (mín. 8 caracteres)</span>
          <input name="password" type="password" required minLength={8} autoComplete="new-password" className="input" />
        </label>
        <button className="btn btn-gold w-full">Criar conta</button>
      </form>
      <p className="mt-5 text-center text-sm text-neutral-400">
        Já tem conta? <Link href="/login" className="text-gold hover:underline">Entrar</Link>
      </p>
    </AuthShell>
  );
}
