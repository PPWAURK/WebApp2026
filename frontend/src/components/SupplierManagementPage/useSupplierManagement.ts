import * as DocumentPicker from 'expo-document-picker';
import { useEffect, useMemo, useRef, useState } from 'react';
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

const PRODUCTS_PER_PAGE = 8;

type UseSupplierManagementParams = {
  text: AppText;
  accessToken: string;
};

export function useSupplierManagement({
  text,
  accessToken,
}: UseSupplierManagementParams) {
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

  // --- Effects ---

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

  // --- Derived data ---

  const supplierProducts = useMemo(
    () =>
      selectedSupplierId
        ? products.filter(
            (product) => product.supplierId === selectedSupplierId,
          )
        : [],
    [products, selectedSupplierId],
  );

  const supplierProductCountById = useMemo(() => {
    const next = new Map<number, number>();

    for (const supplier of suppliers) {
      next.set(supplier.id, 0);
    }

    for (const product of products) {
      next.set(product.supplierId, (next.get(product.supplierId) ?? 0) + 1);
    }

    return next;
  }, [products, suppliers]);

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
  const selectedSupplierProductCount = supplierProducts.length;

  // --- Sync effects ---

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

  // --- Actions ---

  async function handleCreateSupplier() {
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

  async function handleMoveSelectedSupplier(direction: -1 | 1) {
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

  async function handleCreateProduct() {
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

  async function handleSaveProduct() {
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

  async function handleUploadProductImage() {
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

  async function handleDeleteProduct(product: ProductItem) {
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

  async function handleDeleteSupplier(supplier: SupplierItem) {
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

  function selectProductForEditing(productId: number) {
    setSelectedProductId(productId);
    setIsEditorOpen(true);
  }

  return {
    // Data
    suppliers,
    products,
    selectedSupplierId,
    selectedProductId,
    selectedSupplier,
    selectedProduct,
    supplierProducts,
    supplierProductCountById,
    filteredSupplierProducts,
    paginatedProducts,
    selectedSupplierProductCount,
    currentPage,
    totalPages,
    productFilter,
    canMoveSelectedSupplierUp,
    canMoveSelectedSupplierDown,

    // Loading / UI state
    isLoading,
    isCreatingSupplier,
    isReorderingSuppliers,
    isSavingProduct,
    isCreatingProduct,
    isUploadingImage,
    deletingProductId,
    deletingSupplierId,
    isEditorOpen,
    error,
    confirmDialogVisible,
    confirmSupplierDialogVisible,

    // New supplier form
    newSupplierName,
    setNewSupplierName,

    // New product form
    newProductReference,
    setNewProductReference,
    newProductCategory,
    setNewProductCategory,
    newProductNameZh,
    setNewProductNameZh,
    newProductNameFr,
    setNewProductNameFr,
    newProductSpecification,
    setNewProductSpecification,
    newProductUnit,
    setNewProductUnit,
    newProductPriceHt,
    setNewProductPriceHt,

    // Edit product form
    editCategory,
    setEditCategory,
    editNameZh,
    setEditNameZh,
    editNameFr,
    setEditNameFr,
    editSpecification,
    setEditSpecification,
    editPriceHt,
    setEditPriceHt,
    editImage,

    // Actions
    setSelectedSupplierId,
    setProductFilter,
    setCurrentPage,
    setIsEditorOpen,
    selectProductForEditing,
    handleCreateSupplier,
    handleMoveSelectedSupplier,
    handleCreateProduct,
    handleSaveProduct,
    handleUploadProductImage,
    handleDeleteProduct,
    handleDeleteSupplier,
    closeDeleteProductDialog,
    closeDeleteSupplierDialog,
  };
}
