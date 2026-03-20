import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View, useWindowDimensions } from 'react-native';
import {
  getTrainingScenarios,
  type TrainingScenario,
  type TrainingScenarioKey,
} from '../../constants/trainingScenario';
import { getSectionsByModule, type LibrarySection } from '../../constants/documentTaxonomy';
import type { AppText } from '../../locales/translations';
import {
  fetchTrainingAccessByLevel,
  fetchTrainingQuizLinks,
  updateTrainingAccessByLevel,
  updateTrainingQuizLink,
  type TrainingAccessByLevelProfile,
  type TrainingQuizLinkLanguage,
} from '../../services/usersApi';
import { styles } from './AdminTrainingAccessPanel.styles';
import type { EmployeeLevel, TrainingSection, User } from '../../types/auth';

type AdminTrainingAccessPanelProps = {
  accessToken: string;
  currentUser: User;
  text: AppText;
};

const QUIZ_LINK_LANGUAGES: TrainingQuizLinkLanguage[] = ['fr', 'bn'];

function getQuizLinkKey(
  section: TrainingSection,
  language: TrainingQuizLinkLanguage,
) {
  return `${section}:${language}`;
}

function sortSections(sections: TrainingSection[]) {
  return [...sections].sort().join(',');
}

export function AdminTrainingAccessPanel({
  accessToken,
  text,
}: AdminTrainingAccessPanelProps) {
  const { width } = useWindowDimensions();
  const isWideLayout = width >= 1340;
  const isDenseLayout = width < 980;
  const isPhoneLayout = width < 560;
  const isCompactLayout = width < 980;
  const isCompactSurfaceHeader = width < 820;
  const scenarios = useMemo(() => getTrainingScenarios(text), [text]);

  const sectionLabelByKey = useMemo(() => {
    const map = new Map<TrainingSection, string>();
    const grouped = getSectionsByModule(text);
    for (const sectionList of Object.values(grouped)) {
      for (const section of sectionList) {
        map.set(section.key as TrainingSection, section.label);
      }
    }

    return map;
  }, [text]);

  const managedSections = useMemo(
    () =>
      Array.from(
        new Set(scenarios.flatMap((scenario) => scenario.sections)),
      ) as TrainingSection[],
    [scenarios],
  );

  const managedSectionSet = useMemo(
    () => new Set<TrainingSection>(managedSections),
    [managedSections],
  );

  const [levelProfiles, setLevelProfiles] = useState<TrainingAccessByLevelProfile[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<EmployeeLevel | null>(null);
  const [draftSections, setDraftSections] = useState<TrainingSection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isQuizLinksLoading, setIsQuizLinksLoading] = useState(false);
  const [quizLinksError, setQuizLinksError] = useState<string | null>(null);
  const [savingQuizLinkKey, setSavingQuizLinkKey] = useState<string | null>(null);
  const [savedQuizLinksByKey, setSavedQuizLinksByKey] = useState<Record<string, string>>({});
  const [quizLinkDraftsByKey, setQuizLinkDraftsByKey] = useState<Record<string, string>>({});
  const [isLevelListExpanded, setIsLevelListExpanded] = useState(false);
  const [expandedAccessScenarios, setExpandedAccessScenarios] = useState<
    Record<TrainingScenarioKey, boolean>
  >({
    FRONT_OF_HOUSE: false,
    BACK_OF_HOUSE: false,
    STORE_OPS: false,
  });
  const [expandedQuizScenarios, setExpandedQuizScenarios] = useState<
    Record<TrainingScenarioKey, boolean>
  >({
    FRONT_OF_HOUSE: false,
    BACK_OF_HOUSE: false,
    STORE_OPS: false,
  });

  const sectionProfileByLevel = useMemo(() => {
    const map = new Map<EmployeeLevel, TrainingSection[]>();
    for (const profile of levelProfiles) {
      map.set(profile.employeeLevel, profile.sections ?? []);
    }
    return map;
  }, [levelProfiles]);

  const levelOptions = useMemo(() => {
    const levels = Array.from(
      new Set(levelProfiles.map((profile) => profile.employeeLevel)),
    );
    return levels.sort((left, right) => left.localeCompare(right));
  }, [levelProfiles]);

  useEffect(() => {
    let isActive = true;
    setIsLoading(true);
    setError(null);

    void fetchTrainingAccessByLevel(accessToken)
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

  useEffect(() => {
    let isActive = true;
    setIsQuizLinksLoading(true);
    setQuizLinksError(null);

    void fetchTrainingQuizLinks(accessToken)
      .then((quizLinks) => {
        if (!isActive) {
          return;
        }

        const nextSavedByKey = quizLinks.reduce<Record<string, string>>(
          (accumulator, item) => {
            accumulator[getQuizLinkKey(item.section, item.language)] = item.quizUrl ?? '';
            return accumulator;
          },
          {},
        );

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

  useEffect(() => {
    if (!levelOptions.length) {
      setSelectedLevel(null);
      setDraftSections([]);
      setIsLevelListExpanded(false);
      return;
    }

    setSelectedLevel((current) =>
      current && levelOptions.includes(current) ? current : levelOptions[0],
    );
  }, [levelOptions]);

  const baseSectionsForLevel = useMemo(
    () => (selectedLevel ? sectionProfileByLevel.get(selectedLevel) ?? [] : []),
    [sectionProfileByLevel, selectedLevel],
  );

  const baseManagedSectionsForLevel = useMemo(
    () => baseSectionsForLevel.filter((section) => managedSectionSet.has(section)),
    [baseSectionsForLevel, managedSectionSet],
  );

  const hiddenSectionsForLevel = useMemo(
    () => baseSectionsForLevel.filter((section) => !managedSectionSet.has(section)),
    [baseSectionsForLevel, managedSectionSet],
  );

  useEffect(() => {
    setDraftSections(baseManagedSectionsForLevel);
  }, [baseManagedSectionsForLevel]);

  const isDirty = useMemo(
    () => sortSections(draftSections) !== sortSections(baseManagedSectionsForLevel),
    [baseManagedSectionsForLevel, draftSections],
  );

  const selectedCount = draftSections.length;
  const totalCount = managedSections.length;
  const selectedLevelLabel = selectedLevel
    ? text.dashboard.levels[selectedLevel]
    : text.adminTraining.loading;
  const totalQuizLinkCount = managedSections.length * QUIZ_LINK_LANGUAGES.length;
  const configuredQuizLinkCount = useMemo(
    () =>
      managedSections.reduce((count, section) => {
        return (
          count +
          QUIZ_LINK_LANGUAGES.filter((languageValue) =>
            Boolean(
              (savedQuizLinksByKey[getQuizLinkKey(section, languageValue)] ?? '')
                .trim(),
            ),
          ).length
        );
      }, 0),
    [managedSections, savedQuizLinksByKey],
  );

  function toggleSection(section: TrainingSection) {
    setDraftSections((current) =>
      current.includes(section)
        ? current.filter((item) => item !== section)
        : [...current, section],
    );
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

  function toggleScenarioSections(scenario: TrainingScenario) {
    const sectionKeys = scenario.sections;

    setDraftSections((current) => {
      const allSelected = sectionKeys.every((key) => current.includes(key));

      if (allSelected) {
        return current.filter((key) => !sectionKeys.includes(key));
      }

      return Array.from(new Set([...current, ...sectionKeys]));
    });
  }

  function clearScenarioSections(scenario: TrainingScenario) {
    setDraftSections((current) =>
      current.filter((key) => !scenario.sections.includes(key)),
    );
  }

  function toggleAccessScenarioExpanded(key: TrainingScenarioKey) {
    setExpandedAccessScenarios((current) => ({
      ...current,
      [key]: !current[key],
    }));
  }

  function toggleQuizScenarioExpanded(key: TrainingScenarioKey) {
    setExpandedQuizScenarios((current) => ({
      ...current,
      [key]: !current[key],
    }));
  }

  function updateQuizLinkDraft(
    section: TrainingSection,
    language: TrainingQuizLinkLanguage,
    value: string,
  ) {
    const key = getQuizLinkKey(section, language);
    setQuizLinkDraftsByKey((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function saveQuizLink(
    section: TrainingSection,
    language: TrainingQuizLinkLanguage,
  ) {
    const key = getQuizLinkKey(section, language);
    const draftValue = (quizLinkDraftsByKey[key] ?? '').trim();

    setSavingQuizLinkKey(key);
    setQuizLinksError(null);

    try {
      const updated = await updateTrainingQuizLink(
        accessToken,
        section,
        language,
        draftValue || null,
      );

      const normalizedValue = updated.quizUrl ?? '';
      setSavedQuizLinksByKey((current) => ({
        ...current,
        [key]: normalizedValue,
      }));
      setQuizLinkDraftsByKey((current) => ({
        ...current,
        [key]: normalizedValue,
      }));
    } catch {
      setQuizLinksError(text.adminTraining.saveQuizLinksError);
    } finally {
      setSavingQuizLinkKey(null);
    }
  }

  async function saveAccess() {
    if (!selectedLevel) {
      return;
    }

    setIsSaving(true);
    setError(null);

    const payloadSections = Array.from(
      new Set([...draftSections, ...hiddenSectionsForLevel]),
    );

    try {
      const updatedProfile = await updateTrainingAccessByLevel(
        accessToken,
        selectedLevel,
        payloadSections,
      );

      setLevelProfiles((current) =>
        current.some((entry) => entry.employeeLevel === updatedProfile.employeeLevel)
          ? current.map((entry) =>
              entry.employeeLevel === updatedProfile.employeeLevel
                ? updatedProfile
                : entry,
            )
          : [...current, updatedProfile],
      );
    } catch {
      setError(text.adminTraining.saveError);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <View style={styles.panelStack}>
      <View style={[styles.panelHeader, isDenseLayout && styles.panelHeaderCompact]}>
        <View style={styles.panelHeaderCopy}>
          <Text style={styles.panelTitle}>{text.adminTraining.title}</Text>
          <Text style={styles.panelSubtitle}>{text.adminTraining.subtitle}</Text>
        </View>

          <View style={styles.panelStatsRow}>
          <View style={[styles.panelStatCard, isDenseLayout && styles.panelStatCardCompact]}>
            <Text style={styles.panelStatValue}>
              {selectedCount}/{totalCount}
            </Text>
            <Text style={styles.panelStatLabel}>
              {text.adminTraining.allowedSections}
            </Text>
          </View>
          <View style={[styles.panelStatCard, isDenseLayout && styles.panelStatCardCompact]}>
            <Text style={styles.panelStatValue}>
              {configuredQuizLinkCount}/{totalQuizLinkCount}
            </Text>
            <Text style={styles.panelStatLabel}>
              {text.adminTraining.quizLinksTitle}
            </Text>
          </View>
        </View>
      </View>

      <View style={[styles.panelGrid, isWideLayout && styles.panelGridWide]}>
        <View style={[styles.surfaceCard, isDenseLayout && styles.surfaceCardCompact]}>
          <View
            style={[
              styles.surfaceHeader,
              isCompactSurfaceHeader && styles.surfaceHeaderCompact,
            ]}
          >
            <View style={styles.surfaceHeaderCopy}>
              <Text style={styles.surfaceEyebrow}>{text.adminTraining.levelLabel}</Text>
              <Text style={styles.surfaceTitle}>{text.adminTraining.allowedSections}</Text>
              <Text style={styles.surfaceSubtitle}>
                {text.adminTraining.scenarioMatrixSubtitle}
              </Text>
            </View>
            <Text
              style={[
                styles.surfaceCounterPill,
                isCompactSurfaceHeader && styles.surfaceCounterPillCompact,
              ]}
            >
              {selectedCount}/{totalCount}
            </Text>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {isLoading ? (
            <Text style={styles.helperText}>{text.adminTraining.loading}</Text>
          ) : null}

          <Pressable
            style={[
              styles.levelSelectTrigger,
              isLevelListExpanded && styles.levelSelectTriggerActive,
              levelOptions.length === 0 && styles.buttonDisabled,
            ]}
            disabled={levelOptions.length === 0}
            onPress={() => setIsLevelListExpanded((current) => !current)}
          >
            <View style={styles.levelSelectTriggerCopy}>
              <Text style={styles.levelSelectTriggerLabel}>
                {text.adminTraining.levelLabel}
              </Text>
              <Text style={styles.levelSelectTriggerValue}>
                {selectedLevelLabel}
              </Text>
            </View>
            <Ionicons
              name={isLevelListExpanded ? 'chevron-up-outline' : 'chevron-down-outline'}
              size={18}
              color="#7f1b21"
            />
          </Pressable>

          {isLevelListExpanded ? (
            <View style={styles.levelList}>
              {levelOptions.map((level) => (
                <Pressable
                  key={level}
                  style={[
                    styles.levelListItem,
                    selectedLevel === level && styles.levelListItemActive,
                  ]}
                  onPress={() => {
                    setSelectedLevel(level);
                    setIsLevelListExpanded(false);
                  }}
                >
                  <View style={styles.levelListItemCopy}>
                    <Text
                      style={[
                        styles.levelListItemText,
                        selectedLevel === level && styles.levelListItemTextActive,
                      ]}
                    >
                      {text.dashboard.levels[level]}
                    </Text>
                  </View>
                  <Ionicons
                    name={
                      selectedLevel === level
                        ? 'checkmark-circle'
                        : 'ellipse-outline'
                    }
                    size={18}
                    color={selectedLevel === level ? '#ab1e24' : '#c79fa3'}
                  />
                </Pressable>
              ))}
            </View>
          ) : null}

          <View style={[styles.actionRail, isPhoneLayout && styles.actionRailCompact]}>
            <Pressable
              style={[styles.actionButton, isPhoneLayout && styles.actionButtonCompact]}
              onPress={selectAllSections}
            >
              <Text style={styles.actionButtonText}>
                {text.adminTraining.selectAllSections}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.actionButton, isPhoneLayout && styles.actionButtonCompact]}
              onPress={clearAllSections}
            >
              <Text style={styles.actionButtonText}>
                {text.adminTraining.clearAllSections}
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.actionButton,
                isPhoneLayout && styles.actionButtonCompact,
                !isDirty && styles.buttonDisabled,
              ]}
              disabled={!isDirty}
              onPress={resetLevelProfile}
            >
              <Text style={styles.actionButtonText}>
                {text.adminTraining.resetSections}
              </Text>
            </Pressable>
          </View>

          <View style={styles.scenarioStack}>
            {scenarios.map((scenario) => {
              const selectedInScenario = scenario.sections.filter((section) =>
                draftSections.includes(section),
              ).length;
              const isScenarioExpanded = expandedAccessScenarios[scenario.key];

              return (
                <View key={scenario.key} style={styles.scenarioCard}>
                  <View style={styles.scenarioHeaderRow}>
                    <Pressable
                      style={styles.scenarioToggleButton}
                      onPress={() => toggleAccessScenarioExpanded(scenario.key)}
                    >
                      <View style={styles.scenarioHeaderCopy}>
                        <Text style={styles.scenarioTitle}>{scenario.label}</Text>
                        <Text style={styles.scenarioMeta}>
                          {selectedInScenario}/{scenario.sections.length}
                        </Text>
                      </View>
                      <Ionicons
                        name={
                          isScenarioExpanded
                            ? 'chevron-up-outline'
                            : 'chevron-down-outline'
                        }
                        size={18}
                        color="#7f1b21"
                      />
                    </Pressable>
                  </View>

                  {isScenarioExpanded ? (
                    <>
                      <View
                        style={[
                          styles.scenarioActionsRow,
                          isPhoneLayout && styles.scenarioActionsRowCompact,
                        ]}
                      >
                        <Pressable
                          style={[
                            styles.scenarioActionButton,
                            isPhoneLayout && styles.scenarioActionButtonCompact,
                          ]}
                          onPress={() => toggleScenarioSections(scenario)}
                        >
                          <Text style={styles.scenarioActionButtonText}>
                            {text.adminTraining.selectScenario}
                          </Text>
                        </Pressable>
                        <Pressable
                          style={[
                            styles.scenarioActionButton,
                            isPhoneLayout && styles.scenarioActionButtonCompact,
                          ]}
                          onPress={() => clearScenarioSections(scenario)}
                        >
                          <Text style={styles.scenarioActionButtonText}>
                            {text.adminTraining.clearScenario}
                          </Text>
                        </Pressable>
                      </View>

                      <View style={styles.sectionChipRow}>
                        {scenario.sections.map((section) => {
                          const checked = draftSections.includes(section);

                          return (
                            <Pressable
                              key={section}
                              style={[
                                styles.sectionChip,
                                isDenseLayout && styles.sectionChipDense,
                                isPhoneLayout && styles.sectionChipCompact,
                                checked && styles.sectionChipActive,
                              ]}
                              onPress={() => toggleSection(section)}
                            >
                              <Text
                                style={[
                                  styles.sectionChipText,
                                  isDenseLayout && styles.sectionChipTextCompact,
                                  isPhoneLayout && styles.sectionChipTextCompact,
                                  checked && styles.sectionChipTextActive,
                                ]}
                              >
                                {sectionLabelByKey.get(section as LibrarySection) ?? section}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </>
                  ) : (
                    <Text style={styles.scenarioCollapsedHint}>
                      {text.adminTraining.scenarioMatrixSubtitle}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>

          <Pressable
            style={[styles.primaryButton, (isSaving || isLoading) && styles.buttonDisabled]}
            disabled={isSaving || isLoading || !selectedLevel}
            onPress={() => {
              void saveAccess();
            }}
          >
            <Text style={styles.primaryButtonText}>
              {isSaving ? text.adminTraining.saving : text.adminTraining.save}
            </Text>
          </Pressable>
        </View>

        <View style={[styles.surfaceCard, isDenseLayout && styles.surfaceCardCompact]}>
          <View
            style={[
              styles.surfaceHeader,
              isCompactSurfaceHeader && styles.surfaceHeaderCompact,
            ]}
          >
            <View style={styles.surfaceHeaderCopy}>
              <Text style={styles.surfaceEyebrow}>{text.adminTraining.quizLinksTitle}</Text>
              <Text style={styles.surfaceTitle}>{text.adminTraining.quizLinksTitle}</Text>
              <Text style={styles.surfaceSubtitle}>
                {text.adminTraining.quizLinksSubtitle}
              </Text>
            </View>
            <Text
              style={[
                styles.surfaceCounterPill,
                isCompactSurfaceHeader && styles.surfaceCounterPillCompact,
              ]}
            >
              {configuredQuizLinkCount}/{totalQuizLinkCount}
            </Text>
          </View>

          {quizLinksError ? <Text style={styles.error}>{quizLinksError}</Text> : null}
          {isQuizLinksLoading ? (
            <Text style={styles.helperText}>{text.adminTraining.loading}</Text>
          ) : (
            <View style={styles.quizScenarioStack}>
              {scenarios.map((scenario) => {
                const scenarioConfiguredCount = scenario.sections.reduce((count, section) => {
                  return (
                    count +
                    QUIZ_LINK_LANGUAGES.filter((languageValue) =>
                      Boolean(
                        (savedQuizLinksByKey[getQuizLinkKey(section, languageValue)] ?? '')
                          .trim(),
                      ),
                    ).length
                  );
                }, 0);
                const isScenarioExpanded = expandedQuizScenarios[scenario.key];

                return (
                  <View key={`quiz-link-${scenario.key}`} style={styles.quizScenarioCard}>
                    <View style={styles.scenarioHeaderRow}>
                      <Pressable
                        style={styles.scenarioToggleButton}
                        onPress={() => toggleQuizScenarioExpanded(scenario.key)}
                      >
                        <View style={styles.scenarioHeaderCopy}>
                          <Text style={styles.scenarioTitle}>{scenario.label}</Text>
                          <Text style={styles.scenarioMeta}>
                            {scenarioConfiguredCount}/
                            {scenario.sections.length * QUIZ_LINK_LANGUAGES.length}
                          </Text>
                        </View>
                        <Ionicons
                          name={
                            isScenarioExpanded
                              ? 'chevron-up-outline'
                              : 'chevron-down-outline'
                          }
                          size={18}
                          color="#7f1b21"
                        />
                      </Pressable>
                    </View>

                    {isScenarioExpanded ? (
                      <View style={styles.quizSectionStack}>
                        {scenario.sections.map((section) => (
                          <View key={`quiz-link-${section}`} style={styles.quizSectionCard}>
                            <Text style={styles.quizSectionTitle}>
                              {sectionLabelByKey.get(section as LibrarySection) ?? section}
                            </Text>

                            {QUIZ_LINK_LANGUAGES.map((languageValue) => {
                              const linkKey = getQuizLinkKey(section, languageValue);
                              const draftValue = quizLinkDraftsByKey[linkKey] ?? '';
                              const savedValue = savedQuizLinksByKey[linkKey] ?? '';
                              const isQuizDirty = draftValue.trim() !== savedValue.trim();
                              const isSavingQuizLink = savingQuizLinkKey === linkKey;

                              return (
                                <View
                                  key={`quiz-link-row-${section}-${languageValue}`}
                                  style={[
                                    styles.quizLinkRow,
                                    isCompactLayout && styles.quizLinkRowCompact,
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.quizLanguageBadge,
                                      isCompactLayout && styles.quizLanguageBadgeCompact,
                                    ]}
                                  >
                                    {languageValue === 'fr'
                                      ? text.adminTraining.quizLanguageFr
                                      : text.adminTraining.quizLanguageBn}
                                  </Text>
                                  <TextInput
                                    style={[
                                      styles.quizLinkInput,
                                      isCompactLayout && styles.quizLinkInputCompact,
                                    ]}
                                    value={draftValue}
                                    onChangeText={(value) =>
                                      updateQuizLinkDraft(section, languageValue, value)
                                    }
                                    placeholder={text.adminTraining.quizLinkPlaceholder}
                                    placeholderTextColor="#a98a8d"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    keyboardType="url"
                                  />
                                  <Pressable
                                    style={[
                                      styles.quizLinkSaveButton,
                                      isCompactLayout &&
                                        styles.quizLinkSaveButtonCompact,
                                      (!isQuizDirty || isSavingQuizLink) &&
                                        styles.buttonDisabled,
                                    ]}
                                    disabled={!isQuizDirty || isSavingQuizLink}
                                    onPress={() => {
                                      void saveQuizLink(section, languageValue);
                                    }}
                                  >
                                    <Text style={styles.quizLinkSaveButtonText}>
                                      {isSavingQuizLink
                                        ? text.adminTraining.saving
                                        : text.adminTraining.quizLinkSave}
                                    </Text>
                                  </Pressable>
                                </View>
                              );
                            })}
                          </View>
                        ))}
                      </View>
                    ) : (
                      <Text style={styles.scenarioCollapsedHint}>
                        {text.adminTraining.quizLinksSubtitle}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </View>
    </View>
  );
}
