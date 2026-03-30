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
  const effectiveNewsFeed = Array.isArray(newsFeed) ? newsFeed : [];
  const effectiveNewsFeedMonths = Array.isArray(newsFeedMonths)
    ? newsFeedMonths
    : [];
  const effectiveNewsFeedTags = Array.isArray(newsFeedTags) ? newsFeedTags : [];
  const unreadCount = isAdmin
    ? 0
    : effectiveNewsFeed.filter((item) => !isNewsReadForViewer(item)).length;
  const totalCount = effectiveNewsFeed.length;
  const laneConfigs: Array<{
    key: NewsLane;
    label: string;
    iconName: keyof typeof Ionicons.glyphMap;
    color: string;
    badgeBorder: string;
    badgeBackground: string;
    panelBackground: string;
  }> = [
    {
      key: 'NEWS',
      label: text.dashboard.newsColumnNews,
      iconName: 'newspaper-outline',
      color: '#c9545b',
      badgeBorder: 'rgba(201,84,91,0.56)',
      badgeBackground: 'rgba(201,84,91,0.14)',
      panelBackground: '#fffaf8',
    },
    {
      key: 'CONGRATS',
      label: text.dashboard.newsColumnCongrats,
      iconName: 'sparkles-outline',
      color: '#d77a95',
      badgeBorder: 'rgba(215,122,149,0.56)',
      badgeBackground: 'rgba(215,122,149,0.14)',
      panelBackground: '#fff9fc',
    },
    {
      key: 'CRITIQUE',
      label: text.dashboard.newsColumnCritique,
      iconName: 'alert-circle-outline',
      color: '#ab1e24',
      badgeBorder: 'rgba(171,30,36,0.56)',
      badgeBackground: 'rgba(171,30,36,0.16)',
      panelBackground: '#fff8f6',
    },
  ];

  const lanePosts = effectiveNewsFeed
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

  function renderStateCard(
    iconName: keyof typeof Ionicons.glyphMap,
    title: string,
    description: string,
    tone: 'default' | 'error' = 'default',
  ) {
    return (
      <View
        style={[
          styles.newsFeedStateCard,
          tone === 'error' && styles.newsFeedStateCardError,
        ]}
      >
        <View
          style={[
            styles.newsFeedStateIconWrap,
            tone === 'error' && styles.newsFeedStateIconWrapError,
          ]}
        >
          <Ionicons
            name={iconName}
            size={18}
            color={tone === 'error' ? '#ab1e24' : '#7f1b21'}
          />
        </View>
        <View style={styles.newsFeedStateCopy}>
          <Text style={styles.newsFeedStateTitle}>{title}</Text>
          <Text style={styles.newsFeedStateDescription}>{description}</Text>
        </View>
      </View>
    );
  }

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

            {effectiveNewsFeedMonths.map((month) => {
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

            {effectiveNewsFeedTags.map((tag) => {
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

      {newsFeedLoading
        ? renderStateCard(
            'time-outline',
            text.adminTraining.loading,
            text.dashboard.newsFeedSubtitle,
          )
        : null}
      {newsFeedError
        ? renderStateCard(
            'alert-circle-outline',
            newsFeedError,
            text.dashboard.newsFeedSubtitle,
            'error',
          )
        : null}

      {!newsFeedLoading && !newsFeedError && effectiveNewsFeed.length === 0
        ? renderStateCard(
            'notifications-off-outline',
            text.dashboard.newsFeedEmpty,
            text.dashboard.newsFeedSubtitle,
          )
        : null}

      {!newsFeedLoading && !newsFeedError && effectiveNewsFeed.length > 0 ? (
        <View style={styles.newsBoard}>
          {laneConfigs.map((laneConfig) => (
            <View
              key={`news-lane-${laneConfig.key}`}
              style={[
                styles.newsLaneColumn,
                { backgroundColor: laneConfig.panelBackground },
              ]}
            >
              <View style={styles.newsLaneHeader}>
                <View style={styles.newsLaneTitleWrap}>
                  <View
                    style={[
                      styles.newsLaneIconWrap,
                      { backgroundColor: laneConfig.badgeBackground },
                    ]}
                  >
                    <Ionicons
                      name={laneConfig.iconName}
                      size={15}
                      color={laneConfig.color}
                    />
                  </View>
                  <View style={styles.newsLaneTitleCopy}>
                    <Text style={styles.newsLaneTitle}>{laneConfig.label}</Text>
                    <Text style={styles.newsLaneHint}>
                      {lanePosts[laneConfig.key].length === 0
                        ? text.dashboard.newsFeedEmpty
                        : `${lanePosts[laneConfig.key].length} ${text.dashboard.newsFeedTitle.toLowerCase()}`}
                    </Text>
                  </View>
                </View>
                <Text style={styles.newsLaneCount}>
                  {lanePosts[laneConfig.key].length}
                </Text>
              </View>

              <View style={styles.newsLaneBody}>
                {lanePosts[laneConfig.key].length === 0 ? (
                  <View style={styles.newsLaneEmptyState}>
                    <Ionicons
                      name="albums-outline"
                      size={18}
                      color={laneConfig.color}
                    />
                    <Text style={styles.newsLaneEmptyTitle}>
                      {text.dashboard.newsFeedEmpty}
                    </Text>
                    <Text style={styles.newsLaneEmptyDescription}>
                      {text.dashboard.newsFeedSubtitle}
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
                          <View style={styles.newsPostMetaLead}>
                            <View
                              style={[
                                styles.newsLaneDot,
                                { backgroundColor: laneConfig.color },
                              ]}
                            />
                            <Text
                              style={[
                                styles.newsPostMetaText,
                                !isPostRead && styles.newsPostMetaTextUnread,
                              ]}
                            >
                              {new Date(post.createdAt).toLocaleString()}
                            </Text>
                            {!isPostRead ? (
                              <View style={styles.newsUnreadBadge}>
                                <Text style={styles.newsUnreadBadgeText}>
                                  {text.dashboard.newsUnreadLabel}
                                </Text>
                              </View>
                            ) : null}
                          </View>
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
                          <View style={styles.newsPostHeaderBlock}>
                            <Text
                              style={[
                                styles.newsPostTitle,
                                !isPostRead && styles.newsPostTitleUnread,
                              ]}
                            >
                              {stripNewsLaneMarker(post.title)}
                            </Text>
                            <View style={styles.newsPostAuthorRow}>
                              <Ionicons
                                name="person-circle-outline"
                                size={14}
                                color="#8d5a5f"
                              />
                              <Text style={styles.newsPostAuthorText}>
                                {post.createdBy.name ?? post.createdBy.email}
                              </Text>
                            </View>
                          </View>

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

                        <View style={styles.newsPostBodyBox}>
                          <Text
                            style={[
                              styles.newsPostBodyText,
                              !isPostRead && styles.newsPostBodyTextUnread,
                            ]}
                            numberOfLines={4}
                          >
                            {post.message}
                          </Text>
                        </View>

                        <View style={styles.newsPostFooterBlock}>
                          <View style={styles.newsPostDivider} />
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

                          <View style={styles.newsVisibilityRow}>
                            <Ionicons
                              name="layers-outline"
                              size={14}
                              color="#8d5a5f"
                            />
                            <Text style={styles.newsVisibilityText}>
                              {`${text.dashboard.newsVisibleLevelsLabel}: ${getVisibleLevelsSummary(post.visibleEmployeeLevels, text)}`}
                            </Text>
                          </View>

                          {!isAdmin ? (
                            <Text style={styles.newsPostStatusText}>
                              {isPostRead
                                ? text.dashboard.newsReadConfirmed
                                : text.dashboard.newsReadPendingConfirm}
                            </Text>
                          ) : null}

                          {post.attachment ? (
                            <View style={styles.newsAttachmentRow}>
                              <Ionicons
                                name="attach-outline"
                                size={14}
                                color="#ab1e24"
                              />
                              <Text style={styles.quickNewsLink}>
                                {post.attachment.originalName}
                              </Text>
                            </View>
                          ) : null}
                        </View>

                        {isAdmin && expandedNewsTrackingId === post.id ? (
                          <View style={styles.newsTrackingCard}>
                            {newsTrackingByPostId[post.id] ? (
                              <>
                                <View style={styles.newsTrackingHeader}>
                                  <View style={styles.newsTrackingHeaderMain}>
                                    <Text
                                      style={styles.panelSectionLabelOnDark}
                                    >
                                      {text.dashboard.newsReadTrackingTitle}
                                    </Text>
                                    <Text style={styles.panelSubtitleOnDark}>
                                      {text.dashboard.newsReadTrackingGlobal}
                                    </Text>
                                  </View>
                                  <View style={styles.newsTrackingSummaryPill}>
                                    <Text
                                      style={styles.newsTrackingSummaryPillText}
                                    >
                                      {`${newsTrackingByPostId[post.id].readCount}/${newsTrackingByPostId[post.id].totalUsers}`}
                                    </Text>
                                  </View>
                                </View>

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
                                      <Text
                                        style={
                                          styles.newsTrackingRestaurantMeta
                                        }
                                      >
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
