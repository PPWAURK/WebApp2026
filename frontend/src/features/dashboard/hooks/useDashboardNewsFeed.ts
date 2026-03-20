import { useEffect, useState } from 'react';
import { Linking } from 'react-native';
import type { AppText } from '../../../locales/translations';
import {
  deleteNewsPost,
  fetchNewsFeed,
  fetchNewsReadTracking,
  markNewsAsRead,
  type NewsPostItem,
  type NewsReadTrackingResponse,
} from '../../../services/newsApi';
import { normalizeNewsTagKey } from '../lib/dashboardShared';

type ConfirmAction = (
  title: string,
  message: string,
  confirmLabel: string,
) => Promise<boolean>;

type UseDashboardNewsFeedArgs = {
  accessToken: string;
  isAdmin: boolean;
  text: AppText;
  confirmAction: ConfirmAction;
};

export function useDashboardNewsFeed({
  accessToken,
  isAdmin,
  text,
  confirmAction,
}: UseDashboardNewsFeedArgs) {
  const [newsFeed, setNewsFeed] = useState<NewsPostItem[]>([]);
  const [newsFeedLoading, setNewsFeedLoading] = useState(false);
  const [newsFeedError, setNewsFeedError] = useState<string | null>(null);
  const [newsFeedMonths, setNewsFeedMonths] = useState<string[]>([]);
  const [newsFeedTags, setNewsFeedTags] = useState<string[]>([]);
  const [selectedNewsMonth, setSelectedNewsMonth] = useState<string>('ALL');
  const [selectedNewsTag, setSelectedNewsTag] = useState<string>('ALL');
  const [deletingNewsId, setDeletingNewsId] = useState<number | null>(null);
  const [markingNewsReadId, setMarkingNewsReadId] = useState<number | null>(
    null,
  );
  const [expandedNewsTrackingId, setExpandedNewsTrackingId] = useState<
    number | null
  >(null);
  const [loadingNewsTrackingId, setLoadingNewsTrackingId] = useState<
    number | null
  >(null);
  const [newsTrackingByPostId, setNewsTrackingByPostId] = useState<
    Record<number, NewsReadTrackingResponse>
  >({});

  useEffect(() => {
    let isActive = true;
    setNewsFeedLoading(true);
    setNewsFeedError(null);

    void fetchNewsFeed(accessToken, {
      limit: 24,
      month: selectedNewsMonth === 'ALL' ? undefined : selectedNewsMonth,
      tag: selectedNewsTag === 'ALL' ? undefined : selectedNewsTag,
    })
      .then((payload) => {
        if (!isActive) {
          return;
        }

        setNewsFeed(payload.items);
        setNewsFeedMonths(payload.availableMonths);
        setNewsFeedTags(payload.availableTags);

        if (
          selectedNewsMonth !== 'ALL' &&
          !payload.availableMonths.includes(selectedNewsMonth)
        ) {
          setSelectedNewsMonth('ALL');
        }

        if (
          selectedNewsTag !== 'ALL' &&
          !payload.availableTags.some(
            (tag) =>
              normalizeNewsTagKey(tag) ===
              normalizeNewsTagKey(selectedNewsTag),
          )
        ) {
          setSelectedNewsTag('ALL');
        }
      })
      .catch(() => {
        if (!isActive) {
          return;
        }

        setNewsFeed([]);
        setNewsFeedMonths([]);
        setNewsFeedTags([]);
        setNewsFeedError(text.dashboard.newsLoadError);
      })
      .finally(() => {
        if (isActive) {
          setNewsFeedLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [
    accessToken,
    selectedNewsMonth,
    selectedNewsTag,
    text.dashboard.newsLoadError,
  ]);

  async function handleOpenNews(post: NewsPostItem) {
    if (post.attachment?.fileUrl) {
      void Linking.openURL(post.attachment.fileUrl);
    }
  }

  async function handleConfirmNewsRead(post: NewsPostItem) {
    if (post.isRead || markingNewsReadId === post.id) {
      return;
    }

    setMarkingNewsReadId(post.id);

    try {
      await markNewsAsRead(accessToken, post.id);
      setNewsFeed((current) =>
        current.map((item) =>
          item.id === post.id ? { ...item, isRead: true } : item,
        ),
      );
    } catch {
      setNewsFeedError(text.dashboard.newsReadConfirmError);
    } finally {
      setMarkingNewsReadId(null);
    }
  }

  async function handleToggleReadTracking(post: NewsPostItem) {
    if (!isAdmin) {
      return;
    }

    if (expandedNewsTrackingId === post.id) {
      setExpandedNewsTrackingId(null);
      return;
    }

    setExpandedNewsTrackingId(post.id);
    setNewsFeedError(null);

    if (newsTrackingByPostId[post.id]) {
      return;
    }

    setLoadingNewsTrackingId(post.id);
    try {
      const tracking = await fetchNewsReadTracking(accessToken, post.id);
      setNewsTrackingByPostId((current) => ({
        ...current,
        [post.id]: tracking,
      }));
    } catch {
      setNewsFeedError(text.dashboard.newsReadTrackingError);
    } finally {
      setLoadingNewsTrackingId(null);
    }
  }

  async function handleDeleteNews(post: NewsPostItem) {
    if (!isAdmin) {
      return;
    }

    const confirmed = await confirmAction(
      text.dashboard.newsDeleteTitle,
      text.dashboard.newsDeleteMessage,
      text.dashboard.newsDeleteConfirm,
    );
    if (!confirmed) {
      return;
    }

    setDeletingNewsId(post.id);
    setNewsFeedError(null);
    try {
      await deleteNewsPost(accessToken, post.id);
      setNewsFeed((current) => current.filter((item) => item.id !== post.id));
    } catch {
      setNewsFeedError(text.dashboard.newsDeleteError);
    } finally {
      setDeletingNewsId(null);
    }
  }

  function isNewsReadForViewer(post: NewsPostItem) {
    return isAdmin ? true : post.isRead;
  }

  function integratePublishedPost(createdPost: NewsPostItem) {
    const createdDate = new Date(createdPost.createdAt);
    const createdMonth = `${createdDate.getUTCFullYear()}-${`${createdDate.getUTCMonth() + 1}`.padStart(2, '0')}`;
    const matchesSelectedMonth =
      selectedNewsMonth === 'ALL' || selectedNewsMonth === createdMonth;
    const matchesSelectedTag =
      selectedNewsTag === 'ALL' ||
      createdPost.tags.some(
        (tag) =>
          normalizeNewsTagKey(tag) === normalizeNewsTagKey(selectedNewsTag),
      );

    setNewsFeed((current) =>
      matchesSelectedMonth && matchesSelectedTag
        ? [createdPost, ...current].slice(0, 24)
        : current,
    );
    setNewsFeedMonths((current) =>
      current.includes(createdMonth) ? current : [createdMonth, ...current],
    );
    setNewsFeedTags((current) =>
      Array.from(new Set([...current, ...createdPost.tags])).sort((left, right) =>
        left.localeCompare(right),
      ),
    );
  }

  return {
    deletingNewsId,
    expandedNewsTrackingId,
    handleConfirmNewsRead,
    handleDeleteNews,
    handleOpenNews,
    handleToggleReadTracking,
    integratePublishedPost,
    isNewsReadForViewer,
    loadingNewsTrackingId,
    markingNewsReadId,
    newsFeed,
    newsFeedError,
    newsFeedLoading,
    newsFeedMonths,
    newsFeedTags,
    newsTrackingByPostId,
    selectedNewsMonth,
    selectedNewsTag,
    setSelectedNewsMonth,
    setSelectedNewsTag,
  };
}
