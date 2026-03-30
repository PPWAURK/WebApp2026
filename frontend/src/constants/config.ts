import type { LibrarySection } from './documentTaxonomy';

export type TrainingQuizLinkLanguage = 'fr' | 'bn' | 'zh';

function readPublicEnv(name: string): string {
  if (typeof process === 'undefined') {
    return '';
  }

  const rawValue = process.env[name];
  return typeof rawValue === 'string' ? rawValue.trim() : '';
}

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/g, '');
}

const DEFAULT_API_URL = 'https://api.zhaoplatforme.com/backend2';

export const API_URL = normalizeBaseUrl(
  readPublicEnv('EXPO_PUBLIC_API_URL') || DEFAULT_API_URL,
);

export const TRAINING_QUIZ_URL = readPublicEnv('EXPO_PUBLIC_TRAINING_QUIZ_URL');

const TRAINING_QUIZ_URL_BY_LANGUAGE: Record<TrainingQuizLinkLanguage, string> =
  {
    fr: readPublicEnv('EXPO_PUBLIC_TRAINING_QUIZ_URL_FR'),
    bn: readPublicEnv('EXPO_PUBLIC_TRAINING_QUIZ_URL_BN'),
    zh: readPublicEnv('EXPO_PUBLIC_TRAINING_QUIZ_URL_ZH'),
  };

const TRAINING_QUIZ_URL_BY_SECTION_AND_LANGUAGE: Partial<
  Record<LibrarySection, Partial<Record<TrainingQuizLinkLanguage, string>>>
> = {
  RECIPE_TRAINING: {
    fr: readPublicEnv('EXPO_PUBLIC_TRAINING_QUIZ_URL_RECIPE_TRAINING_FR'),
    bn: readPublicEnv('EXPO_PUBLIC_TRAINING_QUIZ_URL_RECIPE_TRAINING_BN'),
    zh: readPublicEnv('EXPO_PUBLIC_TRAINING_QUIZ_URL_RECIPE_TRAINING_ZH'),
  },
  RECIPE: {
    fr: readPublicEnv('EXPO_PUBLIC_TRAINING_QUIZ_URL_RECIPE_FR'),
    bn: readPublicEnv('EXPO_PUBLIC_TRAINING_QUIZ_URL_RECIPE_BN'),
    zh: readPublicEnv('EXPO_PUBLIC_TRAINING_QUIZ_URL_RECIPE_ZH'),
  },
  MISE_EN_PLACE_SOP: {
    fr: readPublicEnv('EXPO_PUBLIC_TRAINING_QUIZ_URL_MISE_EN_PLACE_SOP_FR'),
    bn: readPublicEnv('EXPO_PUBLIC_TRAINING_QUIZ_URL_MISE_EN_PLACE_SOP_BN'),
    zh: readPublicEnv('EXPO_PUBLIC_TRAINING_QUIZ_URL_MISE_EN_PLACE_SOP_ZH'),
  },
  RED_RULES: {
    fr: readPublicEnv('EXPO_PUBLIC_TRAINING_QUIZ_URL_RED_RULES_FR'),
    bn: readPublicEnv('EXPO_PUBLIC_TRAINING_QUIZ_URL_RED_RULES_BN'),
    zh: readPublicEnv('EXPO_PUBLIC_TRAINING_QUIZ_URL_RED_RULES_ZH'),
  },
  BLACK_RULES: {
    fr: readPublicEnv('EXPO_PUBLIC_TRAINING_QUIZ_URL_BLACK_RULES_FR'),
    bn: readPublicEnv('EXPO_PUBLIC_TRAINING_QUIZ_URL_BLACK_RULES_BN'),
    zh: readPublicEnv('EXPO_PUBLIC_TRAINING_QUIZ_URL_BLACK_RULES_ZH'),
  },
  SALLE_TOOLS: {
    fr: readPublicEnv('EXPO_PUBLIC_TRAINING_QUIZ_URL_SALLE_TOOLS_FR'),
    bn: readPublicEnv('EXPO_PUBLIC_TRAINING_QUIZ_URL_SALLE_TOOLS_BN'),
    zh: readPublicEnv('EXPO_PUBLIC_TRAINING_QUIZ_URL_SALLE_TOOLS_ZH'),
  },
  CUISINE_TOOLS: {
    fr: readPublicEnv('EXPO_PUBLIC_TRAINING_QUIZ_URL_CUISINE_TOOLS_FR'),
    bn: readPublicEnv('EXPO_PUBLIC_TRAINING_QUIZ_URL_CUISINE_TOOLS_BN'),
    zh: readPublicEnv('EXPO_PUBLIC_TRAINING_QUIZ_URL_CUISINE_TOOLS_ZH'),
  },
  MEAT_DATE_FORM: {
    fr: readPublicEnv('EXPO_PUBLIC_TRAINING_QUIZ_URL_MEAT_DATE_FORM_FR'),
    bn: readPublicEnv('EXPO_PUBLIC_TRAINING_QUIZ_URL_MEAT_DATE_FORM_BN'),
    zh: readPublicEnv('EXPO_PUBLIC_TRAINING_QUIZ_URL_MEAT_DATE_FORM_ZH'),
  },
  CLEANING_FORM: {
    fr: readPublicEnv('EXPO_PUBLIC_TRAINING_QUIZ_URL_CLEANING_FORM_FR'),
    bn: readPublicEnv('EXPO_PUBLIC_TRAINING_QUIZ_URL_CLEANING_FORM_BN'),
    zh: readPublicEnv('EXPO_PUBLIC_TRAINING_QUIZ_URL_CLEANING_FORM_ZH'),
  },
};

export function getTrainingQuizUrlForSectionLanguage(
  section: LibrarySection,
  language: TrainingQuizLinkLanguage,
): string {
  return (
    TRAINING_QUIZ_URL_BY_SECTION_AND_LANGUAGE[section]?.[language] ||
    TRAINING_QUIZ_URL_BY_LANGUAGE[language] ||
    TRAINING_QUIZ_URL
  );
}
