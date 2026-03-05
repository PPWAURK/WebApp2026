import { useEffect, useMemo, useState } from 'react';
import { ResizeMode, Video } from 'expo-av';
import { Linking, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import {
  getSectionsByModule,
  type LibraryModule,
  type LibrarySection,
} from '../../constants/documentTaxonomy';
import type { AppText } from '../../locales/translations';
import {
  fetchLibraryFiles,
  type LibraryFileItem,
} from '../../services/uploadsApi';
import { styles } from './TrainingPage.styles';
import type { User } from '../../types/auth';

type TrainingPageProps = {
  text: AppText;
  accessToken: string;
  currentUser: User;
};

type TrainingTab = 'dishTraining' | 'companyPolicy' | 'managementTools';

export function TrainingPage({
  text,
  accessToken,
  currentUser,
}: TrainingPageProps) {
  const [activeTab, setActiveTab] = useState<TrainingTab>('dishTraining');
  const [activeSection, setActiveSection] = useState<LibrarySection>('RECIPE');
  const [libraryItems, setLibraryItems] = useState<LibraryFileItem[]>([]);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);
  const [libraryError, setLibraryError] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<LibraryFileItem | null>(
    null,
  );

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
  }, [activeModule, activeSection]);

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

  const visibleSectionOptions = sectionOptions.filter((sectionOption) =>
    userTrainingAccess.includes(sectionOption.key as LibrarySection),
  );

  const selectedSection =
    visibleSectionOptions.find(
      (sectionOption) => sectionOption.key === activeSection,
    ) ?? visibleSectionOptions[0];

  const sectionKeyForItems = selectedSection?.key ?? activeSection;

  const docs = libraryItems.filter(
    (item) =>
      item.section === sectionKeyForItems && item.mediaType === 'document',
  );

  const videos = libraryItems.filter(
    (item) => item.section === sectionKeyForItems && item.mediaType === 'video',
  );

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

          <Text style={styles.docItemMeta}>{text.training.documentsTitle}</Text>
          {docs.length === 0 ? (
            <Text style={styles.docEmpty}>
              {isLoadingLibrary
                ? text.training.loadingLibrary
                : text.training.noDocuments}
            </Text>
          ) : (
            docs.map((item) => (
              <Pressable
                key={`${item.fileName}-doc`}
                style={styles.docItem}
                onPress={() => {
                  void Linking.openURL(item.fileUrl);
                }}
              >
                <Text style={styles.docItemTitle}>{item.originalName}</Text>
              </Pressable>
            ))
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
                  onPress={() => setSelectedVideo(item)}
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
              <Video
                key={selectedVideo.fileUrl}
                style={styles.videoPlayer}
                source={{ uri: selectedVideo.fileUrl }}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay
              />
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}
