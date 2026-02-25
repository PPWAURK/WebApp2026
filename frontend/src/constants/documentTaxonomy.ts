import type { AppText } from '../locales/translations';

export type LibraryModule = 'TRAINING' | 'POLICY' | 'MANAGEMENT' | 'FORMS';

export type LibrarySection =
  | 'RECIPE_TRAINING'
  | 'RECIPE'
  | 'MISE_EN_PLACE_SOP'
  | 'RED_RULES'
  | 'BLACK_RULES'
  | 'SALLE_TOOLS'
  | 'CUISINE_TOOLS'
  | 'MEAT_DATE_FORM'
  | 'CLEANING_FORM';

export type TaxonomyOption = {
  key: LibraryModule | LibrarySection;
  label: string;
};

export function getModuleOptions(text: AppText): Array<{ key: LibraryModule; label: string }> {
  return [
    { key: 'TRAINING', label: text.taxonomy.modules.TRAINING },
    { key: 'POLICY', label: text.taxonomy.modules.POLICY },
    { key: 'MANAGEMENT', label: text.taxonomy.modules.MANAGEMENT },
    { key: 'FORMS', label: text.taxonomy.modules.FORMS },
  ];
}

export function getSectionsByModule(
  text: AppText,
): Record<LibraryModule, Array<{ key: LibrarySection; label: string }>> {
  return {
    TRAINING: [
      { key: 'RECIPE_TRAINING', label: text.taxonomy.sections.RECIPE_TRAINING },
      { key: 'RECIPE', label: text.taxonomy.sections.RECIPE },
      { key: 'MISE_EN_PLACE_SOP', label: text.taxonomy.sections.MISE_EN_PLACE_SOP },
    ],
    POLICY: [
      { key: 'RED_RULES', label: text.taxonomy.sections.RED_RULES },
      { key: 'BLACK_RULES', label: text.taxonomy.sections.BLACK_RULES },
    ],
    MANAGEMENT: [
      { key: 'SALLE_TOOLS', label: text.taxonomy.sections.SALLE_TOOLS },
      { key: 'CUISINE_TOOLS', label: text.taxonomy.sections.CUISINE_TOOLS },
    ],
    FORMS: [
      { key: 'MEAT_DATE_FORM', label: text.taxonomy.sections.MEAT_DATE_FORM },
      { key: 'CLEANING_FORM', label: text.taxonomy.sections.CLEANING_FORM },
    ],
  };
}
