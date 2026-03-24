import { createElement, useEffect, useMemo, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ResizeMode, Video, VideoFullscreenUpdate } from 'expo-av';
import {
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  getTrainingQuizUrlForSectionLanguage,
  type TrainingQuizLinkLanguage,
} from '../../constants/config';
import { getTrainingScenarios } from '../../constants/trainingScenario';
import type { AppText } from '../../locales/translations';
import {
  loadTrainingCompletionMap,
  setTrainingItemCompletion,
  type TrainingCompletionMap,
} from '../../services/trainingProgressStorage';
import { fetchTrainingQuizLinks } from '../../services/usersApi';
import {
  fetchLibraryFiles,
  type LibraryFileItem,
} from '../../services/uploadsApi';
import { styles } from './TrainingPage.styles';
import type { TrainingSection, User } from '../../types/auth';
import type { Language } from '../../types/language';

type TrainingPageProps = {
  text: AppText;
  accessToken: string;
  currentUser: User;
  language: Language;
};

type OpenedDocumentState = {
  fileName: string;
  originalName: string;
  section: TrainingSection;
};

type WebPdfFrameProps = {
  src: string;
  title: string;
};

function getQuizLinkKey(
  section: TrainingSection,
  language: TrainingQuizLinkLanguage,
) {
  return `${section}:${language}`;
}

function buildQuizUrl(
  baseUrl: string,
  section: TrainingSection,
  context: OpenedDocumentState | null,
): string {
  const params = new URLSearchParams({
    section,
  });

  if (context && context.section === section) {
    params.set('document', context.originalName);
  }

  const joinWith = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${joinWith}${params.toString()}`;
}

function WebPdfFrame({ src, title }: WebPdfFrameProps) {
  if (Platform.OS !== 'web') {
    return null;
  }

  return createElement('iframe', {
    src,
    title,
    style: {
      border: '0',
      width: '100%',
      height: '100%',
      backgroundColor: '#ffffff',
      borderRadius: '12px',
    },
  });
}

function buildWebPreviewUrl(src: string): string {
  const [baseUrl, hash = ''] = src.split('#', 2);
  const previewParams = new URLSearchParams(hash);

  if (!previewParams.has('page')) {
    previewParams.set('page', '1');
  }

  previewParams.set('zoom', 'page-height');
  previewParams.set('toolbar', '0');
  previewParams.set('navpanes', '0');
  previewParams.set('scrollbar', '0');

  return `${baseUrl}#${previewParams.toString()}`;
}

function formatDateLabel(value: string) {
  return new Date(value).toLocaleDateString();
}

