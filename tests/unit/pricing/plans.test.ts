import { describe, it, expect } from 'vitest';
import { PRO_PLANS, getProPlan, planSavings, proDaysForAmount } from '@/lib/pricing/plans';
import { DISPLAY_CURRENCIES, convertFromXaf, FCFA_PER_EUR } from '@/lib/pricing/currencies';

describe('formules Pro', () => {
  it('prix et durées des trois formules', () => {
    expect(getProPlan('M1')).toMatchObject({ priceXaf: 2000, days: 30 });
    expect(getProPlan('M3')).toMatchObject({ priceXaf: 5000, days: 90 });
    expect(getProPlan('M12')).toMatchObject({ priceXaf: 18000, days: 365 });
    expect(getProPlan('XX')).toBeNull();
  });

  it('retrouve la durée à partir du montant payé', () => {
    expect(proDaysForAmount(5000)).toBe(90);
    expect(proDaysForAmount(18000)).toBe(365);
    expect(proDaysForAmount(2000)).toBe(30);
    expect(proDaysForAmount(3000)).toBeNull(); // montant d'add-on, pas une formule
  });

  it('calcule les économies en pourcentage', () => {
    const m3 = planSavings(PRO_PLANS[1]!);
    expect(m3.withoutDiscountXaf).toBe(6000);
    expect(m3.savedXaf).toBe(1000);
    expect(m3.savedPercent).toBe(17); // 1000 / 6000 = 16,7 %
    const m12 = planSavings(PRO_PLANS[2]!);
    expect(m12.savedXaf).toBe(6000);
    expect(m12.savedPercent).toBe(25);
    expect(m12.perMonthXaf).toBe(1500);
  });
});

describe('conversion indicative', () => {
  const eur = DISPLAY_CURRENCIES.find((c) => c.code === 'EUR')!;
  const xof = DISPLAY_CURRENCIES.find((c) => c.code === 'XOF')!;
  const usd = DISPLAY_CURRENCIES.find((c) => c.code === 'USD')!;

  it('EUR à parité fixe : 5 000 FCFA ≈ 7,62 €', () => {
    expect(FCFA_PER_EUR).toBeCloseTo(655.957);
    expect(convertFromXaf(5000, eur, null)).toBe(7.62);
  });

  it('XOF à parité 1:1 avec le FCFA', () => {
    expect(convertFromXaf(18000, xof, null)).toBe(18000);
  });

  it('devise en ligne sans taux disponible : pas de chiffre inventé', () => {
    expect(convertFromXaf(2000, usd, null)).toBeNull();
    expect(convertFromXaf(2000, usd, {})).toBeNull();
  });

  it('devise en ligne avec taux : conversion arrondie aux centimes', () => {
    // 1 FCFA = 0,001705 USD (taux du 11/11/2026)
    expect(convertFromXaf(2000, usd, { USD: 0.001705 })).toBe(3.41);
  });
});
