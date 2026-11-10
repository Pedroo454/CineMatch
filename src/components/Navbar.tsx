import Link from "next/link";
import { LogOut, User, Library, Sparkles } from "lucide-react";
import Logo from "./Logo";
import SearchBox from "./SearchBox";
import { getUser } from "@/lib/supabase/server";
import { logout } from "@/app/actions/auth";

const links = [
  { href: "/", label: "Início" },
  { href: "/buscar?type=movie", label: "Filmes" },
  { href: "/buscar?type=tv", label: "Séries" },
  { href: "/franquias", label: "Franquias" },
  { href: "/biblioteca", label: "Minha biblioteca" },
];

export default async function Navbar() {
  const { user } = await getUser();
  const initial = (user?.user_metadata?.username || user?.email || "?").slice(0, 1).toUpperCase();

  return (
    <header className="sticky top-0 z-40 border-b border-ink-700/60 bg-ink-950/80 backdrop-blur-md">
      <div className="container-x flex h-16 items-center gap-4 lg:gap-8">
        <Logo />
        <nav className="hidden items-center gap-6 text-sm text-neutral-400 lg:flex" aria-label="Principal">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="transition hover:text-gold-soft">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto w-full max-w-sm">
          <SearchBox />
        </div>

        {user ? (
          <details className="relative">
            <summary className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-full border border-gold/60 bg-ink-800 text-sm font-semibold text-gold transition hover:bg-ink-700">
              {initial}
            </summary>
            <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border border-ink-600 bg-ink-900 shadow-2xl">
              <Link href="/perfil" className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-ink-700">
                <User className="h-4 w-4" /> Perfil e estatísticas
              </Link>
              <Link href="/biblioteca" className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-ink-700">
                <Library className="h-4 w-4" /> Minha biblioteca
              </Link>
              <Link href="/onboarding" className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-ink-700">
                <Sparkles className="h-4 w-4" /> Editar meu gosto
              </Link>
              <form action={logout}>
                <button className="flex w-full items-center gap-2 border-t border-ink-600 px-4 py-2.5 text-left text-sm text-neutral-400 hover:bg-ink-700 hover:text-white">
                  <LogOut className="h-4 w-4" /> Sair
                </button>
              </form>
            </div>
          </details>
        ) : (
          <Link href="/login" className="btn btn-gold shrink-0 !px-4 !py-2">
            Entrar
          </Link>
        )}
      </div>

      <nav className="container-x scrollbar-hide flex gap-5 overflow-x-auto pb-2 text-xs text-neutral-400 lg:hidden" aria-label="Principal (celular)">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="shrink-0 hover:text-gold-soft">
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
