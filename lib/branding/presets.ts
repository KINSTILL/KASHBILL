/**
 * 10 Presets d'Identité Visuelle White Label (Pro + Add-on White Label)
 * Design haute fidélité, ultra-légers (constantes pures, 0 dépendance externe).
 */

export type VisualPresetId =
  | 'corporate-navy'
  | 'emerald-prestige'
  | 'black-gold'
  | 'tech-indigo'
  | 'warm-terracotta'
  | 'minimalist-slate'
  | 'bordeaux-vintage'
  | 'ocean-blue'
  | 'industrial-charcoal'
  | 'crisp-monochrome';

export interface VisualPreset {
  id: VisualPresetId;
  name: string;
  nameEn: string;
  icon: string;
  description: string;
  descriptionEn: string;
  tag: string;
  tagEn: string;
  primary: string;
  accent: string;
}

export const VISUAL_PRESETS: VisualPreset[] = [
  {
    id: 'corporate-navy',
    name: 'Bleu Corporate',
    nameEn: 'Corporate Navy',
    icon: '🏛️',
    description: 'Bleu marine statutaire et bleu ciel. Idéal banques, audit, cabinets et transitaires.',
    descriptionEn: 'Statutory navy and sky blue. Ideal for finance, legal, and consultancy.',
    tag: 'Institutionnel',
    tagEn: 'Corporate',
    primary: '#0F2B48',
    accent: '#2563EB',
  },
  {
    id: 'emerald-prestige',
    name: 'Émeraude Prestige',
    nameEn: 'Emerald Prestige',
    icon: '🌿',
    description: 'Vert forêt profond et émeraude frais. Idéal santé, pharmacie, bio et négoce.',
    descriptionEn: 'Deep forest green and fresh emerald. Ideal for health, bio, and retail.',
    tag: 'Santé & Éco',
    tagEn: 'Health & Eco',
    primary: '#064E3B',
    accent: '#059669',
  },
  {
    id: 'black-gold',
    name: 'Or & Carbone',
    nameEn: 'Black & Gold',
    icon: '👑',
    description: 'Noir onyx impérial et or chaud. Idéal bijouterie, haute couture et immobilier VIP.',
    descriptionEn: 'Onyx black and warm gold. Ideal for jewelry, luxury goods, and VIP services.',
    tag: 'Luxe & VIP',
    tagEn: 'Luxury',
    primary: '#18181B',
    accent: '#D97706',
  },
  {
    id: 'tech-indigo',
    name: 'Tech Indigo',
    nameEn: 'Tech Indigo',
    icon: '⚡',
    description: 'Indigo nuit et violet électrique. Idéal startups, agences web, télécoms et freelances.',
    descriptionEn: 'Night indigo and electric violet. Ideal for digital agencies, SaaS, and IT.',
    tag: 'Digital & IT',
    tagEn: 'Tech',
    primary: '#312E81',
    accent: '#7C3AED',
  },
  {
    id: 'warm-terracotta',
    name: 'Terracotta & Ambre',
    nameEn: 'Terracotta Amber',
    icon: '☕',
    description: 'Terre cuite chaleureuse et ambre cuivré. Idéal cafés, restauration, artisanat et déco.',
    descriptionEn: 'Warm terracotta and amber. Ideal for hospitality, cafes, and artisanal goods.',
    tag: 'Artisanat & Café',
    tagEn: 'Hospitality',
    primary: '#7C2D12',
    accent: '#EA580C',
  },
  {
    id: 'minimalist-slate',
    name: 'Ardoise Minimaliste',
    nameEn: 'Minimalist Slate',
    icon: '💎',
    description: 'Gris anthracite moderne et argent satiné. Design suisse aéré, idéal architectes et design.',
    descriptionEn: 'Contemporary slate gray and silver. Swiss-inspired, ideal for architects.',
    tag: 'Design Épuré',
    tagEn: 'Minimalist',
    primary: '#334155',
    accent: '#64748B',
  },
  {
    id: 'bordeaux-vintage',
    name: 'Bordeaux Vintage',
    nameEn: 'Bordeaux Vintage',
    icon: '🍷',
    description: 'Rubis royal et rose poudré. Idéal instituts de beauté, mode féminine et événementiel.',
    descriptionEn: 'Royal ruby and soft rose. Ideal for beauty salons, fashion, and events.',
    tag: 'Beauté & Mode',
    tagEn: 'Beauty & Fashion',
    primary: '#831843',
    accent: '#DB2777',
  },
  {
    id: 'ocean-blue',
    name: 'Bleu Océan',
    nameEn: 'Ocean Blue',
    icon: '🌊',
    description: 'Bleu abysse et turquoise lagon. Idéal transport, logistique, tourisme et distribution.',
    descriptionEn: 'Abyss blue and turquoise. Ideal for transport, logistics, and tourism.',
    tag: 'Transport & Logistique',
    tagEn: 'Logistics',
    primary: '#0C4A6E',
    accent: '#0891B2',
  },
  {
    id: 'industrial-charcoal',
    name: 'Industriel & BTP',
    nameEn: 'Industrial Charcoal',
    icon: '🏗️',
    description: 'Acier sombre et jaune signal chantier. Idéal BTP, quincaillerie, mécanique et usines.',
    descriptionEn: 'Dark steel and signal yellow. Ideal for construction, hardware, and garages.',
    tag: 'BTP & Chantier',
    tagEn: 'Construction',
    primary: '#27272A',
    accent: '#CA8A04',
  },
  {
    id: 'crisp-monochrome',
    name: 'Monochrome Pur',
    nameEn: 'Crisp Monochrome',
    icon: '✨',
    description: 'Noir profond et gris acier. Contraste absolu, optimisé pour tickets 80mm et lisibilité.',
    descriptionEn: 'Absolute black and steel gray. Maximum contrast, optimized for thermal prints.',
    tag: 'Contraste Max',
    tagEn: 'High Contrast',
    primary: '#000000',
    accent: '#4B5563',
  },
];

/**
 * Trouve le preset correspondant à une combinaison de couleurs primaires/accent
 */
export function findPresetByColors(
  primary?: string | null,
  accent?: string | null
): VisualPreset | null {
  if (!primary || !accent) return null;
  const pNorm = primary.toUpperCase().trim();
  const aNorm = accent.toUpperCase().trim();
  return (
    VISUAL_PRESETS.find(
      (p) => p.primary.toUpperCase() === pNorm && p.accent.toUpperCase() === aNorm
    ) ?? null
  );
}
