import type { DocType } from '@prisma/client';

export type DocTypeKey = DocType;

export type CompanyField =
  | 'taxId'
  | 'rccm'
  | 'legalAddress'
  | 'legalName';

export type DocTypeConfig = {
  /** Libellé affiché sur le PDF et dans l'UI (FR) */
  label: string;
  /** Libellé affiché sur le PDF et dans l'UI (EN) */
  labelEn: string;
  /** Libellé court pour les onglets/boutons (FR) */
  shortLabel: string;
  /** Libellé court pour les onglets/boutons (EN) */
  shortLabelEn: string;
  /** Emoji ou code d'icône (utilisé tel quel dans l'UI) */
  icon: string;
  /** Description courte pour tooltip et onboarding (FR) */
  description: string;
  /** Description courte pour tooltip et onboarding (EN) */
  descriptionEn: string;
  /** Préfixe de numérotation (ex: "F" pour facture, "DV" pour devis) */
  numberPrefix: string;
  /** Afficher la TVA sur le PDF et dans le formulaire */
  showVat: boolean;
  /** Afficher la durée de validité du document */
  showValidity: boolean;
  /** Valeur par défaut de la durée de validité (en jours), null si non applicable */
  defaultValidityDays: number | null;
  /** Afficher l'acompte sur le PDF et dans le formulaire */
  showDeposit: boolean;
  /** Afficher les frais de livraison */
  showDelivery: boolean;
  /** Prix unitaire optionnel (ex: bordereau de livraison sans prix) */
  priceOptional: boolean;
  /** Afficher les prix par défaut dans le formulaire */
  showPricesByDefault: boolean;
  /** Mode montant direct par défaut (ex: reçu avec Qté = 1 repliable) */
  singleAmountModeByDefault: boolean;
  /** Suggestions rapides d'articles/prestations selon le type de document */
  quickPresets: {
    fr: string[];
    en: string[];
  };
  /** Champs entreprise obligatoires pour émettre ce document */
  requiredCompanyFields: CompanyField[];
  /** Afficher un bloc signature destinataire (bordereau) */
  showRecipientSignature: boolean;
  /** Groupe pour le Bouclier Social (messages WhatsApp) */
  shareGroup: 'DEVIS_PROFORMA' | 'FACTURE_BON_COMMANDE' | 'RECU_TICKET';
  /** Format PDF recommandé par défaut */
  defaultFormat: 'ticket' | 'a4';
  /** Afficher l'échéance de paiement (FACTURE) */
  showDueDate: boolean;
  /** Afficher la référence BC/devis (FACTURE, BON_COMMANDE) */
  showReferenceNumber: boolean;
  /** Afficher le mode de règlement + référence transaction (RECU, TICKET) */
  showPaymentInfo: boolean;
  /** Afficher les détails de livraison (BON_COMMANDE, BORDEREAU) */
  showShipmentDetails: boolean;
  /** Afficher la mention « sans valeur comptable ou fiscale » (PROFORMA) */
  showNonContractual: boolean;
};

