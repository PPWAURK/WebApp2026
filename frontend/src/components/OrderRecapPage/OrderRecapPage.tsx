import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import type { AppText } from '../../locales/translations';
import { styles } from './OrderRecapPage.styles';
import type { Language } from '../../types/language';
import type { OrderRecapData } from '../../types/order';
import { BREAKPOINT_COMPACT, BREAKPOINT_WIDE } from '../../constants/breakpoints';

type OrderRecapPageProps = {
  text: AppText;
  language: Language;
  recap: OrderRecapData;
  deliveryDate: string;
  deliveryAddress: string;
  isSubmittingOrder: boolean;
  submitError: string | null;
  latestCreatedOrder: { id: number; number: string; bonUrl: string } | null;
  sharePromptVisible: boolean;
  onDeliveryDateChange: (value: string) => void;
  onSubmitOrder: () => void;
  onShareOrderBon: (order: { id: number; bonUrl: string }) => void;
  onDownloadOrderBon: (order: { id: number; bonUrl: string }) => void;
  onCloseSharePrompt: () => void;
  onBack: () => void;
};

function formatAmount(value: number) {
  return value.toFixed(2);
}

export function OrderRecapPage({
  text,
  language,
  recap,
  deliveryDate,
  deliveryAddress,
  isSubmittingOrder,
  submitError,
  latestCreatedOrder,
  sharePromptVisible,
  onDeliveryDateChange,
  onSubmitOrder,
  onShareOrderBon,
  onDownloadOrderBon,
  onCloseSharePrompt,
  onBack,
}: OrderRecapPageProps) {
  const { width } = useWindowDimensions();
  const isSmallScreen = width < BREAKPOINT_COMPACT;
  const isWideLayout = width >= BREAKPOINT_WIDE;
  const useSingleColumnGrid = width < 920;
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const dateOptions = useMemo(() => {
    const start = new Date();
    const options: string[] = [];

    for (let index = 0; index < 21; index += 1) {
      const next = new Date(start);
      next.setDate(start.getDate() + index);
      const year = next.getFullYear();
      const month = String(next.getMonth() + 1).padStart(2, '0');
      const day = String(next.getDate()).padStart(2, '0');
      options.push(`${year}-${month}-${day}`);
    }

    return options;
  }, []);

  return (
    <View style={styles.pageRoot}>
      <Modal
        visible={sharePromptVisible && latestCreatedOrder !== null}
        transparent
        animationType="fade"
        onRequestClose={onCloseSharePrompt}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconWrap}>
                <Ionicons name="paper-plane-outline" size={22} color="#ab1e24" />
              </View>
              <View style={styles.modalCopy}>
                <Text style={styles.modalTitle}>
                  {text.orders.sharePromptTitle}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {text.orders.sharePromptSubtitle}
                </Text>
              </View>
            </View>

            {latestCreatedOrder ? (
              <Text style={styles.modalMeta}>
                {text.orders.orderNumberLabel}: {latestCreatedOrder.number}
              </Text>
            ) : null}

            {latestCreatedOrder ? (
              <Pressable
                style={styles.primaryButton}
                onPress={() => onShareOrderBon(latestCreatedOrder)}
              >
                <Text style={styles.primaryButtonText}>
                  {text.orders.shareToWechatButton}
                </Text>
              </Pressable>
            ) : null}

            <Pressable style={styles.secondaryButton} onPress={onCloseSharePrompt}>
              <Text style={styles.secondaryButtonText}>
                {text.orders.shareLaterButton}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <ScrollView
        style={styles.pageScroll}
        contentContainerStyle={styles.pageContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={styles.heroCopy}>
              <Text style={styles.title}>{text.orders.recapTitle}</Text>
              <Text style={styles.subtitle}>{text.orders.recapSubtitle}</Text>
            </View>

            <View style={styles.heroBadge}>
              <Ionicons name="checkmark-circle-outline" size={16} color="#ab1e24" />
              <Text style={styles.heroBadgeText}>{text.orders.summaryTitle}</Text>
            </View>
          </View>

          <View style={styles.heroStatsRow}>
            <View style={styles.heroStatCard}>
              <Text style={styles.heroStatValue}>{recap.totalItems}</Text>
              <Text style={styles.heroStatLabel}>{text.orders.summaryItems}</Text>
            </View>
            <View style={styles.heroStatCard}>
              <Text style={styles.heroStatValue}>{formatAmount(recap.totalAmount)}</Text>
              <Text style={styles.heroStatLabel}>{text.orders.summaryAmount}</Text>
            </View>
          </View>
        </View>

        {submitError ? <Text style={styles.error}>{submitError}</Text> : null}

        <View style={[styles.mainGrid, isWideLayout && styles.mainGridWide]}>
          <View style={[styles.sidebarColumn, isWideLayout && styles.sidebarColumnWide]}>
            <View style={styles.surfaceCard}>
              <View style={styles.surfaceHeader}>
                <View style={styles.surfaceHeaderCopy}>
                  <Text style={styles.surfaceEyebrow}>
                    {text.orders.deliveryDateLabel}
                  </Text>
                  <Text style={styles.surfaceTitle}>{deliveryDate}</Text>
                  <Text style={styles.surfaceSubtitle}>
                    {text.orders.deliveryAddressLabel}
                  </Text>
                </View>
              </View>

              <Pressable
                style={styles.selectTrigger}
                onPress={() => setIsDatePickerOpen((currentValue) => !currentValue)}
              >
                <View style={styles.selectTriggerCopy}>
                  <Text style={styles.selectTriggerLabel}>
                    {text.orders.deliveryDateLabel}
                  </Text>
                  <Text style={styles.selectTriggerText}>{deliveryDate}</Text>
                </View>
                <Ionicons
                  name={isDatePickerOpen ? 'chevron-up-outline' : 'chevron-down-outline'}
                  size={18}
                  color="#ab1e24"
                />
              </Pressable>

              {isDatePickerOpen ? (
                <View style={styles.selectList}>
                  {dateOptions.map((dateValue) => {
                    const isActive = deliveryDate === dateValue;

                    return (
                      <Pressable
                        key={dateValue}
                        style={[
                          styles.selectItem,
                          isActive && styles.selectItemActive,
                        ]}
                        onPress={() => {
                          onDeliveryDateChange(dateValue);
                          setIsDatePickerOpen(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.selectItemText,
                            isActive && styles.selectItemTextActive,
                          ]}
                        >
                          {dateValue}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}

              <View style={styles.addressCard}>
                <View style={styles.addressIconWrap}>
                  <Ionicons name="location-outline" size={18} color="#ab1e24" />
                </View>
                <View style={styles.addressCopy}>
                  <Text style={styles.addressLabel}>
                    {text.orders.deliveryAddressLabel}
                  </Text>
                  <Text style={styles.addressText}>
                    {deliveryAddress || text.orders.deliveryAddressMissing}
                  </Text>
                </View>
              </View>
            </View>

            {latestCreatedOrder ? (
              <View style={styles.successCard}>
                <View style={styles.successHeader}>
                  <View style={styles.successIconWrap}>
                    <Ionicons
                      name="document-text-outline"
                      size={18}
                      color="#ab1e24"
                    />
                  </View>
                  <View style={styles.successCopy}>
                    <Text style={styles.successTitle}>
                      {text.orders.orderSuccessTitle}
                    </Text>
                    <Text style={styles.successMeta}>
                      {text.orders.orderNumberLabel}: {latestCreatedOrder.number}
                    </Text>
                  </View>
                </View>

                <Pressable
                  style={styles.secondaryButton}
                  onPress={() => onDownloadOrderBon(latestCreatedOrder)}
                >
                  <Text style={styles.secondaryButtonText}>
                    {text.orders.downloadBonButton}
                  </Text>
                </Pressable>
              </View>
            ) : null}

            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>{text.orders.summaryTitle}</Text>
              <View style={styles.summaryMetricRow}>
                <Text style={styles.summaryMetricLabel}>{text.orders.summaryItems}</Text>
                <Text style={styles.summaryMetricValue}>{recap.totalItems}</Text>
              </View>
              <View style={styles.summaryMetricRow}>
                <Text style={styles.summaryMetricLabel}>
                  {text.orders.summaryAmount}
                </Text>
                <Text style={styles.summaryMetricValue}>
                  {formatAmount(recap.totalAmount)}
                </Text>
              </View>

              <Pressable
                style={[styles.primaryButton, isSubmittingOrder && styles.buttonDisabled]}
                disabled={isSubmittingOrder}
                onPress={onSubmitOrder}
              >
                <Text style={styles.primaryButtonText}>
                  {isSubmittingOrder
                    ? text.orders.submittingOrder
                    : text.orders.submitOrderButton}
                </Text>
              </Pressable>

              <Pressable style={styles.secondaryButton} onPress={onBack}>
                <Text style={styles.secondaryButtonText}>
                  {text.orders.backToOrderButton}
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.contentColumn}>
            <View style={styles.surfaceCard}>
              <View style={styles.surfaceHeader}>
                <View style={styles.surfaceHeaderCopy}>
                  <Text style={styles.surfaceEyebrow}>{text.orders.summaryTitle}</Text>
                  <Text style={styles.surfaceTitle}>{text.orders.recapTitle}</Text>
                  <Text style={styles.surfaceSubtitle}>{deliveryDate}</Text>
                </View>
                <View style={styles.surfaceCountPill}>
                  <Text style={styles.surfaceCountText}>{recap.items.length}</Text>
                </View>
              </View>

              <View style={[styles.productGrid, styles.listBlock]}>
                {recap.items.map((item) => {
                  const productName =
                    language === 'zh' ? item.nameZh : item.nameFr ?? item.nameZh;
                  const productGridItemStyle = useSingleColumnGrid
                    ? styles.productGridItemSmall
                    : styles.productGridItem;

                  return (
                    <View
                      key={item.orderItemKey}
                      style={[styles.productCard, productGridItemStyle]}
                    >
                      <View
                        style={[
                          styles.productInfoRow,
                          isSmallScreen && styles.productInfoRowSmall,
                        ]}
                      >
                        {item.image ? (
                          <View
                            style={[
                              styles.productImageFrame,
                              isSmallScreen && styles.productImageFrameSmall,
                            ]}
                          >
                            <Image
                              source={{ uri: item.image }}
                              style={styles.productImageThumb}
                              resizeMode="cover"
                            />
                          </View>
                        ) : (
                          <View
                            style={[
                              styles.productImagePlaceholder,
                              isSmallScreen && styles.productImageFrameSmall,
                            ]}
                          >
                            <Ionicons
                              name="image-outline"
                              size={24}
                              color="#ab1e24"
                            />
                          </View>
                        )}

                        <View
                          style={[
                            styles.productInfoColumn,
                            isSmallScreen && styles.productInfoColumnSmall,
                          ]}
                        >
                          <Text style={styles.productTitle}>{productName}</Text>
                          {item.specification ? (
                            <Text style={styles.productSpecificationText}>
                              {item.specification}
                            </Text>
                          ) : null}
                          <Text style={styles.docItemMeta}>
                            {text.orders.unitLabel}:{' '}
                            {item.unit ?? text.orders.unitNotAvailable}
                          </Text>
                          <Text style={styles.docItemMeta}>
                            {text.orders.quantityLabel}: {item.quantity}
                          </Text>
                          <Text style={styles.docItemMeta}>
                            {text.orders.priceLabel}:{' '}
                            {item.priceHt === null
                              ? text.orders.priceNotAvailable
                              : formatAmount(item.priceHt)}
                          </Text>
                          <Text style={styles.lineTotalText}>
                            {text.orders.lineTotalLabel}: {formatAmount(item.lineTotal)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
