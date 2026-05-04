import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import type { AppText } from '../../locales/translations';
import type { SupplierItem } from '../../services/suppliersApi';
import type { Language } from '../../types/language';
import {
  formatProductCategoryLabel,
  type ProductCategory,
} from './ordersPage.shared';
import { styles } from './OrdersPage.styles';

type OrderFilterPanelMode = 'suppliers' | 'filters' | 'mobile';

type SelectedCategoryId = number | 'ALL';

type OrderFilterPanelProps = {
  productCategories: ProductCategory[];
  language: Language;
  loading: boolean;
  mode: OrderFilterPanelMode;
  productSearch: string;
  selectedCategoryId: SelectedCategoryId;
  selectedSupplierId: number | 'ALL';
  selectedSupplierName: string;
  supplierProductCountById: Map<number, number>;
  suppliers: SupplierItem[];
  text: AppText;
  onProductSearchChange: (next: string) => void;
  onSelectedCategoryChange: (next: SelectedCategoryId) => void;
  onSelectSupplier: (supplierId: number) => void;
};

export function OrderFilterPanel({
  productCategories,
  language,
  loading,
  mode,
  productSearch,
  selectedCategoryId,
  selectedSupplierId,
  selectedSupplierName,
  supplierProductCountById,
  suppliers,
  text,
  onProductSearchChange,
  onSelectedCategoryChange,
  onSelectSupplier,
}: OrderFilterPanelProps) {
  if (mode === 'suppliers') {
    return renderSupplierPanel({
      loading,
      selectedSupplierId,
      selectedSupplierName,
      supplierProductCountById,
      suppliers,
      text,
      onSelectSupplier,
    });
  }

  if (mode === 'filters') {
    return renderSearchAndFilterPanel({
      productCategories,
      language,
      productSearch,
      selectedCategoryId,
      text,
      onProductSearchChange,
      onSelectedCategoryChange,
    });
  }

  return (
    <View style={[styles.surfaceCard, styles.mobileFilterPanel]}>
      <View style={styles.surfaceHeader}>
        <View style={styles.surfaceHeaderCopy}>
          <Text style={styles.surfaceEyebrow}>{text.orders.supplierLabel}</Text>
          <Text style={styles.surfaceTitle} numberOfLines={1}>
            {selectedSupplierName}
          </Text>
        </View>
      </View>

      {renderMobileSupplierScroller({
        loading,
        selectedSupplierId,
        supplierProductCountById,
        suppliers,
        text,
        onSelectSupplier,
      })}

      {renderSearchInput({
        productSearch,
        text,
        onProductSearchChange,
      })}

      {renderMobileFilterScroller({
        productCategories,
        language,
        selectedCategoryId,
        text,
        onSelectedCategoryChange,
      })}
    </View>
  );
}

function renderSupplierPanel({
  loading,
  selectedSupplierId,
  selectedSupplierName,
  supplierProductCountById,
  suppliers,
  text,
  onSelectSupplier,
}: Pick<
  OrderFilterPanelProps,
  | 'loading'
  | 'selectedSupplierId'
  | 'selectedSupplierName'
  | 'supplierProductCountById'
  | 'suppliers'
  | 'text'
  | 'onSelectSupplier'
>) {
  return (
    <View style={styles.surfaceCard}>
      <View style={styles.surfaceHeader}>
        <View style={styles.surfaceHeaderCopy}>
          <Text style={styles.surfaceEyebrow}>{text.orders.supplierLabel}</Text>
          <Text style={styles.surfaceTitle}>{selectedSupplierName}</Text>
          <Text style={styles.surfaceSubtitle}>
            {suppliers.length > 0
              ? `${suppliers.length} ${text.orders.supplierLabel.toLowerCase()}`
              : text.orders.empty}
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.emptyCard}>
          <Text style={styles.docEmpty}>{text.orders.loading}</Text>
        </View>
      ) : suppliers.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.docEmpty}>{text.orders.empty}</Text>
        </View>
      ) : (
        <View style={styles.supplierList}>
          {suppliers.map((supplier) =>
            renderSupplierChip({
              isMobile: false,
              isSelected: selectedSupplierId === supplier.id,
              productCount: supplierProductCountById.get(supplier.id) ?? 0,
              supplier,
              onSelectSupplier,
            }),
          )}
        </View>
      )}
    </View>
  );
}

function renderSearchAndFilterPanel({
  productCategories,
  language,
  productSearch,
  selectedCategoryId,
  text,
  onProductSearchChange,
  onSelectedCategoryChange,
}: Pick<
  OrderFilterPanelProps,
  | 'productCategories'
  | 'language'
  | 'productSearch'
  | 'selectedCategoryId'
  | 'text'
  | 'onProductSearchChange'
  | 'onSelectedCategoryChange'
>) {
  return (
    <View style={styles.surfaceCard}>
      <View style={styles.surfaceHeader}>
        <View style={styles.surfaceHeaderCopy}>
          <Text style={styles.surfaceEyebrow}>{text.orders.filterLabel}</Text>
          <Text style={styles.surfaceTitle}>{text.orders.filterLabel}</Text>
          <Text style={styles.surfaceSubtitle}>
            {text.orders.searchProductsPlaceholder}
          </Text>
        </View>
      </View>

      {renderSearchInput({
        productSearch,
        text,
        onProductSearchChange,
      })}

      <Text style={styles.surfaceEyebrow}>{text.orders.categoryLabel}</Text>
      <View style={styles.categoryWrap}>
        {renderCategoryChip({
          isSelected: selectedCategoryId === 'ALL',
          label: text.orders.allCategories,
          onPress: () => onSelectedCategoryChange('ALL'),
        })}

        {productCategories.map((category) =>
          renderCategoryChip({
            isSelected: selectedCategoryId === category.id,
            key: String(category.id),
            label: formatProductCategoryLabel(category, language),
            onPress: () => onSelectedCategoryChange(category.id),
          }),
        )}
      </View>
    </View>
  );
}

