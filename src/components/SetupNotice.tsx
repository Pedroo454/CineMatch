import { AlertTriangle } from "lucide-react";

// Aviso claro do que falta conectar (chaves/variáveis de ambiente).
export default function SetupNotice({ missing }: { missing: string[] }) {
  if (missing.length === 0) return null;
  return (
    <div className="container-x pt-6">
      <div className="panel flex gap-3 border-gold/40 p-4 text-sm">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
        <div>
          <p className="font-medium text-white">Falta conectar algumas chaves</p>
          <ul className="mt-1 list-disc pl-5 text-neutral-400">
            {missing.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
          <p className="mt-2 text-neutral-500">
            Defina as variáveis no arquivo <code className="text-gold">.env.local</code> (ou na Vercel, em Settings → Environment Variables) conforme o <code className="text-gold">.env.example</code>.
          </p>
        </div>
      </div>
    </div>
  );
}

export function missingEnv(): string[] {
  const m: string[] = [];
  if (!process.env.TMDB_READ_TOKEN && !process.env.TMDB_API_KEY) m.push("TMDB_READ_TOKEN (ou TMDB_API_KEY): sem ela não há filmes nem séries");
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    m.push("NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY: sem elas não há login, biblioteca nem recomendações personalizadas");
  return m;
}
