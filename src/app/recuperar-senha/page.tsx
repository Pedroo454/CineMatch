import Link from "next/link";
import type { Metadata } from "next";
import AuthShell from "@/components/AuthShell";
import { requestReset } from "@/app/actions/auth";

export const metadata: Metadata = { title: "Recuperar senha" };

export default function Recuperar({ searchParams }: { searchParams: { error?: string; msg?: string } }) {
  return (
    <AuthShell title="Recuperar senha" subtitle="Enviaremos um link para o seu e-mail." error={searchParams.error} msg={searchParams.msg}>
      <form action={requestReset} className="space-y-4">
        <label className="block text-sm">
          <span className="mb-1 block text-neutral-400">E-mail</span>
          <input name="email" type="email" required autoComplete="email" className="input" />
        </label>
        <button className="btn btn-gold w-full">Enviar link</button>
      </form>
      <p className="mt-5 text-center text-sm text-neutral-400">
        <Link href="/login" className="hover:text-gold">Voltar ao login</Link>
      </p>
    </AuthShell>
  );
}
