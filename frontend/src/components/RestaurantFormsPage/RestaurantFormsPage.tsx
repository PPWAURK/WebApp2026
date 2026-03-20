import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import type { AppText } from '../../locales/translations';
import {
  fetchLibraryFiles,
  type LibraryFileItem,
} from '../../services/uploadsApi';
import type { User } from '../../types/auth';
import { styles } from './RestaurantFormsPage.styles';

type RestaurantFormsPageProps = {
  text: AppText;
  accessToken: string;
  currentUser: User;
};

function formatFileSize(size: number): string {
  if (!Number.isFinite(size) || size <= 0) {
    return '0 KB';
  }

  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(size / 1024))} KB`;
}

function getFileExtensionLabel(fileName: string): string {
  const extension = fileName.split('.').pop()?.trim().toUpperCase();
  return extension && extension.length <= 6 ? extension : 'FILE';
}

function getFileIconName(item: LibraryFileItem): keyof typeof Ionicons.glyphMap {
  if (item.mediaType === 'image') {
    return 'image-outline';
  }

  if (item.mediaType === 'video') {
    return 'videocam-outline';
  }

  return 'document-text-outline';
}

export function RestaurantFormsPage({
  text,
  accessToken,
  currentUser,
}: RestaurantFormsPageProps) {
  const { width } = useWindowDimensions();
  const useTwoColumnGrid = width >= 1080;
  const [items, setItems] = useState<LibraryFileItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    return items
      .sort(
        (left, right) =>
          new Date(right.uploadedAt).getTime() - new Date(left.uploadedAt).getTime(),
      );
  }, [items]);

  const latestUploadedLabel = visibleItems[0]
    ? new Date(visibleItems[0].uploadedAt).toLocaleDateString()
    : null;
  const restaurantLabel = currentUser.restaurant?.name?.trim() || null;
  const quickGuideItems = [
    text.forms.item1,
    text.forms.item2,
    text.forms.item3,
    text.forms.item4,
  ].filter((item) => item.trim().length > 0);

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
              <Text style={styles.title}>{text.forms.title}</Text>
              <Text style={styles.subtitle}>{text.forms.intro}</Text>
            </View>

            <View style={styles.heroMetaColumn}>
              {restaurantLabel ? (
                <View style={styles.heroPill}>
                  <Ionicons name="business-outline" size={16} color="#ab1e24" />
                  <Text style={styles.heroPillText} numberOfLines={1}>
                    {restaurantLabel}
                  </Text>
                </View>
              ) : null}
              {latestUploadedLabel ? (
                <View style={styles.heroPill}>
                  <Ionicons name="calendar-outline" size={16} color="#ab1e24" />
                  <Text style={styles.heroPillText}>{latestUploadedLabel}</Text>
                </View>
              ) : null}
            </View>
          </View>

          <View style={styles.quickGuideGrid}>
            {quickGuideItems.map((item, index) => (
              <View key={item} style={styles.quickGuideCard}>
                <Text style={styles.quickGuideIndex}>
                  {String(index + 1).padStart(2, '0')}
                </Text>
                <Text style={styles.quickGuideText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.surfaceCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderCopy}>
              <Text style={styles.sectionEyebrow}>{text.forms.sectionLabel}</Text>
              <Text style={styles.sectionTitle}>{text.forms.title}</Text>
            </View>
            <View style={styles.sectionCounter}>
              <Text style={styles.sectionCounterValue}>{visibleItems.length}</Text>
            </View>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={[styles.listBlock, styles.fileGrid]}>
            {isLoading ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>{text.forms.loadingLibrary}</Text>
              </View>
            ) : visibleItems.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>{text.forms.noDocuments}</Text>
              </View>
            ) : (
              visibleItems.map((item) => (
                <View
                  key={item.fileName}
                  style={[
                    styles.fileCard,
                    useTwoColumnGrid && styles.fileCardWide,
                  ]}
                >
                  <View style={styles.fileCardTopRow}>
                    <View style={styles.fileIconWrap}>
                      <Ionicons
                        name={getFileIconName(item)}
                        size={20}
                        color="#ab1e24"
                      />
                    </View>

                    <View style={styles.fileBadgeRow}>
                      <View style={styles.fileBadge}>
                        <Text style={styles.fileBadgeText}>
                          {getFileExtensionLabel(item.originalName)}
                        </Text>
                      </View>
                      <View style={styles.fileBadge}>
                        <Text style={styles.fileBadgeText}>
                          {formatFileSize(item.size)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.fileBody}>
                    <Text style={styles.fileName} numberOfLines={2}>
                      {item.originalName}
                    </Text>
                    {item.customCategory ? (
                      <Text style={styles.fileCategory} numberOfLines={1}>
                        {item.customCategory}
                      </Text>
                    ) : null}
                    <Text style={styles.fileMeta}>
                      {new Date(item.uploadedAt).toLocaleDateString()}
                    </Text>
                  </View>

                  <Pressable
                    style={styles.openButton}
                    onPress={() => {
                      void Linking.openURL(item.fileUrl);
                    }}
                  >
                    <Text style={styles.openButtonText}>{text.forms.openFileButton}</Text>
                    <Ionicons name="arrow-forward-outline" size={15} color="#ab1e24" />
                  </Pressable>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
