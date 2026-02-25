import { useEffect, useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import {
  sectionsByModule,
  type LibraryModule,
  type LibrarySection,
} from '../constants/documentTaxonomy';
import type { AppText } from '../locales/translations';
import { fetchLibraryFiles, type LibraryFileItem } from '../services/uploadsApi';
import { styles } from '../styles/appStyles';
import type { User } from '../types/auth';

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

  const sectionOptions = useMemo(
    () => sectionsByModule[activeModule],
    [activeModule],
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
    [tabs, userTrainingAccess],
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
    let isActive = true;
    setIsLoadingLibrary(true);
    setLibraryError(null);

    void fetchLibraryFiles(accessToken, { module: activeModule })
      .then((items) => {
        if (isActive) {
          setLibraryItems(items);
        }
      })
      .catch((error) => {
        if (isActive) {
          setLibraryItems([]);
          setLibraryError(error instanceof Error ? error.message : 'Failed to load documents');
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
  }, [accessToken, activeModule]);

  const visibleSectionOptions = sectionOptions.filter((sectionOption) =>
    userTrainingAccess.includes(sectionOption.key as LibrarySection),
  );
  const selectedSection =
    visibleSectionOptions.find((sectionOption) => sectionOption.key === activeSection) ??
    visibleSectionOptions[0];
  const docs = libraryItems.filter(
    (item) => item.section === activeSection && item.mediaType === 'document',
  );
  const videos = libraryItems.filter(
    (item) => item.section === activeSection && item.mediaType === 'video',
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
            onPress={() => setActiveSection(sectionOption.key as LibrarySection)}
          >
            <Text
              style={[
                styles.trainingTabText,
                activeSection === sectionOption.key && styles.trainingTabTextActive,
              ]}
            >
              {sectionOption.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {libraryError ? <Text style={styles.error}>{libraryError}</Text> : null}

      {allowedTabs.length === 0 ? (
        <Text style={styles.docEmpty}>No training access configured for this account.</Text>
      ) : null}

      {selectedSection ? (
        <View style={styles.docBlock}>
          <Text style={styles.docBlockTitle}>{selectedSection.label}</Text>

          <Text style={styles.docItemMeta}>Documents</Text>
          {docs.length === 0 ? (
            <Text style={styles.docEmpty}>
              {isLoadingLibrary ? 'Loading...' : 'No documents yet'}
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
                <Text style={styles.docItemMeta}>{new Date(item.uploadedAt).toLocaleString()}</Text>
                <Text style={styles.docItemLink}>{item.fileUrl}</Text>
              </Pressable>
            ))
          )}

          <Text style={styles.docItemMeta}>Videos</Text>
          {videos.length === 0 ? (
            <Text style={styles.docEmpty}>
              {isLoadingLibrary ? 'Loading...' : 'No videos yet'}
            </Text>
          ) : (
            videos.map((item) => (
              <Pressable
                key={`${item.fileName}-video`}
                style={styles.docItem}
                onPress={() => {
                  void Linking.openURL(item.fileUrl);
                }}
              >
                <Text style={styles.docItemTitle}>{item.originalName}</Text>
                <Text style={styles.docItemMeta}>{new Date(item.uploadedAt).toLocaleString()}</Text>
                <Text style={styles.docItemLink}>{item.fileUrl}</Text>
              </Pressable>
            ))
          )}
        </View>
      ) : null}
    </View>
  );
}