export const DOC_TYPE_CONFIG: Record<DocType, DocTypeConfig> = {
  TICKET: {
    label: 'TICKET',
    labelEn: 'SALES TICKET',
    shortLabel: 'Ticket',
    shortLabelEn: 'Ticket',
    icon: '🧾',
    description: 'Reçu simplifié pour une vente au comptant, sans TVA',
    descriptionEn: 'Simplified cash-sale receipt, no VAT',
    numberPrefix: 'T',
    showVat: false,
    showValidity: false,
    defaultValidityDays: null,
    showDeposit: false,
    showDelivery: false,
    priceOptional: false,
    showPricesByDefault: true,
    singleAmountModeByDefault: false,
    quickPresets: {
      fr: ['Article boutique', 'Vente au comptant', 'Accessoire', 'Produit'],
      en: ['Shop item', 'Cash sale item', 'Accessory', 'Product'],
    },
    requiredCompanyFields: [],
    showRecipientSignature: false,
    shareGroup: 'RECU_TICKET',
    defaultFormat: 'ticket',
    showDueDate: false,
    showReferenceNumber: false,
    showPaymentInfo: true,
    showShipmentDetails: false,
    showNonContractual: false,
  },
  RECU: {
    label: 'REÇU',
    labelEn: 'RECEIPT',
    shortLabel: 'Reçu',
    shortLabelEn: 'Receipt',
    icon: '✅',




    description: 'Preuve de paiement, éteint la dette',
    descriptionEn: 'Proof of payment settling a balance or deposit',
    numberPrefix: 'R',
    showVat: false,
    showValidity: false,
    defaultValidityDays: null,
    showDeposit: false,
    showDelivery: false,
    priceOptional: false,
    showPricesByDefault: true,
    singleAmountModeByDefault: true,
    quickPresets: {
      fr: ['Règlement facture', 'Acompte sur commande', 'Solde prestation', 'Paiement Mobile Money'],
      en: ['Invoice payment', 'Order deposit', 'Service balance', 'Mobile Money payment'],
    },
    requiredCompanyFields: [],
    showRecipientSignature: false,
    shareGroup: 'RECU_TICKET',
    defaultFormat: 'ticket',
    showDueDate: false,
    showReferenceNumber: false,
    showPaymentInfo: true,
    showShipmentDetails: false,
    showNonContractual: false,
  },
  DEVIS: {
    label: 'DEVIS',
    labelEn: 'QUOTE',
    shortLabel: 'Devis',
    shortLabelEn: 'Quote',
    icon: '📝',
    description: 'Proposition tarifaire, devient contrat après acceptation',
    descriptionEn: 'Price proposal that becomes binding upon acceptance',
    numberPrefix: 'DV',
    showVat: false,
    showValidity: true,
    defaultValidityDays: 30,
    showDeposit: true,
    showDelivery: true,
    priceOptional: false,
    showPricesByDefault: true,
    singleAmountModeByDefault: false,
    quickPresets: {
      fr: ['Forfait prestation', 'Fourniture & pose', 'Étude & conception', 'Pack complet'],
      en: ['Service package', 'Supply & installation', 'Design & study', 'Full package'],
    },
    requiredCompanyFields: [],
    showRecipientSignature: false,
    shareGroup: 'DEVIS_PROFORMA',
    defaultFormat: 'a4',
    showDueDate: false,
    showReferenceNumber: false,
    showPaymentInfo: false,
    showShipmentDetails: false,
    showNonContractual: false,
  },
  PROFORMA: {
    label: 'FACTURE PROFORMA',
    labelEn: 'PROFORMA INVOICE',
    shortLabel: 'Proforma',
    shortLabelEn: 'Proforma',
    icon: '📄',
    description: 'Document de pré-engagement, sans valeur fiscale',
    descriptionEn: 'Pre-commitment invoice for customs, bank or approval',
    numberPrefix: 'FP',
    showVat: false,
    showValidity: true,
    defaultValidityDays: 30,
    showDeposit: true,
    showDelivery: true,
    priceOptional: false,
    showPricesByDefault: true,
    singleAmountModeByDefault: false,
    quickPresets: {
      fr: ['Lot de marchandises', 'Équipement complet', 'Prestation annuelle', 'Fournitures'],
      en: ['Goods batch', 'Complete equipment', 'Annual service', 'Supplies'],
    },
    requiredCompanyFields: [],
    showRecipientSignature: false,
    shareGroup: 'DEVIS_PROFORMA',
    defaultFormat: 'a4',
    showDueDate: false,
    showReferenceNumber: false,
    showPaymentInfo: false,
    showShipmentDetails: false,
    showNonContractual: true,
  },
  BON_COMMANDE: {
    label: 'BON DE COMMANDE',
    labelEn: 'PURCHASE ORDER',
    shortLabel: 'Bon cmde',
    shortLabelEn: 'Purchase order',
    icon: '📦',


    description: 'Engagement d\'achat du client, sert de base à la facturation',
    descriptionEn: 'Client purchase commitment, the basis for invoicing',
    numberPrefix: 'BC',
    showVat: false,
    showValidity: false,
    defaultValidityDays: null,
    showDeposit: false,
    showDelivery: true,
    priceOptional: false,
    showPricesByDefault: true,
    singleAmountModeByDefault: false,
    quickPresets: {
      fr: ['Commande lot articles', 'Approvisionnement stock', 'Matières premières', 'Article sur commande'],
      en: ['Item batch order', 'Stock supply', 'Raw materials', 'Custom order item'],
    },
    requiredCompanyFields: [],
    showRecipientSignature: false,
    shareGroup: 'FACTURE_BON_COMMANDE',
    defaultFormat: 'a4',
    showDueDate: false,
    showReferenceNumber: true,
    showPaymentInfo: false,
    showShipmentDetails: true,
    showNonContractual: false,
  },
  BORDEREAU: {
    label: 'BORDEREAU DE LIVRAISON',
    labelEn: 'DELIVERY NOTE',
    shortLabel: 'Bordereau',
    shortLabelEn: 'Delivery note',
    icon: '🚚',
    description: 'Preuve de livraison, signé par le destinataire',
    descriptionEn: 'Proof of delivery signed by the recipient',
    numberPrefix: 'BL',
    showVat: false,
    showValidity: false,
    defaultValidityDays: null,
    showDeposit: false,
    showDelivery: false,
    priceOptional: true,
    showPricesByDefault: false,
    singleAmountModeByDefault: false,
    quickPresets: {
      fr: ['Colis standard', 'Carton scellé', 'Palette filmée', 'Lot d\'articles livrés'],
      en: ['Standard package', 'Sealed box', 'Wrapped pallet', 'Delivered item batch'],
    },
    requiredCompanyFields: [],
    showRecipientSignature: true,
    shareGroup: 'FACTURE_BON_COMMANDE',
    defaultFormat: 'a4',
    showDueDate: false,
    showReferenceNumber: false,
    showPaymentInfo: false,
    showShipmentDetails: true,
    showNonContractual: false,
  },
  FACTURE: {
    label: 'FACTURE',
    labelEn: 'INVOICE',
    shortLabel: 'Facture',
    shortLabelEn: 'Invoice',
    icon: '💼',
    description: 'Document fiscal, obligatoire pour la TVA et la comptabilité',
    descriptionEn: 'Official tax invoice required for VAT and accounting',
    numberPrefix: 'F',
    showVat: true,
    showValidity: false,
    defaultValidityDays: null,
    showDeposit: false,
    showDelivery: true,
    priceOptional: false,
    showPricesByDefault: true,
    singleAmountModeByDefault: false,
    quickPresets: {
      fr: ['Prestation de service', 'Vente de marchandises', 'Main d\'œuvre', 'Frais de conseil'],
      en: ['Service fee', 'Sale of goods', 'Labor', 'Consulting fee'],
    },
    requiredCompanyFields: [],
    showRecipientSignature: false,
    shareGroup: 'FACTURE_BON_COMMANDE',
    defaultFormat: 'a4',
    showDueDate: true,
    showReferenceNumber: true,
    showPaymentInfo: false,
    showShipmentDetails: false,
    showNonContractual: false,
  },
};

/** Ordre d'affichage dans la grille de sélection */
export const DOC_TYPE_ORDER: DocType[] = [
  'FACTURE',
  'DEVIS',
  'PROFORMA',
  'BON_COMMANDE',
  'BORDEREAU',
  'RECU',
  'TICKET',
];

/** Helper : récupère la config d'un type */
export function getDocTypeConfig(type: DocType): DocTypeConfig {
  return DOC_TYPE_CONFIG[type];
}
