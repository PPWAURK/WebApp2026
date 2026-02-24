import * as DocumentPicker from 'expo-document-picker';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
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
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpload, setLastUpload] = useState<UploadedFileResponse | null>(null);

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
      });
      setLastUpload(uploadResponse);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : text.upload.error);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <View style={styles.uploadCard}>
      <Text style={styles.uploadTitle}>{text.upload.title}</Text>
      <Text style={styles.uploadSubtitle}>{text.upload.subtitle}</Text>

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
          <Text style={styles.uploadResultLink}>{lastUpload.fileUrl}</Text>
        </View>
      ) : null}
    </View>
  );
}
