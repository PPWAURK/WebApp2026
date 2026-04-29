import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, TextInput, View } from 'react-native';
import { COLORS } from '../../constants/colors';
import type { AppText } from '../../locales/translations';
import type { ProductItem } from '../../services/productsApi';
import type { SupplierItem } from '../../services/suppliersApi';
import { ProductCard } from './ProductCard';
import { styles } from './SupplierManagementPage.styles';

type ProductGridProps = {
  text: AppText;
  selectedSupplier: SupplierItem | null;
  selectedSupplierId: number | null;
  selectedProductId: number | null;
  supplierProductCount: number;
  filteredSupplierProducts: ProductItem[];
  paginatedProducts: ProductItem[];
  productFilter: string;
  currentPage: number;
  totalPages: number;
  updatingProductAvailabilityId: number | null;
  isSmallScreen: boolean;
  useSingleColumnProductGrid: boolean;
  onChangeFilter: (value: string) => void;
  onChangePage: (updater: (previous: number) => number) => void;
  onSelectProduct: (productId: number) => void;
  onToggleProductAvailability: (product: ProductItem) => void;
};

export function ProductGrid({
  text,
  selectedSupplier,
  selectedSupplierId,
  selectedProductId,
  supplierProductCount,
  filteredSupplierProducts,
  paginatedProducts,
  productFilter,
  currentPage,
  totalPages,
  updatingProductAvailabilityId,
  isSmallScreen,
  useSingleColumnProductGrid,
  onChangeFilter,
  onChangePage,
  onSelectProduct,
  onToggleProductAvailability,
}: ProductGridProps) {
  const productsPerPage = 8;

  return (
    <View style={styles.surfaceCard}>
      <View style={styles.surfaceHeader}>
        <View style={styles.surfaceHeaderCopy}>
          <Text style={styles.surfaceEyebrow}>
            {text.supplierManagement.productsLabel}
          </Text>
          <Text style={styles.surfaceTitle}>
            {selectedSupplier?.name ?? text.supplierManagement.productsLabel}
          </Text>
          <Text style={styles.surfaceSubtitle}>
            {selectedSupplier
              ? `${filteredSupplierProducts.length}/${supplierProductCount}`
              : text.supplierManagement.selectSupplierFirst}
          </Text>
        </View>
        <Text style={styles.surfacePill}>
          {filteredSupplierProducts.length}
        </Text>
      </View>

      <View style={styles.searchFieldWrap}>
        <Text style={styles.fieldLabel}>
          {text.supplierManagement.filterProductsPlaceholder}
        </Text>
        <View style={styles.searchRow}>
          <View style={styles.searchIconWrap}>
            <Ionicons
              name="search-outline"
              size={16}
              color={COLORS.textMuted}
            />
          </View>
          <TextInput
            style={styles.searchInput}
            placeholder={text.supplierManagement.filterProductsPlaceholder}
            placeholderTextColor={COLORS.placeholder}
            value={productFilter}
            onChangeText={onChangeFilter}
          />
        </View>
      </View>

      <View style={[styles.listBlock, styles.productGrid]}>
        {!selectedSupplierId ? (
          <View style={styles.emptyCard}>
            <Text style={styles.docEmpty}>
              {text.supplierManagement.selectSupplierFirst}
            </Text>
          </View>
        ) : supplierProductCount === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.docEmpty}>
              {text.supplierManagement.noProduct}
            </Text>
          </View>
        ) : filteredSupplierProducts.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.docEmpty}>
              {text.supplierManagement.noFilteredProduct}
            </Text>
          </View>
        ) : (
          paginatedProducts.map((product) => (
            <ProductCard
              key={product.id}
              text={text}
              product={product}
              isSelected={selectedProductId === product.id}
              isSmallScreen={isSmallScreen}
              useSingleColumnGrid={useSingleColumnProductGrid}
              updatingProductAvailabilityId={updatingProductAvailabilityId}
              onSelectProduct={onSelectProduct}
              onToggleProductAvailability={onToggleProductAvailability}
            />
          ))
        )}
      </View>

      {filteredSupplierProducts.length > productsPerPage ? (
        <View
          style={[
            styles.paginationRow,
            isSmallScreen && styles.paginationRowSmall,
          ]}
        >
          <Pressable
            style={[
              styles.secondaryButton,
              isSmallScreen && styles.paginationButtonSmall,
              currentPage === 1 && styles.buttonDisabled,
            ]}
            disabled={currentPage === 1}
            onPress={() =>
              onChangePage((previous) => Math.max(1, previous - 1))
            }
          >
            <Text style={styles.secondaryButtonText}>
              {text.supplierManagement.paginationPrevious}
            </Text>
          </Pressable>

          <Text style={styles.paginationInfo}>
            {text.supplierManagement.paginationPageLabel} {currentPage}/
            {totalPages}
          </Text>

          <Pressable
            style={[
              styles.secondaryButton,
              isSmallScreen && styles.paginationButtonSmall,
              currentPage >= totalPages && styles.buttonDisabled,
            ]}
            disabled={currentPage >= totalPages}
            onPress={() =>
              onChangePage((previous) => Math.min(totalPages, previous + 1))
            }
          >
            <Text style={styles.secondaryButtonText}>
              {text.supplierManagement.paginationNext}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
