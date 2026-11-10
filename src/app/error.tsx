"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container-x flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="font-display text-3xl font-semibold text-white">Algo saiu do roteiro</h1>
      <p className="mt-2 max-w-md text-neutral-400">Não conseguimos carregar esta página agora. Pode ser uma instabilidade temporária.</p>
      <button onClick={reset} className="btn btn-gold mt-6">Tentar novamente</button>
    </div>
  );
}
