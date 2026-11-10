import { LogoMark } from "./Logo";

export default function AuthShell({
  title,
  subtitle,
  error,
  msg,
  children,
}: {
  title: string;
  subtitle?: string;
  error?: string;
  msg?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="container-x flex min-h-[70vh] items-center justify-center py-12">
      <div className="panel w-full max-w-md p-7 sm:p-9">
        <div className="mb-6 flex flex-col items-center text-center">
          <LogoMark size={44} />
          <h1 className="mt-4 font-display text-2xl font-semibold text-white">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-neutral-400">{subtitle}</p>}
        </div>
        {error && (
          <p role="alert" className="mb-4 rounded-lg border border-cine/50 bg-cine/10 px-3 py-2 text-sm text-red-200">
            {error}
          </p>
        )}
        {msg && (
          <p role="status" className="mb-4 rounded-lg border border-gold/40 bg-gold/10 px-3 py-2 text-sm text-gold-soft">
            {msg}
          </p>
        )}
        {children}
      </div>
    </div>
  );
}
