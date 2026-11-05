export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md rounded-lg bg-white p-6 text-center shadow">
        <div className="mb-4 text-6xl">📡</div>
        <h1 className="mb-2 text-xl font-bold text-slate-900">Hors ligne</h1>
        <p className="text-sm text-slate-600">
          Vous n&apos;avez pas de connexion Internet. Vos brouillons sont sauvegardés localement.
        </p>
      </div>
    </main>
  );
}

