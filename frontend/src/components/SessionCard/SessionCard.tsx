import { useWindowDimensions, View } from 'react-native';
import { AdminRestaurantPanel } from '../AdminRestaurantPanel';
import { AdminTrainingAccessPanel } from '../AdminTrainingAccessPanel';
import { AdminUploadPanel } from '../AdminUploadPanel';
import { ConfirmDialog } from '../ConfirmDialog';
import { DashboardHighlights } from '../../features/dashboard/components/DashboardHighlights';
import { DashboardLatestOrderCard } from '../../features/dashboard/components/DashboardLatestOrderCard';
import { DashboardNewsFeed } from '../../features/dashboard/components/DashboardNewsFeed';
import { DashboardOrderPreviewModal } from '../../features/dashboard/components/DashboardOrderPreviewModal';
import { DashboardReturnPhotosModal } from '../../features/dashboard/components/DashboardReturnPhotosModal';
import { DashboardReturnSummaryCard } from '../../features/dashboard/components/DashboardReturnSummaryCard';
import { DashboardTopProductsChart } from '../../features/dashboard/components/DashboardTopProductsChart';
import { useDashboardNewsFeed } from '../../features/dashboard/hooks/useDashboardNewsFeed';
import { useDashboardOrderInsights } from '../../features/dashboard/hooks/useDashboardOrderInsights';
import { styles } from './SessionCard.styles';
import { SessionCardAdminQuickPanel } from './SessionCardAdminQuickPanel';
import { SessionCardLevelEditorModal } from './SessionCardLevelEditorModal';
import { SessionCardManagerToolsGrid } from './SessionCardManagerToolsGrid';
import type { SessionCardProps } from './SessionCard.types';
import { SessionCardWhatsNewPanel } from './SessionCardWhatsNewPanel';
import { useSessionCardConfirmDialog } from './useSessionCardConfirmDialog';
import { useSessionCardSupervisorState } from './useSessionCardSupervisorState';
import { useSessionCardWhatsNewState } from './useSessionCardWhatsNewState';

