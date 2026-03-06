import type { LibrarySection } from './documentTaxonomy';

export const API_URL = 'https://api.zhaoplatforme.com/backend2';

export type TrainingQuizLinkLanguage = 'fr' | 'bn';

function readPublicEnv(name: string): string {
  if (typeof process === 'undefined') {
    return '';
  }

  const rawValue = process.env[name];
  return typeof rawValue === 'string' ? rawValue.trim() : '';
}

export const TRAINING_QUIZ_URL = readPublicEnv(
  'EXPO_PUBLIC_TRAINING_QUIZ_URL',
);

const TRAINING_QUIZ_URL_BY_LANGUAGE: Record<TrainingQuizLinkLanguage, string> = {
  fr: readPublicEnv('EXPO_PUBLIC_TRAINING_QUIZ_URL_FR'),
  bn: readPublicEnv('EXPO_PUBLIC_TRAINING_QUIZ_URL_BN'),
};

const TRAINING_QUIZ_URL_BY_SECTION_AND_LANGUAGE: Partial<
  Record<LibrarySection, Partial<Record<TrainingQuizLinkLanguage, string>>>
> = {
  RECIPE_TRAINING: {
    fr: readPublicEnv('EXPO_PUBLIC_TRAINING_QUIZ_URL_RECIPE_TRAINING_FR'),
    bn: readPublicEnv('EXPO_PUBLIC_TRAINING_QUIZ_URL_RECIPE_TRAINING_BN'),
  },
  RECIPE: {
    fr: readPublicEnv('EXPO_PUBLIC_TRAINING_QUIZ_URL_RECIPE_FR'),
    bn: readPublicEnv('EXPO_PUBLIC_TRAINING_QUIZ_URL_RECIPE_BN'),
  },
  MISE_EN_PLACE_SOP: {
    fr: readPublicEnv('EXPO_PUBLIC_TRAINING_QUIZ_URL_MISE_EN_PLACE_SOP_FR'),
    bn: readPublicEnv('EXPO_PUBLIC_TRAINING_QUIZ_URL_MISE_EN_PLACE_SOP_BN'),
  },
  RED_RULES: {
    fr: readPublicEnv('EXPO_PUBLIC_TRAINING_QUIZ_URL_RED_RULES_FR'),
    bn: readPublicEnv('EXPO_PUBLIC_TRAINING_QUIZ_URL_RED_RULES_BN'),
  },
  BLACK_RULES: {
    fr: readPublicEnv('EXPO_PUBLIC_TRAINING_QUIZ_URL_BLACK_RULES_FR'),
    bn: readPublicEnv('EXPO_PUBLIC_TRAINING_QUIZ_URL_BLACK_RULES_BN'),
  },
  SALLE_TOOLS: {
    fr: readPublicEnv('EXPO_PUBLIC_TRAINING_QUIZ_URL_SALLE_TOOLS_FR'),
    bn: readPublicEnv('EXPO_PUBLIC_TRAINING_QUIZ_URL_SALLE_TOOLS_BN'),
  },
  CUISINE_TOOLS: {
    fr: readPublicEnv('EXPO_PUBLIC_TRAINING_QUIZ_URL_CUISINE_TOOLS_FR'),
    bn: readPublicEnv('EXPO_PUBLIC_TRAINING_QUIZ_URL_CUISINE_TOOLS_BN'),
  },
  MEAT_DATE_FORM: {
    fr: readPublicEnv('EXPO_PUBLIC_TRAINING_QUIZ_URL_MEAT_DATE_FORM_FR'),
    bn: readPublicEnv('EXPO_PUBLIC_TRAINING_QUIZ_URL_MEAT_DATE_FORM_BN'),
  },
  CLEANING_FORM: {
    fr: readPublicEnv('EXPO_PUBLIC_TRAINING_QUIZ_URL_CLEANING_FORM_FR'),
    bn: readPublicEnv('EXPO_PUBLIC_TRAINING_QUIZ_URL_CLEANING_FORM_BN'),
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
