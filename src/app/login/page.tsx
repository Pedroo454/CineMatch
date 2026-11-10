import Link from "next/link";
import type { Metadata } from "next";
import AuthShell from "@/components/AuthShell";
import { login } from "@/app/actions/auth";

export const metadata: Metadata = { title: "Entrar" };

export default function Login({ searchParams }: { searchParams: { error?: string; msg?: string; next?: string } }) {
  return (
    <AuthShell title="Bem-vindo de volta" subtitle="Entre para ver suas recomendações." error={searchParams.error} msg={searchParams.msg}>
      <form action={login} className="space-y-4">
        <input type="hidden" name="next" value={searchParams.next ?? "/"} />
        <label className="block text-sm">
          <span className="mb-1 block text-neutral-400">E-mail</span>
          <input name="email" type="email" required autoComplete="email" className="input" />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-neutral-400">Senha</span>
          <input name="password" type="password" required autoComplete="current-password" className="input" />
        </label>
        <button className="btn btn-gold w-full">Entrar</button>
      </form>
      <div className="mt-5 flex justify-between text-sm text-neutral-400">
        <Link href="/recuperar-senha" className="hover:text-gold">Esqueci a senha</Link>
        <Link href="/cadastro" className="hover:text-gold">Criar conta</Link>
      </div>
    </AuthShell>
  );
}
