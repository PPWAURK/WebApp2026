import { useEffect, useMemo, useState } from 'react';
import { Linking, Platform } from 'react-native';
import {
  getTrainingQuizUrlForSectionLanguage,
  type TrainingQuizLinkLanguage,
} from '../../constants/config';
import type { AppText } from '../../locales/translations';
import {
  loadTrainingCompletionMap,
  setTrainingItemCompletion,
  type TrainingCompletionMap,
} from '../../services/trainingProgressStorage';
import {
  fetchLibraryFiles,
  type LibraryFileItem,
} from '../../services/uploadsApi';
import { fetchTrainingQuizLinks } from '../../services/usersApi';
import type { TrainingSection } from '../../types/auth';
import {
  buildQuizUrl,
  getQuizLinkKey,
  type OpenedDocumentState,
} from './trainingPage.shared';

type UseTrainingDataParams = {
  text: AppText;
  accessToken: string;
  userId: number;
  language: 'fr' | 'en' | 'zh' | 'bn';
  activeSection: TrainingSection | null;
  searchKeyword: string;
};

export function useTrainingData({
  text,
  accessToken,
  userId,
  language,
  activeSection,
  searchKeyword,
}: UseTrainingDataParams) {
  const [libraryItems, setLibraryItems] = useState<LibraryFileItem[]>([]);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);
  const [libraryError, setLibraryError] = useState<string | null>(null);
  const [openedDocument, setOpenedDocument] =
    useState<OpenedDocumentState | null>(null);
  const [webPreviewDocument, setWebPreviewDocument] =
    useState<LibraryFileItem | null>(null);
  const [webPreviewUrl, setWebPreviewUrl] = useState<string | null>(null);
  const [webPreviewLoading, setWebPreviewLoading] = useState(false);
  const [quizLinksByKey, setQuizLinksByKey] = useState<Record<string, string>>(
    {},
  );
  const [quizLanguage, setQuizLanguage] = useState<TrainingQuizLinkLanguage>(
    language === 'fr' ? 'fr' : language === 'zh' ? 'zh' : 'bn',
  );
  const [completionByFile, setCompletionByFile] =
    useState<TrainingCompletionMap>({});

  useEffect(() => {
    let isActive = true;

    void loadTrainingCompletionMap(userId)
      .then((data) => {
        if (isActive) {
          setCompletionByFile(data);
        }
      })
      .catch(() => {
        if (isActive) {
          setCompletionByFile({});
        }
      });

    return () => {
      isActive = false;
    };
  }, [userId]);

  useEffect(() => {
    let isActive = true;
    setIsLoadingLibrary(true);
    setLibraryError(null);

    void fetchLibraryFiles(accessToken, {})
      .then((items) => {
        if (isActive) {
          setLibraryItems(items);
        }
      })
      .catch(() => {
        if (isActive) {
          setLibraryItems([]);
          setLibraryError(text.training.loadError);
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
  }, [accessToken, text.training.loadError]);

  useEffect(() => {
    let isActive = true;

    void fetchTrainingQuizLinks(accessToken)
      .then((links) => {
        if (!isActive) {
          return;
        }

        const nextQuizLinksByKey = links.reduce<Record<string, string>>(
          (accumulator, item) => {
            if (item.quizUrl) {
              accumulator[getQuizLinkKey(item.section, item.language)] =
                item.quizUrl;
            }

            return accumulator;
          },
          {},
        );

        setQuizLinksByKey(nextQuizLinksByKey);
      })
      .catch(() => {
        if (isActive) {
          setQuizLinksByKey({});
        }
      });

    return () => {
      isActive = false;
    };
  }, [accessToken]);

  const sectionItems = useMemo(() => {
    if (!activeSection) {
      return [];
    }

    const normalizedSearch = searchKeyword.trim().toLowerCase();

    return libraryItems
      .filter(
        (item) =>
          item.section === activeSection &&
          (item.mediaType === 'document' || item.mediaType === 'video'),
      )
      .filter((item) => {
        if (!normalizedSearch) {
          return true;
        }

        return item.originalName.toLowerCase().includes(normalizedSearch);
      })
      .sort(
        (left, right) =>
          new Date(right.uploadedAt).getTime() -
          new Date(left.uploadedAt).getTime(),
      );
  }, [activeSection, libraryItems, searchKeyword]);

  const selectedSectionDocumentCount = sectionItems.filter(
    (item) => item.mediaType === 'document',
  ).length;
  const selectedSectionVideoCount = sectionItems.filter(
    (item) => item.mediaType === 'video',
  ).length;
  const selectedSectionCompletedCount = sectionItems.filter((item) =>
    Boolean(completionByFile[item.fileName]),
  ).length;

  const selectedSectionKey = activeSection;
  const dbQuizBaseUrl = selectedSectionKey
    ? (quizLinksByKey[getQuizLinkKey(selectedSectionKey, quizLanguage)] ?? '')
    : '';
  const fallbackQuizBaseUrl = selectedSectionKey
    ? getTrainingQuizUrlForSectionLanguage(selectedSectionKey, quizLanguage)
    : '';
  const quizBaseUrl = dbQuizBaseUrl || fallbackQuizBaseUrl;

  const quizUrl = useMemo(() => {
    if (!quizBaseUrl || !selectedSectionKey) {
      return null;
    }

    return buildQuizUrl(quizBaseUrl, selectedSectionKey, openedDocument);
  }, [openedDocument, quizBaseUrl, selectedSectionKey]);

  useEffect(() => {
    if (!webPreviewDocument) {
      return;
    }

    const stillExists = sectionItems.some(
      (item) => item.fileName === webPreviewDocument.fileName,
    );

    if (!stillExists) {
      setWebPreviewDocument(null);
    }
  }, [sectionItems, webPreviewDocument]);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      return;
    }

    if (!webPreviewDocument) {
      setWebPreviewUrl(null);
      setWebPreviewLoading(false);
      return;
    }

    setWebPreviewLoading(true);
    setWebPreviewUrl(webPreviewDocument.fileUrl);
    setWebPreviewLoading(false);
  }, [webPreviewDocument]);

  const quizStatusText = !quizBaseUrl
    ? text.training.quizLinkMissing
    : openedDocument && openedDocument.section === selectedSectionKey
      ? text.training.quizReady
      : text.training.quizDirectAvailable;

  const hasSearchResults = sectionItems.length > 0;

  function openDocument(item: LibraryFileItem) {
    const documentSection = activeSection ?? (item.section as TrainingSection);

    setOpenedDocument({
      fileName: item.fileName,
      originalName: item.originalName,
      section: documentSection,
    });

    if (Platform.OS === 'web') {
      setWebPreviewDocument(item);
      return;
    }

    void Linking.openURL(item.fileUrl);
  }

  function openQuiz() {
    if (!quizUrl) {
      return;
    }

    void Linking.openURL(quizUrl);
  }

  async function toggleCompletion(fileName: string) {
    const currentlyCompleted = Boolean(completionByFile[fileName]);

    setCompletionByFile((current) => {
      const next = { ...current };
      if (currentlyCompleted) {
        delete next[fileName];
      } else {
        next[fileName] = { completedAt: new Date().toISOString() };
      }
      return next;
    });

    try {
      const saved = await setTrainingItemCompletion(
        userId,
        fileName,
        !currentlyCompleted,
      );
      setCompletionByFile(saved);
    } catch {
      setCompletionByFile((current) => {
        const next = { ...current };
        if (!currentlyCompleted) {
          delete next[fileName];
        } else {
          next[fileName] = { completedAt: new Date().toISOString() };
        }
        return next;
      });
    }
  }

  return {
    libraryItems,
    isLoadingLibrary,
    libraryError,
    openedDocument,
    webPreviewDocument,
    webPreviewUrl,
    webPreviewLoading,
    quizLanguage,
    completionByFile,
    sectionItems,
    selectedSectionDocumentCount,
    selectedSectionVideoCount,
    selectedSectionCompletedCount,
    quizUrl,
    quizStatusText,
    hasSearchResults,
    setQuizLanguage,
    openDocument,
    openQuiz,
    toggleCompletion,
  };
}
