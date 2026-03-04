export type UploadModule = 'TRAINING' | 'POLICY' | 'MANAGEMENT' | 'FORMS';

export type UploadSection =
  | 'RECIPE_TRAINING'
  | 'RECIPE'
  | 'MISE_EN_PLACE_SOP'
  | 'RED_RULES'
  | 'BLACK_RULES'
  | 'SALLE_TOOLS'
  | 'CUISINE_TOOLS'
  | 'MEAT_DATE_FORM'
  | 'CLEANING_FORM';

export const UPLOAD_SECTION_BY_MODULE: Record<UploadModule, UploadSection[]> = {
  TRAINING: ['RECIPE_TRAINING', 'RECIPE', 'MISE_EN_PLACE_SOP'],
  POLICY: ['RED_RULES', 'BLACK_RULES'],
  MANAGEMENT: ['SALLE_TOOLS', 'CUISINE_TOOLS'],
  FORMS: ['MEAT_DATE_FORM', 'CLEANING_FORM'],
};

export function isUploadModule(value: string): value is UploadModule {
  return value in UPLOAD_SECTION_BY_MODULE;
}

export function isUploadSection(value: string): value is UploadSection {
  return Object.values(UPLOAD_SECTION_BY_MODULE)
    .flat()
    .includes(value as UploadSection);
}

export function isSectionInModule(
  module: UploadModule,
  section: UploadSection,
) {
  return UPLOAD_SECTION_BY_MODULE[module].includes(section);
}
