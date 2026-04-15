import { useState } from 'react';
import { ScrollView, Text, useWindowDimensions, View } from 'react-native';
import type { AppText } from '../../locales/translations';
import type {
  OrderReturnSummary,
  OrderSummary,
} from '../../services/ordersApi';
import type { Restaurant } from '../../types/auth';
import { deleteOrderReturn } from '../../services/ordersApi';
import { ConfirmDialog } from '../ConfirmDialog';
import { OrderHistoryAnalytics } from './OrderHistoryAnalytics';
import { OrderHistoryDateGroup } from './OrderHistoryDateGroup';
import { styles } from './OrderHistoryPage.styles';
import { OrderHistoryToolbar } from './OrderHistoryToolbar';
import { OrderReturnModal } from './OrderReturnModal';
import { useOrderHistory } from './useOrderHistory';
import { useOrderReturnFlow } from './useOrderReturnFlow';
import { BREAKPOINT_WIDE } from '../../constants/breakpoints';

type OrderHistoryPageProps = {
  text: AppText;
  accessToken: string;
  orders: OrderSummary[];
  orderReturns: OrderReturnSummary[];
  restaurantOptions: Restaurant[];
  selectedRestaurantId: number | null;
  allRestaurantsLabel: string;
  canSelectAllRestaurants: boolean;
  isLoading: boolean;
  deletingOrderId: number | null;
  onSelectRestaurantId: (restaurantId: number | null) => void;
  onRefresh: () => Promise<void>;
  onDeleteReturnSuccess: (returnId: number) => void;
  onDownloadOrderBon: (order: {
    id: number;
    bonUrl: string;
    number?: string;
  }) => void;
  onDeleteOrder: (order: OrderSummary) => void;
};

