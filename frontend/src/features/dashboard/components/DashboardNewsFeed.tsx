import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, Text, View } from 'react-native';
import type { AppText } from '../../../locales/translations';
import type {
  NewsPostItem,
  NewsReadTrackingResponse,
} from '../../../services/newsApi';
import { styles } from '../../../components/SessionCard/SessionCard.styles';
import {
  formatNewsTag,
  getNewsAudienceLabel,
  getNewsLaneFromTitle,
  getVisibleLevelsSummary,
  normalizeNewsTagKey,
  stripNewsLaneMarker,
  type NewsLane,
} from '../lib/dashboardShared';

type DashboardNewsFeedProps = {
  deletingNewsId: number | null;
  expandedNewsTrackingId: number | null;
  isAdmin: boolean;
  isNewsReadForViewer: (post: NewsPostItem) => boolean;
  isTwoColumnFeatureLayout: boolean;
  loadingNewsTrackingId: number | null;
  markingNewsReadId: number | null;
  newsFeed: NewsPostItem[];
  newsFeedError: string | null;
  newsFeedLoading: boolean;
  newsFeedMonths: string[];
  newsFeedTags: string[];
  newsTrackingByPostId: Record<number, NewsReadTrackingResponse>;
  onConfirmNewsRead: (post: NewsPostItem) => Promise<void>;
  onDeleteNews: (post: NewsPostItem) => Promise<void>;
  onOpenNews: (post: NewsPostItem) => Promise<void>;
  onSelectNewsMonth: (month: string) => void;
  onSelectNewsTag: (tag: string) => void;
  onToggleReadTracking: (post: NewsPostItem) => Promise<void>;
  selectedNewsMonth: string;
  selectedNewsTag: string;
  text: AppText;
};

