import type { SVGProps } from 'react';

/**
 * Jeu d'icônes vectorielles inline (zéro dépendance externe).
 * Style cohérent avec le design system « Modern Cash » :
 * viewBox 24, trait arrondi, couleur héritée via currentColor.
 */
type IconProps = SVGProps<SVGSVGElement>;

const common: SVGProps<SVGSVGElement> = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

/** Bouclier avec coche — emblème de la marque MyCashBill. */
export function ShieldCheck(props: IconProps) {
  return (
    <svg {...common} {...props}>
      <path d="M12 3 4 6.5v5c0 4.6 3.2 8 8 9.5 4.8-1.5 8-4.9 8-9.5v-5L12 3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

/** Téléphone mobile. */
export function Smartphone(props: IconProps) {
  return (
    <svg {...common} {...props}>
      <rect x="6.5" y="2.5" width="11" height="19" rx="2.5" />
      <path d="M11 18.5h2" />
    </svg>
  );
}

/** Cadenas. */
export function Lock(props: IconProps) {
  return (
    <svg {...common} {...props}>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
      <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
    </svg>
  );
}

/** Œil ouvert. */
export function Eye(props: IconProps) {
  return (
    <svg {...common} {...props}>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

/** Œil barré. */
export function EyeOff(props: IconProps) {
  return (
    <svg {...common} {...props}>
      <path d="M9.9 5.7A9.7 9.7 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a16.6 16.6 0 0 1-3.4 4.2" />
      <path d="M6.6 6.6A16.5 16.5 0 0 0 2.5 12S6 18.5 12 18.5a9.6 9.6 0 0 0 4.2-.9" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
      <path d="m3 3 18 18" />
    </svg>
  );
}

/** Cercle d'alerte. */
export function AlertCircle(props: IconProps) {
  return (
    <svg {...common} {...props}>
      <circle cx="12" cy="12" r="9.5" />
      <path d="M12 7.5v5" />
      <path d="M12 16.25h.01" />
    </svg>
  );
}

/** Indicateur de chargement (à animer via animate-spin). */
export function Loader2(props: IconProps) {
  return (
    <svg {...common} {...props}>
      <path d="M21 12a9 9 0 1 1-6.2-8.56" />
    </svg>
  );
}

/** Flèche vers la droite. */
export function ArrowRight(props: IconProps) {
  return (
    <svg {...common} {...props}>
      <path d="M4 12h15" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}
