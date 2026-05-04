import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { Image, Pressable, Text, TextInput, View } from 'react-native';
import type { AppText } from '../../locales/translations';
import type {
  ProductItem,
  ProductSpecificationItem,
} from '../../services/productsApi';
import type { Language } from '../../types/language';
import {
  buildOrderItemKey,
  formatAmount,
  formatSpecificationLabel,
} from './ordersPage.shared';
import { styles } from './OrdersPage.styles';

type OrderProductCardProps = {
  isCompactProductCard: boolean;
  isMobileLayout: boolean;
  isSmallScreen: boolean;
  isTabletCompactProductCard: boolean;
  language: Language;
  product: ProductItem;
  quantities: Record<string, number>;
  text: AppText;
  useSingleColumnGrid: boolean;
  onSetQuantity: (orderItemKey: string, nextQuantity: number) => void;
};

export const OrderProductCard = memo(function OrderProductCard({
  isCompactProductCard,
  isMobileLayout,
  isSmallScreen,
  isTabletCompactProductCard,
  language,
  product,
  quantities,
  text,
  useSingleColumnGrid,
  onSetQuantity,
}: OrderProductCardProps) {
  const productName =
    language === 'zh' ? product.nameZh : (product.nameFr ?? product.nameZh);
  const categoryLabel =
    language === 'zh' ? product.categoryNameZh : product.categoryNameFr;

  if (isCompactProductCard) {
    return (
      <View
        style={[
          styles.mobileProductCard,
          isTabletCompactProductCard && styles.tabletProductCard,
        ]}
      >
        <View style={styles.mobileProductHeaderRow}>
          {renderProductImage(product, true)}
          <View style={styles.mobileProductTitleColumn}>
            <View style={styles.mobileProductNameRow}>
              <Text style={styles.mobileProductTitle} numberOfLines={2}>
                {productName}
              </Text>
              <View style={styles.productBadge}>
                <Text style={styles.productBadgeText} numberOfLines={1}>
                  {categoryLabel}
                </Text>
              </View>
            </View>
            <View style={styles.mobileCartonReferenceBlock}>
              <Text style={styles.mobileCartonReferenceLabel}>
                {text.orders.cartonSpecificationReference}
              </Text>
              <Text style={styles.mobileCartonReferenceText} numberOfLines={1}>
                {buildProductSpecificationReference(product, text)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.mobileSpecificationList}>
          {product.specifications.map((specification) =>
            renderMobileSpecificationRow({
              language,
              product,
              productName,
              quantities,
              specification,
              text,
              onSetQuantity,
            }),
          )}
        </View>
      </View>
    );
  }

  const productGridItemStyle = useSingleColumnGrid
    ? styles.productGridItemSmall
    : styles.productGridItem;
  const specificationLabels = product.specifications
    .map((specification) => formatSpecificationLabel(specification))
    .filter((label): label is string => label !== null);

  return (
    <View style={[styles.productCard, productGridItemStyle]}>
      <View style={styles.productCardHeader}>
        <View style={styles.productBadgeRow}>
          <View style={styles.productBadge}>
            <Text style={styles.productBadgeText}>{categoryLabel}</Text>
          </View>
          {product.reference ? (
            <View style={styles.productBadge}>
              <Text style={styles.productBadgeText}>{product.reference}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View
        style={[
          styles.productInfoRow,
          isSmallScreen && styles.productInfoRowSmall,
        ]}
      >
        {renderProductImage(product, false, isSmallScreen)}

        <View
          style={[
            styles.productInfoColumn,
            isSmallScreen && styles.productInfoColumnSmall,
          ]}
        >
          <View style={styles.productTitleBlock}>
            <Text style={styles.productTitle}>{productName}</Text>
            <View style={styles.productSpecificationList}>
              {specificationLabels.map((label, index) => (
                <Text
                  key={`${product.id}-specification-label-${index}`}
                  style={styles.productSpecificationText}
                  numberOfLines={1}
                >
                  {label}
                </Text>
              ))}
            </View>
          </View>
        </View>
      </View>

      <View style={styles.specificationList}>
        {product.specifications.map((specification) =>
          renderDesktopSpecificationCard({
            language,
            product,
            productName,
            quantities,
            specification,
            text,
            onSetQuantity,
          }),
        )}
      </View>
    </View>
  );
});

function renderProductImage(
  product: ProductItem,
  isMobileLayout: boolean,
  isSmallScreen = false,
) {
  const frameStyle = [
    styles.productImageFrame,
    isSmallScreen && styles.productImageFrameSmall,
    isMobileLayout && styles.mobileProductImageFrame,
  ];
  const placeholderStyle = [
    styles.productImagePlaceholder,
    isSmallScreen && styles.productImageFrameSmall,
    isMobileLayout && styles.mobileProductImageFrame,
  ];

  if (!product.image) {
    return (
      <View style={placeholderStyle}>
        <Ionicons
          name="image-outline"
          size={isMobileLayout ? 18 : 24}
          color="#ab1e24"
        />
      </View>
    );
  }

  return (
    <View style={frameStyle}>
      <Image
        source={{ uri: product.image }}
        style={styles.productImageThumb}
        resizeMode="cover"
      />
    </View>
  );
}

function renderMobileSpecificationRow({
  language,
  product,
  productName,
  quantities,
  specification,
  text,
  onSetQuantity,
}: {
  language: Language;
  product: ProductItem;
  productName: string;
  quantities: Record<string, number>;
  specification: ProductSpecificationItem;
  text: AppText;
  onSetQuantity: (orderItemKey: string, nextQuantity: number) => void;
}) {
  const orderItemKey = buildOrderItemKey(product.id, specification.slot);
  const quantity = quantities[orderItemKey] ?? 0;
  const specificationLabel =
    formatSpecificationLabel(specification) ??
    text.orders.defaultSpecificationLabel;

  return (
    <View
      key={`${product.id}-${specification.slot ?? 'base'}`}
      style={[
        styles.mobileSpecificationRow,
        quantity > 0 && styles.specificationCardActive,
      ]}
    >
      {renderQuantityStepper({
        language,
        orderItemKey,
        productName,
        quantity,
        specificationLabel,
        onSetQuantity,
      })}

      <View style={styles.mobileSpecificationCopy}>
        <Text style={styles.mobileSpecificationMeta} numberOfLines={1}>
          {specification.unit ?? text.orders.unitNotAvailable} ·{' '}
          {specification.priceHt === null
            ? text.orders.priceNotAvailable
            : formatAmount(specification.priceHt)}
        </Text>
      </View>
    </View>
  );
}

function buildProductSpecificationReference(
  product: ProductItem,
  text: AppText,
): string {
  const labels = product.specifications
    .map((specification) => formatSpecificationLabel(specification))
    .filter((label): label is string => label !== null);

  return labels.length > 0
    ? labels.join(' / ')
    : text.orders.defaultSpecificationLabel;
}

function renderDesktopSpecificationCard({
  language,
  product,
  productName,
  quantities,
  specification,
  text,
  onSetQuantity,
}: {
  language: Language;
  product: ProductItem;
  productName: string;
  quantities: Record<string, number>;
  specification: ProductSpecificationItem;
  text: AppText;
  onSetQuantity: (orderItemKey: string, nextQuantity: number) => void;
}) {
  const orderItemKey = buildOrderItemKey(product.id, specification.slot);
  const quantity = quantities[orderItemKey] ?? 0;
  const specificationLabel = formatSpecificationLabel(specification);

  return (
    <View
      key={`${product.id}-${specification.slot ?? 'base'}`}
      style={[
        styles.specificationCard,
        quantity > 0 && styles.specificationCardActive,
      ]}
    >
      <View style={styles.specificationMetaRow}>
        <View style={styles.specificationMetaItem}>
          <Text style={styles.specificationMetaLabel}>
            {text.orders.unitLabel}
          </Text>
          <Text style={styles.specificationMetaValue}>
            {specification.unit ?? text.orders.unitNotAvailable}
          </Text>
        </View>
        <View style={styles.specificationMetaItem}>
          <Text style={styles.specificationMetaLabel}>
            {text.orders.priceLabel}
          </Text>
          <Text
            style={[
              styles.specificationMetaValue,
              styles.specificationPriceValue,
            ]}
          >
            {specification.priceHt === null
              ? text.orders.priceNotAvailable
              : formatAmount(specification.priceHt)}
          </Text>
        </View>
      </View>

      <View style={styles.quantitySection}>
        <Text style={styles.quantityLabel}>{text.orders.quantityLabel}</Text>
        <View style={styles.quantityBar}>
          <View style={styles.quantityInputWrap}>
            <TextInput
              style={styles.quantityInput}
              value={String(quantity)}
              onChangeText={(value) => {
                onSetQuantity(orderItemKey, parseQuantityInput(value));
              }}
              keyboardType="number-pad"
              inputMode="numeric"
              selectTextOnFocus
              maxLength={4}
              textAlign="center"
              accessibilityLabel={buildQuantityInputLabel({
                language,
                productName,
                specificationLabel,
              })}
            />
          </View>
          <Text style={styles.quantityUnitText}>
            {specification.unit ?? text.orders.unitNotAvailable}
          </Text>
        </View>
      </View>
    </View>
  );
}

function renderQuantityStepper({
  language,
  orderItemKey,
  productName,
  quantity,
  specificationLabel,
  onSetQuantity,
}: {
  language: Language;
  orderItemKey: string;
  productName: string;
  quantity: number;
  specificationLabel: string | null;
  onSetQuantity: (orderItemKey: string, nextQuantity: number) => void;
}) {
  const decrementDisabled = quantity <= 0;

  return (
    <View style={styles.mobileQuantityStepper}>
      <Pressable
        style={[
          styles.mobileQuantityButton,
          decrementDisabled && styles.buttonDisabled,
        ]}
        disabled={decrementDisabled}
        onPress={() => onSetQuantity(orderItemKey, quantity - 1)}
        accessibilityRole="button"
        accessibilityLabel={
          language === 'zh'
            ? `减少${productName}${specificationLabel ?? ''}数量`
            : `Diminuer la quantite pour ${productName} ${
                specificationLabel ?? ''
              }`
        }
        accessibilityState={{ disabled: decrementDisabled }}
      >
        <Text style={styles.mobileQuantityButtonText}>-</Text>
      </Pressable>

      <View style={styles.mobileQuantityInputWrap}>
        <TextInput
          style={styles.mobileQuantityInput}
          value={String(quantity)}
          onChangeText={(value) => {
            onSetQuantity(orderItemKey, parseQuantityInput(value));
          }}
          keyboardType="number-pad"
          inputMode="numeric"
          selectTextOnFocus
          maxLength={4}
          textAlign="center"
          accessibilityLabel={buildQuantityInputLabel({
            language,
            productName,
            specificationLabel,
          })}
        />
      </View>

      <Pressable
        style={styles.mobileQuantityButton}
        onPress={() => onSetQuantity(orderItemKey, quantity + 1)}
        accessibilityRole="button"
        accessibilityLabel={
          language === 'zh'
            ? `增加${productName}${specificationLabel ?? ''}数量`
            : `Augmenter la quantite pour ${productName} ${
                specificationLabel ?? ''
              }`
        }
      >
        <Text style={styles.mobileQuantityButtonText}>+</Text>
      </Pressable>
    </View>
  );
}

function parseQuantityInput(value: string): number {
  const digitsOnly = value.replace(/\D+/g, '');
  return digitsOnly.length > 0 ? Number(digitsOnly) : 0;
}

function buildQuantityInputLabel({
  language,
  productName,
  specificationLabel,
}: {
  language: Language;
  productName: string;
  specificationLabel: string | null;
}): string {
  if (language === 'zh') {
    return `${productName}${specificationLabel ?? ''}数量输入框`;
  }

  return `Champ de quantite pour ${productName} ${specificationLabel ?? ''}`;
}
