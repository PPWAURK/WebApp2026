import { useEffect, useMemo, useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
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

export function RestaurantFormsPage({
  text,
  accessToken,
  currentUser,
}: RestaurantFormsPageProps) {
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

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{text.forms.title}</Text>
      <Text style={styles.subtitle}>{text.forms.intro}</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

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
    </View>
  );
}
