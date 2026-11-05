'use client';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 text-6xl">⚠️</div>
      <h1 className="mb-2 text-xl font-bold">Une erreur est survenue</h1>
      <p className="mb-4 text-sm text-slate-600">{error.message}</p>
      <button onClick={reset} className="rounded-lg bg-sage-500 px-4 py-2 text-white">
        Réessayer
      </button>
    </div>
  );
}

