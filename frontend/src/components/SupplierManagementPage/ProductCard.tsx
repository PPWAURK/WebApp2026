import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, Text, View } from 'react-native';
import { COLORS } from '../../constants/colors';
import type { AppText } from '../../locales/translations';
import type { ProductItem } from '../../services/productsApi';
import { styles } from './SupplierManagementPage.styles';

type ProductCardProps = {
  text: AppText;
  product: ProductItem;
  isSelected: boolean;
  isSmallScreen: boolean;
  useSingleColumnGrid: boolean;
  updatingProductAvailabilityId: number | null;
  onSelectProduct: (productId: number) => void;
  onToggleProductAvailability: (product: ProductItem) => void;
};

export function ProductCard({
  text,
  product,
  isSelected,
  isSmallScreen,
  useSingleColumnGrid,
  updatingProductAvailabilityId,
  onSelectProduct,
  onToggleProductAvailability,
}: ProductCardProps) {
  const infoRowStyle = isSmallScreen
    ? styles.productInfoRowSmall
    : styles.productInfoRow;
  const productGridItemStyle = useSingleColumnGrid
    ? styles.productGridItemSmall
    : styles.productGridItem;
  const productLabel = product.nameFr ?? product.nameZh;

  return (
    <View
      style={[
        styles.productCard,
        productGridItemStyle,
        isSelected && styles.productCardActive,
      ]}
    >
      <View style={styles.productCardHeader}>
        <View style={styles.productBadgeRow}>
          {!product.isActive ? (
            <View style={styles.productInactiveBadge}>
              <Text style={styles.productInactiveBadgeText} numberOfLines={1}>
                {text.supplierManagement.inactiveProductBadge}
              </Text>
            </View>
          ) : null}
          <View style={styles.productBadge}>
            <Text style={styles.productBadgeText} numberOfLines={1}>
              {product.category}
            </Text>
          </View>
          {product.reference ? (
            <View style={styles.productBadge}>
              <Text style={styles.productBadgeText} numberOfLines={1}>
                {product.reference}
              </Text>
            </View>
          ) : null}
        </View>

        <Pressable
          accessibilityLabel={
            product.isActive
              ? text.supplierManagement.deactivateProductButton
              : text.supplierManagement.activateProductButton
          }
          style={[
            styles.productAvailabilityIconButton,
            !product.isActive && styles.productActivateIconButton,
          ]}
          disabled={updatingProductAvailabilityId === product.id}
          onPress={() => {
            void onToggleProductAvailability(product);
          }}
        >
          {updatingProductAvailabilityId === product.id ? (
            <Text style={styles.productDeleteLoading}>…</Text>
          ) : (
            <Ionicons
              name={
                product.isActive ? 'archive-outline' : 'arrow-up-circle-outline'
              }
              size={18}
              color={product.isActive ? '#8f141b' : '#0f766e'}
            />
          )}
        </Pressable>
      </View>

      <Pressable
        style={styles.productCardContentPressable}
        onPress={() => onSelectProduct(product.id)}
      >
        <View style={infoRowStyle}>
          {product.image ? (
            <View
              style={[
                styles.productImageFrame,
                isSmallScreen && styles.productImageFrameSmall,
              ]}
            >
              <Image
                source={{ uri: product.image }}
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
                size={26}
                color={COLORS.brandPrimary}
              />
            </View>
          )}

          <View
            style={[
              styles.productInfoColumn,
              isSmallScreen && styles.productInfoColumnSmall,
            ]}
          >
            <Text style={styles.productCardTitle} numberOfLines={2}>
              {productLabel}
            </Text>
            {product.nameFr &&
            product.nameZh &&
            product.nameFr !== product.nameZh ? (
              <Text style={styles.productCardSubtitle} numberOfLines={1}>
                {product.nameZh}
              </Text>
            ) : null}
            {product.specifications.map((specification) => {
              const specificationLabel =
                specification.specification ??
                `${text.supplierManagement.fields.specification} 1`;
              const unitLabel = specification.unit ?? '—';
              const priceLabel =
                specification.priceHt === null
                  ? '—'
                  : specification.priceHt.toFixed(2);

              return (
                <Text
                  key={`${product.id}-${specification.slot ?? 'base'}`}
                  style={styles.docItemMeta}
                  numberOfLines={1}
                >
                  {specificationLabel} · {unitLabel} · {priceLabel}
                </Text>
              );
            })}
            <Text style={styles.productEditHint}>
              {product.isActive
                ? text.supplierManagement.tapToEdit
                : text.supplierManagement.inactiveProductHint}
            </Text>
          </View>
        </View>
      </Pressable>
    </View>
  );
}
