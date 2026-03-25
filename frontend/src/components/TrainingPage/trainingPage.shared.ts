import { createElement } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import type { LibraryFileItem } from '../../services/uploadsApi';
import type { TrainingSection } from '../../types/auth';

export type OpenedDocumentState = {
  fileName: string;
  originalName: string;
  section: TrainingSection;
};

type WebPdfFrameProps = {
  src: string;
  title: string;
};

export function getQuizLinkKey(
  section: TrainingSection,
  language: 'fr' | 'bn',
) {
  return `${section}:${language}`;
}

export function buildQuizUrl(
  baseUrl: string,
  section: TrainingSection,
  context: OpenedDocumentState | null,
): string {
  const params = new URLSearchParams({ section });

  if (context && context.section === section) {
    params.set('document', context.originalName);
  }

  const joinWith = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${joinWith}${params.toString()}`;
}

export function WebPdfFrame({ src, title }: WebPdfFrameProps) {
  if (Platform.OS !== 'web') {
    return null;
  }

  return createElement('iframe', {
    src,
    title,
    style: {
      border: '0',
      width: '100%',
      height: '100%',
      backgroundColor: '#ffffff',
      borderRadius: '12px',
    },
  });
}

export function buildWebPreviewUrl(src: string): string {
  const [baseUrl, hash = ''] = src.split('#', 2);
  const previewParams = new URLSearchParams(hash);

  if (!previewParams.has('page')) {
    previewParams.set('page', '1');
  }

  previewParams.set('zoom', 'page-height');
  previewParams.set('toolbar', '0');
  previewParams.set('navpanes', '0');
  previewParams.set('scrollbar', '0');

  return `${baseUrl}#${previewParams.toString()}`;
}

export function formatDateLabel(value: string) {
  return new Date(value).toLocaleDateString();
}

export function formatFileSize(size: number) {
  if (!Number.isFinite(size) || size <= 0) {
    return '0 KB';
  }

  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(size / 1024))} KB`;
}

export function getTrainingItemIcon(
  item: LibraryFileItem,
): keyof typeof Ionicons.glyphMap {
  if (item.mediaType === 'video') {
    return 'videocam-outline';
  }

  return 'document-text-outline';
}