function formatFileSize(size: number) {
  if (!Number.isFinite(size) || size <= 0) {
    return '0 KB';
  }

  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(size / 1024))} KB`;
}

function getTrainingItemIcon(
  item: LibraryFileItem,
): keyof typeof Ionicons.glyphMap {
  if (item.mediaType === 'video') {
    return 'videocam-outline';
  }

  return 'document-text-outline';
}

export function TrainingPage({
  text,
  accessToken,
  currentUser,
  language,
}: TrainingPageProps) {
  const [activeScenarioKey, setActiveScenarioKey] = useState<string | null>(
    null,
  );
  const [activeSection, setActiveSection] = useState<TrainingSection | null>(
    null,
  );
  const [libraryItems, setLibraryItems] = useState<LibraryFileItem[]>([]);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);
  const [libraryError, setLibraryError] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<LibraryFileItem | null>(
    null,
  );
  const [openedDocument, setOpenedDocument] =
    useState<OpenedDocumentState | null>(null);
  const [webPreviewDocument, setWebPreviewDocument] =
    useState<LibraryFileItem | null>(null);
  const [webPreviewUrl, setWebPreviewUrl] = useState<string | null>(null);
  const [webPreviewLoading, setWebPreviewLoading] = useState(false);
  const [isWebPreviewFullscreen, setIsWebPreviewFullscreen] = useState(false);
  const [quizLinksByKey, setQuizLinksByKey] = useState<Record<string, string>>(
    {},
  );
  const [quizLanguage, setQuizLanguage] = useState<TrainingQuizLinkLanguage>(
    language === 'fr' ? 'fr' : 'bn',
  );
  const [completionByFile, setCompletionByFile] =
    useState<TrainingCompletionMap>({});
  const [shouldAutoFullscreen, setShouldAutoFullscreen] = useState(false);
  const [videoAspectRatio, setVideoAspectRatio] = useState(16 / 9);

  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const videoRef = useRef<Video | null>(null);

  const scenarios = useMemo(() => getTrainingScenarios(text), [text]);
  const userTrainingAccess = currentUser.trainingAccess ?? [];

  const sectionLabelByKey = useMemo(() => {
    const map = new Map<TrainingSection, string>();
    for (const scenario of scenarios) {
      for (const section of scenario.sections) {
        map.set(section, text.taxonomy.sections[section]);
      }
    }
    return map;
  }, [scenarios, text]);

  const availableScenarios = useMemo(
    () =>
      scenarios
        .map((scenario) => ({
          ...scenario,
          sections: scenario.sections.filter((section) =>
            userTrainingAccess.includes(section),
          ),
        }))
        .filter((scenario) => scenario.sections.length > 0),
    [scenarios, userTrainingAccess],
  );

  useEffect(() => {
    if (!availableScenarios.length) {
      setActiveScenarioKey(null);
      setActiveSection(null);
      return;
    }

    setActiveScenarioKey((current) => {
      if (
        current &&
        availableScenarios.some((scenario) => scenario.key === current)
      ) {
        return current;
      }
      return availableScenarios[0].key;
    });
  }, [availableScenarios]);

  const activeScenario = useMemo(
    () =>
      availableScenarios.find(
        (scenario) => scenario.key === activeScenarioKey,
      ) ??
      availableScenarios[0] ??
      null,
    [activeScenarioKey, availableScenarios],
  );

  useEffect(() => {
    if (!activeScenario) {
      setActiveSection(null);
      return;
    }

    setActiveSection((current) => {
      if (current && activeScenario.sections.includes(current)) {
        return current;
      }

      return activeScenario.sections[0] ?? null;
    });
  }, [activeScenario]);

  useEffect(() => {
    setSearchKeyword('');
    setSelectedVideo(null);
    setShouldAutoFullscreen(false);
  }, [activeScenarioKey, activeSection]);

  useEffect(() => {
    setVideoAspectRatio(16 / 9);
  }, [selectedVideo?.fileUrl]);

  useEffect(() => {
    let isActive = true;

    void loadTrainingCompletionMap(currentUser.id)
      .then((data) => {
        if (isActive) {
          setCompletionByFile(data);
        }
      })
      .catch(() => {
        if (isActive) {
          setCompletionByFile({});
        }
      });

    return () => {
      isActive = false;
    };
  }, [currentUser.id]);

  useEffect(() => {
    let isActive = true;
    setIsLoadingLibrary(true);
    setLibraryError(null);

    void fetchLibraryFiles(accessToken, {})
      .then((items) => {
        if (isActive) {
          setLibraryItems(items);
        }
      })
      .catch(() => {
        if (isActive) {
          setLibraryItems([]);
          setLibraryError(text.training.loadError);
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoadingLibrary(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [accessToken, text.training.loadError]);

  useEffect(() => {
    let isActive = true;

    void fetchTrainingQuizLinks(accessToken)
      .then((links) => {
        if (!isActive) {
          return;
        }

        const nextQuizLinksByKey = links.reduce<Record<string, string>>(
          (accumulator, item) => {
            if (item.quizUrl) {
              accumulator[getQuizLinkKey(item.section, item.language)] =
                item.quizUrl;
            }
            return accumulator;
          },
          {},
        );

        setQuizLinksByKey(nextQuizLinksByKey);
      })
      .catch(() => {
        if (isActive) {
          setQuizLinksByKey({});
        }
      });

    return () => {
      isActive = false;
    };
  }, [accessToken]);

  const selectedSectionLabel =
    (activeSection ? sectionLabelByKey.get(activeSection) : null) ?? '';

  const sectionItems = useMemo(() => {
    if (!activeSection) {
      return [];
    }

    const normalizedSearch = searchKeyword.trim().toLowerCase();

    return libraryItems
      .filter(
        (item) =>
          item.section === activeSection &&
          (item.mediaType === 'document' || item.mediaType === 'video'),
      )
      .filter((item) => {
        if (!normalizedSearch) {
          return true;
        }

        return item.originalName.toLowerCase().includes(normalizedSearch);
      })
      .sort(
        (left, right) =>
          new Date(right.uploadedAt).getTime() -
          new Date(left.uploadedAt).getTime(),
      );
  }, [activeSection, libraryItems, searchKeyword]);

  const selectedSectionDocumentCount = sectionItems.filter(
    (item) => item.mediaType === 'document',
  ).length;
  const selectedSectionVideoCount = sectionItems.filter(
    (item) => item.mediaType === 'video',
  ).length;
  const selectedSectionCompletedCount = sectionItems.filter((item) =>
    Boolean(completionByFile[item.fileName]),
  ).length;

  const selectedSectionKey = activeSection;
  const dbQuizBaseUrl = selectedSectionKey
    ? (quizLinksByKey[getQuizLinkKey(selectedSectionKey, quizLanguage)] ?? '')
    : '';
  const fallbackQuizBaseUrl = selectedSectionKey
    ? getTrainingQuizUrlForSectionLanguage(selectedSectionKey, quizLanguage)
    : '';
  const quizBaseUrl = dbQuizBaseUrl || fallbackQuizBaseUrl;

  const quizUrl = useMemo(() => {
    if (!quizBaseUrl || !selectedSectionKey) {
      return null;
    }

    return buildQuizUrl(quizBaseUrl, selectedSectionKey, openedDocument);
  }, [openedDocument, quizBaseUrl, selectedSectionKey]);

  useEffect(() => {
    if (!webPreviewDocument) {
      return;
    }

    const stillExists = sectionItems.some(
      (item) => item.fileName === webPreviewDocument.fileName,
    );

    if (!stillExists) {
      setWebPreviewDocument(null);
    }
  }, [sectionItems, webPreviewDocument]);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      return;
    }

    if (!webPreviewDocument) {
      setWebPreviewUrl((currentUrl) => {
        if (currentUrl) {
          URL.revokeObjectURL(currentUrl);
        }
        return null;
      });
      setWebPreviewLoading(false);
      return;
    }

    let isActive = true;
    setWebPreviewLoading(true);

    void fetch(webPreviewDocument.fileUrl)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('TRAINING_PREVIEW_FAILED');
        }

        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);

        if (!isActive) {
          URL.revokeObjectURL(objectUrl);
          return;
        }

        setWebPreviewUrl((currentUrl) => {
          if (currentUrl) {
            URL.revokeObjectURL(currentUrl);
          }
          return objectUrl;
        });
      })
      .catch(() => {
        if (isActive) {
          setWebPreviewUrl((currentUrl) => {
            if (currentUrl) {
              URL.revokeObjectURL(currentUrl);
            }
            return null;
          });
        }
      })
      .finally(() => {
        if (isActive) {
          setWebPreviewLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [webPreviewDocument]);

  const quizStatusText = !quizBaseUrl
    ? text.training.quizLinkMissing
    : openedDocument && openedDocument.section === selectedSectionKey
      ? text.training.quizReady
      : text.training.quizDirectAvailable;

  const hasSearchResults = sectionItems.length > 0;
  const isWebPlatform = Platform.OS === 'web';
  const showSidePreview = isWebPlatform && windowWidth >= 1180;
  const previewFrameHeight = showSidePreview
    ? Math.max(360, Math.min(windowHeight - 320, 560))
    : Math.max(300, Math.min(windowHeight * 0.45, 460));

  const videoFrameSize = useMemo(() => {
    const modalCardInnerMaxWidth = Math.min(windowWidth - 56, 736);
    const modalMaxHeight = Math.max(220, windowHeight - 140);
    const widthByHeightLimit = modalMaxHeight * videoAspectRatio;
    const frameWidth = Math.max(
      180,
      Math.min(modalCardInnerMaxWidth, widthByHeightLimit),
    );
    const frameHeight = frameWidth / videoAspectRatio;

    return {
      width: frameWidth,
      height: frameHeight,
    };
  }, [videoAspectRatio, windowHeight, windowWidth]);

  function updateVideoAspectRatioFromEvent(event: unknown) {
    const readyEvent = event as {
      naturalSize?: { width?: number; height?: number };
      nativeEvent?: {
        naturalSize?: { width?: number; height?: number };
        target?: { videoWidth?: number; videoHeight?: number };
      };
      target?: { videoWidth?: number; videoHeight?: number };
    };

    const naturalSize =
      readyEvent.naturalSize ?? readyEvent.nativeEvent?.naturalSize;
    const target = readyEvent.target ?? readyEvent.nativeEvent?.target;
    const width = naturalSize?.width ?? target?.videoWidth ?? 0;
    const height = naturalSize?.height ?? target?.videoHeight ?? 0;

    if (width > 0 && height > 0) {
      setVideoAspectRatio(width / height);
    }
  }

  async function openFullscreenFromPlayer() {
    if (!selectedVideo) {
      return;
    }

    setShouldAutoFullscreen(false);

    try {
      await videoRef.current?.presentFullscreenPlayer();
    } catch {
      // Keep playback in current modal when fullscreen is unavailable.
    }
  }

  function openDocument(item: LibraryFileItem) {
    const documentSection = activeSection ?? (item.section as TrainingSection);

    setOpenedDocument({
      fileName: item.fileName,
      originalName: item.originalName,
      section: documentSection,
    });

    if (isWebPlatform) {
      setWebPreviewDocument(item);
      return;
    }

    void Linking.openURL(item.fileUrl);
  }

  function openQuiz() {
    if (!quizUrl) {
      return;
    }

    void Linking.openURL(quizUrl);
  }

  async function toggleCompletion(fileName: string) {
    const currentlyCompleted = Boolean(completionByFile[fileName]);

    setCompletionByFile((current) => {
      const next = { ...current };
      if (currentlyCompleted) {
        delete next[fileName];
      } else {
        next[fileName] = { completedAt: new Date().toISOString() };
      }
      return next;
    });

    try {
      const saved = await setTrainingItemCompletion(
        currentUser.id,
        fileName,
        !currentlyCompleted,
      );
      setCompletionByFile(saved);
    } catch {
      setCompletionByFile((current) => {
        const next = { ...current };
        if (!currentlyCompleted) {
          delete next[fileName];
        } else {
          next[fileName] = { completedAt: new Date().toISOString() };
        }
        return next;
      });
    }
  }

  return (
    <View style={styles.pageRoot}>
      <ScrollView
        style={styles.pageScroll}
        contentContainerStyle={styles.pageContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={styles.heroCopy}>
              <Text style={styles.title}>{text.training.title}</Text>
              <Text style={styles.subtitle}>{text.training.intro}</Text>
            </View>

            <View style={styles.heroBadgeRow}>
              {activeScenario ? (
                <View style={styles.heroBadge}>
                  <Ionicons name="layers-outline" size={16} color="#ab1e24" />
                  <Text style={styles.heroBadgeText}>
                    {activeScenario.label}
                  </Text>
                </View>
              ) : null}
              {selectedSectionLabel ? (
                <View style={styles.heroBadge}>
                  <Ionicons name="book-outline" size={16} color="#ab1e24" />
                  <Text style={styles.heroBadgeText}>
                    {selectedSectionLabel}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          {availableScenarios.length > 0 ? (
            <View style={styles.heroStatsRow}>
              <View style={styles.heroStatCard}>
                <Text style={styles.heroStatValue}>
                  {selectedSectionDocumentCount}
                </Text>
                <Text style={styles.heroStatLabel}>
                  {text.training.taskTypeDocument}
                </Text>
              </View>
              <View style={styles.heroStatCard}>
                <Text style={styles.heroStatValue}>
                  {selectedSectionVideoCount}
                </Text>
                <Text style={styles.heroStatLabel}>
                  {text.training.taskTypeVideo}
                </Text>
              </View>
              <View style={styles.heroStatCard}>
                <Text style={styles.heroStatValue}>
                  {selectedSectionCompletedCount}
                </Text>
                <Text style={styles.heroStatLabel}>
                  {text.training.completionDone}
                </Text>
              </View>
            </View>
          ) : null}
        </View>

        {libraryError ? <Text style={styles.error}>{libraryError}</Text> : null}

        {!availableScenarios.length ? (
          <View style={styles.emptyStateCard}>
            <Text style={styles.emptyText}>
              {text.training.noAccessConfigured}
            </Text>
          </View>
        ) : (
          <View
            style={[
              styles.trainingLayout,
              windowWidth >= 1120 && styles.trainingLayoutWide,
            ]}
          >
            <View
              style={[
                styles.controlColumn,
                windowWidth >= 1120 && styles.controlColumnWide,
              ]}
            >
              <View style={styles.surfaceCard}>
                <View style={styles.surfaceHeader}>
                  <View style={styles.surfaceHeaderCopy}>
                    <Text style={styles.surfaceEyebrow}>
                      {text.training.scenarioLabel}
                    </Text>
                    <Text style={styles.surfaceTitle}>
                      {activeScenario?.label ?? text.training.title}
                    </Text>
                    <Text style={styles.surfaceSubtitle}>
                      {text.training.workflowHint}
                    </Text>
                  </View>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.pillRow}
                >
                  {availableScenarios.map((scenario) => (
                    <Pressable
                      key={scenario.key}
                      style={[
                        styles.pill,
                        activeScenario?.key === scenario.key &&
                          styles.pillActive,
                      ]}
                      onPress={() => setActiveScenarioKey(scenario.key)}
                    >
                      <Text
                        style={[
                          styles.pillText,
                          activeScenario?.key === scenario.key &&
                            styles.pillTextActive,
                        ]}
                      >
                        {scenario.label}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.surfaceCard}>
                <View style={styles.surfaceHeader}>
                  <View style={styles.surfaceHeaderCopy}>
                    <Text style={styles.surfaceEyebrow}>
                      {text.training.sectionLabel}
                    </Text>
                    <Text style={styles.surfaceTitle}>
                      {selectedSectionLabel || text.training.sectionLabel}
                    </Text>
                    <Text style={styles.surfaceSubtitle}>
                      {text.training.searchPlaceholder}
                    </Text>
                  </View>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.pillRow}
                >
                  {(activeScenario?.sections ?? []).map((section) => (
                    <Pressable
                      key={section}
                      style={[
                        styles.pill,
                        activeSection === section && styles.pillActive,
                      ]}
                      onPress={() => setActiveSection(section)}
                    >
                      <Text
                        style={[
                          styles.pillText,
                          activeSection === section && styles.pillTextActive,
                        ]}
                      >
                        {sectionLabelByKey.get(section)}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.quizCard}>
                <View style={styles.quizHeaderRow}>
                  <View style={styles.quizHeaderCopy}>
                    <Text style={styles.quizTitle}>
                      {text.training.workflowTitle}
                    </Text>
                    <Text style={styles.quizHint}>
                      {text.training.workflowHint}
                    </Text>
                  </View>

                  <Pressable
                    style={[
                      styles.quizActionButton,
                      !quizUrl && styles.quizActionButtonDisabled,
                    ]}
                    onPress={openQuiz}
                    disabled={!quizUrl}
                  >
                    <Text style={styles.quizActionButtonText}>
                      {text.training.quizButton}
                    </Text>
                  </Pressable>
                </View>

                <View style={styles.quizLanguageRow}>
                  <Text style={styles.quizLanguageLabel}>
                    {text.training.quizLanguageLabel}
                  </Text>
                  <View style={styles.quizLanguageChipRow}>
                    {(['fr', 'bn'] as TrainingQuizLinkLanguage[]).map(
                      (languageValue) => (
                        <Pressable
                          key={`quiz-language-${languageValue}`}
                          style={[
                            styles.quizLanguageChip,
                            quizLanguage === languageValue &&
                              styles.quizLanguageChipActive,
                          ]}
                          onPress={() => setQuizLanguage(languageValue)}
                        >
                          <Text
                            style={[
                              styles.quizLanguageChipText,
                              quizLanguage === languageValue &&
                                styles.quizLanguageChipTextActive,
                            ]}
                          >
                            {languageValue === 'fr'
                              ? text.training.quizLanguageFr
                              : text.training.quizLanguageBn}
                          </Text>
                        </Pressable>
                      ),
                    )}
                  </View>
                </View>

                <Text style={styles.quizStatusText}>{quizStatusText}</Text>
              </View>
            </View>

            <View
              style={[
                styles.resourceColumn,
                windowWidth >= 1120 && styles.resourceColumnWide,
              ]}
            >
              <View style={styles.surfaceCard}>
                <View style={styles.surfaceHeader}>
                  <View style={styles.surfaceHeaderCopy}>
                    <Text style={styles.surfaceEyebrow}>
                      {selectedSectionLabel}
                    </Text>
                    <Text style={styles.surfaceTitle}>
                      {selectedSectionLabel}
                    </Text>
                    <Text style={styles.surfaceSubtitle}>
                      {text.training.previewHint}
                    </Text>
                  </View>
                  <View style={styles.surfaceCountPill}>
                    <Text style={styles.surfaceCountText}>
                      {sectionItems.length}
                    </Text>
                  </View>
                </View>

                <View style={styles.searchWrap}>
                  <View style={styles.searchShell}>
                    <Ionicons name="search-outline" size={18} color="#8d5a5f" />
                    <TextInput
                      style={styles.searchInput}
                      value={searchKeyword}
                      onChangeText={setSearchKeyword}
                      placeholder={text.training.searchPlaceholder}
                      placeholderTextColor="#a98a8d"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                <View
                  style={[
                    styles.contentSplit,
                    showSidePreview && styles.contentSplitWide,
                  ]}
                >
                  <View
                    style={[
                      styles.taskListWrap,
                      showSidePreview && styles.taskListWrapWide,
                    ]}
                  >
                    <Text style={styles.taskListTitle}>
                      {selectedSectionLabel}
                    </Text>

                    {!hasSearchResults ? (
                      <View style={styles.emptyStateCardInner}>
                        <Text style={styles.emptyText}>
                          {isLoadingLibrary
                            ? text.training.loadingLibrary
                            : searchKeyword.trim().length > 0
                              ? text.training.searchEmpty
                              : text.training.noDocuments}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.taskList}>
                        {sectionItems.map((item) => {
                          const isDocument = item.mediaType === 'document';
                          const isCompleted = Boolean(
                            completionByFile[item.fileName],
                          );
                          const isActiveTask =
                            openedDocument?.fileName === item.fileName ||
                            webPreviewDocument?.fileName === item.fileName;

                          return (
                            <View
                              key={item.fileName}
                              style={[
                                styles.taskCard,
                                isActiveTask && styles.taskCardActive,
                              ]}
                            >
                              <View style={styles.taskCardHeader}>
                                <View style={styles.taskCardIconWrap}>
                                  <Ionicons
                                    name={getTrainingItemIcon(item)}
                                    size={18}
                                    color="#ab1e24"
                                  />
                                </View>

                                <View style={styles.taskCardCopy}>
                                  <Text style={styles.taskCardTitle}>
                                    {item.originalName}
                                  </Text>
                                  <Text style={styles.taskMeta}>
                                    {`${formatDateLabel(item.uploadedAt)} · ${formatFileSize(
                                      item.size,
                                    )}`}
                                  </Text>
                                </View>

                                <View style={styles.taskBadgeColumn}>
                                  <View style={styles.taskTypeBadge}>
                                    <Text style={styles.taskTypeBadgeText}>
                                      {isDocument
                                        ? text.training.taskTypeDocument
                                        : text.training.taskTypeVideo}
                                    </Text>
                                  </View>
                                  <View
                                    style={[
                                      styles.taskStatusBadge,
                                      isCompleted && styles.taskStatusBadgeDone,
                                    ]}
                                  >
                                    <Text
                                      style={[
                                        styles.taskStatusText,
                                        isCompleted &&
                                          styles.taskStatusTextDone,
                                      ]}
                                    >
                                      {isCompleted
                                        ? text.training.completionDone
                                        : text.training.completionTodo}
                                    </Text>
                                  </View>
                                </View>
                              </View>

                              <View style={styles.taskActionsRow}>
                                {isDocument ? (
                                  <Pressable
                                    style={styles.taskActionButton}
                                    onPress={() => openDocument(item)}
                                  >
                                    <Text style={styles.taskActionButtonText}>
                                      {isWebPlatform
                                        ? text.training.previewButton
                                        : text.training.openPdfButton}
                                    </Text>
                                  </Pressable>
                                ) : (
                                  <Pressable
                                    style={styles.taskActionButton}
                                    onPress={() => {
                                      setSelectedVideo(item);
                                      setShouldAutoFullscreen(true);
                                    }}
                                  >
                                    <Text style={styles.taskActionButtonText}>
                                      {text.training.playVideoButton}
                                    </Text>
                                  </Pressable>
                                )}

                                <Pressable
                                  style={[
                                    styles.taskActionButton,
                                    styles.taskCompletionButton,
                                    isCompleted &&
                                      styles.taskCompletionButtonDone,
                                  ]}
                                  onPress={() => {
                                    void toggleCompletion(item.fileName);
                                  }}
                                >
                                  <Text
                                    style={[
                                      styles.taskActionButtonText,
                                      isCompleted &&
                                        styles.taskCompletionButtonTextDone,
                                    ]}
                                  >
                                    {isCompleted
                                      ? text.training.markUndone
                                      : text.training.markDone}
                                  </Text>
                                </Pressable>
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </View>

                  {isWebPlatform ? (
                    <View
                      style={[
                        styles.previewWrap,
                        showSidePreview
                          ? styles.previewWrapSide
                          : styles.previewWrapBelow,
                      ]}
                    >
                      <View style={styles.previewHeader}>
                        <View style={styles.previewHeaderCopy}>
                          <Text style={styles.previewTitle}>
                            {webPreviewDocument?.originalName ??
                              text.training.previewTitle}
                          </Text>
                          <Text style={styles.previewHint}>
                            {text.training.webPreviewHint}
                          </Text>
                        </View>
                        {webPreviewDocument ? (
                          <View style={styles.previewControlsRow}>
                            <Pressable
                              style={styles.previewControlButton}
                              onPress={() => setIsWebPreviewFullscreen(true)}
                            >
                              <Text style={styles.previewControlButtonText}>
                                {text.training.previewFullscreen}
                              </Text>
                            </Pressable>
                          </View>
                        ) : null}
                      </View>

                      <View
                        style={[
                          styles.previewFrameShell,
                          { height: previewFrameHeight },
                        ]}
                      >
                        {webPreviewDocument ? (
                          webPreviewUrl ? (
                            <WebPdfFrame
                              src={buildWebPreviewUrl(webPreviewUrl)}
                              title={webPreviewDocument.originalName}
                            />
                          ) : webPreviewLoading ? (
                            <View style={styles.previewEmptyWrap}>
                              <Text style={styles.previewEmptyText}>
                                {text.training.loadingLibrary}
                              </Text>
                            </View>
                          ) : (
                            <View style={styles.previewEmptyWrap}>
                              <Text style={styles.previewEmptyText}>
                                {text.training.previewEmpty}
                              </Text>
                            </View>
                          )
                        ) : (
                          <View style={styles.previewEmptyWrap}>
                            <Text style={styles.previewEmptyText}>
                              {text.training.previewEmpty}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {isWebPlatform ? (
        <Modal
          visible={isWebPreviewFullscreen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsWebPreviewFullscreen(false)}
        >
          <View style={styles.previewFullscreenBackdrop}>
            <View style={styles.previewFullscreenCard}>
              <View style={styles.previewFullscreenHeader}>
                <Text style={styles.previewFullscreenTitle} numberOfLines={1}>
                  {webPreviewDocument?.originalName ??
                    text.training.previewTitle}
                </Text>
                <Pressable
                  style={styles.previewControlButton}
                  onPress={() => setIsWebPreviewFullscreen(false)}
                >
                  <Text style={styles.previewControlButtonText}>X</Text>
                </Pressable>
              </View>
              <View style={styles.previewFullscreenFrameShell}>
                {webPreviewDocument && webPreviewUrl ? (
                  <WebPdfFrame
                    src={buildWebPreviewUrl(webPreviewUrl)}
                    title={webPreviewDocument.originalName}
                  />
                ) : webPreviewLoading ? (
                  <View style={styles.previewEmptyWrap}>
                    <Text style={styles.previewEmptyText}>
                      {text.training.loadingLibrary}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>
        </Modal>
      ) : null}

      <Modal
        visible={Boolean(selectedVideo)}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedVideo(null)}
      >
        <View style={styles.videoModalBackdrop}>
          <View style={styles.videoModalCard}>
            <View style={styles.videoModalHeader}>
              <Text style={styles.videoModalTitle} numberOfLines={2}>
                {selectedVideo?.originalName ?? text.training.videosTitle}
              </Text>
              <Pressable
                style={styles.videoModalCloseButton}
                onPress={() => setSelectedVideo(null)}
                accessibilityRole="button"
                accessibilityLabel={text.dashboard.levelModalClose}
              >
                <Text style={styles.videoModalCloseText}>X</Text>
              </Pressable>
            </View>

            {selectedVideo ? (
              <View
                style={[
                  styles.videoPlayerShell,
                  {
                    width: videoFrameSize.width,
                    height: videoFrameSize.height,
                  },
                ]}
              >
                <Video
                  key={selectedVideo.fileUrl}
                  ref={videoRef}
                  style={styles.videoPlayer}
                  source={{ uri: selectedVideo.fileUrl }}
                  useNativeControls
                  resizeMode={ResizeMode.CONTAIN}
                  shouldPlay
                  onLoad={(event) => {
                    updateVideoAspectRatioFromEvent(event);
                    if (shouldAutoFullscreen) {
                      void openFullscreenFromPlayer();
                    }
                  }}
                  onReadyForDisplay={(event) => {
                    updateVideoAspectRatioFromEvent(event);
                    if (shouldAutoFullscreen) {
                      void openFullscreenFromPlayer();
                    }
                  }}
                  onFullscreenUpdate={(event) => {
                    if (
                      event.fullscreenUpdate ===
                      VideoFullscreenUpdate.PLAYER_DID_DISMISS
                    ) {
                      setSelectedVideo(null);
                    }
                  }}
                />
              </View>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}
