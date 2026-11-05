import Link from 'next/link';
import type { Route } from 'next';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 text-6xl">🔍</div>
      <h1 className="mb-2 text-xl font-bold">Page introuvable</h1>
      <Link href={'/fr' as Route} className="rounded-lg bg-sage-500 px-4 py-2 text-white">
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
