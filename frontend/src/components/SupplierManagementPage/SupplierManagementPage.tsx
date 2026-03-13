import * as DocumentPicker from 'expo-document-picker';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import type { AppText } from '../../locales/translations';
import {
  createProduct,
  deleteProduct,
  fetchProducts,
  uploadProductImage,
  updateProduct,
  type ProductItem,
} from '../../services/productsApi';
import {
  createSupplier,
  deleteSupplier,
  fetchSuppliers,
  reorderSuppliers,
  type SupplierItem,
} from '../../services/suppliersApi';
import { ConfirmDialog } from '../ConfirmDialog';
import { styles } from './SupplierManagementPage.styles';

type SupplierManagementPageProps = {
  text: AppText;
  accessToken: string;
};

const PRODUCTS_PER_PAGE = 8;

export function SupplierManagementPage({
  text,
  accessToken,
}: SupplierManagementPageProps) {
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 560;

  const [suppliers, setSuppliers] = useState<SupplierItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(
    null,
  );
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null,
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [productFilter, setProductFilter] = useState('');
  const [newSupplierName, setNewSupplierName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingSupplier, setIsCreatingSupplier] = useState(false);
  const [isReorderingSuppliers, setIsReorderingSuppliers] = useState(false);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<number | null>(
    null,
  );
  const [deletingSupplierId, setDeletingSupplierId] = useState<number | null>(
    null,
  );
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDialogVisible, setConfirmDialogVisible] = useState(false);
  const confirmDeleteResolverRef = useRef<((value: boolean) => void) | null>(
    null,
  );
  const [confirmSupplierDialogVisible, setConfirmSupplierDialogVisible] =
    useState(false);
  const confirmDeleteSupplierResolverRef = useRef<
    ((value: boolean) => void) | null
  >(null);

  const [newProductReference, setNewProductReference] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('');
  const [newProductNameZh, setNewProductNameZh] = useState('');
  const [newProductNameFr, setNewProductNameFr] = useState('');
  const [newProductSpecification, setNewProductSpecification] = useState('');
  const [newProductUnit, setNewProductUnit] = useState('');
  const [newProductPriceHt, setNewProductPriceHt] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editNameZh, setEditNameZh] = useState('');
  const [editNameFr, setEditNameFr] = useState('');
  const [editSpecification, setEditSpecification] = useState('');
  const [editPriceHt, setEditPriceHt] = useState('');
  const [editImage, setEditImage] = useState('');

  useEffect(() => {
    let isActive = true;
    setIsLoading(true);
    setError(null);

    void Promise.all([fetchSuppliers(accessToken), fetchProducts(accessToken)])
      .then(([supplierResult, productResult]) => {
        if (!isActive) {
          return;
        }

        setSuppliers(supplierResult);
        setProducts(productResult);
        setSelectedSupplierId(supplierResult[0]?.id ?? null);
      })
      .catch(() => {
        if (isActive) {
          setError(text.supplierManagement.loadError);
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [accessToken, text.supplierManagement.loadError]);

  const supplierProducts = useMemo(
    () =>
      selectedSupplierId
        ? products.filter(
            (product) => product.supplierId === selectedSupplierId,
          )
        : [],
    [products, selectedSupplierId],
  );

  const filteredSupplierProducts = useMemo(() => {
    const normalizedFilter = productFilter.trim().toLowerCase();
    if (!normalizedFilter) {
      return supplierProducts;
    }

    return supplierProducts.filter((product) => {
      const fields = [
        product.nameFr,
        product.nameZh,
        product.reference,
        product.category,
        product.specification,
        product.unit,
      ];

      return fields.some(
        (field) =>
          typeof field === 'string' &&
          field.toLowerCase().includes(normalizedFilter),
      );
    });
  }, [productFilter, supplierProducts]);

  const totalPages = useMemo(
    () =>
      Math.max(
        1,
        Math.ceil(filteredSupplierProducts.length / PRODUCTS_PER_PAGE),
      ),
    [filteredSupplierProducts.length],
  );

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
    return filteredSupplierProducts.slice(
      startIndex,
      startIndex + PRODUCTS_PER_PAGE,
    );
  }, [currentPage, filteredSupplierProducts]);

  const selectedProduct = useMemo(
    () =>
      supplierProducts.find((product) => product.id === selectedProductId) ??
      null,
    [selectedProductId, supplierProducts],
  );
  const selectedSupplier = useMemo(
    () =>
      suppliers.find((supplier) => supplier.id === selectedSupplierId) ?? null,
    [selectedSupplierId, suppliers],
  );
  const selectedSupplierIndex =
    selectedSupplierId === null
      ? -1
      : suppliers.findIndex((supplier) => supplier.id === selectedSupplierId);
  const canMoveSelectedSupplierUp = selectedSupplierIndex > 0;
  const canMoveSelectedSupplierDown =
    selectedSupplierIndex >= 0 && selectedSupplierIndex < suppliers.length - 1;

  useEffect(() => {
    if (!supplierProducts.some((product) => product.id === selectedProductId)) {
      setSelectedProductId(supplierProducts[0]?.id ?? null);
    }
  }, [selectedProductId, supplierProducts]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedSupplierId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [productFilter]);

  useEffect(() => {
    setCurrentPage((previous) => Math.min(previous, totalPages));
  }, [totalPages]);

  useEffect(() => {
    if (!selectedProduct) {
      setEditCategory('');
      setEditNameZh('');
      setEditNameFr('');
      setEditSpecification('');
      setEditPriceHt('');
      setEditImage('');
      return;
    }

    setEditCategory(selectedProduct.category);
    setEditNameZh(selectedProduct.nameZh);
    setEditNameFr(selectedProduct.nameFr ?? '');
    setEditSpecification(selectedProduct.specification ?? '');
    setEditPriceHt(
      selectedProduct.priceHt === null
        ? ''
        : selectedProduct.priceHt.toString(),
    );
    setEditImage(selectedProduct.image ?? '');
  }, [selectedProduct]);

  async function onCreateSupplier() {
    setIsCreatingSupplier(true);
    setError(null);
    try {
      const created = await createSupplier(accessToken, {
        name: newSupplierName,
      });
      setSuppliers((current) => [...current, created]);
      setSelectedSupplierId(created.id);
      setNewSupplierName('');
    } catch {
      setError(text.supplierManagement.createSupplierError);
    } finally {
      setIsCreatingSupplier(false);
    }
  }

  async function onMoveSelectedSupplier(direction: -1 | 1) {
    if (selectedSupplierIndex < 0) {
      return;
    }

    const targetIndex = selectedSupplierIndex + direction;
    if (targetIndex < 0 || targetIndex >= suppliers.length) {
      return;
    }

    const nextSuppliers = [...suppliers];
    const [movedSupplier] = nextSuppliers.splice(selectedSupplierIndex, 1);
    nextSuppliers.splice(targetIndex, 0, movedSupplier);

    setIsReorderingSuppliers(true);
    setError(null);

    try {
      const reordered = await reorderSuppliers(accessToken, {
        supplierIds: nextSuppliers.map((supplier) => supplier.id),
      });
      setSuppliers(reordered);
    } catch (reorderError) {
      if (reorderError instanceof Error && reorderError.message.trim()) {
        setError(reorderError.message);
      } else {
        setError(text.supplierManagement.reorderSupplierError);
      }
    } finally {
      setIsReorderingSuppliers(false);
    }
  }

  async function onCreateProduct() {
    if (!selectedSupplierId) {
      setError(text.supplierManagement.selectSupplierFirst);
      return;
    }

    if (!newProductCategory.trim() || !newProductNameZh.trim()) {
      setError(text.supplierManagement.createProductValidationError);
      return;
    }

    const parsedPrice = newProductPriceHt.trim()
      ? Number(newProductPriceHt)
      : null;
    if (newProductPriceHt.trim() && !Number.isFinite(parsedPrice)) {
      setError(text.supplierManagement.invalidPrice);
      return;
    }

    setIsCreatingProduct(true);
    setError(null);

    try {
      const created = await createProduct(accessToken, {
        supplierId: selectedSupplierId,
        reference: newProductReference.trim()
          ? newProductReference.trim()
          : null,
        category: newProductCategory.trim(),
        nameZh: newProductNameZh.trim(),
        nameFr: newProductNameFr.trim() ? newProductNameFr.trim() : null,
        specification: newProductSpecification.trim()
          ? newProductSpecification.trim()
          : null,
        unit: newProductUnit.trim() ? newProductUnit.trim() : null,
        priceHt: parsedPrice,
      });

      setProducts((current) => [...current, created]);
      setSelectedProductId(created.id);
      setIsEditorOpen(true);
      setProductFilter('');
      setNewProductReference('');
      setNewProductCategory('');
      setNewProductNameZh('');
      setNewProductNameFr('');
      setNewProductSpecification('');
      setNewProductUnit('');
      setNewProductPriceHt('');
    } catch (createError) {
      if (createError instanceof Error && createError.message.trim()) {
        setError(createError.message);
      } else {
        setError(text.supplierManagement.createProductError);
      }
    } finally {
      setIsCreatingProduct(false);
    }
  }

  async function onSaveProduct() {
    if (!selectedProduct || !selectedSupplierId) {
      return;
    }

    const parsedPrice = editPriceHt.trim() ? Number(editPriceHt) : null;
    if (editPriceHt.trim() && !Number.isFinite(parsedPrice)) {
      setError(text.supplierManagement.invalidPrice);
      return;
    }

    setIsSavingProduct(true);
    setError(null);

    try {
      const updated = await updateProduct(accessToken, selectedProduct.id, {
        supplierId: selectedSupplierId,
        category: editCategory.trim(),
        nameZh: editNameZh.trim(),
        nameFr: editNameFr.trim() ? editNameFr.trim() : null,
        specification: editSpecification.trim()
          ? editSpecification.trim()
          : null,
        priceHt: parsedPrice,
      });

      setProducts((current) =>
        current.map((product) =>
          product.id === updated.id ? updated : product,
        ),
      );
    } catch {
      setError(text.supplierManagement.saveProductError);
    } finally {
      setIsSavingProduct(false);
    }
  }

  async function onUploadProductImage() {
    if (!selectedProduct) {
      return;
    }

    const result = await DocumentPicker.getDocumentAsync({
      multiple: false,
      type: ['image/*'],
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      return;
    }

    const asset = result.assets[0];
    if (!asset) {
      return;
    }

    setIsUploadingImage(true);
    setError(null);

    try {
      const imageUrl = await uploadProductImage(
        accessToken,
        selectedProduct.id,
        {
          uri: asset.uri,
          name: asset.name,
          mimeType: asset.mimeType ?? undefined,
          file: (asset as { file?: File }).file,
        },
      );

      setEditImage(imageUrl);
      setProducts((current) =>
        current.map((product) =>
          product.id === selectedProduct.id
            ? { ...product, image: imageUrl }
            : product,
        ),
      );
    } catch {
      setError(text.supplierManagement.uploadImageError);
    } finally {
      setIsUploadingImage(false);
    }
  }

  async function onDeleteProduct(product: ProductItem) {
    const confirmed = await new Promise<boolean>((resolve) => {
      confirmDeleteResolverRef.current = resolve;
      setConfirmDialogVisible(true);
    });

    if (!confirmed) {
      return;
    }

    setDeletingProductId(product.id);
    setError(null);

    try {
      await deleteProduct(accessToken, product.id);
      setProducts((current) =>
        current.filter((entry) => entry.id !== product.id),
      );
      if (selectedProductId === product.id) {
        setSelectedProductId(null);
        setIsEditorOpen(false);
      }
    } catch (deleteError) {
      if (deleteError instanceof Error && deleteError.message.trim()) {
        setError(deleteError.message);
      } else {
        setError(text.supplierManagement.deleteProductError);
      }
    } finally {
      setDeletingProductId(null);
    }
  }

  async function onDeleteSupplier(supplier: SupplierItem) {
    const confirmed = await new Promise<boolean>((resolve) => {
      confirmDeleteSupplierResolverRef.current = resolve;
      setConfirmSupplierDialogVisible(true);
    });

    if (!confirmed) {
      return;
    }

    setDeletingSupplierId(supplier.id);
    setError(null);

    try {
      await deleteSupplier(accessToken, supplier.id);
      setProducts((current) =>
        current.filter((product) => product.supplierId !== supplier.id),
      );
      setSuppliers((current) => {
        const remaining = current.filter((entry) => entry.id !== supplier.id);
        if (selectedSupplierId === supplier.id) {
          setSelectedSupplierId(remaining[0]?.id ?? null);
          setSelectedProductId(null);
          setIsEditorOpen(false);
        }
        return remaining;
      });
    } catch (deleteError) {
      if (deleteError instanceof Error && deleteError.message.trim()) {
        setError(deleteError.message);
      } else {
        setError(text.supplierManagement.deleteSupplierError);
      }
    } finally {
      setDeletingSupplierId(null);
    }
  }

  function closeDeleteProductDialog(value: boolean) {
    if (confirmDeleteResolverRef.current) {
      confirmDeleteResolverRef.current(value);
      confirmDeleteResolverRef.current = null;
    }
    setConfirmDialogVisible(false);
  }

  function closeDeleteSupplierDialog(value: boolean) {
    if (confirmDeleteSupplierResolverRef.current) {
      confirmDeleteSupplierResolverRef.current(value);
      confirmDeleteSupplierResolverRef.current = null;
    }
    setConfirmSupplierDialogVisible(false);
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{text.supplierManagement.title}</Text>
      <Text style={styles.subtitle}>{text.supplierManagement.subtitle}</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {isLoading ? (
        <Text style={styles.docEmpty}>{text.supplierManagement.loading}</Text>
      ) : null}

      <Text style={styles.uploadFieldTitle}>
        {text.supplierManagement.newSupplierLabel}
      </Text>
      <TextInput
        style={styles.input}
        placeholder={text.supplierManagement.newSupplierPlaceholder}
        placeholderTextColor="#a98a8d"
        value={newSupplierName}
        onChangeText={setNewSupplierName}
      />
      <Pressable
        style={[
          styles.primaryButton,
          isCreatingSupplier && styles.buttonDisabled,
        ]}
        disabled={isCreatingSupplier}
        onPress={() => {
          void onCreateSupplier();
        }}
      >
        <Text style={styles.primaryButtonText}>
          {isCreatingSupplier
            ? text.supplierManagement.creatingSupplier
            : text.supplierManagement.createSupplierButton}
        </Text>
      </Pressable>

      <Text style={styles.uploadFieldTitle}>
        {text.supplierManagement.suppliersLabel}
      </Text>
      <View style={styles.trainingTabRow}>
        {suppliers.map((supplier) => (
          <Pressable
            key={supplier.id}
            style={[
              styles.trainingTab,
              selectedSupplierId === supplier.id && styles.trainingTabActive,
            ]}
            onPress={() => setSelectedSupplierId(supplier.id)}
          >
            <Text
              style={[
                styles.trainingTabText,
                selectedSupplierId === supplier.id &&
                  styles.trainingTabTextActive,
              ]}
            >
              {supplier.name}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.supplierOrderHint}>
        {text.supplierManagement.supplierOrderHint}
      </Text>
      <View
        style={[
          styles.supplierOrderActions,
          isSmallScreen && styles.supplierOrderActionsSmall,
        ]}
      >
        <Pressable
          style={[
            styles.secondaryButton,
            styles.supplierOrderButton,
            (!canMoveSelectedSupplierUp || isReorderingSuppliers) &&
              styles.buttonDisabled,
          ]}
          disabled={!canMoveSelectedSupplierUp || isReorderingSuppliers}
          onPress={() => {
            void onMoveSelectedSupplier(-1);
          }}
        >
          <Text style={styles.secondaryButtonText}>
            {text.supplierManagement.moveSupplierUpButton}
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.secondaryButton,
            styles.supplierOrderButton,
            (!canMoveSelectedSupplierDown || isReorderingSuppliers) &&
              styles.buttonDisabled,
          ]}
          disabled={!canMoveSelectedSupplierDown || isReorderingSuppliers}
          onPress={() => {
            void onMoveSelectedSupplier(1);
          }}
        >
          <Text style={styles.secondaryButtonText}>
            {text.supplierManagement.moveSupplierDownButton}
          </Text>
        </Pressable>
      </View>
      {isReorderingSuppliers ? (
        <Text style={styles.docEmpty}>
          {text.supplierManagement.reorderingSupplier}
        </Text>
      ) : null}
      <Pressable
        style={[
          styles.dangerButton,
          (!selectedSupplier ||
            deletingSupplierId !== null ||
            isReorderingSuppliers) &&
            styles.buttonDisabled,
        ]}
        disabled={
          !selectedSupplier ||
          deletingSupplierId !== null ||
          isReorderingSuppliers
        }
        onPress={() => {
          if (selectedSupplier) {
            void onDeleteSupplier(selectedSupplier);
          }
        }}
      >
        <Text style={styles.dangerButtonText}>
          {deletingSupplierId !== null
            ? text.supplierManagement.deletingSupplier
            : text.supplierManagement.deleteSupplierButton}
        </Text>
      </Pressable>

      <Text style={styles.uploadFieldTitle}>
        {text.supplierManagement.newProductLabel}
      </Text>
      {!selectedSupplierId ? (
        <Text style={styles.docEmpty}>
          {text.supplierManagement.selectSupplierFirst}
        </Text>
      ) : null}
      <TextInput
        style={styles.input}
        placeholder={text.supplierManagement.fields.reference}
        placeholderTextColor="#a98a8d"
        value={newProductReference}
        onChangeText={setNewProductReference}
      />
      <TextInput
        style={styles.input}
        placeholder={text.supplierManagement.fields.category}
        placeholderTextColor="#a98a8d"
        value={newProductCategory}
        onChangeText={setNewProductCategory}
      />
      <TextInput
        style={styles.input}
        placeholder={text.supplierManagement.fields.nameZh}
        placeholderTextColor="#a98a8d"
        value={newProductNameZh}
        onChangeText={setNewProductNameZh}
      />
      <TextInput
        style={styles.input}
        placeholder={text.supplierManagement.fields.nameFr}
        placeholderTextColor="#a98a8d"
        value={newProductNameFr}
        onChangeText={setNewProductNameFr}
      />
      <TextInput
        style={styles.input}
        placeholder={text.supplierManagement.fields.specification}
        placeholderTextColor="#a98a8d"
        value={newProductSpecification}
        onChangeText={setNewProductSpecification}
      />
      <TextInput
        style={styles.input}
        placeholder={text.supplierManagement.fields.unit}
        placeholderTextColor="#a98a8d"
        value={newProductUnit}
        onChangeText={setNewProductUnit}
      />
      <TextInput
        style={styles.input}
        placeholder={text.supplierManagement.fields.priceHt}
        placeholderTextColor="#a98a8d"
        keyboardType="decimal-pad"
        value={newProductPriceHt}
        onChangeText={setNewProductPriceHt}
      />
      <Pressable
        style={[
          styles.primaryButton,
          (!selectedSupplierId || isCreatingProduct) && styles.buttonDisabled,
        ]}
        disabled={!selectedSupplierId || isCreatingProduct}
        onPress={() => {
          void onCreateProduct();
        }}
      >
        <Text style={styles.primaryButtonText}>
          {isCreatingProduct
            ? text.supplierManagement.creatingProduct
            : text.supplierManagement.createProductButton}
        </Text>
      </Pressable>

      <Text style={styles.uploadFieldTitle}>
        {text.supplierManagement.productsLabel}
      </Text>
      <TextInput
        style={styles.input}
        placeholder={text.supplierManagement.filterProductsPlaceholder}
        placeholderTextColor="#a98a8d"
        value={productFilter}
        onChangeText={setProductFilter}
      />
      <View style={[styles.listBlock, styles.productGrid]}>
        {supplierProducts.length === 0 ? (
          <Text style={styles.docEmpty}>
            {text.supplierManagement.noProduct}
          </Text>
        ) : filteredSupplierProducts.length === 0 ? (
          <Text style={styles.docEmpty}>
            {text.supplierManagement.noFilteredProduct}
          </Text>
        ) : (
          paginatedProducts.map((product) => {
            const infoRowStyle = isSmallScreen
              ? styles.productInfoRowSmall
              : styles.productInfoRow;
            const productGridItemStyle = isSmallScreen
              ? styles.productGridItemSmall
              : styles.productGridItem;

            return (
              <View
                key={product.id}
                style={[
                  styles.docItem,
                  productGridItemStyle,
                  selectedProductId === product.id && styles.trainingTabActive,
                ]}
              >
                <View style={styles.productCardHeaderRow}>
                  <Pressable
                    style={styles.productCardContentPressable}
                    onPress={() => {
                      setSelectedProductId(product.id);
                      setIsEditorOpen(true);
                    }}
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
                      ) : null}

                      <View
                        style={[
                          styles.productInfoColumn,
                          isSmallScreen && styles.productInfoColumnSmall,
                        ]}
                      >
                        <Text
                          style={[
                            styles.docItemTitle,
                            selectedProductId === product.id &&
                              styles.trainingTabTextActive,
                          ]}
                        >
                          {product.nameFr ?? product.nameZh}
                        </Text>
                        {product.nameFr &&
                        product.nameZh &&
                        product.nameFr !== product.nameZh ? (
                          <Text
                            style={[
                              styles.docItemMeta,
                              selectedProductId === product.id &&
                                styles.trainingTabTextActive,
                            ]}
                          >
                            {product.nameZh}
                          </Text>
                        ) : null}
                        <Text
                          style={[
                            styles.docItemMeta,
                            selectedProductId === product.id &&
                              styles.trainingTabTextActive,
                          ]}
                        >
                          {product.category}
                        </Text>
                        {product.specification ? (
                          <Text
                            style={[
                              styles.docItemMeta,
                              selectedProductId === product.id &&
                                styles.trainingTabTextActive,
                            ]}
                          >
                            {text.supplierManagement.fields.specification}:{' '}
                            {product.specification}
                          </Text>
                        ) : null}
                        <Text
                          style={[
                            styles.docItemMeta,
                            selectedProductId === product.id &&
                              styles.trainingTabTextActive,
                          ]}
                        >
                          {text.supplierManagement.tapToEdit}
                        </Text>
                      </View>
                    </View>
                  </Pressable>

                  <Pressable
                    style={styles.productDeleteIconButton}
                    disabled={deletingProductId === product.id}
                    onPress={() => {
                      void onDeleteProduct(product);
                    }}
                  >
                    {deletingProductId === product.id ? (
                      <Text style={styles.productDeleteLoading}>…</Text>
                    ) : (
                      <View style={styles.trashIcon}>
                        <View style={styles.trashLid} />
                        <View style={styles.trashBody}>
                          <View style={styles.trashBar} />
                          <View style={styles.trashBar} />
                        </View>
                      </View>
                    )}
                  </Pressable>
                </View>
              </View>
            );
          })
        )}
      </View>

      {filteredSupplierProducts.length > PRODUCTS_PER_PAGE ? (
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
              setCurrentPage((previous) => Math.max(1, previous - 1))
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
              setCurrentPage((previous) => Math.min(totalPages, previous + 1))
            }
          >
            <Text style={styles.secondaryButtonText}>
              {text.supplierManagement.paginationNext}
            </Text>
          </Pressable>
        </View>
      ) : null}

      <Modal
        visible={isEditorOpen && Boolean(selectedProduct)}
        transparent
        animationType="fade"
        onRequestClose={() => setIsEditorOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <ScrollView contentContainerStyle={styles.modalContent}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.docBlockTitle}>
                  {text.supplierManagement.editProductTitle}
                </Text>
                <Pressable
                  style={styles.secondaryButton}
                  onPress={() => setIsEditorOpen(false)}
                >
                  <Text style={styles.secondaryButtonText}>
                    {text.supplierManagement.closeEditor}
                  </Text>
                </Pressable>
              </View>

              {selectedProduct ? (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder={text.supplierManagement.fields.nameZh}
                    placeholderTextColor="#a98a8d"
                    value={editNameZh}
                    onChangeText={setEditNameZh}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder={text.supplierManagement.fields.nameFr}
                    placeholderTextColor="#a98a8d"
                    value={editNameFr}
                    onChangeText={setEditNameFr}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder={text.supplierManagement.fields.specification}
                    placeholderTextColor="#a98a8d"
                    value={editSpecification}
                    onChangeText={setEditSpecification}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder={text.supplierManagement.fields.category}
                    placeholderTextColor="#a98a8d"
                    value={editCategory}
                    onChangeText={setEditCategory}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder={text.supplierManagement.fields.priceHt}
                    placeholderTextColor="#a98a8d"
                    keyboardType="decimal-pad"
                    value={editPriceHt}
                    onChangeText={setEditPriceHt}
                  />

                  <Text style={styles.docItemMeta}>
                    {text.supplierManagement.fields.image}
                  </Text>
                  {editImage ? (
                    <View style={styles.productImageFrame}>
                      <Image
                        source={{ uri: editImage }}
                        style={styles.productImagePreview}
                        resizeMode="cover"
                      />
                    </View>
                  ) : null}
                  <Text style={styles.docItemLink}>
                    {editImage || text.supplierManagement.noImage}
                  </Text>
                  <Pressable
                    style={[
                      styles.secondaryButton,
                      isUploadingImage && styles.buttonDisabled,
                    ]}
                    disabled={isUploadingImage}
                    onPress={() => {
                      void onUploadProductImage();
                    }}
                  >
                    <Text style={styles.secondaryButtonText}>
                      {isUploadingImage
                        ? text.supplierManagement.uploadingImage
                        : text.supplierManagement.uploadImageButton}
                    </Text>
                  </Pressable>

                  <Pressable
                    style={[
                      styles.primaryButton,
                      isSavingProduct && styles.buttonDisabled,
                    ]}
                    disabled={isSavingProduct}
                    onPress={() => {
                      void onSaveProduct();
                    }}
                  >
                    <Text style={styles.primaryButtonText}>
                      {isSavingProduct
                        ? text.supplierManagement.savingProduct
                        : text.supplierManagement.saveProductButton}
                    </Text>
                  </Pressable>
                </>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <ConfirmDialog
        visible={confirmDialogVisible}
        title={text.supplierManagement.deleteProductButton}
        message={text.supplierManagement.deleteProductConfirm}
        cancelLabel={text.supplierManagement.deleteProductCancel}
        confirmLabel={text.supplierManagement.deleteProductConfirmButton}
        destructive
        onCancel={() => closeDeleteProductDialog(false)}
        onConfirm={() => closeDeleteProductDialog(true)}
      />
      <ConfirmDialog
        visible={confirmSupplierDialogVisible}
        title={text.supplierManagement.deleteSupplierButton}
        message={text.supplierManagement.deleteSupplierConfirm}
        cancelLabel={text.supplierManagement.deleteSupplierCancel}
        confirmLabel={text.supplierManagement.deleteSupplierConfirmButton}
        destructive
        onCancel={() => closeDeleteSupplierDialog(false)}
        onConfirm={() => closeDeleteSupplierDialog(true)}
      />
    </View>
  );
}
