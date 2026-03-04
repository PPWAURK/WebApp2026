"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UPLOAD_SECTION_BY_MODULE = void 0;
exports.isUploadModule = isUploadModule;
exports.isUploadSection = isUploadSection;
exports.isSectionInModule = isSectionInModule;
exports.UPLOAD_SECTION_BY_MODULE = {
    TRAINING: ['RECIPE_TRAINING', 'RECIPE', 'MISE_EN_PLACE_SOP'],
    POLICY: ['RED_RULES', 'BLACK_RULES'],
    MANAGEMENT: ['SALLE_TOOLS', 'CUISINE_TOOLS'],
    FORMS: ['MEAT_DATE_FORM', 'CLEANING_FORM'],
};
function isUploadModule(value) {
    return value in exports.UPLOAD_SECTION_BY_MODULE;
}
function isUploadSection(value) {
    return Object.values(exports.UPLOAD_SECTION_BY_MODULE)
        .flat()
        .includes(value);
}
function isSectionInModule(module, section) {
    return exports.UPLOAD_SECTION_BY_MODULE[module].includes(section);
}
//# sourceMappingURL=upload-taxonomy.js.map