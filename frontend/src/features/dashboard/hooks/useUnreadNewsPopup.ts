import { Linking } from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import type { AppText } from '../../../locales/translations';
import {
  fetchNewsFeed,
  markNewsAsRead,
  type NewsPostItem,
} from '../../../services/newsApi';

type UseUnreadNewsPopupParams = {
  accessToken: string | null;
  isAdmin: boolean;
  sessionKey: string | null;
  text: AppText;
};

export function useUnreadNewsPopup({
  accessToken,
  isAdmin,
  sessionKey,
  text,
}: UseUnreadNewsPopupParams) {
  const [newsFeed, setNewsFeed] = useState<NewsPostItem[]>([]);
  const [dismissedNewsId, setDismissedNewsId] = useState<number | null>(null);

  useEffect(() => {
    setDismissedNewsId(null);
  }, [sessionKey]);

  useEffect(() => {
    if (!accessToken || isAdmin) {
      setNewsFeed([]);
      return;
    }

    let isActive = true;

    void fetchNewsFeed(accessToken, { limit: 24 })
      .then((payload) => {
        if (isActive) {
          setNewsFeed(payload.items);
        }
      })
      .catch(() => {
        if (isActive) {
          setNewsFeed([]);
        }
      });

    return () => {
      isActive = false;
    };
  }, [accessToken, isAdmin, text.dashboard.newsLoadError]);

  const activeUnreadNews = useMemo(
    () =>
      newsFeed.find((post) => !post.isRead && dismissedNewsId !== post.id) ??
      null,
    [dismissedNewsId, newsFeed],
  );

  function closePopup() {
    if (!activeUnreadNews) {
      return;
    }

    setDismissedNewsId(activeUnreadNews.id);
  }

  async function openUnreadNews() {
    if (!activeUnreadNews || !accessToken) {
      return;
    }

    try {
      await markNewsAsRead(accessToken, activeUnreadNews.id);
      setNewsFeed((current) =>
        current.map((item) =>
          item.id === activeUnreadNews.id ? { ...item, isRead: true } : item,
        ),
      );

      if (activeUnreadNews.attachment?.fileUrl) {
        await Linking.openURL(activeUnreadNews.attachment.fileUrl);
      }
    } finally {
      setDismissedNewsId(activeUnreadNews.id);
    }
  }

  return {
    activeUnreadNews,
    closePopup,
    openUnreadNews,
  };
}
