import type { Metadata } from "next";
import AuthShell from "@/components/AuthShell";
import { updatePassword } from "@/app/actions/auth";

export const metadata: Metadata = { title: "Nova senha" };

export default function Redefinir({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <AuthShell title="Defina uma nova senha" error={searchParams.error}>
      <form action={updatePassword} className="space-y-4">
        <label className="block text-sm">
          <span className="mb-1 block text-neutral-400">Nova senha (mín. 8 caracteres)</span>
          <input name="password" type="password" required minLength={8} autoComplete="new-password" className="input" />
        </label>
        <button className="btn btn-gold w-full">Salvar senha</button>
      </form>
    </AuthShell>
  );
}
