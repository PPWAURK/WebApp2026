import * as DocumentPicker from 'expo-document-picker';
import { useEffect, useState } from 'react';
import { Alert, Linking, Platform, Pressable, Text, View } from 'react-native';
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

  const availableSections = sectionsByModule[selectedModule];

  useEffect(() => {
    let isActive = true;
    setIsLoadingLibrary(true);
    setLibraryError(null);

    void fetchLibraryFiles(accessToken, {
      module: selectedModule,
      section: selectedSection,
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
  }, [accessToken, selectedModule, selectedSection, text.upload.loadExistingError]);

  function onSelectModule(nextModule: LibraryModule) {
    setSelectedModule(nextModule);
    const firstSection = sectionsByModule[nextModule][0];
    if (firstSection) {
      setSelectedSection(firstSection.key as LibrarySection);
    }
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
      const uploadResponse = await uploadSingleFile(accessToken, {
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType ?? undefined,
        file: (asset as { file?: File }).file,
      }, {
        module: selectedModule,
        section: selectedSection,
      });
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
    if (Platform.OS === 'web') {
      return typeof window !== 'undefined' && window.confirm(text.upload.deleteConfirmMessage);
    }

    return new Promise<boolean>((resolve) => {
      Alert.alert(
        text.upload.deleteConfirmTitle,
        text.upload.deleteConfirmMessage,
        [
          { text: text.adminTraining.confirmProbationCancel, style: 'cancel', onPress: () => resolve(false) },
          { text: text.upload.deleteConfirmAction, style: 'destructive', onPress: () => resolve(true) },
        ],
        { cancelable: true, onDismiss: () => resolve(false) },
      );
    });
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
      setLibraryItems((current) => current.filter((entry) => entry.documentId !== item.documentId));
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
            onPress={() => setSelectedSection(sectionOption.key as LibrarySection)}
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
            {text.upload.resultModule}: {moduleOptions.find((option) => option.key === lastUpload.module)?.label ?? lastUpload.module}
          </Text>
          <Text style={styles.uploadResultMeta}>
            {text.upload.resultSection}: {sectionsByModule[lastUpload.module].find((option) => option.key === lastUpload.section)?.label ?? lastUpload.section}
          </Text>
          <Text style={styles.uploadResultLink}>{lastUpload.fileUrl}</Text>
        </View>
      ) : null}

      <View style={styles.uploadResultBox}>
        <Text style={styles.uploadResultText}>{text.upload.existingTitle}</Text>
        <Text style={styles.uploadResultMeta}>{text.upload.existingSubtitle}</Text>

        {isLoadingLibrary ? <Text style={styles.uploadResultMeta}>{text.upload.loadingExisting}</Text> : null}
        {libraryError ? <Text style={styles.error}>{libraryError}</Text> : null}

        {!isLoadingLibrary && !libraryError && libraryItems.length === 0 ? (
          <Text style={styles.uploadResultMeta}>{text.upload.emptyExisting}</Text>
        ) : null}

        {libraryItems.slice(0, 15).map((item) => (
          <View key={`media-${item.documentId}`} style={styles.mediaItemCard}>
            <Text style={styles.uploadResultText}>{item.originalName}</Text>
            <Text style={styles.uploadResultMeta}>{new Date(item.uploadedAt).toLocaleString()}</Text>
            <Text style={styles.uploadResultMeta}>{item.mediaType}</Text>

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
                style={[styles.deleteButton, isDeletingId === item.documentId && styles.buttonDisabled]}
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
    </View>
  );
}
