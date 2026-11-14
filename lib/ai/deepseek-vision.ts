import {
  ScanConfidence,
  ScannedQuote,
  ScanResult,
  scannedQuoteSchema,
} from '@/lib/validators/quote-scan';

export type { ScanConfidence, ScannedQuote, ScanResult };

export class QuoteScanError extends Error {
  constructor(public code: 'INVALID_SCHEMA' | 'API_ERROR' | 'TIMEOUT' | 'EMPTY_RESPONSE', message: string) {
    super(message);
    this.name = 'QuoteScanError';
  }
}

const DEEPSEEK_API_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/chat/completions';
const DEEPSEEK_MODEL = process.env.DEEPSEEK_VISION_MODEL || 'deepseek-flash';

const PROMPT_EXTRACTION = `Tu es un expert en lecture et extraction de devis et documents commerciaux manuscrits ou imprimés.
Analyse attentivement cette image.
Extrais les informations sous forme d'un objet JSON strict respectant scrupuleusement la structure suivante :
{
  "client": string ou null (nom complet du client ou prospect, null si absent ou illisible),
  "date": string ou null (date du document au format YYYY-MM-DD ou telle qu'écrite, null si illisible),
  "items": [
    {
      "description": string (désignation du produit ou de la prestation),
      "quantity": number ou null (quantité numérique),
      "unitPrice": number ou null (prix unitaire numérique),
      "total": number ou null (total de la ligne)
    }
  ],
  "subtotal": number ou null (sous-total HT s'il existe),
  "tax": number ou null (montant de la taxe / TVA s'il existe),
  "total": number ou null (montant total TTC ou net à payer)
}

Règles impératives :
1. Si un champ ou montant est illisible ou douteux, renvoie null. N'invente JAMAIS de chiffre, ne mets JAMAIS 0 par défaut si ce n'est pas explicitement écrit "0".
2. Renvoie UNIQUEMENT le bloc JSON valide, sans balises markdown, sans texte explicatif avant ou après.`;

const PROMPT_TRANSCRIPTION = `Tu es un transcripteur expert.
Transcris l'intégralité du texte visible sur cette image, ligne par ligne, de façon brute et fidèle, sans interprétation, sans corriger les fautes éventuelles, sans omettre les nombres ou symboles de monnaie.
Renvoie uniquement le texte brut transcrit.`;

async function callDeepSeekWithRetry(
  prompt: string,
  imageBase64: string,
  mimeType: string,
  timeoutMs = 30000
): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new QuoteScanError('API_ERROR', 'DEEPSEEK_API_KEY non configurée');
  }

  const payload = {
    model: DEEPSEEK_MODEL,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${imageBase64}`,
            },
          },
        ],
      },
    ],
    temperature: 0.1,
  };

  const executeCall = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(DEEPSEEK_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`DeepSeek API status ${response.status}: ${errorText}`);
      }

      const json = await response.json();
      const content = json.choices?.[0]?.message?.content;
      if (!content || typeof content !== 'string') {
        throw new QuoteScanError('EMPTY_RESPONSE', 'Réponse DeepSeek vide');
      }
      return content.trim();
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') {
        throw new QuoteScanError('TIMEOUT', `Timeout de la requête (${timeoutMs}ms)`);
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  };

  try {
    return await executeCall();
  } catch (err: unknown) {
    // 1 retry sur erreur serveur (5xx) ou timeout
    const isRetryable =
      err instanceof QuoteScanError && err.code === 'TIMEOUT'
        ? true
        : err instanceof Error && /status 5\d\d/.test(err.message);

    if (isRetryable) {
      return await executeCall();
    }
    if (err instanceof QuoteScanError) {
      throw err;
    }
    throw new QuoteScanError('API_ERROR', (err as Error)?.message || 'Erreur DeepSeek inconnue');
  }
}

function cleanJsonResponse(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/```\s*$/i, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/```\s*$/i, '');
  }
  return cleaned.trim();
}

function normalizeForSearch(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

export async function scanQuoteImage(imageBase64: string, mimeType: string): Promise<ScanResult> {
  // Exécution parallèle des deux passes
  const [extractionRaw, transcriptionRaw] = await Promise.all([
    callDeepSeekWithRetry(PROMPT_EXTRACTION, imageBase64, mimeType),
    callDeepSeekWithRetry(PROMPT_TRANSCRIPTION, imageBase64, mimeType),
  ]);

  const cleanedJson = cleanJsonResponse(extractionRaw);
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(cleanedJson);
  } catch {
    throw new QuoteScanError('INVALID_SCHEMA', 'Échec du parsing JSON de la passe extraction');
  }

  const zodParsed = scannedQuoteSchema.safeParse(parsedJson);
  if (!zodParsed.success) {
    throw new QuoteScanError('INVALID_SCHEMA', `Schéma invalide: ${zodParsed.error.message}`);
  }

  const data: ScannedQuote = zodParsed.data;
  const normalizedTranscription = normalizeForSearch(transcriptionRaw);

  const confidence: Record<string, ScanConfidence> = {};

  const verifyValue = (fieldKey: string, val: string | number | null) => {
    if (val === null || val === undefined || val === '') {
      confidence[fieldKey] = 'basse';
      return;
    }
    const valStr = String(val);
    const normalizedVal = normalizeForSearch(valStr);
    if (!normalizedVal) {
      confidence[fieldKey] = 'basse';
      return;
    }

    if (normalizedTranscription.includes(normalizedVal)) {
      confidence[fieldKey] = 'haute';
    } else {
      confidence[fieldKey] = 'basse';
    }
  };

  verifyValue('client', data.client);
  verifyValue('date', data.date);
  verifyValue('subtotal', data.subtotal);
  verifyValue('tax', data.tax);
  verifyValue('total', data.total);

  data.items.forEach((item, index) => {
    verifyValue(`items.${index}.description`, item.description);
    verifyValue(`items.${index}.quantity`, item.quantity);
    verifyValue(`items.${index}.unitPrice`, item.unitPrice);
    verifyValue(`items.${index}.total`, item.total);
  });

  return {
    data,
    confidence,
  };
}
