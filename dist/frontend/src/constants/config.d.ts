import type { LibrarySection } from './documentTaxonomy';
export declare const API_URL = "https://api.zhaoplatforme.com/backend2";
export type TrainingQuizLinkLanguage = 'fr' | 'bn';
export declare const TRAINING_QUIZ_URL: string;
export declare function getTrainingQuizUrlForSectionLanguage(section: LibrarySection, language: TrainingQuizLinkLanguage): string;