export function OrderHistoryPage({
  text,
  accessToken,
  orders,
  orderReturns,
  restaurantOptions,
  selectedRestaurantId,
  allRestaurantsLabel,
  canSelectAllRestaurants,
  isLoading,
  deletingOrderId,
  onSelectRestaurantId,
  onRefresh,
  onDeleteReturnSuccess,
  onDownloadOrderBon,
  onDeleteOrder,
}: OrderHistoryPageProps) {
  const { width } = useWindowDimensions();
  const isMediumScreen = width >= 820;
  const isWideLayout = width >= BREAKPOINT_WIDE;
  const [pendingDeleteReturn, setPendingDeleteReturn] =
    useState<OrderReturnSummary | null>(null);
  const [deletingReturnId, setDeletingReturnId] = useState<number | null>(null);
  const [deleteReturnError, setDeleteReturnError] = useState<string | null>(
    null,
  );

  const orderReturnFlow = useOrderReturnFlow({
    accessToken,
    onRefresh,
    text,
  });

  const history = useOrderHistory({
    accessToken,
    orders,
    orderReturns,
    selectedRestaurantId,
    text,
  });

  async function handleConfirmDeleteReturn() {
    if (!pendingDeleteReturn || deletingReturnId !== null) {
      return;
    }

    setDeleteReturnError(null);
    setDeletingReturnId(pendingDeleteReturn.id);

    try {
      await deleteOrderReturn(accessToken, pendingDeleteReturn.id);
      onDeleteReturnSuccess(pendingDeleteReturn.id);
      setPendingDeleteReturn(null);
      await onRefresh();
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === 'Order return not found'
      ) {
        onDeleteReturnSuccess(pendingDeleteReturn.id);
        setPendingDeleteReturn(null);
        await onRefresh();
        return;
      }

      setDeleteReturnError(
        error instanceof Error && error.message.trim()
          ? error.message
          : text.orders.deleteReturnError,
      );
    } finally {
      setDeletingReturnId(null);
    }
  }

  return (
    <View style={styles.pageRoot}>
      <ScrollView
        style={styles.pageScroll}
        contentContainerStyle={styles.pageContent}
        showsVerticalScrollIndicator={false}
      >
        <OrderHistoryAnalytics
          text={text}
          analytics={history.analytics}
          analyticsError={history.analyticsError}
          analyticsLoading={history.analyticsLoading}
          activePeriodLabel={history.activePeriodLabel}
          averageOrderItemsLabel={history.averageOrderItemsLabel}
          comparisonMax={history.comparisonMax}
          filteredSortedOrdersCount={history.filteredSortedOrders.length}
          filteredTotalAmount={history.filteredTotalAmount}
          filteredTotalItems={history.filteredTotalItems}
          isWideLayout={isWideLayout}
          ordersByDateCount={history.ordersByDate.length}
          selectedSupplierGroup={history.selectedSupplierGroup}
          onRefresh={onRefresh}
        />

        <OrderHistoryToolbar
          text={text}
          groupedOrders={history.groupedOrders}
          restaurantOptions={restaurantOptions}
          selectedRestaurantId={selectedRestaurantId}
          allRestaurantsLabel={allRestaurantsLabel}
          canSelectAllRestaurants={canSelectAllRestaurants}
          selectedSupplierKey={history.selectedSupplierKey}
          search={history.search}
          period={history.period}
          sortBy={history.sortBy}
          isMediumScreen={isMediumScreen}
          onSelectRestaurant={onSelectRestaurantId}
          onSelectSupplier={history.setSelectedSupplierKey}
          onChangeSearch={history.setSearch}
          onChangePeriod={history.setPeriod}
          onChangeSort={history.setSortBy}
        />

        <View style={styles.historyCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderCopy}>
              <Text style={styles.sectionEyebrow}>
                {text.orders.historyTitle}
              </Text>
              <Text style={styles.sectionTitle}>
                {history.selectedSupplierGroup?.supplierName ??
                  text.orders.supplierTabsTitle}
              </Text>
              <Text style={styles.sectionSubtitle}>
                {text.orders.historySubtitle}
              </Text>
            </View>
            <View style={styles.sectionCountPill}>
              <Text style={styles.sectionCountText}>
                {history.filteredSortedOrders.length}
              </Text>
            </View>
          </View>

          {deleteReturnError ? (
            <View style={styles.statusCard}>
              <Text style={styles.statusText}>{deleteReturnError}</Text>
            </View>
          ) : null}

          {isLoading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>{text.orders.loading}</Text>
            </View>
          ) : null}

          {!isLoading && orders.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                {text.orders.historyEmpty}
              </Text>
            </View>
          ) : null}

          {!isLoading &&
          orders.length > 0 &&
          history.filteredSortedOrders.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                {text.orders.historyEmpty}
              </Text>
            </View>
          ) : null}

          {!isLoading && history.filteredSortedOrders.length > 0 ? (
            <View style={styles.listBlock}>
              {history.ordersByDate.map(([date, dateOrders]) => (
                <OrderHistoryDateGroup
                  key={`date-${date}`}
                  text={text}
                  date={date}
                  dateOrders={dateOrders}
                  isOpen={history.expandedDates[date] ?? false}
                  returnsByOrderId={history.returnsByOrderId}
                  deletingOrderId={deletingOrderId}
                  deletingReturnId={deletingReturnId}
                  returnDraftLoadingOrderId={
                    orderReturnFlow.returnDraftLoadingOrderId
                  }
                  onToggle={history.toggleDate}
                  onDownloadOrderBon={onDownloadOrderBon}
                  onOpenReturnDraft={orderReturnFlow.openReturnDraft}
                  onDeleteOrder={onDeleteOrder}
                  onDeleteReturn={setPendingDeleteReturn}
                />
              ))}
            </View>
          ) : null}
        </View>
      </ScrollView>

      <OrderReturnModal
        draft={orderReturnFlow.returnDraft}
        onClose={orderReturnFlow.closeReturnModal}
        onSubmit={orderReturnFlow.submitReturn}
        submitting={orderReturnFlow.submittingReturn}
        text={text}
        visible={orderReturnFlow.returnModalVisible}
      />

      <ConfirmDialog
        visible={orderReturnFlow.successDialogVisible}
        title={text.orders.returnSuccessTitle}
        message={text.orders.returnSuccessMessage}
        cancelLabel={text.orders.returnCancelButton}
        confirmLabel={text.orders.returnCancelButton}
        singleAction
        onCancel={orderReturnFlow.closeSuccessDialog}
        onConfirm={orderReturnFlow.closeSuccessDialog}
      />

      <ConfirmDialog
        visible={Boolean(pendingDeleteReturn)}
        title={text.orders.deleteReturnButton}
        message={text.orders.deleteReturnConfirm}
        cancelLabel={text.orders.deleteReturnCancel}
        confirmLabel={text.orders.deleteReturnConfirmButton}
        destructive
        cancelDisabled={deletingReturnId !== null}
        confirmDisabled={deletingReturnId !== null}
        onCancel={() => setPendingDeleteReturn(null)}
        onConfirm={() => {
          void handleConfirmDeleteReturn();
        }}
      />
    </View>
  );
}
