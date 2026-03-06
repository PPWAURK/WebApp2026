export type UploadModule = 'TRAINING' | 'POLICY' | 'MANAGEMENT' | 'FORMS';
export type UploadSection = 'RECIPE_TRAINING' | 'RECIPE' | 'MISE_EN_PLACE_SOP' | 'RED_RULES' | 'BLACK_RULES' | 'SALLE_TOOLS' | 'CUISINE_TOOLS' | 'MEAT_DATE_FORM' | 'CLEANING_FORM';
export declare const UPLOAD_SECTION_BY_MODULE: Record<UploadModule, UploadSection[]>;
export declare function isUploadModule(value: string): value is UploadModule;
export declare function isUploadSection(value: string): value is UploadSection;
export declare function isSectionInModule(module: UploadModule, section: UploadSection): boolean;
