import { en } from './en';
import type { TranslationKeys } from './en';
import { es } from './es';

export type Language = 'en' | 'es';

export const translations: Record<Language, TranslationKeys> = {
  en,
  es
};

export type { TranslationKeys } from './en';