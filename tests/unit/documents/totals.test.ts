import { describe, it, expect } from 'vitest';
import { computeTotals, computePayload } from '@/lib/documents/payload';

describe('computeTotals (TVA, acompte, net à payer)', () => {
  it('applique la TVA sur HT = articles + livraison (cas de la facture exemple)', () => {
    // 132 500 HT articles + 5 000 livraison = 137 500 ; TVA 19,25 % = 26 468,75 → 26 469
    const t = computeTotals({ subtotal: 132500, deliveryFee: 5000, vatRate: 19.25, depositPercentage: null });
    expect(t.htBase).toBe(137500);
    expect(t.vatAmount).toBe(26469);
    expect(t.ttc).toBe(163969);
    expect(t.total).toBe(163969);
  });

  it('calcule l\'acompte sur le TTC et retranche le net à payer', () => {
    // HT 100 000 ; TVA 19 250 ; TTC 119 250 ; acompte 30 % = 35 775 ; net 83 475
    const t = computeTotals({ subtotal: 100000, deliveryFee: null, vatRate: 19.25, depositPercentage: 30 });
    expect(t.vatAmount).toBe(19250);
    expect(t.ttc).toBe(119250);
    expect(t.depositAmount).toBe(35775);
    expect(t.total).toBe(83475);
  });

  it('sans TVA : le total est articles + livraison', () => {
    const t = computeTotals({ subtotal: 5000, deliveryFee: 500, vatRate: null, depositPercentage: null });
    expect(t.vatAmount).toBeNull();
    expect(t.total).toBe(5500);
  });

  it('computePayload reste cohérent avec computeTotals', () => {
    const p = computePayload({
      lines: [
        { description: 'A', quantity: 2, unitPrice: 1500 },
        { description: 'B', quantity: 1, unitPrice: 2750 },
      ],
      vatRate: 19.25,
      depositPercentage: null,
      deliveryFee: 1000,
      notes: null,
      validityDays: null,
      dueDate: null,
      referenceNumber: null,
      paymentMethod: null,
      paymentReference: null,
      paymentOperator: null,
      paymentOperatorFreeText: null,
      equivalentCurrency: null,
      equivalentAmount: null,
      exchangeRate: null,
      exchangeRateNote: null,
      deliveryDate: null,
      deliveryAddress: null,
    } as Parameters<typeof computePayload>[0]);
    // HT = 5750 + 1000 = 6750 ; TVA = 1299,375 → 1299 ; total = 8049
    expect(p.subtotal).toBe(5750);
    expect(p.vatAmount).toBe(1299);
    expect(p.total).toBe(8049);
  });
});
