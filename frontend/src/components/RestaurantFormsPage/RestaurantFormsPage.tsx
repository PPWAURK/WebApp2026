import { useEffect, useMemo, useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import {
  getSectionsByModule,
  type LibrarySection,
} from '../../constants/documentTaxonomy';
import type { AppText } from '../../locales/translations';
import {
  fetchLibraryFiles,
  type LibraryFileItem,
} from '../../services/uploadsApi';
import type { TrainingSection, User } from '../../types/auth';
import { styles } from './RestaurantFormsPage.styles';

type RestaurantFormsPageProps = {
  text: AppText;
  accessToken: string;
  currentUser: User;
};

export function RestaurantFormsPage({
  text,
  accessToken,
  currentUser,
}: RestaurantFormsPageProps) {
  const [items, setItems] = useState<LibraryFileItem[]>([]);
  const [activeSection, setActiveSection] = useState<LibrarySection | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sectionOptions = useMemo(
    () => getSectionsByModule(text).FORMS,
    [text],
  );

  const visibleSectionOptions = useMemo(
    () =>
      sectionOptions.filter((sectionOption) =>
        currentUser.trainingAccess.includes(sectionOption.key as TrainingSection),
      ),
    [currentUser.trainingAccess, sectionOptions],
  );

  useEffect(() => {
    if (!visibleSectionOptions.length) {
      setActiveSection(null);
      return;
    }

    setActiveSection((current) =>
      current && visibleSectionOptions.some((entry) => entry.key === current)
        ? current
        : (visibleSectionOptions[0]?.key ?? null),
    );
  }, [visibleSectionOptions]);

  useEffect(() => {
    let isActive = true;
    setIsLoading(true);
    setError(null);

    void fetchLibraryFiles(accessToken, { module: 'FORMS' })
      .then((result) => {
        if (isActive) {
          setItems(result);
        }
      })
      .catch(() => {
        if (isActive) {
          setItems([]);
          setError(text.forms.loadError);
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
  }, [accessToken, text.forms.loadError]);

  const visibleItems = useMemo(() => {
    if (!activeSection) {
      return [];
    }

    return items
      .filter((item) => item.section === activeSection)
      .sort(
        (left, right) =>
          new Date(right.uploadedAt).getTime() - new Date(left.uploadedAt).getTime(),
      );
  }, [activeSection, items]);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{text.forms.title}</Text>
      <Text style={styles.subtitle}>{text.forms.intro}</Text>

      <Text style={styles.sectionLabel}>{text.forms.sectionLabel}</Text>
      <View style={styles.tabRow}>
        {visibleSectionOptions.map((sectionOption) => (
          <Pressable
            key={sectionOption.key}
            style={[
              styles.tab,
              activeSection === sectionOption.key && styles.tabActive,
            ]}
            onPress={() => setActiveSection(sectionOption.key)}
          >
            <Text
              style={[
                styles.tabText,
                activeSection === sectionOption.key && styles.tabTextActive,
              ]}
            >
              {sectionOption.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {!visibleSectionOptions.length ? (
        <Text style={styles.emptyText}>{text.forms.noAccess}</Text>
      ) : null}

      {visibleSectionOptions.length ? (
        <View style={styles.listBlock}>
          {isLoading ? (
            <Text style={styles.emptyText}>{text.forms.loadingLibrary}</Text>
          ) : visibleItems.length === 0 ? (
            <Text style={styles.emptyText}>{text.forms.noDocuments}</Text>
          ) : (
            visibleItems.map((item) => (
              <View key={item.fileName} style={styles.fileCard}>
                <Text style={styles.fileName}>{item.originalName}</Text>
                <Text style={styles.fileMeta}>
                  {new Date(item.uploadedAt).toLocaleDateString()}
                </Text>
                <Pressable
                  style={styles.openButton}
                  onPress={() => {
                    void Linking.openURL(item.fileUrl);
                  }}
                >
                  <Text style={styles.openButtonText}>{text.forms.openFileButton}</Text>
                </Pressable>
              </View>
            ))
          )}
        </View>
      ) : null}
    </View>
  );
}
