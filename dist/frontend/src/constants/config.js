"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TRAINING_QUIZ_URL = exports.API_URL = void 0;
exports.getTrainingQuizUrlForSectionLanguage = getTrainingQuizUrlForSectionLanguage;
exports.API_URL = 'https://api.zhaoplatforme.com/backend2';
function readPublicEnv(name) {
    if (typeof process === 'undefined') {
        return '';
    }
    const rawValue = process.env[name];
    return typeof rawValue === 'string' ? rawValue.trim() : '';
}
exports.TRAINING_QUIZ_URL = readPublicEnv('EXPO_PUBLIC_TRAINING_QUIZ_URL');
const TRAINING_QUIZ_URL_BY_LANGUAGE = {
    fr: readPublicEnv('EXPO_PUBLIC_TRAINING_QUIZ_URL_FR'),
    bn: readPublicEnv('EXPO_PUBLIC_TRAINING_QUIZ_URL_BN'),
};
const TRAINING_QUIZ_URL_BY_SECTION_AND_LANGUAGE = {
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
function getTrainingQuizUrlForSectionLanguage(section, language) {
    return (TRAINING_QUIZ_URL_BY_SECTION_AND_LANGUAGE[section]?.[language] ||
        TRAINING_QUIZ_URL_BY_LANGUAGE[language] ||
        exports.TRAINING_QUIZ_URL);
}
//# sourceMappingURL=config.js.map