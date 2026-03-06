import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import {
  getTrainingScenarios,
  type TrainingScenario,
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
    <View style={styles.uploadCard}>
      <Text style={styles.uploadTitle}>{text.adminTraining.title}</Text>
      <Text style={styles.uploadSubtitle}>{text.adminTraining.subtitle}</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {isLoading ? <Text style={styles.docItemMeta}>{text.adminTraining.loading}</Text> : null}

      <View style={styles.sectionCard}>
        <Text style={styles.uploadFieldTitle}>{text.adminTraining.levelLabel}</Text>
        <View style={styles.uploadChipWrap}>
          {levelOptions.map((level) => (
            <Pressable
              key={level}
              style={[styles.uploadChip, selectedLevel === level && styles.uploadChipActive]}
              onPress={() => setSelectedLevel(level)}
            >
              <Text
                style={[
                  styles.uploadChipText,
                  selectedLevel === level && styles.uploadChipTextActive,
                ]}
              >
                {text.dashboard.levels[level]}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.uploadFieldTitle}>{text.adminTraining.allowedSections}</Text>
          <Text style={styles.sectionCounter}>
            {selectedCount}/{totalCount}
          </Text>
        </View>

        <View style={styles.quickActionsRow}>
          <Pressable style={styles.quickActionButton} onPress={selectAllSections}>
            <Text style={styles.quickActionButtonText}>
              {text.adminTraining.selectAllSections}
            </Text>
          </Pressable>
          <Pressable style={styles.quickActionButton} onPress={clearAllSections}>
            <Text style={styles.quickActionButtonText}>
              {text.adminTraining.clearAllSections}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.quickActionButton, !isDirty && styles.buttonDisabled]}
            disabled={!isDirty}
            onPress={resetLevelProfile}
          >
            <Text style={styles.quickActionButtonText}>{text.adminTraining.resetSections}</Text>
          </Pressable>
        </View>

        <Text style={styles.matrixTitle}>{text.adminTraining.scenarioMatrixTitle}</Text>
        <Text style={styles.docItemMeta}>{text.adminTraining.scenarioMatrixSubtitle}</Text>

        {scenarios.map((scenario) => {
          const selectedInScenario = scenario.sections.filter((section) =>
            draftSections.includes(section),
          ).length;

          return (
            <View key={scenario.key} style={styles.scenarioCard}>
              <View style={styles.scenarioHeaderRow}>
                <View>
                  <Text style={styles.scenarioTitle}>{scenario.label}</Text>
                  <Text style={styles.moduleMeta}>
                    {selectedInScenario}/{scenario.sections.length}
                  </Text>
                </View>

                <View style={styles.scenarioActionsRow}>
                  <Pressable
                    style={styles.scenarioActionButton}
                    onPress={() => toggleScenarioSections(scenario)}
                  >
                    <Text style={styles.scenarioActionButtonText}>
                      {text.adminTraining.selectScenario}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={styles.scenarioActionButton}
                    onPress={() => clearScenarioSections(scenario)}
                  >
                    <Text style={styles.scenarioActionButtonText}>
                      {text.adminTraining.clearScenario}
                    </Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.uploadChipWrap}>
                {scenario.sections.map((section) => {
                  const checked = draftSections.includes(section);

                  return (
                    <Pressable
                      key={section}
                      style={[styles.uploadChip, checked && styles.uploadChipActive]}
                      onPress={() => toggleSection(section)}
                    >
                      <Text
                        style={[
                          styles.uploadChipText,
                          checked && styles.uploadChipTextActive,
                        ]}
                      >
                        {sectionLabelByKey.get(section as LibrarySection) ?? section}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.uploadFieldTitle}>{text.adminTraining.quizLinksTitle}</Text>
        <Text style={styles.docItemMeta}>{text.adminTraining.quizLinksSubtitle}</Text>

        {quizLinksError ? <Text style={styles.error}>{quizLinksError}</Text> : null}
        {isQuizLinksLoading ? (
          <Text style={styles.docItemMeta}>{text.adminTraining.loading}</Text>
        ) : (
          scenarios.map((scenario) => (
            <View key={`quiz-link-${scenario.key}`} style={styles.scenarioCard}>
              <Text style={styles.scenarioTitle}>{scenario.label}</Text>

              {scenario.sections.map((section) => (
                <View key={`quiz-link-${section}`} style={styles.quizLinkSectionCard}>
                  <Text style={styles.docItemTitle}>
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
                        style={styles.quizLinkLanguageRow}
                      >
                        <Text style={styles.quizLanguageBadge}>
                          {languageValue === 'fr'
                            ? text.adminTraining.quizLanguageFr
                            : text.adminTraining.quizLanguageBn}
                        </Text>
                        <TextInput
                          style={styles.quizLinkInput}
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
                            (!isQuizDirty || isSavingQuizLink) && styles.buttonDisabled,
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
          ))
        )}
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
  );
}
