import { Ionicons } from '@expo/vector-icons';
import { ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { COLORS } from '../../constants/colors';
import type { AppText } from '../../locales/translations';
import { ConfirmDialog } from '../ConfirmDialog';
import { ProductCreateCard } from './ProductCreateCard';
import { ProductEditorModal } from './ProductEditorModal';
import { ProductGrid } from './ProductGrid';
import { SupplierListCard } from './SupplierListCard';
import { styles } from './SupplierManagementPage.styles';
import { useSupplierManagement } from './useSupplierManagement';

type SupplierManagementPageProps = {
  text: AppText;
  accessToken: string;
};

export function SupplierManagementPage({
  text,
  accessToken,
}: SupplierManagementPageProps) {
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 560;
  const isMediumScreen = width >= 760;
  const isWideLayout = width >= 1400;
  const useSingleColumnProductGrid = width < 1180;

  const state = useSupplierManagement({ text, accessToken });

  return (
    <View style={styles.pageRoot}>
      <ScrollView
        style={styles.pageScroll}
        contentContainerStyle={styles.pageContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={styles.heroCopy}>
              <Text style={styles.title}>{text.supplierManagement.title}</Text>
              <Text style={styles.subtitle}>
                {text.supplierManagement.subtitle}
              </Text>
            </View>

            {state.selectedSupplier ? (
              <View style={styles.heroBadge}>
                <Ionicons
                  name="business-outline"
                  size={16}
                  color={COLORS.brandPrimary}
                />
                <Text style={styles.heroBadgeText} numberOfLines={1}>
                  {state.selectedSupplier.name}
                </Text>
              </View>
            ) : null}
          </View>

          {state.error ? <Text style={styles.error}>{state.error}</Text> : null}
          {state.isLoading ? (
            <Text style={styles.docEmpty}>
              {text.supplierManagement.loading}
            </Text>
          ) : (
            <View style={styles.statGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{state.suppliers.length}</Text>
                <Text style={styles.statLabel}>
                  {text.supplierManagement.suppliersLabel}
                </Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>
                  {state.selectedSupplierProductCount}
                </Text>
                <Text style={styles.statLabel}>
                  {text.supplierManagement.productsLabel}
                </Text>
              </View>
            </View>
          )}
        </View>

        <View style={[styles.mainGrid, isWideLayout && styles.mainGridWide]}>
          <View
            style={[
              styles.sidebarColumn,
              isWideLayout && styles.sidebarColumnWide,
            ]}
          >
            <SupplierListCard
              text={text}
              suppliers={state.suppliers}
              selectedSupplierId={state.selectedSupplierId}
              selectedSupplier={state.selectedSupplier}
              supplierProductCountById={state.supplierProductCountById}
              newSupplierName={state.newSupplierName}
              isCreatingSupplier={state.isCreatingSupplier}
              isReorderingSuppliers={state.isReorderingSuppliers}
              isUpdatingSupplierOrderSettings={
                state.isUpdatingSupplierOrderSettings
              }
              deletingSupplierId={state.deletingSupplierId}
              canMoveSelectedSupplierUp={state.canMoveSelectedSupplierUp}
              canMoveSelectedSupplierDown={state.canMoveSelectedSupplierDown}
              isMediumScreen={isMediumScreen}
              onSelectSupplier={state.setSelectedSupplierId}
              onChangeNewSupplierName={state.setNewSupplierName}
              onCreateSupplier={() => {
                void state.handleCreateSupplier();
              }}
              onToggleSupplierOrderTemplate={(nextValue) => {
                void state.handleToggleSupplierOrderTemplate(nextValue);
              }}
              onMoveSupplier={(direction) => {
                void state.handleMoveSelectedSupplier(direction);
              }}
              onDeleteSupplier={(supplier) => {
                void state.handleDeleteSupplier(supplier);
              }}
            />

            <ProductCreateCard
              text={text}
              selectedSupplier={state.selectedSupplier}
              selectedSupplierId={state.selectedSupplierId}
              isMediumScreen={isMediumScreen}
              isCreatingProduct={state.isCreatingProduct}
              newProductReference={state.newProductReference}
              newProductCategory={state.newProductCategory}
              newProductNameZh={state.newProductNameZh}
              newProductNameFr={state.newProductNameFr}
              newProductSpecification={state.newProductSpecification}
              newProductUnit={state.newProductUnit}
              newProductPriceHt={state.newProductPriceHt}
              newProductSpecification2={state.newProductSpecification2}
              newProductUnit2={state.newProductUnit2}
              newProductPriceHt2={state.newProductPriceHt2}
              newProductSpecification3={state.newProductSpecification3}
              newProductUnit3={state.newProductUnit3}
              newProductPriceHt3={state.newProductPriceHt3}
              onChangeReference={state.setNewProductReference}
              onChangeCategory={state.setNewProductCategory}
              onChangeNameZh={state.setNewProductNameZh}
              onChangeNameFr={state.setNewProductNameFr}
              onChangeSpecification={state.setNewProductSpecification}
              onChangeUnit={state.setNewProductUnit}
              onChangePriceHt={state.setNewProductPriceHt}
              onChangeSpecification2={state.setNewProductSpecification2}
              onChangeUnit2={state.setNewProductUnit2}
              onChangePriceHt2={state.setNewProductPriceHt2}
              onChangeSpecification3={state.setNewProductSpecification3}
              onChangeUnit3={state.setNewProductUnit3}
              onChangePriceHt3={state.setNewProductPriceHt3}
              onCreateProduct={() => {
                void state.handleCreateProduct();
              }}
            />
          </View>

          <View
            style={[
              styles.contentColumn,
              isWideLayout && styles.contentColumnWide,
            ]}
          >
            <ProductGrid
              text={text}
              selectedSupplier={state.selectedSupplier}
              selectedSupplierId={state.selectedSupplierId}
              selectedProductId={state.selectedProductId}
              supplierProductCount={state.selectedSupplierProductCount}
              filteredSupplierProducts={state.filteredSupplierProducts}
              paginatedProducts={state.paginatedProducts}
              productFilter={state.productFilter}
              currentPage={state.currentPage}
              totalPages={state.totalPages}
              deletingProductId={state.deletingProductId}
              isSmallScreen={isSmallScreen}
              useSingleColumnProductGrid={useSingleColumnProductGrid}
              onChangeFilter={state.setProductFilter}
              onChangePage={state.setCurrentPage}
              onSelectProduct={state.selectProductForEditing}
              onDeleteProduct={(product) => {
                void state.handleDeleteProduct(product);
              }}
            />
          </View>
        </View>
      </ScrollView>

      <ProductEditorModal
        text={text}
        visible={state.isEditorOpen && Boolean(state.selectedProduct)}
        selectedProduct={state.selectedProduct}
        selectedSupplier={state.selectedSupplier}
        isMediumScreen={isMediumScreen}
        isSavingProduct={state.isSavingProduct}
        isUploadingImage={state.isUploadingImage}
        editCategory={state.editCategory}
        editNameZh={state.editNameZh}
        editNameFr={state.editNameFr}
        editSpecification={state.editSpecification}
        editUnit={state.editUnit}
        editPriceHt={state.editPriceHt}
        editSpecification2={state.editSpecification2}
        editUnit2={state.editUnit2}
        editPriceHt2={state.editPriceHt2}
        editSpecification3={state.editSpecification3}
        editUnit3={state.editUnit3}
        editPriceHt3={state.editPriceHt3}
        editImage={state.editImage}
        onChangeCategory={state.setEditCategory}
        onChangeNameZh={state.setEditNameZh}
        onChangeNameFr={state.setEditNameFr}
        onChangeSpecification={state.setEditSpecification}
        onChangeUnit={state.setEditUnit}
        onChangePriceHt={state.setEditPriceHt}
        onChangeSpecification2={state.setEditSpecification2}
        onChangeUnit2={state.setEditUnit2}
        onChangePriceHt2={state.setEditPriceHt2}
        onChangeSpecification3={state.setEditSpecification3}
        onChangeUnit3={state.setEditUnit3}
        onChangePriceHt3={state.setEditPriceHt3}
        onClose={() => state.setIsEditorOpen(false)}
        onSave={() => {
          void state.handleSaveProduct();
        }}
        onUploadImage={() => {
          void state.handleUploadProductImage();
        }}
      />

      <ConfirmDialog
        visible={state.confirmDialogVisible}
        title={text.supplierManagement.deleteProductButton}
        message={text.supplierManagement.deleteProductConfirm}
        cancelLabel={text.supplierManagement.deleteProductCancel}
        confirmLabel={text.supplierManagement.deleteProductConfirmButton}
        destructive
        onCancel={() => state.closeDeleteProductDialog(false)}
        onConfirm={() => state.closeDeleteProductDialog(true)}
      />
      <ConfirmDialog
        visible={state.confirmSupplierDialogVisible}
        title={text.supplierManagement.deleteSupplierButton}
        message={text.supplierManagement.deleteSupplierConfirm}
        cancelLabel={text.supplierManagement.deleteSupplierCancel}
        confirmLabel={text.supplierManagement.deleteSupplierConfirmButton}
        destructive
        onCancel={() => state.closeDeleteSupplierDialog(false)}
        onConfirm={() => state.closeDeleteSupplierDialog(true)}
      />
    </View>
  );
}
