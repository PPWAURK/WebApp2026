import { ScrollView, Text, useWindowDimensions, View } from 'react-native';
import type { AppText } from '../../locales/translations';
import type {
  OrderReturnSummary,
  OrderSummary,
} from '../../services/ordersApi';
import { ConfirmDialog } from '../ConfirmDialog';
import { OrderHistoryAnalytics } from './OrderHistoryAnalytics';
import { OrderHistoryDateGroup } from './OrderHistoryDateGroup';
import { styles } from './OrderHistoryPage.styles';
import { OrderHistoryToolbar } from './OrderHistoryToolbar';
import { OrderReturnModal } from './OrderReturnModal';
import { useOrderHistory } from './useOrderHistory';
import { useOrderReturnFlow } from './useOrderReturnFlow';

type OrderHistoryPageProps = {
  text: AppText;
  accessToken: string;
  orders: OrderSummary[];
  orderReturns: OrderReturnSummary[];
  isLoading: boolean;
  deletingOrderId: number | null;
  onRefresh: () => void;
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
  isLoading,
  deletingOrderId,
  onRefresh,
  onDownloadOrderBon,
  onDeleteOrder,
}: OrderHistoryPageProps) {
  const { width } = useWindowDimensions();
  const isMediumScreen = width >= 820;
  const isWideLayout = width >= 1180;

  const orderReturnFlow = useOrderReturnFlow({
    accessToken,
    onRefresh,
    text,
  });

  const history = useOrderHistory({
    accessToken,
    orders,
    orderReturns,
    text,
  });

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
          selectedSupplierKey={history.selectedSupplierKey}
          search={history.search}
          period={history.period}
          sortBy={history.sortBy}
          isMediumScreen={isMediumScreen}
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
                  returnDraftLoadingOrderId={
                    orderReturnFlow.returnDraftLoadingOrderId
                  }
                  onToggle={history.toggleDate}
                  onDownloadOrderBon={onDownloadOrderBon}
                  onOpenReturnDraft={orderReturnFlow.openReturnDraft}
                  onDeleteOrder={onDeleteOrder}
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
    </View>
  );
}