export function DashboardNewsFeed({
  deletingNewsId,
  expandedNewsTrackingId,
  isAdmin,
  isNewsReadForViewer,
  isTwoColumnFeatureLayout,
  loadingNewsTrackingId,
  markingNewsReadId,
  newsFeed,
  newsFeedError,
  newsFeedLoading,
  newsFeedMonths,
  newsFeedTags,
  newsTrackingByPostId,
  onConfirmNewsRead,
  onDeleteNews,
  onOpenNews,
  onSelectNewsMonth,
  onSelectNewsTag,
  onToggleReadTracking,
  selectedNewsMonth,
  selectedNewsTag,
  text,
}: DashboardNewsFeedProps) {
  const unreadCount = isAdmin
    ? 0
    : newsFeed.filter((item) => !isNewsReadForViewer(item)).length;
  const totalCount = newsFeed.length;
  const laneConfigs: Array<{
    key: NewsLane;
    label: string;
    color: string;
    badgeBorder: string;
    badgeBackground: string;
  }> = [
    {
      key: 'NEWS',
      label: text.dashboard.newsColumnNews,
      color: '#c9545b',
      badgeBorder: 'rgba(201,84,91,0.56)',
      badgeBackground: 'rgba(201,84,91,0.14)',
    },
    {
      key: 'CONGRATS',
      label: text.dashboard.newsColumnCongrats,
      color: '#d77a95',
      badgeBorder: 'rgba(215,122,149,0.56)',
      badgeBackground: 'rgba(215,122,149,0.14)',
    },
    {
      key: 'CRITIQUE',
      label: text.dashboard.newsColumnCritique,
      color: '#ab1e24',
      badgeBorder: 'rgba(171,30,36,0.56)',
      badgeBackground: 'rgba(171,30,36,0.16)',
    },
  ];

  const lanePosts = newsFeed
    .slice(0, 24)
    .reduce<Record<NewsLane, NewsPostItem[]>>(
      (accumulator, post) => {
        const lane = getNewsLaneFromTitle(post.title);
        accumulator[lane].push(post);
        return accumulator;
      },
      {
        NEWS: [],
        CONGRATS: [],
        CRITIQUE: [],
      },
    );

  return (
    <View style={[styles.quickBlock, styles.newsFeedHighlightBlock]}>
      <View
        style={[
          styles.newsFeedHeaderShell,
          isTwoColumnFeatureLayout && styles.newsFeedHeaderShellWide,
        ]}
      >
        <View style={styles.newsFeedHeaderMain}>
          <Text style={styles.panelTitleOnDark}>
            {text.dashboard.newsFeedTitle}
          </Text>
          <Text style={styles.newsFeedHeaderDescription}>
            {text.dashboard.newsFeedSubtitle}
          </Text>
        </View>

        <View style={styles.newsFeedSummaryRail}>
          <View style={styles.newsFeedSummaryPill}>
            <Text style={styles.newsFeedSummaryPillValue}>{totalCount}</Text>
            <Text style={styles.newsFeedSummaryPillLabel}>
              {text.dashboard.newsFeedTitle}
            </Text>
          </View>
          {!isAdmin ? (
            <View style={styles.newsFeedSummaryPill}>
              <Text style={styles.newsFeedSummaryPillValue}>{unreadCount}</Text>
              <Text style={styles.newsFeedSummaryPillLabel}>
                {text.dashboard.newsUnreadLabel}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <View
        style={[
          styles.newsFeedToolbar,
          isTwoColumnFeatureLayout && styles.newsFeedToolbarWide,
        ]}
      >
        <View style={styles.newsFeedFilterGroup}>
          <View style={styles.newsFeedFilterGroupHeader}>
            <Text style={styles.newsFeedFilterLabel}>
              {text.dashboard.newsMonthFilterLabel}
            </Text>
            <Text style={styles.newsFeedFilterValue}>
              {selectedNewsMonth === 'ALL'
                ? text.dashboard.newsMonthFilterAll
                : selectedNewsMonth}
            </Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.newsFilterTabs}
          >
            <Pressable
              style={[
                styles.newsFilterChip,
                selectedNewsMonth === 'ALL' && styles.newsFilterChipActive,
              ]}
              onPress={() => onSelectNewsMonth('ALL')}
            >
              <Text
                style={[
                  styles.newsFilterChipText,
                  selectedNewsMonth === 'ALL' &&
                    styles.newsFilterChipTextActive,
                ]}
              >
                {text.dashboard.newsMonthFilterAll}
              </Text>
            </Pressable>

            {newsFeedMonths.map((month) => {
              const isActive = selectedNewsMonth === month;
              return (
                <Pressable
                  key={`news-month-${month}`}
                  style={[
                    styles.newsFilterChip,
                    isActive && styles.newsFilterChipActive,
                  ]}
                  onPress={() => onSelectNewsMonth(month)}
                >
                  <Text
                    style={[
                      styles.newsFilterChipText,
                      isActive && styles.newsFilterChipTextActive,
                    ]}
                  >
                    {month}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.newsFeedFilterGroup}>
          <View style={styles.newsFeedFilterGroupHeader}>
            <Text style={styles.newsFeedFilterLabel}>
              {text.dashboard.newsTagFilterLabel}
            </Text>
            <Text style={styles.newsFeedFilterValue}>
              {selectedNewsTag === 'ALL'
                ? text.dashboard.newsTagFilterAll
                : formatNewsTag(selectedNewsTag)}
            </Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.newsFilterTabs}
          >
            <Pressable
              style={[
                styles.newsFilterChip,
                selectedNewsTag === 'ALL' && styles.newsFilterChipActive,
              ]}
              onPress={() => onSelectNewsTag('ALL')}
            >
              <Text
                style={[
                  styles.newsFilterChipText,
                  selectedNewsTag === 'ALL' && styles.newsFilterChipTextActive,
                ]}
              >
                {text.dashboard.newsTagFilterAll}
              </Text>
            </Pressable>

            {newsFeedTags.map((tag) => {
              const isActive =
                normalizeNewsTagKey(selectedNewsTag) ===
                normalizeNewsTagKey(tag);
              return (
                <Pressable
                  key={`news-tag-${tag}`}
                  style={[
                    styles.newsFilterChip,
                    isActive && styles.newsFilterChipActive,
                  ]}
                  onPress={() => onSelectNewsTag(tag)}
                >
                  <Text
                    style={[
                      styles.newsFilterChipText,
                      isActive && styles.newsFilterChipTextActive,
                    ]}
                  >
                    {formatNewsTag(tag)}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>

      {newsFeedLoading ? (
        <Text style={styles.panelSubtitleOnDark}>
          {text.adminTraining.loading}
        </Text>
      ) : null}
      {newsFeedError ? <Text style={styles.errorText}>{newsFeedError}</Text> : null}

      {!newsFeedLoading && !newsFeedError && newsFeed.length === 0 ? (
        <Text style={styles.panelSubtitleOnDark}>
          {text.dashboard.newsFeedEmpty}
        </Text>
      ) : null}

      {!newsFeedLoading && !newsFeedError && newsFeed.length > 0 ? (
        <View style={styles.newsBoard}>
          {laneConfigs.map((laneConfig) => (
            <View
              key={`news-lane-${laneConfig.key}`}
              style={styles.newsLaneColumn}
            >
              <View style={styles.newsLaneHeader}>
                <View style={styles.newsLaneTitleWrap}>
                  <View
                    style={[
                      styles.newsLaneDot,
                      { backgroundColor: laneConfig.color },
                    ]}
                  />
                  <Text style={styles.newsLaneTitle}>{laneConfig.label}</Text>
                </View>
                <Text style={styles.newsLaneCount}>
                  {lanePosts[laneConfig.key].length}
                </Text>
              </View>

              <View style={styles.newsLaneBody}>
                {lanePosts[laneConfig.key].length === 0 ? (
                  <View style={styles.newsLaneEmptyState}>
                    <Text style={styles.panelSubtitleOnDark}>
                      {text.dashboard.newsFeedEmpty}
                    </Text>
                  </View>
                ) : (
                  lanePosts[laneConfig.key].map((post) => {
                    const isPostRead = isNewsReadForViewer(post);

                    return (
                      <Pressable
                        key={`news-${laneConfig.key}-${post.id}`}
                        style={[
                          styles.newsPostCard,
                          !isPostRead && styles.newsPostCardUnread,
                        ]}
                        onPress={() => {
                          void onOpenNews(post);
                        }}
                      >
                        <View style={styles.newsPostMetaRow}>
                          <Text style={styles.newsPostMetaText}>
                            {new Date(post.createdAt).toLocaleString()}
                          </Text>
                          <Text
                            style={[
                              styles.newsPostTag,
                              {
                                borderColor: laneConfig.badgeBorder,
                                backgroundColor: laneConfig.badgeBackground,
                              },
                            ]}
                          >
                            {laneConfig.label}
                          </Text>
                        </View>

                        <View style={styles.quickNewsRowHeader}>
                          <Text style={styles.newsPostTitle}>
                            {stripNewsLaneMarker(post.title)}
                          </Text>

                          {!isAdmin ? (
                            <Pressable
                              style={[
                                styles.newsPostActionButton,
                                isPostRead && styles.newsPostActionButtonDone,
                                markingNewsReadId === post.id &&
                                  styles.buttonDisabled,
                              ]}
                              accessibilityLabel={
                                text.dashboard.newsConfirmReadButton
                              }
                              disabled={
                                isPostRead || markingNewsReadId === post.id
                              }
                              onPress={(event) => {
                                event.stopPropagation?.();
                                void onConfirmNewsRead(post);
                              }}
                            >
                              <Ionicons
                                name={
                                  isPostRead
                                    ? 'checkmark-done-outline'
                                    : markingNewsReadId === post.id
                                      ? 'hourglass-outline'
                                      : 'checkmark-outline'
                                }
                                size={18}
                                color={isPostRead ? '#2f7d32' : '#7f1b21'}
                              />
                            </Pressable>
                          ) : (
                            <Pressable
                              style={[
                                styles.newsPostActionButton,
                                expandedNewsTrackingId === post.id &&
                                  styles.newsPostActionButtonActive,
                                loadingNewsTrackingId === post.id &&
                                  styles.buttonDisabled,
                              ]}
                              accessibilityLabel={
                                text.dashboard.newsReadTrackingButton
                              }
                              disabled={loadingNewsTrackingId === post.id}
                              onPress={(event) => {
                                event.stopPropagation?.();
                                void onToggleReadTracking(post);
                              }}
                            >
                              <Ionicons
                                name={
                                  loadingNewsTrackingId === post.id
                                    ? 'hourglass-outline'
                                    : 'people-outline'
                                }
                                size={18}
                                color="#7f1b21"
                              />
                            </Pressable>
                          )}
                        </View>

                        <Text style={styles.newsPostBodyText} numberOfLines={4}>
                          {post.message}
                        </Text>

                        <View style={styles.newsPostFooterBlock}>
                          <View style={styles.newsTagRow}>
                            <View style={styles.newsAudiencePill}>
                              <Text style={styles.newsAudiencePillText}>
                                {getNewsAudienceLabel(post.audience, text)}
                              </Text>
                            </View>
                            {post.tags.map((tag) => (
                              <View
                                key={`news-post-tag-${post.id}-${tag}`}
                                style={styles.newsIndexedTag}
                              >
                                <Text style={styles.newsIndexedTagText}>
                                  {formatNewsTag(tag)}
                                </Text>
                              </View>
                            ))}
                          </View>

                          <Text style={styles.newsPostMetaText}>
                            {post.createdBy.name ?? post.createdBy.email}
                          </Text>
                          <Text style={styles.newsPostMetaText}>
                            {`${text.dashboard.newsVisibleLevelsLabel}: ${getVisibleLevelsSummary(post.visibleEmployeeLevels, text)}`}
                          </Text>

                          {!isAdmin ? (
                            <Text style={styles.panelSubtitleOnDark}>
                              {isPostRead
                                ? text.dashboard.newsReadConfirmed
                                : text.dashboard.newsReadPendingConfirm}
                            </Text>
                          ) : null}

                          {post.attachment ? (
                            <Text style={styles.quickNewsLink}>
                              {post.attachment.originalName}
                            </Text>
                          ) : null}
                        </View>

                        {isAdmin && expandedNewsTrackingId === post.id ? (
                          <View style={styles.newsTrackingCard}>
                            {newsTrackingByPostId[post.id] ? (
                              <>
                                <Text style={styles.panelSectionLabelOnDark}>
                                  {text.dashboard.newsReadTrackingTitle}
                                </Text>
                                <Text style={styles.panelSubtitleOnDark}>
                                  {`${text.dashboard.newsReadTrackingGlobal}: ${newsTrackingByPostId[post.id].readCount}/${newsTrackingByPostId[post.id].totalUsers}`}
                                </Text>

                                {newsTrackingByPostId[post.id].byRestaurant.map(
                                  (group) => (
                                    <View
                                      key={`news-tracking-restaurant-${post.id}-${group.restaurant?.id ?? 'none'}`}
                                      style={styles.newsTrackingRestaurantGroup}
                                    >
                                      <Text
                                        style={styles.panelSectionLabelOnDark}
                                      >
                                        {group.restaurant?.name ??
                                          text.dashboard
                                            .newsReadTrackingNoRestaurant}
                                      </Text>
                                      <Text style={styles.panelSubtitleOnDark}>
                                        {`${text.dashboard.newsReadTrackingUnread}: ${group.unreadCount} | ${text.dashboard.newsReadTrackingRead}: ${group.readCount}`}
                                      </Text>

                                      {group.unreadUsers.length === 0 ? (
                                        <Text
                                          style={styles.panelSubtitleOnDark}
                                        >
                                          {
                                            text.dashboard
                                              .newsReadTrackingAllRead
                                          }
                                        </Text>
                                      ) : (
                                        group.unreadUsers.map((unreadUser) => (
                                          <Text
                                            key={`news-tracking-user-${post.id}-${unreadUser.id}`}
                                            style={styles.panelSubtitleOnDark}
                                          >
                                            {`- ${unreadUser.name ?? unreadUser.email} (${text.dashboard.roleValues[unreadUser.role]} / ${text.dashboard.levels[unreadUser.employeeLevel]})`}
                                          </Text>
                                        ))
                                      )}
                                    </View>
                                  ),
                                )}
                              </>
                            ) : (
                              <Text style={styles.panelSubtitleOnDark}>
                                {text.adminTraining.loading}
                              </Text>
                            )}
                          </View>
                        ) : null}

                        {isAdmin ? (
                          <Pressable
                            style={[
                              styles.newsPostDeleteButton,
                              deletingNewsId === post.id &&
                                styles.buttonDisabled,
                            ]}
                            accessibilityLabel={text.dashboard.newsDeleteButton}
                            disabled={deletingNewsId === post.id}
                            onPress={(event) => {
                              event.stopPropagation?.();
                              void onDeleteNews(post);
                            }}
                          >
                            <Ionicons
                              name={
                                deletingNewsId === post.id
                                  ? 'hourglass-outline'
                                  : 'trash-outline'
                              }
                              size={18}
                              color="#ab1e24"
                            />
                          </Pressable>
                        ) : null}
                      </Pressable>
                    );
                  })
                )}
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
