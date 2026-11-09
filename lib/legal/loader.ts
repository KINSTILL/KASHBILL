import { readFile } from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';

export const LEGAL_SLUGS = [
  'cgu',
  'cgv',
  'privacy',
  'cookies',
  'mentions-legales',
  'disclaimer',
  'refund',
] as const;
export type LegalSlug = (typeof LEGAL_SLUGS)[number];

export const LEGAL_TITLES: Record<LegalSlug, string> = {
  cgu: 'CGU',
  cgv: 'CGV',
  privacy: 'Politique de confidentialité',
  cookies: 'Politique de cookies',
  'mentions-legales': 'Mentions légales',
  disclaimer: 'Clause de non-responsabilité',
  refund: 'Politique de remboursement',
};

export type LegalDoc = {
  slug: LegalSlug;
  title: string;
  version: string;
  effectiveDate: string;
  content: string; // markdown body
};

const CONTENT_DIR = path.join(process.cwd(), 'content', 'legal');

export async function getLegalDoc(
  slug: LegalSlug,
  locale: 'fr' | 'en'
): Promise<LegalDoc | null> {
  try {
    const filePath = path.join(CONTENT_DIR, locale, `${slug}.md`);
    const raw = await readFile(filePath, 'utf8');
    const { data, content } = matter(raw);
    return {
      slug,
      title: (data.title as string) ?? LEGAL_TITLES[slug],
      version: (data.version as string) ?? '1.0',
      effectiveDate:
        (data.effectiveDate as string) ??
        new Date().toISOString().split('T')[0]!,
      content,
    };
  } catch {
    return null;
  }
}
