import { useEffect, useMemo, useRef, useState } from 'react';
import { ResizeMode, Video, VideoFullscreenUpdate } from 'expo-av';
import {
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  getTrainingQuizUrlForSectionLanguage,
  type TrainingQuizLinkLanguage,
} from '../../constants/config';
import {
  getSectionsByModule,
  type LibraryModule,
  type LibrarySection,
} from '../../constants/documentTaxonomy';
import type { AppText } from '../../locales/translations';
import { fetchTrainingQuizLinks } from '../../services/usersApi';
import {
  fetchLibraryFiles,
  type LibraryFileItem,
} from '../../services/uploadsApi';
import { styles } from './TrainingPage.styles';
import type { User } from '../../types/auth';
import type { Language } from '../../types/language';

type TrainingPageProps = {
  text: AppText;
  accessToken: string;
  currentUser: User;
  language: Language;
};

type TrainingTab = 'dishTraining' | 'companyPolicy' | 'managementTools';

type OpenedDocumentState = {
  fileName: string;
  originalName: string;
  section: LibrarySection;
};

function appendQuizContextToUrl(
  baseUrl: string,
  context: OpenedDocumentState,
): string {
  const params = new URLSearchParams({
    section: context.section,
    document: context.originalName,
  });

  const joinWith = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${joinWith}${params.toString()}`;
}

function getQuizLinkKey(
  section: LibrarySection,
  language: TrainingQuizLinkLanguage,
) {
  return `${section}:${language}`;
}

export function TrainingPage({
  text,
  accessToken,
  currentUser,
  language,
}: TrainingPageProps) {
  const [activeTab, setActiveTab] = useState<TrainingTab>('dishTraining');
  const [activeSection, setActiveSection] = useState<LibrarySection>('RECIPE');
  const [libraryItems, setLibraryItems] = useState<LibraryFileItem[]>([]);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);
  const [libraryError, setLibraryError] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<LibraryFileItem | null>(
    null,
  );
  const [openedDocument, setOpenedDocument] =
    useState<OpenedDocumentState | null>(null);
  const [quizLinksByKey, setQuizLinksByKey] = useState<Record<string, string>>(
    {},
  );
  const [shouldAutoFullscreen, setShouldAutoFullscreen] = useState(false);
  const [videoAspectRatio, setVideoAspectRatio] = useState(16 / 9);
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const videoRef = useRef<Video | null>(null);

  const tabs: Array<{ key: TrainingTab; label: string }> = [
    { key: 'dishTraining', label: text.training.tabs.dishTraining },
    { key: 'companyPolicy', label: text.training.tabs.companyPolicy },
    { key: 'managementTools', label: text.training.tabs.managementTools },
  ];

  const activeModule: LibraryModule =
    activeTab === 'dishTraining'
      ? 'TRAINING'
      : activeTab === 'companyPolicy'
        ? 'POLICY'
        : 'MANAGEMENT';

  const userTrainingAccess = currentUser.trainingAccess ?? [];
  const sectionsByModule = useMemo(() => getSectionsByModule(text), [text]);

  const sectionOptions = useMemo(
    () => sectionsByModule[activeModule],
    [activeModule, sectionsByModule],
  );

  const allowedTabs = useMemo(
    () =>
      tabs.filter((tab) => {
        const module: LibraryModule =
          tab.key === 'dishTraining'
            ? 'TRAINING'
            : tab.key === 'companyPolicy'
              ? 'POLICY'
              : 'MANAGEMENT';
        return sectionsByModule[module].some((section) =>
          userTrainingAccess.includes(section.key as LibrarySection),
        );
      }),
    [sectionsByModule, tabs, userTrainingAccess],
  );

  useEffect(() => {
    if (!allowedTabs.some((tab) => tab.key === activeTab)) {
      const fallbackTab = allowedTabs[0];
      if (fallbackTab) {
        setActiveTab(fallbackTab.key);
      }
    }
  }, [activeTab, allowedTabs]);

  useEffect(() => {
    const firstSection = sectionOptions.find((sectionOption) =>
      userTrainingAccess.includes(sectionOption.key as LibrarySection),
    );
    if (firstSection) {
      setActiveSection(firstSection.key as LibrarySection);
    }
  }, [sectionOptions, userTrainingAccess]);

  useEffect(() => {
    setSelectedVideo(null);
    setOpenedDocument(null);
    setShouldAutoFullscreen(false);
  }, [activeModule, activeSection]);

  useEffect(() => {
    setVideoAspectRatio(16 / 9);
  }, [selectedVideo?.fileUrl]);

  useEffect(() => {
    let isActive = true;
    setIsLoadingLibrary(true);
    setLibraryError(null);

    void fetchLibraryFiles(accessToken, { module: activeModule })
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
  }, [accessToken, activeModule, text.training.loadError]);

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

  const visibleSectionOptions = sectionOptions.filter((sectionOption) =>
    userTrainingAccess.includes(sectionOption.key as LibrarySection),
  );

  const selectedSection =
    visibleSectionOptions.find(
      (sectionOption) => sectionOption.key === activeSection,
    ) ?? visibleSectionOptions[0];
  const selectedSectionKey = selectedSection?.key;
  const quizLanguage: TrainingQuizLinkLanguage =
    language === 'fr' ? 'fr' : 'bn';
  const dbQuizBaseUrl = selectedSectionKey
    ? quizLinksByKey[getQuizLinkKey(selectedSectionKey, quizLanguage)] ?? ''
    : '';
  const fallbackQuizBaseUrl = selectedSectionKey
    ? getTrainingQuizUrlForSectionLanguage(selectedSectionKey, quizLanguage)
    : '';
  const quizBaseUrl = dbQuizBaseUrl || fallbackQuizBaseUrl;

  const sectionKeyForItems = selectedSection?.key ?? activeSection;

  const docs = libraryItems.filter(
    (item) =>
      item.section === sectionKeyForItems && item.mediaType === 'document',
  );

  const videos = libraryItems.filter(
    (item) => item.section === sectionKeyForItems && item.mediaType === 'video',
  );

  useEffect(() => {
    if (!openedDocument) {
      return;
    }

    const isDocumentStillVisible = docs.some(
      (item) => item.fileName === openedDocument.fileName,
    );

    if (!isDocumentStillVisible) {
      setOpenedDocument(null);
    }
  }, [docs, openedDocument]);

  const quizUrl = useMemo(() => {
    if (!quizBaseUrl || !openedDocument) {
      return null;
    }

    return appendQuizContextToUrl(quizBaseUrl, openedDocument);
  }, [openedDocument, quizBaseUrl]);

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

  async function openFullscreenFromPlayer() {
    if (!selectedVideo) {
      return;
    }

    setShouldAutoFullscreen(false);

    try {
      await videoRef.current?.presentFullscreenPlayer();
    } catch {
      // Keep playback in the current modal when fullscreen is unavailable.
    }
  }

  function openDocumentFile(item: LibraryFileItem) {
    setOpenedDocument({
      fileName: item.fileName,
      originalName: item.originalName,
      section: item.section,
    });
    void Linking.openURL(item.fileUrl);
  }

  function openQuiz() {
    if (!quizUrl) {
      return;
    }

    void Linking.openURL(quizUrl);
  }

  const quizStatusText = !quizBaseUrl
    ? text.training.quizLinkMissing
    : openedDocument
      ? text.training.quizReady
      : text.training.quizLocked;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{text.training.title}</Text>
      <Text style={styles.subtitle}>{text.training.intro}</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.trainingTabRow}
      >
        {allowedTabs.map((tab) => (
          <Pressable
            key={tab.key}
            style={[
              styles.trainingTab,
              activeTab === tab.key && styles.trainingTabActive,
            ]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text
              style={[
                styles.trainingTabText,
                activeTab === tab.key && styles.trainingTabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.trainingTabRow}
      >
        {visibleSectionOptions.map((sectionOption) => (
          <Pressable
            key={sectionOption.key}
            style={[
              styles.trainingTab,
              activeSection === sectionOption.key && styles.trainingTabActive,
            ]}
            onPress={() =>
              setActiveSection(sectionOption.key as LibrarySection)
            }
          >
            <Text
              style={[
                styles.trainingTabText,
                activeSection === sectionOption.key &&
                  styles.trainingTabTextActive,
              ]}
            >
              {sectionOption.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {libraryError ? <Text style={styles.error}>{libraryError}</Text> : null}

      {allowedTabs.length === 0 ? (
        <Text style={styles.docEmpty}>{text.training.noAccessConfigured}</Text>
      ) : null}

      {selectedSection ? (
        <View style={styles.docBlock}>
          <Text style={styles.docBlockTitle}>{selectedSection.label}</Text>

          <View style={styles.workflowCard}>
            <Text style={styles.workflowTitle}>{text.training.workflowTitle}</Text>
            <Text style={styles.workflowHint}>{text.training.workflowHint}</Text>

            <View style={styles.workflowStepRow}>
              <View
                style={[
                  styles.workflowStepBadge,
                  openedDocument && styles.workflowStepBadgeDone,
                ]}
              >
                <Text
                  style={[
                    styles.workflowStepBadgeText,
                    openedDocument && styles.workflowStepBadgeTextDone,
                  ]}
                >
                  1
                </Text>
              </View>
              <Text style={styles.workflowStepText}>{text.training.workflowStepRead}</Text>
            </View>

            <View style={styles.workflowStepRow}>
              <View
                style={[
                  styles.workflowStepBadge,
                  quizUrl && styles.workflowStepBadgeDone,
                ]}
              >
                <Text
                  style={[
                    styles.workflowStepBadgeText,
                    quizUrl && styles.workflowStepBadgeTextDone,
                  ]}
                >
                  2
                </Text>
              </View>
              <Text style={styles.workflowStepText}>{text.training.workflowStepQuiz}</Text>
            </View>

            <Pressable
              style={[
                styles.quizActionButton,
                !quizUrl && styles.quizActionButtonDisabled,
              ]}
              onPress={openQuiz}
              disabled={!quizUrl}
            >
              <Text style={styles.quizActionButtonText}>{text.training.quizButton}</Text>
            </Pressable>

            <Text style={styles.workflowStatusText}>{quizStatusText}</Text>
          </View>

          <Text style={styles.docItemMeta}>{text.training.documentsTitle}</Text>
          {docs.length === 0 ? (
            <Text style={styles.docEmpty}>
              {isLoadingLibrary
                ? text.training.loadingLibrary
                : text.training.noDocuments}
            </Text>
          ) : (
            docs.map((item) => {
              const isOpened =
                openedDocument?.fileName === item.fileName &&
                openedDocument.section === item.section;

              return (
                <View
                  key={`${item.fileName}-doc`}
                  style={[styles.docItem, isOpened && styles.docItemActive]}
                >
                  <Text style={styles.docItemTitle}>{item.originalName}</Text>
                  <Text style={styles.docItemMeta}>
                    {new Date(item.uploadedAt).toLocaleDateString()}
                  </Text>
                  <Pressable
                    style={styles.docActionButton}
                    onPress={() => openDocumentFile(item)}
                  >
                    <Text style={styles.docActionButtonText}>
                      {text.training.openPdfButton}
                    </Text>
                  </Pressable>
                </View>
              );
            })
          )}

          <Text style={styles.docItemMeta}>{text.training.videosTitle}</Text>
          {videos.length === 0 ? (
            <Text style={styles.docEmpty}>
              {isLoadingLibrary
                ? text.training.loadingLibrary
                : text.training.noVideos}
            </Text>
          ) : (
            <View style={styles.videoSelectorGrid}>
              {videos.map((item) => (
                <Pressable
                  key={`${item.fileName}-video`}
                  style={styles.videoSelectorCard}
                  onPress={() => {
                    setSelectedVideo(item);
                    setShouldAutoFullscreen(true);
                  }}
                >
                  <Text style={styles.videoSelectorCardTitle} numberOfLines={2}>
                    {item.originalName}
                  </Text>
                  <Text style={styles.videoSelectorCardMeta}>
                    {new Date(item.uploadedAt).toLocaleDateString()}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
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
                  { width: videoFrameSize.width, height: videoFrameSize.height },
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
