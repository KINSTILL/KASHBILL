import { prisma } from '@/lib/db';

type Props = { params: Promise<{ locale: string; token: string }> };

export default async function VerifyPage({ params }: Props) {
  const { token } = await params;

  const verification = await prisma.documentVerification.findUnique({
    where: { publicToken: token },
    include: {
      document: {
        include: { user: { select: { businessName: true, legalName: true } } },
      },
    },
  });

  if (!verification) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md rounded-lg bg-white p-6 text-center shadow">
          <div className="mb-4 text-6xl">❌</div>
          <h1 className="mb-2 text-xl font-bold text-slate-900">Document non reconnu</h1>
          <p className="text-sm text-slate-600">
            {"Ce document n'a pas été émis par CashBill. Il peut s'agir d'un faux."}
          </p>
        </div>
      </main>
    );
  }

  if (!verification.isAuthentic) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md rounded-lg bg-white p-6 text-center shadow">
          <div className="mb-4 text-6xl">⚠️</div>
          <h1 className="mb-2 text-xl font-bold text-red-700">Document frauduleux</h1>
          <p className="text-sm text-slate-600">
            {"Ce document a été signalé comme frauduleux par CashBill. Ne l'utilisez pas."}
          </p>
        </div>
      </main>
    );
  }

  const company =
    verification.document.user.businessName ??
    verification.document.user.legalName ??
    'Entreprise';

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md rounded-lg bg-white p-6 text-center shadow">
        <div className="mb-4 text-6xl">✅</div>
        <h1 className="mb-2 text-xl font-bold text-green-700">Document authentique</h1>
        <p className="mb-4 text-sm text-slate-600">Émis par</p>
        <p className="mb-2 font-bold text-slate-900">{company}</p>
        <p className="text-sm text-slate-600">
          Document N° {verification.document.number}
          <br />
          Type : {verification.document.type}
          <br />
          Émis le {new Intl.DateTimeFormat('fr-CM', { dateStyle: 'long' }).format(verification.document.createdAt)}
        </p>
        <p className="mt-6 text-xs text-slate-400">
          Cette vérification ne révèle aucune donnée commerciale du document.
        </p>
      </div>
    </main>
  );
}