export function SessionCard({ user, accessToken, text }: SessionCardProps) {
  const { width } = useWindowDimensions();
  const isWideLayout = width >= 1180;
  const isTwoColumnFeatureLayout = width >= 900;
  const isInsightGridWide = width >= 960;
  const isCompactDashboardCards = width < 820;
  const isAdmin = user.role === 'ADMIN';
  const isCompactAdminCardLayout = width < 760 || (isAdmin && isWideLayout);
  const isManager = user.role === 'MANAGER';
  const isSupervisor = isManager || isAdmin;

  const confirmDialogState = useSessionCardConfirmDialog(text);
  const orderInsights = useDashboardOrderInsights({
    accessToken,
    isSupervisor,
    text,
  });
  const newsFeedState = useDashboardNewsFeed({
    accessToken,
    confirmAction: confirmDialogState.confirmAction,
    isAdmin,
    text,
  });
  const supervisorState = useSessionCardSupervisorState({
    accessToken,
    confirmAction: confirmDialogState.confirmAction,
    currentUser: user,
    isAdmin,
    isManager,
    isSupervisor,
    text,
  });
  const whatsNewState = useSessionCardWhatsNewState({
    accessToken,
    integratePublishedPost: newsFeedState.integratePublishedPost,
    text,
  });

  const roleLabel = text.dashboard.roleValues[user.role];
  const workplaceLabel = text.dashboard.workplaceValues[user.workplaceRole];
  const restaurantLabel = user.restaurant?.name ?? text.profile.noRestaurant;
  const addressLabel = user.restaurant?.address ?? text.profile.noAddress;
  const unreadNewsCount = isAdmin
    ? 0
    : newsFeedState.newsFeed.filter(
        (item) => !newsFeedState.isNewsReadForViewer(item),
      ).length;
  const latestOrderValue = orderInsights.latestOrder?.number ?? '-';
  const latestOrderMeta = orderInsights.latestOrder
    ? `${orderInsights.latestOrder.totalItems} ${text.orders.summaryItems}`
    : text.dashboard.quickNoOrder;
  const dashboardHighlights: Array<{
    key: string;
    label: string;
    value: string;
    meta: string;
    icon:
      | 'shield-checkmark-outline'
      | 'business-outline'
      | 'notifications-outline'
      | 'receipt-outline'
      | 'people-outline'
      | 'school-outline';
  }> = [
    {
      key: 'role',
      label: text.dashboard.role,
      value: roleLabel,
      meta: workplaceLabel,
      icon: 'shield-checkmark-outline',
    },
    {
      key: 'restaurant',
      label: text.profile.restaurantLabel,
      value: restaurantLabel,
      meta: addressLabel,
      icon: 'business-outline',
    },
    {
      key: 'news',
      label: text.dashboard.newsFeedTitle,
      value: `${unreadNewsCount}`,
      meta: text.dashboard.newsUnreadLabel,
      icon: 'notifications-outline',
    },
    isAdmin
      ? {
          key: 'restaurant-count',
          label: text.landing.metrics.restaurants,
          value: `${supervisorState.restaurants.length}`,
          meta: text.profile.restaurantLabel,
          icon: 'business-outline',
        }
      : {
          key: 'latest-order',
          label: text.dashboard.quickLatestOrderTitle,
          value: latestOrderValue,
          meta: latestOrderMeta,
          icon: 'receipt-outline',
        },
  ];

  if (isSupervisor) {
    const pendingAccountCount =
      supervisorState.accountApprovalUsers.length +
      supervisorState.emailVerificationUsers.length;

    dashboardHighlights.push({
      key: 'approval',
      label: isAdmin
        ? text.dashboard.quickApproveManagerTitle
        : text.dashboard.quickApproveTitle,
      value: `${pendingAccountCount}`,
      meta: `${supervisorState.users.length}`,
      icon: 'people-outline',
    });
  } else {
    dashboardHighlights.push({
      key: 'training-access',
      label: text.profile.trainingAccessLabel,
      value: `${user.trainingAccess.length}`,
      meta: text.profile.trainingAccessLabel,
      icon: 'school-outline',
    });
  }

  return (
    <View style={styles.dashboardStack}>
      <DashboardHighlights
        highlights={dashboardHighlights}
        isWideLayout={isWideLayout}
      />

      <View style={styles.dashboardNewsRow}>
        <DashboardNewsFeed
          deletingNewsId={newsFeedState.deletingNewsId}
          expandedNewsTrackingId={newsFeedState.expandedNewsTrackingId}
          isAdmin={isAdmin}
          isNewsReadForViewer={newsFeedState.isNewsReadForViewer}
          isTwoColumnFeatureLayout={isTwoColumnFeatureLayout}
          loadingNewsTrackingId={newsFeedState.loadingNewsTrackingId}
          markingNewsReadId={newsFeedState.markingNewsReadId}
          newsFeed={newsFeedState.newsFeed}
          newsFeedError={newsFeedState.newsFeedError}
          newsFeedLoading={newsFeedState.newsFeedLoading}
          newsFeedMonths={newsFeedState.newsFeedMonths}
          newsFeedTags={newsFeedState.newsFeedTags}
          newsTrackingByPostId={newsFeedState.newsTrackingByPostId}
          onConfirmNewsRead={newsFeedState.handleConfirmNewsRead}
          onDeleteNews={newsFeedState.handleDeleteNews}
          onOpenNews={newsFeedState.handleOpenNews}
          onSelectNewsMonth={newsFeedState.setSelectedNewsMonth}
          onSelectNewsTag={newsFeedState.setSelectedNewsTag}
          onToggleReadTracking={newsFeedState.handleToggleReadTracking}
          selectedNewsMonth={newsFeedState.selectedNewsMonth}
          selectedNewsTag={newsFeedState.selectedNewsTag}
          text={text}
        />
      </View>

      {isAdmin ? (
        <>
          <View
            style={[
              styles.dashboardInsightGrid,
              isWideLayout && styles.dashboardInsightGridWide,
            ]}
          >
            <View
              style={[
                styles.dashboardInsightCard,
                isWideLayout
                  ? styles.dashboardInsightCardFlexible
                  : styles.dashboardInsightCardStacked,
              ]}
            >
              <SessionCardWhatsNewPanel
                isCompactAdminCardLayout={isCompactAdminCardLayout}
                text={text}
                whatsNewState={whatsNewState}
              />
            </View>
            <View
              style={[
                styles.dashboardInsightCard,
                isWideLayout
                  ? styles.dashboardInsightCardFlexible
                  : styles.dashboardInsightCardStacked,
              ]}
            >
              <SessionCardAdminQuickPanel
                isCompactAdminCardLayout={isCompactAdminCardLayout}
                supervisorState={supervisorState}
                text={text}
              />
            </View>
            <View
              style={[
                styles.dashboardInsightCard,
                isWideLayout
                  ? styles.dashboardInsightCardFlexible
                  : styles.dashboardInsightCardStacked,
              ]}
            >
              <AdminRestaurantPanel accessToken={accessToken} text={text} />
            </View>
          </View>

          <View style={styles.dashboardAdminToolStack}>
            <AdminTrainingAccessPanel
              accessToken={accessToken}
              currentUser={user}
              text={text}
            />
            <AdminUploadPanel accessToken={accessToken} text={text} />
          </View>
        </>
      ) : null}

      {isManager ? (
        <View style={styles.dashboardContentGrid}>
          <View
            style={[
              styles.dashboardInsightGrid,
              isInsightGridWide && styles.dashboardInsightGridWide,
            ]}
          >
            <View
              style={[
                styles.dashboardInsightCard,
                isInsightGridWide
                  ? styles.dashboardInsightCardFlexible
                  : styles.dashboardInsightCardStacked,
              ]}
            >
              <DashboardLatestOrderCard
                isCompactLayout={isCompactDashboardCards}
                latestOrder={orderInsights.latestOrder}
                onOpenPreview={orderInsights.openOrderPreview}
                orderError={orderInsights.orderError}
                orderLoading={orderInsights.orderLoading}
                orderPreviewLoading={orderInsights.orderPreviewLoading}
                orderPreviewUrl={orderInsights.orderPreviewUrl}
                text={text}
              />
            </View>
            <View
              style={[
                styles.dashboardInsightCard,
                isInsightGridWide
                  ? styles.dashboardInsightCardFlexible
                  : styles.dashboardInsightCardStacked,
              ]}
            >
              <DashboardReturnSummaryCard
                isCompactLayout={isCompactDashboardCards}
                onOpenReturnPhotos={orderInsights.openReturnPhotos}
                recentReturns={orderInsights.recentReturns}
                returnsError={orderInsights.returnsError}
                returnsLoading={orderInsights.returnsLoading}
                text={text}
              />
            </View>
          </View>

          <View
            style={[
              styles.dashboardInsightCard,
              styles.dashboardInsightCardStacked,
            ]}
          >
            <DashboardTopProductsChart
              chartMonths={orderInsights.chartMonths}
              chartSuppliers={orderInsights.chartSuppliers}
              isWideLayout={isWideLayout}
              onSelectMonth={orderInsights.setSelectedChartMonth}
              onSelectSupplier={orderInsights.setSelectedChartSupplierId}
              selectedChartMonth={orderInsights.selectedChartMonth}
              selectedChartSupplierId={orderInsights.selectedChartSupplierId}
              text={text}
              topProducts={orderInsights.topProducts}
              topProductsError={orderInsights.topProductsError}
              topProductsLoading={orderInsights.topProductsLoading}
            />
          </View>

          <SessionCardManagerToolsGrid
            isWideLayout={isWideLayout}
            supervisorState={supervisorState}
            text={text}
          />
        </View>
      ) : null}

      <DashboardOrderPreviewModal
        latestOrder={orderInsights.latestOrder}
        onClose={orderInsights.closeOrderPreview}
        orderPreviewUrl={orderInsights.orderPreviewUrl}
        text={text}
        visible={orderInsights.isOrderPreviewOpen}
      />

      <DashboardReturnPhotosModal
        entry={orderInsights.selectedReturnForPhotos}
        onClose={orderInsights.closeReturnPhotos}
        text={text}
        visible={orderInsights.isReturnPhotosOpen}
      />

      <SessionCardLevelEditorModal
        supervisorState={supervisorState}
        text={text}
      />

      <ConfirmDialog
        visible={confirmDialogState.confirmDialog.visible}
        title={confirmDialogState.confirmDialog.title}
        message={confirmDialogState.confirmDialog.message}
        cancelLabel={confirmDialogState.confirmDialog.cancelLabel}
        confirmLabel={confirmDialogState.confirmDialog.confirmLabel}
        destructive={confirmDialogState.confirmDialog.destructive}
        onCancel={() => confirmDialogState.closeConfirmDialog(false)}
        onConfirm={() => confirmDialogState.closeConfirmDialog(true)}
      />
    </View>
  );
}
