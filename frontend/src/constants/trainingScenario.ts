import type { AppText } from '../locales/translations';
import type { TrainingSection } from '../types/auth';

export type TrainingScenarioKey =
  | 'FRONT_OF_HOUSE'
  | 'BACK_OF_HOUSE'
  | 'STORE_OPS';

export type TrainingScenario = {
  key: TrainingScenarioKey;
  label: string;
  sections: TrainingSection[];
};

export const TRAINING_SCENARIO_SECTION_MAP: Record<
  TrainingScenarioKey,
  TrainingSection[]
> = {
  FRONT_OF_HOUSE: ['RECIPE_TRAINING', 'SALLE_TOOLS'],
  BACK_OF_HOUSE: ['RECIPE', 'MISE_EN_PLACE_SOP', 'CUISINE_TOOLS'],
  STORE_OPS: ['RED_RULES', 'BLACK_RULES'],
};

export const TRAINING_SCENARIO_ORDER: TrainingScenarioKey[] = [
  'FRONT_OF_HOUSE',
  'BACK_OF_HOUSE',
  'STORE_OPS',
];

export function getTrainingScenarios(text: AppText): TrainingScenario[] {
  return [
    {
      key: 'FRONT_OF_HOUSE',
      label: text.training.scenarios.frontOfHouse,
      sections: TRAINING_SCENARIO_SECTION_MAP.FRONT_OF_HOUSE,
    },
    {
      key: 'BACK_OF_HOUSE',
      label: text.training.scenarios.backOfHouse,
      sections: TRAINING_SCENARIO_SECTION_MAP.BACK_OF_HOUSE,
    },
    {
      key: 'STORE_OPS',
      label: text.training.scenarios.storeOps,
      sections: TRAINING_SCENARIO_SECTION_MAP.STORE_OPS,
    },
  ];
}

export function getTrainingScenarioForSection(
  section: TrainingSection,
): TrainingScenarioKey | null {
  for (const key of TRAINING_SCENARIO_ORDER) {
    if (TRAINING_SCENARIO_SECTION_MAP[key].includes(section)) {
      return key;
    }
  }

  return null;
}
