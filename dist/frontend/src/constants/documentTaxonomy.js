"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getModuleOptions = getModuleOptions;
exports.getSectionsByModule = getSectionsByModule;
function getModuleOptions(text) {
    return [
        { key: 'TRAINING', label: text.taxonomy.modules.TRAINING },
        { key: 'POLICY', label: text.taxonomy.modules.POLICY },
        { key: 'MANAGEMENT', label: text.taxonomy.modules.MANAGEMENT },
        { key: 'FORMS', label: text.taxonomy.modules.FORMS },
    ];
}
function getSectionsByModule(text) {
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
//# sourceMappingURL=documentTaxonomy.js.map