function renderMobileSupplierScroller({
  loading,
  selectedSupplierId,
  supplierProductCountById,
  suppliers,
  text,
  onSelectSupplier,
}: Pick<
  OrderFilterPanelProps,
  | 'loading'
  | 'selectedSupplierId'
  | 'supplierProductCountById'
  | 'suppliers'
  | 'text'
  | 'onSelectSupplier'
>) {
  if (loading) {
    return (
      <View style={styles.emptyCard}>
        <Text style={styles.docEmpty}>{text.orders.loading}</Text>
      </View>
    );
  }

  if (suppliers.length === 0) {
    return (
      <View style={styles.emptyCard}>
        <Text style={styles.docEmpty}>{text.orders.empty}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.mobileChipScrollerContent}
    >
      {suppliers.map((supplier) =>
        renderSupplierChip({
          isMobile: true,
          isSelected: selectedSupplierId === supplier.id,
          productCount: supplierProductCountById.get(supplier.id) ?? 0,
          supplier,
          onSelectSupplier,
        }),
      )}
    </ScrollView>
  );
}

function renderMobileFilterScroller({
  productCategories,
  language,
  selectedCategoryId,
  text,
  onSelectedCategoryChange,
}: Pick<
  OrderFilterPanelProps,
  | 'productCategories'
  | 'language'
  | 'selectedCategoryId'
  | 'text'
  | 'onSelectedCategoryChange'
>) {
  return (
    <View>
      <Text style={styles.surfaceEyebrow}>{text.orders.categoryLabel}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.mobileChipScrollerContent}
      >
        {renderCategoryChip({
          isMobile: true,
          isSelected: selectedCategoryId === 'ALL',
          label: text.orders.allCategories,
          onPress: () => onSelectedCategoryChange('ALL'),
        })}

        {productCategories.map((category) =>
          renderCategoryChip({
            isMobile: true,
            isSelected: selectedCategoryId === category.id,
            key: String(category.id),
            label: formatProductCategoryLabel(category, language),
            onPress: () => onSelectedCategoryChange(category.id),
          }),
        )}
      </ScrollView>
    </View>
  );
}

function renderSearchInput({
  productSearch,
  text,
  onProductSearchChange,
}: Pick<
  OrderFilterPanelProps,
  'productSearch' | 'text' | 'onProductSearchChange'
>) {
  return (
    <View style={styles.searchWrap}>
      <View style={styles.searchShell}>
        <Ionicons name="search-outline" size={18} color="#8d5a5f" />
        <TextInput
          style={styles.searchInput}
          value={productSearch}
          onChangeText={onProductSearchChange}
          placeholder={text.orders.searchProductsPlaceholder}
          placeholderTextColor="#aa777b"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
    </View>
  );
}

function renderSupplierChip({
  isMobile,
  isSelected,
  productCount,
  supplier,
  onSelectSupplier,
}: {
  isMobile: boolean;
  isSelected: boolean;
  productCount: number;
  supplier: SupplierItem;
  onSelectSupplier: (supplierId: number) => void;
}) {
  return (
    <Pressable
      key={supplier.id}
      style={[
        styles.supplierCard,
        isMobile && styles.mobileSupplierChip,
        isSelected && styles.supplierCardActive,
      ]}
      onPress={() => onSelectSupplier(supplier.id)}
      accessibilityRole="button"
      accessibilityLabel={supplier.name}
      accessibilityState={{ selected: isSelected }}
    >
      <View style={styles.supplierCardTitleRow}>
        <Text
          style={[
            styles.supplierCardTitle,
            isMobile && styles.mobileSupplierChipText,
            isSelected && styles.supplierCardTitleActive,
          ]}
          numberOfLines={1}
        >
          {supplier.name}
        </Text>
        <Text
          style={[
            styles.supplierCardCount,
            isMobile && styles.mobileSupplierChipCount,
            isSelected && styles.supplierCardCountActive,
          ]}
        >
          {productCount}
        </Text>
      </View>
    </Pressable>
  );
}

function renderCategoryChip({
  isMobile = false,
  isSelected,
  key,
  label,
  onPress,
}: {
  isMobile?: boolean;
  isSelected: boolean;
  key?: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      key={key ?? label}
      style={[
        styles.categoryChip,
        isMobile && styles.mobileCategoryChip,
        isSelected && styles.categoryChipActive,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: isSelected }}
    >
      <Text
        style={[
          styles.categoryChipText,
          isSelected && styles.categoryChipTextActive,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}
