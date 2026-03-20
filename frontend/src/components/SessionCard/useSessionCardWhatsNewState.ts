import { useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import {
  EMPLOYEE_LEVELS,
  NEWS_ATTACHMENT_MODULE,
  NEWS_ATTACHMENT_SECTION,
  NEWS_LANE_MARKERS,
  PICKER_TYPES,
  parseNewsTagsInput,
  type NewsLane,
} from '../../features/dashboard/lib/dashboardShared';
import type { NewsPostItem } from '../../services/newsApi';
import { createNewsPost } from '../../services/newsApi';
import {
  uploadSingleFile,
  type UploadedFileResponse,
} from '../../services/uploadsApi';
import type { AppText } from '../../locales/translations';
import type { EmployeeLevel } from '../../types/auth';

type UseSessionCardWhatsNewStateArgs = {
  accessToken: string;
  integratePublishedPost: (createdPost: NewsPostItem) => void;
  text: AppText;
};

export type SessionCardWhatsNewState = {
  isWhatsNewLevelsExpanded: boolean;
  parsedWhatsNewTags: string[];
  setWhatsNewLane: Dispatch<SetStateAction<NewsLane>>;
  setWhatsNewMessage: Dispatch<SetStateAction<string>>;
  setWhatsNewTagsInput: Dispatch<SetStateAction<string>>;
  setWhatsNewTitle: Dispatch<SetStateAction<string>>;
  toggleWhatsNewVisibleLevel: (level: EmployeeLevel) => void;
  clearWhatsNewVisibleLevels: () => void;
  toggleWhatsNewLevelsExpanded: () => void;
  handlePublishWhatsNew: () => Promise<void>;
  handleWhatsNewUpload: () => Promise<void>;
  whatsNewError: string | null;
  whatsNewLane: NewsLane;
  whatsNewLastUpload: UploadedFileResponse | null;
  whatsNewMessage: string;
  whatsNewPublishing: boolean;
  whatsNewTagsInput: string;
  whatsNewTitle: string;
  whatsNewUploading: boolean;
  whatsNewVisibleLevels: EmployeeLevel[];
};

export function useSessionCardWhatsNewState({
  accessToken,
  integratePublishedPost,
  text,
}: UseSessionCardWhatsNewStateArgs): SessionCardWhatsNewState {
  const [whatsNewUploading, setWhatsNewUploading] = useState(false);
  const [whatsNewError, setWhatsNewError] = useState<string | null>(null);
  const [whatsNewLastUpload, setWhatsNewLastUpload] =
    useState<UploadedFileResponse | null>(null);
  const [whatsNewTitle, setWhatsNewTitle] = useState('');
  const [whatsNewMessage, setWhatsNewMessage] = useState('');
  const [whatsNewTagsInput, setWhatsNewTagsInput] = useState('');
  const [whatsNewLane, setWhatsNewLane] = useState<NewsLane>('NEWS');
  const [whatsNewVisibleLevels, setWhatsNewVisibleLevels] = useState<
    EmployeeLevel[]
  >([]);
  const [isWhatsNewLevelsExpanded, setIsWhatsNewLevelsExpanded] =
    useState(false);
  const [whatsNewPublishing, setWhatsNewPublishing] = useState(false);

  const parsedWhatsNewTags = useMemo(
    () => parseNewsTagsInput(whatsNewTagsInput),
    [whatsNewTagsInput],
  );

  function clearWhatsNewVisibleLevels() {
    setWhatsNewVisibleLevels([]);
  }

  function toggleWhatsNewVisibleLevel(level: EmployeeLevel) {
    setWhatsNewVisibleLevels((current) =>
      current.includes(level)
        ? current.filter((entry) => entry !== level)
        : [...current, level],
    );
  }

  function toggleWhatsNewLevelsExpanded() {
    setIsWhatsNewLevelsExpanded((current) => !current);
  }

  async function handleWhatsNewUpload() {
    setWhatsNewError(null);

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

    setWhatsNewUploading(true);

    try {
      const response = await uploadSingleFile(
        accessToken,
        {
          uri: asset.uri,
          name: asset.name,
          mimeType: asset.mimeType ?? undefined,
          file: (asset as { file?: File }).file,
        },
        {
          module: NEWS_ATTACHMENT_MODULE,
          section: NEWS_ATTACHMENT_SECTION,
        },
      );
      setWhatsNewLastUpload(response);
    } catch {
      setWhatsNewError(text.upload.error);
    } finally {
      setWhatsNewUploading(false);
    }
  }

  async function handlePublishWhatsNew() {
    const title = whatsNewTitle.trim();
    const message = whatsNewMessage.trim();

    if (!title || !message) {
      setWhatsNewError(text.dashboard.whatsNewValidationError);
      return;
    }

    setWhatsNewPublishing(true);
    setWhatsNewError(null);

    try {
      const createdPost = await createNewsPost(accessToken, {
        title: `${NEWS_LANE_MARKERS[whatsNewLane]} ${title}`,
        message,
        tags: parsedWhatsNewTags,
        visibleEmployeeLevels: whatsNewVisibleLevels,
        attachmentDocumentId: whatsNewLastUpload?.documentId,
      });

      integratePublishedPost(createdPost);
      setWhatsNewTitle('');
      setWhatsNewMessage('');
      setWhatsNewTagsInput('');
      setWhatsNewLane('NEWS');
      setWhatsNewVisibleLevels([]);
      setIsWhatsNewLevelsExpanded(false);
      setWhatsNewLastUpload(null);
    } catch {
      setWhatsNewError(text.dashboard.whatsNewPublishError);
    } finally {
      setWhatsNewPublishing(false);
    }
  }

  return {
    isWhatsNewLevelsExpanded,
    parsedWhatsNewTags,
    setWhatsNewLane,
    setWhatsNewMessage,
    setWhatsNewTagsInput,
    setWhatsNewTitle,
    toggleWhatsNewVisibleLevel,
    clearWhatsNewVisibleLevels,
    toggleWhatsNewLevelsExpanded,
    handlePublishWhatsNew,
    handleWhatsNewUpload,
    whatsNewError,
    whatsNewLane,
    whatsNewLastUpload,
    whatsNewMessage,
    whatsNewPublishing,
    whatsNewTagsInput,
    whatsNewTitle,
    whatsNewUploading,
    whatsNewVisibleLevels,
  };
}
