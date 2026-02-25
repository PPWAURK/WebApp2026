import * as DocumentPicker from 'expo-document-picker';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import {
  getModuleOptions,
  getSectionsByModule,
  type LibraryModule,
  type LibrarySection,
} from '../constants/documentTaxonomy';
import type { AppText } from '../locales/translations';
import {
  uploadSingleFile,
  type UploadedFileResponse,
} from '../services/uploadsApi';
import { styles } from '../styles/appStyles';

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

  const availableSections = sectionsByModule[selectedModule];

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
    } catch {
      setError(text.upload.error);
    } finally {
      setIsUploading(false);
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
    </View>
  );
}
