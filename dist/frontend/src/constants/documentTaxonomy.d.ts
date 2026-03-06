import type { AppText } from '../locales/translations';
export type LibraryModule = 'TRAINING' | 'POLICY' | 'MANAGEMENT' | 'FORMS';
export type LibrarySection = 'RECIPE_TRAINING' | 'RECIPE' | 'MISE_EN_PLACE_SOP' | 'RED_RULES' | 'BLACK_RULES' | 'SALLE_TOOLS' | 'CUISINE_TOOLS' | 'MEAT_DATE_FORM' | 'CLEANING_FORM';
export type TaxonomyOption = {
    key: LibraryModule | LibrarySection;
    label: string;
};
export declare function getModuleOptions(text: AppText): Array<{
    key: LibraryModule;
    label: string;
}>;
export declare function getSectionsByModule(text: AppText): Record<LibraryModule, Array<{
    key: LibrarySection;
    label: string;
}>>;
