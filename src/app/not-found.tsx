import Link from "next/link";
import { LogoMark } from "@/components/Logo";

export default function NotFound() {
  return (
    <div className="container-x flex min-h-[60vh] flex-col items-center justify-center text-center">
      <LogoMark size={56} />
      <h1 className="mt-5 font-display text-3xl font-semibold text-white">Corta! Cena não encontrada.</h1>
      <p className="mt-2 text-neutral-400">Essa página não existe ou o título não está mais disponível.</p>
      <Link href="/" className="btn btn-gold mt-6">Voltar ao início</Link>
    </div>
  );
}
