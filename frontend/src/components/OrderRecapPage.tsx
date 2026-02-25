import { useMemo, useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import type { AppText } from '../locales/translations';
import type { OrderSummary } from '../services/ordersApi';
import { styles } from '../styles/appStyles';
import type { Language } from '../types/language';
import type { OrderRecapData } from '../types/order';

type OrderRecapPageProps = {
  text: AppText;
  language: Language;
  recap: OrderRecapData;
  deliveryDate: string;
  deliveryAddress: string;
  isSubmittingOrder: boolean;
  latestCreatedOrder: { id: number; number: string; bonUrl: string } | null;
  orderHistory: OrderSummary[];
  onDeliveryDateChange: (value: string) => void;
  onSubmitOrder: () => void;
  onDownloadOrderBon: (order: { id: number; bonUrl: string }) => void;
  onBack: () => void;
};

export function OrderRecapPage({
  text,
  language,
  recap,
  deliveryDate,
  deliveryAddress,
  isSubmittingOrder,
  latestCreatedOrder,
  orderHistory,
  onDeliveryDateChange,
  onSubmitOrder,
  onDownloadOrderBon,
  onBack,
}: OrderRecapPageProps) {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const dateOptions = useMemo(() => {
    const start = new Date();
    const options: string[] = [];

    for (let i = 0; i < 21; i += 1) {
      const next = new Date(start);
      next.setDate(start.getDate() + i);
      const year = next.getFullYear();
      const month = String(next.getMonth() + 1).padStart(2, '0');
      const day = String(next.getDate()).padStart(2, '0');
      options.push(`${year}-${month}-${day}`);
    }

    return options;
  }, []);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{text.orders.recapTitle}</Text>
      <Text style={styles.subtitle}>{text.orders.recapSubtitle}</Text>

      <View style={styles.docBlock}>
        <Text style={styles.uploadFieldTitle}>{text.orders.deliveryDateLabel}</Text>
        <Pressable
          style={styles.restaurantSelectTrigger}
          onPress={() => setIsDatePickerOpen((currentValue) => !currentValue)}
        >
          <Text style={styles.restaurantSelectTriggerText}>{deliveryDate}</Text>
          <Text style={styles.restaurantSelectChevron}>
            {isDatePickerOpen ? '▲' : '▼'}
          </Text>
        </Pressable>

        {isDatePickerOpen ? (
          <View style={styles.restaurantSelectList}>
            {dateOptions.map((dateValue) => (
              <Pressable
                key={dateValue}
                style={[
                  styles.restaurantSelectItem,
                  deliveryDate === dateValue && styles.restaurantSelectItemActive,
                ]}
                onPress={() => {
                  onDeliveryDateChange(dateValue);
                  setIsDatePickerOpen(false);
                }}
              >
                <Text
                  style={[
                    styles.restaurantSelectItemText,
                    deliveryDate === dateValue && styles.restaurantSelectItemTextActive,
                  ]}
                >
                  {dateValue}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        <Text style={styles.uploadFieldTitle}>{text.orders.deliveryAddressLabel}</Text>
        <Text style={styles.docItemMeta}>
          {deliveryAddress || text.orders.deliveryAddressMissing}
        </Text>
      </View>

      {latestCreatedOrder ? (
        <View style={styles.docBlock}>
          <Text style={styles.docBlockTitle}>{text.orders.orderSuccessTitle}</Text>
          <Text style={styles.docItemMeta}>
            {text.orders.orderNumberLabel}: {latestCreatedOrder.number}
          </Text>
          <Pressable
            style={styles.secondaryButton}
            onPress={() => onDownloadOrderBon(latestCreatedOrder)}
          >
            <Text style={styles.secondaryButtonText}>{text.orders.downloadBonButton}</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={[styles.listBlock, styles.productGrid]}>
        {recap.items.map((item) => {
          const productName = language === 'zh' ? item.nameZh : item.nameFr ?? item.nameZh;
          return (
            <View key={`${item.productId}-${item.quantity}`} style={[styles.docItem, styles.productGridItem]}>
              <View style={styles.productInfoRow}>
                {item.image ? (
                  <View style={styles.productImageFrame}>
                    <Image source={{ uri: item.image }} style={styles.productImageThumb} resizeMode="cover" />
                  </View>
                ) : null}
                <View style={styles.productInfoColumn}>
                  <Text style={styles.docItemTitle}>{productName}</Text>
                  <Text style={styles.docItemMeta}>{text.orders.quantityLabel}: {item.quantity}</Text>
                  <Text style={styles.docItemMeta}>{text.orders.priceLabel}: {item.priceHt === null ? text.orders.priceNotAvailable : item.priceHt.toFixed(2)}</Text>
                  <Text style={styles.docItemMeta}>{text.orders.lineTotalLabel}: {item.lineTotal.toFixed(2)}</Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.docBlock}>
        <Text style={styles.docBlockTitle}>{text.orders.summaryTitle}</Text>
        <Text style={styles.docItemMeta}>{text.orders.summaryItems}: {recap.totalItems}</Text>
        <Text style={styles.docItemMeta}>{text.orders.summaryAmount}: {recap.totalAmount.toFixed(2)}</Text>
      </View>

      <Pressable
        style={[styles.primaryButton, isSubmittingOrder && styles.buttonDisabled]}
        disabled={isSubmittingOrder}
        onPress={onSubmitOrder}
      >
        <Text style={styles.primaryButtonText}>
          {isSubmittingOrder ? text.orders.submittingOrder : text.orders.submitOrderButton}
        </Text>
      </Pressable>

      <View style={styles.docBlock}>
        <Text style={styles.docBlockTitle}>{text.orders.historyTitle}</Text>
        {orderHistory.length === 0 ? (
          <Text style={styles.docEmpty}>{text.orders.historyEmpty}</Text>
        ) : (
          orderHistory.map((order) => (
            <View key={order.id} style={styles.docItem}>
              <Text style={styles.docItemTitle}>{order.number}</Text>
              <Text style={styles.docItemMeta}>
                {text.orders.deliveryDateLabel}: {order.deliveryDate}
              </Text>
              <Text style={styles.docItemMeta}>
                {text.orders.summaryAmount}: {order.totalAmount.toFixed(2)}
              </Text>
              <Pressable
                style={styles.secondaryButton}
                onPress={() => onDownloadOrderBon(order)}
              >
                <Text style={styles.secondaryButtonText}>{text.orders.downloadBonButton}</Text>
              </Pressable>
            </View>
          ))
        )}
      </View>

      <Pressable style={styles.primaryButton} onPress={onBack}>
        <Text style={styles.primaryButtonText}>{text.orders.backToOrderButton}</Text>
      </Pressable>
    </View>
  );
}
