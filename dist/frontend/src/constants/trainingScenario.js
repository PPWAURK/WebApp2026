"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TRAINING_SCENARIO_ORDER = exports.TRAINING_SCENARIO_SECTION_MAP = void 0;
exports.getTrainingScenarios = getTrainingScenarios;
exports.getTrainingScenarioForSection = getTrainingScenarioForSection;
exports.TRAINING_SCENARIO_SECTION_MAP = {
    FRONT_OF_HOUSE: ['RECIPE_TRAINING', 'SALLE_TOOLS'],
    BACK_OF_HOUSE: ['RECIPE', 'MISE_EN_PLACE_SOP', 'CUISINE_TOOLS'],
    STORE_OPS: ['RED_RULES', 'BLACK_RULES'],
};
exports.TRAINING_SCENARIO_ORDER = [
    'FRONT_OF_HOUSE',
    'BACK_OF_HOUSE',
    'STORE_OPS',
];
function getTrainingScenarios(text) {
    return [
        {
            key: 'FRONT_OF_HOUSE',
            label: text.training.scenarios.frontOfHouse,
            sections: exports.TRAINING_SCENARIO_SECTION_MAP.FRONT_OF_HOUSE,
        },
        {
            key: 'BACK_OF_HOUSE',
            label: text.training.scenarios.backOfHouse,
            sections: exports.TRAINING_SCENARIO_SECTION_MAP.BACK_OF_HOUSE,
        },
        {
            key: 'STORE_OPS',
            label: text.training.scenarios.storeOps,
            sections: exports.TRAINING_SCENARIO_SECTION_MAP.STORE_OPS,
        },
    ];
}
function getTrainingScenarioForSection(section) {
    for (const key of exports.TRAINING_SCENARIO_ORDER) {
        if (exports.TRAINING_SCENARIO_SECTION_MAP[key].includes(section)) {
            return key;
        }
    }
    return null;
}
//# sourceMappingURL=trainingScenario.js.map