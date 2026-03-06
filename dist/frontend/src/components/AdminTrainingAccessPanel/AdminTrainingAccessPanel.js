"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminTrainingAccessPanel = AdminTrainingAccessPanel;
const react_1 = require("react");
const react_native_1 = require("react-native");
const trainingScenario_1 = require("../../constants/trainingScenario");
const documentTaxonomy_1 = require("../../constants/documentTaxonomy");
const usersApi_1 = require("../../services/usersApi");
const AdminTrainingAccessPanel_styles_1 = require("./AdminTrainingAccessPanel.styles");
const QUIZ_LINK_LANGUAGES = ['fr', 'bn'];
function getQuizLinkKey(section, language) {
    return `${section}:${language}`;
}
function sortSections(sections) {
    return [...sections].sort().join(',');
}
function AdminTrainingAccessPanel({ accessToken, text, }) {
    const scenarios = (0, react_1.useMemo)(() => (0, trainingScenario_1.getTrainingScenarios)(text), [text]);
    const sectionLabelByKey = (0, react_1.useMemo)(() => {
        const map = new Map();
        const grouped = (0, documentTaxonomy_1.getSectionsByModule)(text);
        for (const sectionList of Object.values(grouped)) {
            for (const section of sectionList) {
                map.set(section.key, section.label);
            }
        }
        return map;
    }, [text]);
    const managedSections = (0, react_1.useMemo)(() => Array.from(new Set(scenarios.flatMap((scenario) => scenario.sections))), [scenarios]);
    const managedSectionSet = (0, react_1.useMemo)(() => new Set(managedSections), [managedSections]);
    const [levelProfiles, setLevelProfiles] = (0, react_1.useState)([]);
    const [selectedLevel, setSelectedLevel] = (0, react_1.useState)(null);
    const [draftSections, setDraftSections] = (0, react_1.useState)([]);
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const [isSaving, setIsSaving] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const [isQuizLinksLoading, setIsQuizLinksLoading] = (0, react_1.useState)(false);
    const [quizLinksError, setQuizLinksError] = (0, react_1.useState)(null);
    const [savingQuizLinkKey, setSavingQuizLinkKey] = (0, react_1.useState)(null);
    const [savedQuizLinksByKey, setSavedQuizLinksByKey] = (0, react_1.useState)({});
    const [quizLinkDraftsByKey, setQuizLinkDraftsByKey] = (0, react_1.useState)({});
    const sectionProfileByLevel = (0, react_1.useMemo)(() => {
        const map = new Map();
        for (const profile of levelProfiles) {
            map.set(profile.employeeLevel, profile.sections ?? []);
        }
        return map;
    }, [levelProfiles]);
    const levelOptions = (0, react_1.useMemo)(() => {
        const levels = Array.from(new Set(levelProfiles.map((profile) => profile.employeeLevel)));
        return levels.sort((left, right) => left.localeCompare(right));
    }, [levelProfiles]);
    (0, react_1.useEffect)(() => {
        let isActive = true;
        setIsLoading(true);
        setError(null);
        void (0, usersApi_1.fetchTrainingAccessByLevel)(accessToken)
            .then((profiles) => {
            if (!isActive) {
                return;
            }
            setLevelProfiles(profiles);
        })
            .catch(() => {
            if (isActive) {
                setError(text.adminTraining.loadLevelProfilesError);
            }
        })
            .finally(() => {
            if (isActive) {
                setIsLoading(false);
            }
        });
        return () => {
            isActive = false;
        };
    }, [accessToken, text.adminTraining.loadLevelProfilesError]);
    (0, react_1.useEffect)(() => {
        let isActive = true;
        setIsQuizLinksLoading(true);
        setQuizLinksError(null);
        void (0, usersApi_1.fetchTrainingQuizLinks)(accessToken)
            .then((quizLinks) => {
            if (!isActive) {
                return;
            }
            const nextSavedByKey = quizLinks.reduce((accumulator, item) => {
                accumulator[getQuizLinkKey(item.section, item.language)] = item.quizUrl ?? '';
                return accumulator;
            }, {});
            setSavedQuizLinksByKey(nextSavedByKey);
            setQuizLinkDraftsByKey(nextSavedByKey);
        })
            .catch(() => {
            if (isActive) {
                setSavedQuizLinksByKey({});
                setQuizLinkDraftsByKey({});
                setQuizLinksError(text.adminTraining.loadQuizLinksError);
            }
        })
            .finally(() => {
            if (isActive) {
                setIsQuizLinksLoading(false);
            }
        });
        return () => {
            isActive = false;
        };
    }, [accessToken, text.adminTraining.loadQuizLinksError]);
    (0, react_1.useEffect)(() => {
        if (!levelOptions.length) {
            setSelectedLevel(null);
            setDraftSections([]);
            return;
        }
        setSelectedLevel((current) => current && levelOptions.includes(current) ? current : levelOptions[0]);
    }, [levelOptions]);
    const baseSectionsForLevel = (0, react_1.useMemo)(() => (selectedLevel ? sectionProfileByLevel.get(selectedLevel) ?? [] : []), [sectionProfileByLevel, selectedLevel]);
    const baseManagedSectionsForLevel = (0, react_1.useMemo)(() => baseSectionsForLevel.filter((section) => managedSectionSet.has(section)), [baseSectionsForLevel, managedSectionSet]);
    const hiddenSectionsForLevel = (0, react_1.useMemo)(() => baseSectionsForLevel.filter((section) => !managedSectionSet.has(section)), [baseSectionsForLevel, managedSectionSet]);
    (0, react_1.useEffect)(() => {
        setDraftSections(baseManagedSectionsForLevel);
    }, [baseManagedSectionsForLevel]);
    const isDirty = (0, react_1.useMemo)(() => sortSections(draftSections) !== sortSections(baseManagedSectionsForLevel), [baseManagedSectionsForLevel, draftSections]);
    const selectedCount = draftSections.length;
    const totalCount = managedSections.length;
    function toggleSection(section) {
        setDraftSections((current) => current.includes(section)
            ? current.filter((item) => item !== section)
            : [...current, section]);
    }
    function selectAllSections() {
        setDraftSections([...managedSections]);
    }
    function clearAllSections() {
        setDraftSections([]);
    }
    function resetLevelProfile() {
        setDraftSections(baseManagedSectionsForLevel);
    }
    function toggleScenarioSections(scenario) {
        const sectionKeys = scenario.sections;
        setDraftSections((current) => {
            const allSelected = sectionKeys.every((key) => current.includes(key));
            if (allSelected) {
                return current.filter((key) => !sectionKeys.includes(key));
            }
            return Array.from(new Set([...current, ...sectionKeys]));
        });
    }
    function clearScenarioSections(scenario) {
        setDraftSections((current) => current.filter((key) => !scenario.sections.includes(key)));
    }
    function updateQuizLinkDraft(section, language, value) {
        const key = getQuizLinkKey(section, language);
        setQuizLinkDraftsByKey((current) => ({
            ...current,
            [key]: value,
        }));
    }
    async function saveQuizLink(section, language) {
        const key = getQuizLinkKey(section, language);
        const draftValue = (quizLinkDraftsByKey[key] ?? '').trim();
        setSavingQuizLinkKey(key);
        setQuizLinksError(null);
        try {
            const updated = await (0, usersApi_1.updateTrainingQuizLink)(accessToken, section, language, draftValue || null);
            const normalizedValue = updated.quizUrl ?? '';
            setSavedQuizLinksByKey((current) => ({
                ...current,
                [key]: normalizedValue,
            }));
            setQuizLinkDraftsByKey((current) => ({
                ...current,
                [key]: normalizedValue,
            }));
        }
        catch {
            setQuizLinksError(text.adminTraining.saveQuizLinksError);
        }
        finally {
            setSavingQuizLinkKey(null);
        }
    }
    async function saveAccess() {
        if (!selectedLevel) {
            return;
        }
        setIsSaving(true);
        setError(null);
        const payloadSections = Array.from(new Set([...draftSections, ...hiddenSectionsForLevel]));
        try {
            const updatedProfile = await (0, usersApi_1.updateTrainingAccessByLevel)(accessToken, selectedLevel, payloadSections);
            setLevelProfiles((current) => current.some((entry) => entry.employeeLevel === updatedProfile.employeeLevel)
                ? current.map((entry) => entry.employeeLevel === updatedProfile.employeeLevel
                    ? updatedProfile
                    : entry)
                : [...current, updatedProfile]);
        }
        catch {
            setError(text.adminTraining.saveError);
        }
        finally {
            setIsSaving(false);
        }
    }
    return (<react_native_1.View style={AdminTrainingAccessPanel_styles_1.styles.uploadCard}>
      <react_native_1.Text style={AdminTrainingAccessPanel_styles_1.styles.uploadTitle}>{text.adminTraining.title}</react_native_1.Text>
      <react_native_1.Text style={AdminTrainingAccessPanel_styles_1.styles.uploadSubtitle}>{text.adminTraining.subtitle}</react_native_1.Text>

      {error ? <react_native_1.Text style={AdminTrainingAccessPanel_styles_1.styles.error}>{error}</react_native_1.Text> : null}
      {isLoading ? <react_native_1.Text style={AdminTrainingAccessPanel_styles_1.styles.docItemMeta}>{text.adminTraining.loading}</react_native_1.Text> : null}

      <react_native_1.View style={AdminTrainingAccessPanel_styles_1.styles.sectionCard}>
        <react_native_1.Text style={AdminTrainingAccessPanel_styles_1.styles.uploadFieldTitle}>{text.adminTraining.levelLabel}</react_native_1.Text>
        <react_native_1.View style={AdminTrainingAccessPanel_styles_1.styles.uploadChipWrap}>
          {levelOptions.map((level) => (<react_native_1.Pressable key={level} style={[AdminTrainingAccessPanel_styles_1.styles.uploadChip, selectedLevel === level && AdminTrainingAccessPanel_styles_1.styles.uploadChipActive]} onPress={() => setSelectedLevel(level)}>
              <react_native_1.Text style={[
                AdminTrainingAccessPanel_styles_1.styles.uploadChipText,
                selectedLevel === level && AdminTrainingAccessPanel_styles_1.styles.uploadChipTextActive,
            ]}>
                {text.dashboard.levels[level]}
              </react_native_1.Text>
            </react_native_1.Pressable>))}
        </react_native_1.View>
      </react_native_1.View>

      <react_native_1.View style={AdminTrainingAccessPanel_styles_1.styles.sectionCard}>
        <react_native_1.View style={AdminTrainingAccessPanel_styles_1.styles.sectionHeaderRow}>
          <react_native_1.Text style={AdminTrainingAccessPanel_styles_1.styles.uploadFieldTitle}>{text.adminTraining.allowedSections}</react_native_1.Text>
          <react_native_1.Text style={AdminTrainingAccessPanel_styles_1.styles.sectionCounter}>
            {selectedCount}/{totalCount}
          </react_native_1.Text>
        </react_native_1.View>

        <react_native_1.View style={AdminTrainingAccessPanel_styles_1.styles.quickActionsRow}>
          <react_native_1.Pressable style={AdminTrainingAccessPanel_styles_1.styles.quickActionButton} onPress={selectAllSections}>
            <react_native_1.Text style={AdminTrainingAccessPanel_styles_1.styles.quickActionButtonText}>
              {text.adminTraining.selectAllSections}
            </react_native_1.Text>
          </react_native_1.Pressable>
          <react_native_1.Pressable style={AdminTrainingAccessPanel_styles_1.styles.quickActionButton} onPress={clearAllSections}>
            <react_native_1.Text style={AdminTrainingAccessPanel_styles_1.styles.quickActionButtonText}>
              {text.adminTraining.clearAllSections}
            </react_native_1.Text>
          </react_native_1.Pressable>
          <react_native_1.Pressable style={[AdminTrainingAccessPanel_styles_1.styles.quickActionButton, !isDirty && AdminTrainingAccessPanel_styles_1.styles.buttonDisabled]} disabled={!isDirty} onPress={resetLevelProfile}>
            <react_native_1.Text style={AdminTrainingAccessPanel_styles_1.styles.quickActionButtonText}>{text.adminTraining.resetSections}</react_native_1.Text>
          </react_native_1.Pressable>
        </react_native_1.View>

        <react_native_1.Text style={AdminTrainingAccessPanel_styles_1.styles.matrixTitle}>{text.adminTraining.scenarioMatrixTitle}</react_native_1.Text>
        <react_native_1.Text style={AdminTrainingAccessPanel_styles_1.styles.docItemMeta}>{text.adminTraining.scenarioMatrixSubtitle}</react_native_1.Text>

        {scenarios.map((scenario) => {
            const selectedInScenario = scenario.sections.filter((section) => draftSections.includes(section)).length;
            return (<react_native_1.View key={scenario.key} style={AdminTrainingAccessPanel_styles_1.styles.scenarioCard}>
              <react_native_1.View style={AdminTrainingAccessPanel_styles_1.styles.scenarioHeaderRow}>
                <react_native_1.View>
                  <react_native_1.Text style={AdminTrainingAccessPanel_styles_1.styles.scenarioTitle}>{scenario.label}</react_native_1.Text>
                  <react_native_1.Text style={AdminTrainingAccessPanel_styles_1.styles.moduleMeta}>
                    {selectedInScenario}/{scenario.sections.length}
                  </react_native_1.Text>
                </react_native_1.View>

                <react_native_1.View style={AdminTrainingAccessPanel_styles_1.styles.scenarioActionsRow}>
                  <react_native_1.Pressable style={AdminTrainingAccessPanel_styles_1.styles.scenarioActionButton} onPress={() => toggleScenarioSections(scenario)}>
                    <react_native_1.Text style={AdminTrainingAccessPanel_styles_1.styles.scenarioActionButtonText}>
                      {text.adminTraining.selectScenario}
                    </react_native_1.Text>
                  </react_native_1.Pressable>
                  <react_native_1.Pressable style={AdminTrainingAccessPanel_styles_1.styles.scenarioActionButton} onPress={() => clearScenarioSections(scenario)}>
                    <react_native_1.Text style={AdminTrainingAccessPanel_styles_1.styles.scenarioActionButtonText}>
                      {text.adminTraining.clearScenario}
                    </react_native_1.Text>
                  </react_native_1.Pressable>
                </react_native_1.View>
              </react_native_1.View>

              <react_native_1.View style={AdminTrainingAccessPanel_styles_1.styles.uploadChipWrap}>
                {scenario.sections.map((section) => {
                    const checked = draftSections.includes(section);
                    return (<react_native_1.Pressable key={section} style={[AdminTrainingAccessPanel_styles_1.styles.uploadChip, checked && AdminTrainingAccessPanel_styles_1.styles.uploadChipActive]} onPress={() => toggleSection(section)}>
                      <react_native_1.Text style={[
                            AdminTrainingAccessPanel_styles_1.styles.uploadChipText,
                            checked && AdminTrainingAccessPanel_styles_1.styles.uploadChipTextActive,
                        ]}>
                        {sectionLabelByKey.get(section) ?? section}
                      </react_native_1.Text>
                    </react_native_1.Pressable>);
                })}
              </react_native_1.View>
            </react_native_1.View>);
        })}
      </react_native_1.View>

      <react_native_1.View style={AdminTrainingAccessPanel_styles_1.styles.sectionCard}>
        <react_native_1.Text style={AdminTrainingAccessPanel_styles_1.styles.uploadFieldTitle}>{text.adminTraining.quizLinksTitle}</react_native_1.Text>
        <react_native_1.Text style={AdminTrainingAccessPanel_styles_1.styles.docItemMeta}>{text.adminTraining.quizLinksSubtitle}</react_native_1.Text>

        {quizLinksError ? <react_native_1.Text style={AdminTrainingAccessPanel_styles_1.styles.error}>{quizLinksError}</react_native_1.Text> : null}
        {isQuizLinksLoading ? (<react_native_1.Text style={AdminTrainingAccessPanel_styles_1.styles.docItemMeta}>{text.adminTraining.loading}</react_native_1.Text>) : (scenarios.map((scenario) => (<react_native_1.View key={`quiz-link-${scenario.key}`} style={AdminTrainingAccessPanel_styles_1.styles.scenarioCard}>
              <react_native_1.Text style={AdminTrainingAccessPanel_styles_1.styles.scenarioTitle}>{scenario.label}</react_native_1.Text>

              {scenario.sections.map((section) => (<react_native_1.View key={`quiz-link-${section}`} style={AdminTrainingAccessPanel_styles_1.styles.quizLinkSectionCard}>
                  <react_native_1.Text style={AdminTrainingAccessPanel_styles_1.styles.docItemTitle}>
                    {sectionLabelByKey.get(section) ?? section}
                  </react_native_1.Text>

                  {QUIZ_LINK_LANGUAGES.map((languageValue) => {
                    const linkKey = getQuizLinkKey(section, languageValue);
                    const draftValue = quizLinkDraftsByKey[linkKey] ?? '';
                    const savedValue = savedQuizLinksByKey[linkKey] ?? '';
                    const isQuizDirty = draftValue.trim() !== savedValue.trim();
                    const isSavingQuizLink = savingQuizLinkKey === linkKey;
                    return (<react_native_1.View key={`quiz-link-row-${section}-${languageValue}`} style={AdminTrainingAccessPanel_styles_1.styles.quizLinkLanguageRow}>
                        <react_native_1.Text style={AdminTrainingAccessPanel_styles_1.styles.quizLanguageBadge}>
                          {languageValue === 'fr'
                            ? text.adminTraining.quizLanguageFr
                            : text.adminTraining.quizLanguageBn}
                        </react_native_1.Text>
                        <react_native_1.TextInput style={AdminTrainingAccessPanel_styles_1.styles.quizLinkInput} value={draftValue} onChangeText={(value) => updateQuizLinkDraft(section, languageValue, value)} placeholder={text.adminTraining.quizLinkPlaceholder} placeholderTextColor="#a98a8d" autoCapitalize="none" autoCorrect={false} keyboardType="url"/>
                        <react_native_1.Pressable style={[
                            AdminTrainingAccessPanel_styles_1.styles.quizLinkSaveButton,
                            (!isQuizDirty || isSavingQuizLink) && AdminTrainingAccessPanel_styles_1.styles.buttonDisabled,
                        ]} disabled={!isQuizDirty || isSavingQuizLink} onPress={() => {
                            void saveQuizLink(section, languageValue);
                        }}>
                          <react_native_1.Text style={AdminTrainingAccessPanel_styles_1.styles.quizLinkSaveButtonText}>
                            {isSavingQuizLink
                            ? text.adminTraining.saving
                            : text.adminTraining.quizLinkSave}
                          </react_native_1.Text>
                        </react_native_1.Pressable>
                      </react_native_1.View>);
                })}
                </react_native_1.View>))}
            </react_native_1.View>)))}
      </react_native_1.View>

      <react_native_1.Pressable style={[AdminTrainingAccessPanel_styles_1.styles.primaryButton, (isSaving || isLoading) && AdminTrainingAccessPanel_styles_1.styles.buttonDisabled]} disabled={isSaving || isLoading || !selectedLevel} onPress={() => {
            void saveAccess();
        }}>
        <react_native_1.Text style={AdminTrainingAccessPanel_styles_1.styles.primaryButtonText}>
          {isSaving ? text.adminTraining.saving : text.adminTraining.save}
        </react_native_1.Text>
      </react_native_1.Pressable>
    </react_native_1.View>);
}
//# sourceMappingURL=AdminTrainingAccessPanel.js.map