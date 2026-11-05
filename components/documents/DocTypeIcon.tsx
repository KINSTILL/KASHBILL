import type { DocType } from '@prisma/client';
import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { type: DocType };

/**
 * Icônes vectorielles dédiées à chaque type de document.
 * Trait 1.75, coin arrondi, viewBox 24 — cohérent avec le design system « Modern Cash ».
 * Couleur héritée via currentColor.
 */
export function DocTypeIcon({ type, ...props }: IconProps) {
  const common: SVGProps<SVGSVGElement> = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    ...props,
  };

  switch (type) {
    case 'FACTURE':
      // Portefeuille / document fiscal
      return (
        <svg {...common}>
          <path d="M4 7.5A1.5 1.5 0 0 1 5.5 6h13A1.5 1.5 0 0 1 20 7.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 16.5v-9Z" />
          <path d="M4 9h16" />
          <path d="M15 13.5h2.5" />
        </svg>
      );
    case 'DEVIS':
      // Document avec coin plié + crayon (proposition)
      return (
        <svg {...common}>
          <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8" />
          <path d="M14 3v5h5" />
          <path d="M9 13h4" />
          <path d="M9 17h6" />
        </svg>
      );
    case 'PROFORMA':
      // Document avec horloge (validité)
      return (
        <svg {...common}>
          <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8" />
          <path d="M14 3v5h5" />
          <circle cx="11" cy="15" r="2.25" />
          <path d="M11 14v1l.7.7" />
        </svg>
      );
    case 'BON_COMMANDE':
      // Carton / paquet avec sangle
      return (
        <svg {...common}>
          <path d="M3.5 8 12 4l8.5 4v8L12 20l-8.5-4V8Z" />
          <path d="M3.5 8 12 12l8.5-4" />
          <path d="M12 12v8" />
        </svg>
      );
    case 'BORDEREAU':
      // Camion de livraison
      return (
        <svg {...common}>
          <path d="M3 7.5A1.5 1.5 0 0 1 4.5 6H13a1 1 0 0 1 1 1v8H3V7.5Z" />
          <path d="M14 9h3.2a1 1 0 0 1 .85.47L20.5 13v2H14V9Z" />
          <circle cx="7.5" cy="16.5" r="1.5" />
          <circle cx="17" cy="16.5" r="1.5" />
          <path d="M9 16.5h6.5" />
        </svg>
      );
    case 'RECU':
      // Reçu avec coche (paiement)
      return (
        <svg {...common}>
          <path d="M6 3.5h12a1 1 0 0 1 1 1V20l-2.5-1.4L14 20l-2-1.4L10 20l-2.5-1.4L5 20V4.5a1 1 0 0 1 1-1Z" />
          <path d="M8.5 11.5l2 2 4.5-4.5" />
        </svg>
      );
    case 'TICKET':
      // Ticket avec encoches latérales
      return (
        <svg {...common}>
          <path d="M4 8.5V7a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v1.5a2.5 2.5 0 0 0 0 5V17a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-3.5a2.5 2.5 0 0 0 0-5Z" />
          <path d="M13.5 6.5v11" strokeDasharray="2 2.5" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8" />
          <path d="M14 3v5h5" />
        </svg>
      );
  }
}
