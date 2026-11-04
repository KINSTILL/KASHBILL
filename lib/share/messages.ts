import type { ShareDistance, ShareGroup, ShareTone } from './storage';

export type ShareTranslator = (key: string) => string;

export function resolveShareMessage(
  t: ShareTranslator,
  group: ShareGroup,
  tone: ShareTone,
  distance: ShareDistance,
  locale: 'fr' | 'en',
  custom?: string
): string {
  if (custom && custom.trim().length > 0) return custom;
  if (locale === 'en') {
    return t(`share.messages.${group}.${tone}`);
  }
  return t(`share.messages.${group}.${tone}.${distance}`);
}

