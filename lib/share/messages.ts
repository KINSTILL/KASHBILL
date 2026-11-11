import type { ShareDistance, ShareGroup, ShareTone } from './storage';

export type ShareTranslator = (key: string) => string;

type ToneDistanceMap = Record<ShareTone, Record<ShareDistance, string>>;
type SupportedDocType =
  | 'DEVIS'
  | 'PROFORMA'
  | 'FACTURE'
  | 'BON_COMMANDE'
  | 'BORDEREAU'
  | 'RECU'
  | 'TICKET';

const DOC_TYPE_MESSAGES: Record<'fr' | 'en', Record<SupportedDocType, ToneDistanceMap>> = {
  fr: {
    DEVIS: {
      transparency: {
        tu: "Salut ! Pour qu'on soit bien alignés sur les détails, je t'ai préparé ce devis au propre. Regarde et dis-moi si tout te convient avant qu'on valide !",
        vous: "Bonjour ! Pour que nous soyons bien alignés sur les détails, je vous ai préparé ce devis détaillé. Regardez et dites-moi si tout vous convient avant validation.",
      },
      pro: {
        tu: 'Bonjour, suite à nos échanges, voici ton devis détaillé. Je reste disponible si tu as des questions.',
        vous: 'Bonjour, suite à nos échanges, veuillez trouver ci-joint votre devis détaillé. Je reste à votre disposition pour toute question.',
      },
      casual: {
        tu: "Hello ! Voici le devis pour notre projet. Vérifie que je n'ai rien oublié et fais-moi signe !",
        vous: "Hello ! Voici le devis pour votre projet. Vérifiez que je n'ai rien oublié et faites-moi signe !",
      },
    },
    PROFORMA: {
      transparency: {
        tu: "Salut ! Voici ta facture proforma avec le détail complet et mes coordonnées. Dès que c'est validé de ton côté, on lance la suite !",
        vous: "Bonjour ! Voici votre facture proforma avec le détail complet et nos coordonnées. Dès qu'elle est validée de votre côté, nous lançons la suite.",
      },
      pro: {
        tu: 'Bonjour, suite à ta demande, voici ta facture proforma détaillée. Je reste à ta disposition pour toute précision.',
        vous: 'Bonjour, suite à votre demande, veuillez trouver ci-joint votre facture proforma détaillée. Nous restons à votre disposition pour toute précision.',
      },
      casual: {
        tu: "Hello ! Voici la facture proforma comme convenu. Dis-moi dès que c'est bon pour toi !",
        vous: "Hello ! Voici la facture proforma comme convenu. Dites-moi dès que c'est bon pour vous !",
      },
    },
    FACTURE: {
      transparency: {
        tu: 'Salut ! Comme convenu, voici ta facture officielle avec toutes mes coordonnées et le détail exact. Merci pour ta confiance !',
        vous: 'Bonjour ! Comme convenu, voici votre facture officielle avec toutes nos coordonnées et le détail exact. Merci pour votre confiance.',
      },
      pro: {
        tu: 'Bonjour, voici ta facture numérique détaillée. Merci pour ta confiance et à très vite !',
        vous: 'Bonjour, veuillez trouver ci-joint votre facture numérique détaillée. Nous vous remercions pour votre confiance.',
      },
      casual: {
        tu: 'Hello ! Voici ta facture au propre pour tes archives. Merci encore !',
        vous: 'Hello ! Voici votre facture au propre pour vos archives. Merci encore !',
      },
    },
    BON_COMMANDE: {
      transparency: {
        tu: 'Salut ! Voici le bon de commande récapitulatif avec tout le détail des articles convenus. Dès que tu confirmes, on prépare tout !',
        vous: 'Bonjour ! Voici le bon de commande récapitulatif avec le détail exact des articles convenus. Dès votre confirmation, nous lançons la préparation.',
      },
      pro: {
        tu: 'Bonjour, voici ton bon de commande détaillé. Merci de nous confirmer sa bonne réception.',
        vous: 'Bonjour, veuillez trouver ci-joint votre bon de commande détaillé. Merci de bien vouloir nous confirmer sa bonne réception.',
      },
      casual: {
        tu: 'Hello ! Voici le récapitulatif net et précis de la commande pour tes archives.',
        vous: 'Hello ! Voici le récapitulatif net et précis de la commande pour vos archives.',
      },
    },
    BORDEREAU: {
      transparency: {
        tu: 'Salut ! Voici le bordereau de livraison avec le détail des articles expédiés. Vérifie bien à la réception et fais-moi signe !',
        vous: 'Bonjour ! Voici le bordereau de livraison avec le détail des articles expédiés. Merci de vérifier à la réception et de nous tenir informés.',
      },
      pro: {
        tu: 'Bonjour, voici ton bordereau de livraison détaillant les articles remis. Bonne réception !',
        vous: 'Bonjour, veuillez trouver ci-joint votre bordereau de livraison détaillant les articles remis. Nous vous souhaitons une bonne réception.',
      },
      casual: {
        tu: 'Hello ! Voici le bordereau de livraison. Fais-moi signe dès que tu reçois le colis !',
        vous: 'Hello ! Voici le bordereau de livraison. Faites-nous signe dès que vous recevez le colis !',
      },
    },
    RECU: {
      transparency: {
        tu: 'Paiement bien reçu, merci pour la force ! Voici ton reçu officiel pour garder une trace sur ton téléphone.',
        vous: 'Paiement bien reçu, merci pour votre confiance ! Voici votre reçu officiel pour garder une trace sur votre téléphone.',
      },
      pro: {
        tu: 'Bonjour, nous confirmons la bonne réception de ton paiement. Voici ton reçu de paiement ci-joint.',
        vous: 'Bonjour, nous confirmons la bonne réception de votre paiement. Veuillez trouver votre reçu de paiement ci-joint.',
      },
      casual: {
        tu: "C'est tout bon de mon côté, paiement bien enregistré ! Voici ton reçu numérique. Merci encore !",
        vous: "C'est tout bon de notre côté, paiement bien enregistré ! Voici votre reçu numérique. Merci encore !",
      },
    },
    TICKET: {
      transparency: {
        tu: 'Merci pour ton achat ! Voici ton ticket de caisse numérique pour garder une trace sur ton téléphone.',
        vous: 'Merci pour votre achat ! Voici votre ticket de caisse numérique pour garder une trace sur votre téléphone.',
      },
      pro: {
        tu: 'Bonjour, merci pour ta visite. Voici ton ticket de caisse détaillé. À très bientôt !',
        vous: 'Bonjour, nous vous remercions pour votre achat. Veuillez trouver ci-joint votre ticket de caisse détaillé. À très bientôt !',
      },
      casual: {
        tu: "Merci d'être passé ! Voici ton ticket de caisse numérique. À très vite !",
        vous: 'Merci de votre visite ! Voici votre ticket de caisse numérique. À très bientôt !',
      },
    },
  },
  en: {
    DEVIS: {
      transparency: {
        tu: "Hi! To make sure we're aligned on every detail, I prepared this quote for you. Take a look and let me know if everything works for you before we confirm!",
        vous: 'Hello! To ensure we are aligned on the details, I have prepared this detailed quote for you. Please review and let me know if everything is suitable before validation.',
      },
      pro: {
        tu: 'Hello, following our discussion, here is your detailed quote. Feel free to reach out if you have any questions.',
        vous: 'Hello, following our discussion, please find your detailed quote attached. I remain at your disposal should you have any questions.',
      },
      casual: {
        tu: 'Hey! Here is the quote for our project. Check to make sure I did not miss anything!',
        vous: 'Hello! Here is the quote for your project. Please verify that nothing was missed!',
      },
    },
    PROFORMA: {
      transparency: {
        tu: "Hi! Here is your proforma invoice with the full breakdown and our details. As soon as you confirm, we'll get started!",
        vous: 'Hello! Here is your proforma invoice with the complete breakdown and our details. As soon as it is approved on your end, we will proceed.',
      },
      pro: {
        tu: 'Hello, following your request, here is your detailed proforma invoice. Let me know if you need any clarification.',
        vous: 'Hello, following your request, please find your detailed proforma invoice attached. We remain at your disposal for any further information.',
      },
      casual: {
        tu: "Hey! Here is the proforma invoice as agreed. Let me know once you're good to go!",
        vous: 'Hello! Here is the proforma invoice as agreed. Please let us know once everything is good on your end!',
      },
    },
    FACTURE: {
      transparency: {
        tu: 'Hi! As agreed, here is your official invoice with all my details and the exact breakdown. Thanks for your trust!',
        vous: 'Hello! As agreed, here is your official invoice with all business details and the itemized breakdown. Thank you for your trust.',
      },
      pro: {
        tu: 'Hello, here is your detailed digital invoice. Thank you for your business and talk to you soon!',
        vous: 'Hello, please find your detailed digital invoice attached. Thank you for your business and partnership!',
      },
      casual: {
        tu: 'Hey! Here is your invoice for your records. Thanks again!',
        vous: 'Hello! Here is your invoice for your records. Thank you again!',
      },
    },
    BON_COMMANDE: {
      transparency: {
        tu: "Hi! Here is the purchase order with the full breakdown of the agreed items. As soon as you confirm, we'll get everything ready!",
        vous: 'Hello! Here is the purchase order with the exact breakdown of the agreed items. Upon your confirmation, we will begin preparation.',
      },
      pro: {
        tu: 'Hello, here is your detailed purchase order. Please confirm receipt at your convenience.',
        vous: 'Hello, please find your detailed purchase order attached. Kindly confirm receipt at your convenience.',
      },
      casual: {
        tu: 'Hey! Here is the clean order summary for your records.',
        vous: 'Hello! Here is the complete order summary for your records.',
      },
    },
    BORDEREAU: {
      transparency: {
        tu: 'Hi! Here is the delivery note listing all dispatched items. Please check everything upon delivery and let me know!',
        vous: 'Hello! Here is the delivery note listing all dispatched items. Please verify upon receipt and let us know.',
      },
      pro: {
        tu: 'Hello, here is your delivery note detailing the items delivered. Thank you!',
        vous: 'Hello, please find attached your delivery note detailing the delivered items. Thank you for your business.',
      },
      casual: {
        tu: 'Hey! Here is the delivery note. Let me know as soon as you receive the package!',
        vous: 'Hello! Here is the delivery note. Please let us know as soon as you receive the delivery!',
      },
    },
    RECU: {
      transparency: {
        tu: 'Payment received, thanks for your support! Here is your official receipt to keep on your phone.',
        vous: 'Payment received with thanks! Here is your official payment receipt for your records.',
      },
      pro: {
        tu: 'Hello, we confirm receipt of your payment. Please find your payment receipt attached.',
        vous: 'Hello, we confirm receipt of your payment. Please find your official payment receipt attached.',
      },
      casual: {
        tu: 'All good on my side, payment recorded! Here is your digital receipt. Thanks again!',
        vous: 'All set on our side, payment recorded! Here is your digital receipt. Thank you again!',
      },
    },
    TICKET: {
      transparency: {
        tu: 'Thanks for your purchase! Here is your digital sales receipt to keep on your phone.',
        vous: 'Thank you for your purchase! Here is your digital sales receipt for your records.',
      },
      pro: {
        tu: 'Hello, thank you for your visit. Here is your itemized sales receipt. See you soon!',
        vous: 'Hello, thank you for your purchase. Please find your itemized sales receipt attached. We look forward to seeing you again!',
      },
      casual: {
        tu: 'Thanks for stopping by! Here is your digital receipt. See you soon!',
        vous: 'Thank you for your visit! Here is your digital receipt. See you again soon!',
      },
    },
  },
};

