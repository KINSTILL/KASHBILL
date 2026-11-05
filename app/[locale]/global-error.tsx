'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
          <div className="mb-4 text-6xl">⚠️</div>
          <h1 className="mb-2 text-xl font-bold">Une erreur critique est survenue</h1>
          <p className="mb-4 text-sm text-slate-600">{error.message}</p>
          <button onClick={reset} className="rounded-lg bg-sage-500 px-4 py-2 text-white">
            Réessayer
          </button>
        </div>
      </body>
    </html>
  );
}

