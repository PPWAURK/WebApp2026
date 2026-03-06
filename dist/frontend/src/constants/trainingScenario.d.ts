import type { AppText } from '../locales/translations';
import type { TrainingSection } from '../types/auth';
export type TrainingScenarioKey = 'FRONT_OF_HOUSE' | 'BACK_OF_HOUSE' | 'STORE_OPS';
export type TrainingScenario = {
    key: TrainingScenarioKey;
    label: string;
    sections: TrainingSection[];
};
export declare const TRAINING_SCENARIO_SECTION_MAP: Record<TrainingScenarioKey, TrainingSection[]>;
export declare const TRAINING_SCENARIO_ORDER: TrainingScenarioKey[];
export declare function getTrainingScenarios(text: AppText): TrainingScenario[];
export declare function getTrainingScenarioForSection(section: TrainingSection): TrainingScenarioKey | null;
