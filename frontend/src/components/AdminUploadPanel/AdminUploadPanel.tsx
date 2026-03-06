import * as DocumentPicker from 'expo-document-picker';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Linking, Pressable, Text, TextInput, View } from 'react-native';
import {
  getModuleOptions,
  getSectionsByModule,
  type LibraryModule,
  type LibrarySection,
} from '../../constants/documentTaxonomy';
import type { AppText } from '../../locales/translations';
import {
  deleteLibraryFile,
  fetchLibraryFiles,
  type LibraryFileItem,
  uploadSingleFile,
  type UploadedFileResponse,
} from '../../services/uploadsApi';
import { ConfirmDialog } from '../ConfirmDialog';
import { styles } from './AdminUploadPanel.styles';

type AdminUploadPanelProps = {
  accessToken: string;
  text: AppText;
};

const PICKER_TYPES = [
  'image/*',
  'video/*',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
];

function getScopeKey(module: LibraryModule, section: LibrarySection) {
  return `${module}:${section}`;
}

export function AdminUploadPanel({ accessToken, text }: AdminUploadPanelProps) {
  const moduleOptions = getModuleOptions(text);
  const sectionsByModule = getSectionsByModule(text);
  const [selectedModule, setSelectedModule] = useState<LibraryModule>('TRAINING');
  const [selectedSection, setSelectedSection] =
    useState<LibrarySection>('RECIPE_TRAINING');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpload, setLastUpload] = useState<UploadedFileResponse | null>(null);
  const [libraryItems, setLibraryItems] = useState<LibraryFileItem[]>([]);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);
  const [libraryError, setLibraryError] = useState<string | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<number | null>(null);
  const [confirmDialogVisible, setConfirmDialogVisible] = useState(false);
  const [categoryInput, setCategoryInput] = useState('');
  const [selectedCustomCategory, setSelectedCustomCategory] = useState<string | null>(
    null,
  );
  const [customCategoriesByScope, setCustomCategoriesByScope] = useState<
    Record<string, string[]>
  >({});
  const confirmDeleteResolverRef = useRef<((value: boolean) => void) | null>(null);

  const availableSections = sectionsByModule[selectedModule];
  const scopeKey = getScopeKey(selectedModule, selectedSection);

  useEffect(() => {
    let isActive = true;
    setIsLoadingLibrary(true);
    setLibraryError(null);

    void fetchLibraryFiles(accessToken, {
      module: selectedModule,
      section: selectedSection,
      customCategory: selectedCustomCategory ?? undefined,
    })
      .then((items) => {
        if (isActive) {
          setLibraryItems(items);

          const categoriesFromServer = Array.from(
            new Set(
              items
                .map((item) => item.customCategory?.trim() ?? '')
                .filter((value) => value.length > 0),
            ),
          ).sort((left, right) => left.localeCompare(right));

          setCustomCategoriesByScope((current) => {
            const existing = current[scopeKey] ?? [];
            return {
              ...current,
              [scopeKey]: Array.from(
                new Set([...existing, ...categoriesFromServer]),
              ).sort((left, right) => left.localeCompare(right)),
            };
          });
        }
      })
      .catch(() => {
        if (isActive) {
          setLibraryItems([]);
          setLibraryError(text.upload.loadExistingError);
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
  }, [
    accessToken,
    scopeKey,
    selectedCustomCategory,
    selectedModule,
    selectedSection,
    text.upload.loadExistingError,
  ]);

  const customCategoryOptions = useMemo(
    () => customCategoriesByScope[scopeKey] ?? [],
    [customCategoriesByScope, scopeKey],
  );

  useEffect(() => {
    if (
      selectedCustomCategory &&
      !customCategoryOptions.includes(selectedCustomCategory)
    ) {
      setSelectedCustomCategory(null);
    }
  }, [customCategoryOptions, selectedCustomCategory]);

  function onSelectModule(nextModule: LibraryModule) {
    setSelectedModule(nextModule);
    const firstSection = sectionsByModule[nextModule][0];
    if (firstSection) {
      setSelectedSection(firstSection.key as LibrarySection);
    }
    setSelectedCustomCategory(null);
    setCategoryInput('');
  }

  function onSelectSection(nextSection: LibrarySection) {
    setSelectedSection(nextSection);
    setSelectedCustomCategory(null);
    setCategoryInput('');
  }

  function addCustomCategory() {
    const normalized = categoryInput.trim();
    if (!normalized) {
      return;
    }

    if (normalized.length > 80) {
      setError(text.upload.categoryTooLong);
      return;
    }

    if (customCategoryOptions.includes(normalized)) {
      setError(text.upload.categoryExists);
      return;
    }

    setCustomCategoriesByScope((current) => {
      const existing = current[scopeKey] ?? [];
      return {
        ...current,
        [scopeKey]: [...existing, normalized].sort((left, right) =>
          left.localeCompare(right),
        ),
      };
    });

    setSelectedCustomCategory(normalized);
    setCategoryInput('');
    setError(null);
  }

  async function handlePickAndUpload() {
    setError(null);
    setLastUpload(null);

    const result = await DocumentPicker.getDocumentAsync({
      multiple: false,
      type: PICKER_TYPES,
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      return;
    }

    const asset = result.assets[0];
    if (!asset) {
      return;
    }

    setIsUploading(true);
    try {
      const uploadResponse = await uploadSingleFile(
        accessToken,
        {
          uri: asset.uri,
          name: asset.name,
          mimeType: asset.mimeType ?? undefined,
          file: (asset as { file?: File }).file,
        },
        {
          module: selectedModule,
          section: selectedSection,
          customCategory: selectedCustomCategory,
        },
      );

      setLastUpload(uploadResponse);
      setLibraryItems((current) => [
        {
          ...uploadResponse,
          uploadedAt: new Date().toISOString(),
          uploadedByUserId: null,
        },
        ...current,
      ]);

      if (uploadResponse.customCategory) {
        setCustomCategoriesByScope((current) => {
          const existing = current[scopeKey] ?? [];
          if (existing.includes(uploadResponse.customCategory ?? '')) {
            return current;
          }

          return {
            ...current,
            [scopeKey]: [...existing, uploadResponse.customCategory ?? ''].sort(
              (left, right) => left.localeCompare(right),
            ),
          };
        });
      }
    } catch {
      setError(text.upload.error);
    } finally {
      setIsUploading(false);
    }
  }

  async function confirmDelete(): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      confirmDeleteResolverRef.current = resolve;
      setConfirmDialogVisible(true);
    });
  }

  function closeConfirmDelete(value: boolean) {
    if (confirmDeleteResolverRef.current) {
      confirmDeleteResolverRef.current(value);
      confirmDeleteResolverRef.current = null;
    }

    setConfirmDialogVisible(false);
  }

  async function handleDeleteLibraryItem(item: LibraryFileItem) {
    const confirmed = await confirmDelete();
    if (!confirmed) {
      return;
    }

    setIsDeletingId(item.documentId);
    setLibraryError(null);

    try {
      await deleteLibraryFile(accessToken, item.documentId);
      setLibraryItems((current) =>
        current.filter((entry) => entry.documentId !== item.documentId),
      );
    } catch {
      setLibraryError(text.upload.deleteError);
    } finally {
      setIsDeletingId(null);
    }
  }

  return (
    <View style={styles.uploadCard}>
      <Text style={styles.uploadTitle}>{text.upload.title}</Text>
      <Text style={styles.uploadSubtitle}>{text.upload.subtitle}</Text>

      <Text style={styles.uploadFieldTitle}>{text.upload.moduleLabel}</Text>
      <View style={styles.uploadChipWrap}>
        {moduleOptions.map((moduleOption) => (
          <Pressable
            key={moduleOption.key}
            style={[
              styles.uploadChip,
              selectedModule === moduleOption.key && styles.uploadChipActive,
            ]}
            onPress={() => onSelectModule(moduleOption.key as LibraryModule)}
          >
            <Text
              style={[
                styles.uploadChipText,
                selectedModule === moduleOption.key && styles.uploadChipTextActive,
              ]}
            >
              {moduleOption.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.uploadFieldTitle}>{text.upload.sectionLabel}</Text>
      <View style={styles.uploadChipWrap}>
        {availableSections.map((sectionOption) => (
          <Pressable
            key={sectionOption.key}
            style={[
              styles.uploadChip,
              selectedSection === sectionOption.key && styles.uploadChipActive,
            ]}
            onPress={() => onSelectSection(sectionOption.key as LibrarySection)}
          >
            <Text
              style={[
                styles.uploadChipText,
                selectedSection === sectionOption.key && styles.uploadChipTextActive,
              ]}
            >
              {sectionOption.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.uploadFieldTitle}>{text.upload.customCategoryLabel}</Text>
      <View style={styles.uploadChipWrap}>
        <Pressable
          style={[
            styles.uploadChip,
            selectedCustomCategory === null && styles.uploadChipActive,
          ]}
          onPress={() => setSelectedCustomCategory(null)}
        >
          <Text
            style={[
              styles.uploadChipText,
              selectedCustomCategory === null && styles.uploadChipTextActive,
            ]}
          >
            {text.upload.allCategories}
          </Text>
        </Pressable>

        {customCategoryOptions.map((categoryName) => (
          <Pressable
            key={`category-${scopeKey}-${categoryName}`}
            style={[
              styles.uploadChip,
              selectedCustomCategory === categoryName && styles.uploadChipActive,
            ]}
            onPress={() => setSelectedCustomCategory(categoryName)}
          >
            <Text
              style={[
                styles.uploadChipText,
                selectedCustomCategory === categoryName && styles.uploadChipTextActive,
              ]}
            >
              {categoryName}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.categoryInputRow}>
        <TextInput
          style={styles.categoryInput}
          value={categoryInput}
          onChangeText={setCategoryInput}
          placeholder={text.upload.customCategoryPlaceholder}
          placeholderTextColor="#a98a8d"
          autoCorrect={false}
          autoCapitalize="none"
          maxLength={80}
        />
        <Pressable style={styles.categoryAddButton} onPress={addCustomCategory}>
          <Text style={styles.secondaryButtonText}>{text.upload.addCategoryButton}</Text>
        </Pressable>
      </View>

      <Pressable
        style={[styles.primaryButton, isUploading && styles.buttonDisabled]}
        disabled={isUploading}
        onPress={() => {
          void handlePickAndUpload();
        }}
      >
        <Text style={styles.primaryButtonText}>
          {isUploading ? text.upload.uploading : text.upload.cta}
        </Text>
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {lastUpload ? (
        <View style={styles.uploadResultBox}>
          <Text style={styles.uploadResultText}>
            {text.upload.success}: {lastUpload.originalName}
          </Text>
          <Text style={styles.uploadResultMeta}>
            {text.upload.resultModule}:{' '}
            {moduleOptions.find((option) => option.key === lastUpload.module)?.label ??
              lastUpload.module}
          </Text>
          <Text style={styles.uploadResultMeta}>
            {text.upload.resultSection}:{' '}
            {sectionsByModule[lastUpload.module].find(
              (option) => option.key === lastUpload.section,
            )?.label ?? lastUpload.section}
          </Text>
          <Text style={styles.uploadResultMeta}>
            {text.upload.customCategoryLabel}:{' '}
            {lastUpload.customCategory || text.upload.uncategorized}
          </Text>
          <Text style={styles.uploadResultLink}>{lastUpload.fileUrl}</Text>
        </View>
      ) : null}

      <View style={styles.uploadResultBox}>
        <Text style={styles.uploadResultText}>{text.upload.existingTitle}</Text>
        <Text style={styles.uploadResultMeta}>{text.upload.existingSubtitle}</Text>

        {isLoadingLibrary ? (
          <Text style={styles.uploadResultMeta}>{text.upload.loadingExisting}</Text>
        ) : null}
        {libraryError ? <Text style={styles.error}>{libraryError}</Text> : null}

        {!isLoadingLibrary && !libraryError && libraryItems.length === 0 ? (
          <Text style={styles.uploadResultMeta}>{text.upload.emptyExisting}</Text>
        ) : null}

        {libraryItems.slice(0, 15).map((item) => (
          <View key={`media-${item.documentId}`} style={styles.mediaItemCard}>
            <Text style={styles.uploadResultText}>{item.originalName}</Text>
            <Text style={styles.uploadResultMeta}>
              {new Date(item.uploadedAt).toLocaleString()}
            </Text>
            <Text style={styles.uploadResultMeta}>{item.mediaType}</Text>
            <Text style={styles.uploadResultMeta}>
              {text.upload.customCategoryLabel}:{' '}
              {item.customCategory || text.upload.uncategorized}
            </Text>

            <View style={styles.mediaActionRow}>
              <Pressable
                style={styles.secondaryButton}
                onPress={() => {
                  void Linking.openURL(item.fileUrl);
                }}
              >
                <Text style={styles.secondaryButtonText}>{text.upload.openMediaButton}</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.deleteButton,
                  isDeletingId === item.documentId && styles.buttonDisabled,
                ]}
                disabled={isDeletingId === item.documentId}
                onPress={() => {
                  void handleDeleteLibraryItem(item);
                }}
              >
                <Text style={styles.deleteButtonText}>
                  {isDeletingId === item.documentId
                    ? text.upload.deletingMedia
                    : text.upload.deleteMediaButton}
                </Text>
              </Pressable>
            </View>
          </View>
        ))}
      </View>

      <ConfirmDialog
        visible={confirmDialogVisible}
        title={text.upload.deleteConfirmTitle}
        message={text.upload.deleteConfirmMessage}
        cancelLabel={text.adminTraining.confirmProbationCancel}
        confirmLabel={text.upload.deleteConfirmAction}
        destructive
        onCancel={() => closeConfirmDelete(false)}
        onConfirm={() => closeConfirmDelete(true)}
      />
    </View>
  );
}
