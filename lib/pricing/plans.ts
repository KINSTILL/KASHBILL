/**
 * Formules Pro : source unique des prix et durées (utilisée serveur ET navigateur).
 * Le prix est toujours en FCFA (XAF) : c'est le montant débité par Notch Pay.
 */

/** Prix d'un mois Pro, de référence pour calculer les économies. */
export const PRO_MONTHLY_PRICE_XAF = 2000;

export const PRO_PLANS = [
  { id: 'M1', months: 1, days: 30, priceXaf: 2000 },
  { id: 'M3', months: 3, days: 90, priceXaf: 5000 },
  { id: 'M12', months: 12, days: 365, priceXaf: 18000 },
] as const;

export type ProPlanId = (typeof PRO_PLANS)[number]['id'];

export const DEFAULT_PRO_PLAN_ID: ProPlanId = 'M12';

export function getProPlan(id: string | null | undefined) {
  return PRO_PLANS.find((p) => p.id === id) ?? null;
}

/** Durée (en jours) correspondant à un montant payé. Null si le montant n'est pas une formule Pro. */
export function proDaysForAmount(amountXaf: number | null | undefined): number | null {
  if (amountXaf == null) return null;
  return PRO_PLANS.find((p) => p.priceXaf === amountXaf)?.days ?? null;
}

/** Économie par rapport à des mois payés au tarif mensuel. */
export function planSavings(plan: (typeof PRO_PLANS)[number]) {
  const withoutDiscount = plan.months * PRO_MONTHLY_PRICE_XAF;
  const savedXaf = withoutDiscount - plan.priceXaf;
  return {
    withoutDiscountXaf: withoutDiscount,
    savedXaf,
    savedPercent: savedXaf > 0 ? Math.round((savedXaf / withoutDiscount) * 100) : 0,
    perMonthXaf: Math.round(plan.priceXaf / plan.months),
  };
}
