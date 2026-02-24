import { useEffect, useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import {
  sectionsByModule,
  type LibraryModule,
} from '../constants/documentTaxonomy';
import type { AppText } from '../locales/translations';
import { fetchLibraryFiles, type LibraryFileItem } from '../services/uploadsApi';
import { styles } from '../styles/appStyles';

type TrainingPageProps = {
  text: AppText;
  accessToken: string;
};

type TrainingTab = 'dishTraining' | 'companyPolicy' | 'managementTools';

export function TrainingPage({ text, accessToken }: TrainingPageProps) {
  const [activeTab, setActiveTab] = useState<TrainingTab>('dishTraining');
  const [libraryItems, setLibraryItems] = useState<LibraryFileItem[]>([]);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);
  const [libraryError, setLibraryError] = useState<string | null>(null);
  const tabs: Array<{ key: TrainingTab; label: string }> = [
    { key: 'dishTraining', label: text.training.tabs.dishTraining },
    { key: 'companyPolicy', label: text.training.tabs.companyPolicy },
    { key: 'managementTools', label: text.training.tabs.managementTools },
  ];
  const section = text.training.sections[activeTab];
  const activeModule: LibraryModule =
    activeTab === 'dishTraining'
      ? 'TRAINING'
      : activeTab === 'companyPolicy'
        ? 'POLICY'
        : 'MANAGEMENT';

  const sectionOptions = useMemo(
    () => sectionsByModule[activeModule],
    [activeModule],
  );

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

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{text.training.title}</Text>
      <Text style={styles.subtitle}>{text.training.intro}</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.trainingTabRow}
      >
        {tabs.map((tab) => (
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

      <Text style={styles.sectionTitle}>{section.title}</Text>
      <Text style={styles.subtitle}>{section.intro}</Text>

      <View style={styles.listBlock}>
        <Text style={styles.listItem}>- {section.item1}</Text>
        <Text style={styles.listItem}>- {section.item2}</Text>
        <Text style={styles.listItem}>- {section.item3}</Text>
        <Text style={styles.listItem}>- {section.item4}</Text>
      </View>

      {libraryError ? <Text style={styles.error}>{libraryError}</Text> : null}

      {sectionOptions.map((sectionOption) => {
        const docs = libraryItems.filter(
          (item) => item.section === sectionOption.key && item.mediaType === 'document',
        );
        const videos = libraryItems.filter(
          (item) => item.section === sectionOption.key && item.mediaType === 'video',
        );

        return (
          <View key={sectionOption.key} style={styles.docBlock}>
            <Text style={styles.docBlockTitle}>{sectionOption.label}</Text>

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
        );
      })}
    </View>
  );
}
