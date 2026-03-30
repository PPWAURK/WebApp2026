import * as DocumentPicker from 'expo-document-picker';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Linking, Pressable, Text, TextInput, View } from 'react-native';
import {
  getModuleOptions,
  getSectionsByModule,
  isLibrarySection,
  type LibraryModule,
  type LibrarySection,
} from '../../constants/documentTaxonomy';
import type { AppText } from '../../locales/translations';
import {
  createModuleCategory,
  deleteLibraryFile,
  deleteModuleCategory,
  fetchLibraryFiles,
  fetchModuleCategories,
  type LibraryFileItem,
  type ModuleCategoryItem,
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

function sortCategories(items: ModuleCategoryItem[]) {
  return [...items].sort((left, right) => left.name.localeCompare(right.name));
}

export function AdminUploadPanel({ accessToken, text }: AdminUploadPanelProps) {
  const moduleOptions = useMemo(() => getModuleOptions(text), [text]);
  const sectionsByModule = useMemo(() => getSectionsByModule(text), [text]);
  const [selectedModule, setSelectedModule] = useState<LibraryModule>('TRAINING');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpload, setLastUpload] = useState<UploadedFileResponse | null>(null);
  const [libraryItems, setLibraryItems] = useState<LibraryFileItem[]>([]);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);
  const [libraryError, setLibraryError] = useState<string | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<number | null>(null);
  const [confirmDialogVisible, setConfirmDialogVisible] = useState(false);
  const [deleteCategoryDialogVisible, setDeleteCategoryDialogVisible] =
    useState(false);
  const [categoryInput, setCategoryInput] = useState('');
  const [moduleCategories, setModuleCategories] = useState<ModuleCategoryItem[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [categoryLoadError, setCategoryLoadError] = useState<string | null>(null);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);

  const confirmDeleteResolverRef = useRef<((value: boolean) => void) | null>(null);

  const availableSections = sectionsByModule[selectedModule];
  const defaultCategorySection = (availableSections[0]?.key ??
    'RECIPE_TRAINING') as LibrarySection;

  const selectedCategory = useMemo(
    () => moduleCategories.find((item) => item.id === selectedCategoryId) ?? null,
    [moduleCategories, selectedCategoryId],
  );

  function getCategoryLabel(item: ModuleCategoryItem) {
    if (isLibrarySection(item.name)) {
      const translated = availableSections.find((entry) => entry.key === item.name);
      if (translated) {
        return translated.label;
      }
    }

    return item.name;
  }

  useEffect(() => {
    setSelectedCategoryId(null);
    setCategoryInput('');
    setError(null);
  }, [sectionsByModule, selectedModule]);

  useEffect(() => {
    let isActive = true;
    setIsLoadingCategories(true);
    setCategoryLoadError(null);

    void fetchModuleCategories(accessToken, selectedModule)
      .then((items) => {
        if (!isActive) {
          return;
        }

        setModuleCategories(sortCategories(items));
      })
      .catch(() => {
        if (!isActive) {
          return;
        }

        setModuleCategories([]);
        setCategoryLoadError(text.upload.loadCategoriesError);
      })
      .finally(() => {
        if (isActive) {
          setIsLoadingCategories(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [accessToken, selectedModule, text.upload.loadCategoriesError]);

  useEffect(() => {
    if (
      selectedCategoryId !== null &&
      !moduleCategories.some((item) => item.id === selectedCategoryId)
    ) {
      setSelectedCategoryId(null);
    }
  }, [moduleCategories, selectedCategoryId]);

  useEffect(() => {
    let isActive = true;
    setIsLoadingLibrary(true);
    setLibraryError(null);

    void fetchLibraryFiles(accessToken, {
      module: selectedModule,
      customCategory: selectedCategory?.name ?? undefined,
    })
      .then((items) => {
        if (isActive) {
          setLibraryItems(items);
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
    selectedCategory?.name,
    selectedModule,
    text.upload.loadExistingError,
  ]);

  function onSelectModule(nextModule: LibraryModule) {
    setSelectedModule(nextModule);
  }

  async function addCustomCategory() {
    const normalized = categoryInput.trim();
    if (!normalized) {
      return;
    }

    if (normalized.length > 80) {
      setError(text.upload.categoryTooLong);
      return;
    }

    const alreadyExists = moduleCategories.some(
      (item) => item.name.toLowerCase() === normalized.toLowerCase(),
    );

    if (alreadyExists) {
      setError(text.upload.categoryExists);
      return;
    }

    setError(null);
    setIsCreatingCategory(true);

    try {
      const created = await createModuleCategory(accessToken, {
        module: selectedModule,
        name: normalized,
        section: defaultCategorySection,
      });

      setModuleCategories((current) => sortCategories([...current, created]));
      setSelectedCategoryId(created.id);
      setCategoryInput('');
    } catch {
      setError(text.upload.createCategoryError);
    } finally {
      setIsCreatingCategory(false);
    }
  }

  async function handlePickAndUpload() {
    setError(null);
    setLastUpload(null);

    if (!selectedCategory) {
      setError(text.upload.selectCategoryRequired);
      return;
    }

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
          section: selectedCategory.section,
          customCategory: selectedCategory.name,
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

  async function handleDeleteCustomCategory() {
    if (!selectedCategory) {
      return;
    }

    setDeleteCategoryDialogVisible(false);
    setIsDeletingCategory(true);
    setLibraryError(null);
    setError(null);

    try {
      await deleteModuleCategory(accessToken, selectedCategory.id);

      setModuleCategories((current) =>
        current.filter((item) => item.id !== selectedCategory.id),
      );
      setSelectedCategoryId(null);
    } catch {
      setLibraryError(text.upload.deleteCategoryError);
    } finally {
      setIsDeletingCategory(false);
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
        <Pressable
          style={[
            styles.uploadChip,
            selectedCategoryId === null && styles.uploadChipActive,
          ]}
          onPress={() => setSelectedCategoryId(null)}
        >
          <Text
            style={[
              styles.uploadChipText,
              selectedCategoryId === null && styles.uploadChipTextActive,
            ]}
          >
            {text.upload.allCategories}
          </Text>
        </Pressable>

        {moduleCategories.map((categoryItem) => (
          <Pressable
            key={`category-${selectedModule}-${categoryItem.id}`}
            style={[
              styles.uploadChip,
              selectedCategoryId === categoryItem.id && styles.uploadChipActive,
            ]}
            onPress={() => setSelectedCategoryId(categoryItem.id)}
          >
            <Text
              style={[
                styles.uploadChipText,
                selectedCategoryId === categoryItem.id && styles.uploadChipTextActive,
              ]}
            >
              {getCategoryLabel(categoryItem)}
            </Text>
          </Pressable>
        ))}
      </View>

      {isLoadingCategories ? (
        <Text style={styles.uploadResultMeta}>{text.upload.loadingCategories}</Text>
      ) : null}
      {categoryLoadError ? <Text style={styles.error}>{categoryLoadError}</Text> : null}
      {!isLoadingCategories && !categoryLoadError && moduleCategories.length === 0 ? (
        <Text style={styles.uploadResultMeta}>{text.upload.emptyCategories}</Text>
      ) : null}

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
        <Pressable
          style={[styles.categoryAddButton, isCreatingCategory && styles.buttonDisabled]}
          disabled={isCreatingCategory}
          onPress={() => {
            void addCustomCategory();
          }}
        >
          <Text style={styles.secondaryButtonText}>
            {isCreatingCategory
              ? text.upload.creatingCategory
              : text.upload.addCategoryButton}
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.categoryDeleteButton,
            (!selectedCategory || isDeletingCategory) && styles.buttonDisabled,
          ]}
          disabled={!selectedCategory || isDeletingCategory}
          onPress={() => setDeleteCategoryDialogVisible(true)}
        >
          <Text style={styles.deleteButtonText}>
            {isDeletingCategory
              ? text.upload.deletingCategory
              : text.upload.deleteCategoryButton}
          </Text>
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

      <ConfirmDialog
        visible={deleteCategoryDialogVisible}
        title={text.upload.deleteCategoryConfirmTitle}
        message={
          selectedCategory
            ? `${text.upload.deleteCategoryConfirmMessage} ${getCategoryLabel(selectedCategory)}`
            : text.upload.deleteCategoryConfirmMessage
        }
        cancelLabel={text.adminTraining.confirmProbationCancel}
        confirmLabel={text.upload.deleteCategoryConfirmAction}
        destructive
        onCancel={() => setDeleteCategoryDialogVisible(false)}
        onConfirm={() => {
          void handleDeleteCustomCategory();
          void handleDeleteCustomCategory();
        }}
      />
    </View>
  );
}