const GROUP_FALLBACK: Record<'fr' | 'en', Record<ShareGroup, ToneDistanceMap>> = {
  fr: {
    DEVIS_PROFORMA: DOC_TYPE_MESSAGES.fr.DEVIS,
    FACTURE_BON_COMMANDE: DOC_TYPE_MESSAGES.fr.FACTURE,
    RECU_TICKET: DOC_TYPE_MESSAGES.fr.RECU,
  },
  en: {
    DEVIS_PROFORMA: DOC_TYPE_MESSAGES.en.DEVIS,
    FACTURE_BON_COMMANDE: DOC_TYPE_MESSAGES.en.FACTURE,
    RECU_TICKET: DOC_TYPE_MESSAGES.en.RECU,
  },
};

export function resolveShareMessage(
  t: ShareTranslator,
  group: ShareGroup,
  tone: ShareTone,
  distance: ShareDistance,
  locale: 'fr' | 'en',
  custom?: string,
  docType?: string
): string {
  if (custom && custom.trim().length > 0) return custom;

  const lang = locale === 'en' ? 'en' : 'fr';
  if (docType && docType in DOC_TYPE_MESSAGES[lang]) {
    return DOC_TYPE_MESSAGES[lang][docType as SupportedDocType][tone][distance];
  }

  try {
    const key = `share.messages.${group}.${tone}.${distance}`;
    const translated = t(key);
    if (translated && translated !== key && !translated.startsWith('share.messages.')) {
      return translated;
    }
  } catch {
    // fallback ci-dessous
  }

  return GROUP_FALLBACK[lang][group][tone][distance];
}
