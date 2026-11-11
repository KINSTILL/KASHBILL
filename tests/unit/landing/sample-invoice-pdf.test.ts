import { describe, it, expect } from 'vitest';
import { writeFileSync } from 'node:fs';
import { pdf, Font } from '@react-pdf/renderer';
import { buildSampleInvoice } from '@/lib/landing/sample-invoice';
import { A4Document } from '@/lib/pdf/templates/A4Template';

describe('facture d exemple de la vitrine', () => {
  it('génère un PDF A4 valide avec le template du SaaS', async () => {
    Font.registerHyphenationCallback((word) => [word]);
    const { doc, options } = buildSampleInvoice(new Date('2026-11-11T10:00:00Z'));
    const element = A4Document({ doc, options });
    const blob = await pdf(element as Parameters<typeof pdf>[0]).toBlob();
    const buf = Buffer.from(await blob.arrayBuffer());
    expect(buf.subarray(0, 5).toString()).toBe('%PDF-');
    expect(buf.length).toBeGreaterThan(1000);
    const out = process.env.SAMPLE_PDF_OUT;
    if (out) writeFileSync(out, buf);
  }, 60000);
});
