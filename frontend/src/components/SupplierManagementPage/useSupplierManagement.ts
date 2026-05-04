import * as DocumentPicker from 'expo-document-picker';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { AppText } from '../../locales/translations';
import {
  createProductCategory,
  createProduct,
  deleteProductCategory,
  fetchProductCategories,
  fetchProducts,
  updateProductCategory,
  uploadProductImage,
  updateProduct,
  updateProductAvailability,
  type ProductCategoryItem,
  type ProductItem,
} from '../../services/productsApi';
import {
  createSupplier,
  deleteSupplier,
  fetchSuppliers,
  reorderSuppliers,
  updateSupplierOrderSettings,
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
  const [orderNoticeDraft, setOrderNoticeDraft] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingSupplier, setIsCreatingSupplier] = useState(false);
  const [isReorderingSuppliers, setIsReorderingSuppliers] = useState(false);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [isUpdatingSupplierOrderSettings, setIsUpdatingSupplierOrderSettings] =
    useState(false);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [updatingProductAvailabilityId, setUpdatingProductAvailabilityId] =
    useState<number | null>(null);
  const [deletingSupplierId, setDeletingSupplierId] = useState<number | null>(
    null,
  );
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDialogVisible, setConfirmDialogVisible] = useState(false);
  const confirmDeactivateResolverRef = useRef<
    ((value: boolean) => void) | null
  >(null);
  const [confirmSupplierDialogVisible, setConfirmSupplierDialogVisible] =
    useState(false);
  const confirmDeleteSupplierResolverRef = useRef<
    ((value: boolean) => void) | null
  >(null);
  const [productCategories, setProductCategories] = useState<
    ProductCategoryItem[]
  >([]);
  const [newProductCategoryId, setNewProductCategoryId] = useState<
    number | null
  >(null);
  const [editProductCategoryId, setEditProductCategoryId] = useState<
    number | null
  >(null);
  const [managedProductCategoryId, setManagedProductCategoryId] = useState<
    number | null
  >(null);
  const [newCategoryNameZh, setNewCategoryNameZh] = useState('');
  const [newCategoryNameFr, setNewCategoryNameFr] = useState('');
  const [editCategoryNameZh, setEditCategoryNameZh] = useState('');
  const [editCategoryNameFr, setEditCategoryNameFr] = useState('');
  const [updatingCategoryId, setUpdatingCategoryId] = useState<number | null>(
    null,
  );

  const [newProductReference, setNewProductReference] = useState('');
  const [newProductNameZh, setNewProductNameZh] = useState('');
  const [newProductNameFr, setNewProductNameFr] = useState('');
  const [newProductSpecification, setNewProductSpecification] = useState('');
  const [newProductUnit, setNewProductUnit] = useState('');
  const [newProductPriceHt, setNewProductPriceHt] = useState('');
  const [newProductSpecification2, setNewProductSpecification2] = useState('');
  const [newProductUnit2, setNewProductUnit2] = useState('');
  const [newProductPriceHt2, setNewProductPriceHt2] = useState('');
  const [newProductSpecification3, setNewProductSpecification3] = useState('');
  const [newProductUnit3, setNewProductUnit3] = useState('');
  const [newProductPriceHt3, setNewProductPriceHt3] = useState('');
  const [editNameZh, setEditNameZh] = useState('');
  const [editNameFr, setEditNameFr] = useState('');
  const [editSpecification, setEditSpecification] = useState('');
  const [editUnit, setEditUnit] = useState('');
  const [editPriceHt, setEditPriceHt] = useState('');
  const [editSpecification2, setEditSpecification2] = useState('');
  const [editUnit2, setEditUnit2] = useState('');
  const [editPriceHt2, setEditPriceHt2] = useState('');
  const [editSpecification3, setEditSpecification3] = useState('');
  const [editUnit3, setEditUnit3] = useState('');
  const [editPriceHt3, setEditPriceHt3] = useState('');
  const [editImage, setEditImage] = useState('');

  // --- Effects ---

  useEffect(() => {
    let isActive = true;
    setIsLoading(true);
    setError(null);

    void Promise.all([
      fetchSuppliers(accessToken),
      fetchProducts(accessToken, { includeInactive: true }),
    ])
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

  useEffect(() => {
    let isActive = true;

    if (!selectedSupplierId) {
      setProductCategories([]);
      setNewProductCategoryId(null);
      setEditProductCategoryId(null);
      setManagedProductCategoryId(null);
      return;
    }

    setProductCategories([]);
    setNewProductCategoryId(null);
    setEditProductCategoryId(null);
    setManagedProductCategoryId(null);

    void fetchProductCategories(accessToken, selectedSupplierId)
      .then((categories) => {
        if (!isActive) {
          return;
        }

        const sortedCategories = sortProductCategories(categories);
        const firstCategoryId = sortedCategories[0]?.id ?? null;

        setProductCategories(sortedCategories);
        setNewProductCategoryId((current) =>
          hasCategory(sortedCategories, current) ? current : firstCategoryId,
        );
        setManagedProductCategoryId((current) =>
          hasCategory(sortedCategories, current) ? current : firstCategoryId,
        );
      })
      .catch(() => {
        if (isActive) {
          setError(text.supplierManagement.loadCategoriesError);
        }
      });

    return () => {
      isActive = false;
    };
  }, [
    accessToken,
    selectedSupplierId,
    text.supplierManagement.loadCategoriesError,
  ]);

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
        product.specification2,
        product.specification3,
        product.unit,
        product.unit2,
        product.unit3,
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
  const isOrderNoticeDirty =
    orderNoticeDraft.trim() !== (selectedSupplier?.orderNotice.trim() ?? '');

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
    setOrderNoticeDraft(selectedSupplier?.orderNotice ?? '');
  }, [selectedSupplierId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [productFilter]);

  useEffect(() => {
    setCurrentPage((previous) => Math.min(previous, totalPages));
  }, [totalPages]);

  useEffect(() => {
    if (!selectedProduct) {
      setEditProductCategoryId(null);
      setEditNameZh('');
      setEditNameFr('');
      setEditSpecification('');
      setEditUnit('');
      setEditPriceHt('');
      setEditSpecification2('');
      setEditUnit2('');
      setEditPriceHt2('');
      setEditSpecification3('');
      setEditUnit3('');
      setEditPriceHt3('');
      setEditImage('');
      return;
    }

    setEditProductCategoryId(
      resolveProductCategoryId(selectedProduct, productCategories),
    );
    setEditNameZh(selectedProduct.nameZh);
    setEditNameFr(selectedProduct.nameFr ?? '');
    setEditSpecification(selectedProduct.specification ?? '');
    setEditUnit(selectedProduct.unit ?? '');
    setEditPriceHt(
      selectedProduct.priceHt === null
        ? ''
        : selectedProduct.priceHt.toString(),
    );
    setEditSpecification2(selectedProduct.specification2 ?? '');
    setEditUnit2(selectedProduct.unit2 ?? '');
    setEditPriceHt2(
      selectedProduct.priceHt2 === null
        ? ''
        : selectedProduct.priceHt2.toString(),
    );
    setEditSpecification3(selectedProduct.specification3 ?? '');
    setEditUnit3(selectedProduct.unit3 ?? '');
    setEditPriceHt3(
      selectedProduct.priceHt3 === null
        ? ''
        : selectedProduct.priceHt3.toString(),
    );
    setEditImage(selectedProduct.image ?? '');
  }, [productCategories, selectedProduct]);

  useEffect(() => {
    const selectedCategory =
      productCategories.find(
        (category) => category.id === managedProductCategoryId,
      ) ?? null;

    setEditCategoryNameZh(selectedCategory?.nameZh ?? '');
    setEditCategoryNameFr(selectedCategory?.nameFr ?? '');
  }, [managedProductCategoryId, productCategories]);

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

    const selectedCategory = getProductCategoryById(
      productCategories,
      newProductCategoryId,
    );

    if (!selectedCategory || !newProductNameZh.trim()) {
      setError(text.supplierManagement.createProductValidationError);
      return;
    }

    const parsedPrice = parseOptionalPrice(newProductPriceHt);
    const parsedPrice2 = parseOptionalPrice(newProductPriceHt2);
    const parsedPrice3 = parseOptionalPrice(newProductPriceHt3);

    if (
      parsedPrice === undefined ||
      parsedPrice2 === undefined ||
      parsedPrice3 === undefined
    ) {
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
        categoryId: selectedCategory.id,
        category: selectedCategory.nameZh,
        nameZh: newProductNameZh.trim(),
        nameFr: newProductNameFr.trim() ? newProductNameFr.trim() : null,
        specification: newProductSpecification.trim()
          ? newProductSpecification.trim()
          : null,
        unit: newProductUnit.trim() ? newProductUnit.trim() : null,
        priceHt: parsedPrice,
        specification2: newProductSpecification2.trim()
          ? newProductSpecification2.trim()
          : null,
        unit2: newProductUnit2.trim() ? newProductUnit2.trim() : null,
        priceHt2: parsedPrice2,
        specification3: newProductSpecification3.trim()
          ? newProductSpecification3.trim()
          : null,
        unit3: newProductUnit3.trim() ? newProductUnit3.trim() : null,
        priceHt3: parsedPrice3,
      });

      setProducts((current) => [...current, created]);
      setSelectedProductId(created.id);
      setIsEditorOpen(true);
      setProductFilter('');
      setNewProductReference('');
      setNewProductNameZh('');
      setNewProductNameFr('');
      setNewProductSpecification('');
      setNewProductUnit('');
      setNewProductPriceHt('');
      setNewProductSpecification2('');
      setNewProductUnit2('');
      setNewProductPriceHt2('');
      setNewProductSpecification3('');
      setNewProductUnit3('');
      setNewProductPriceHt3('');
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

    const selectedCategory = getProductCategoryById(
      productCategories,
      editProductCategoryId,
    );

    if (!selectedCategory || !editNameZh.trim()) {
      setError(text.supplierManagement.createProductValidationError);
      return;
    }

    const parsedPrice = parseOptionalPrice(editPriceHt);
    const parsedPrice2 = parseOptionalPrice(editPriceHt2);
    const parsedPrice3 = parseOptionalPrice(editPriceHt3);

    if (
      parsedPrice === undefined ||
      parsedPrice2 === undefined ||
      parsedPrice3 === undefined
    ) {
      setError(text.supplierManagement.invalidPrice);
      return;
    }

    setIsSavingProduct(true);
    setError(null);

    try {
      const updated = await updateProduct(accessToken, selectedProduct.id, {
        supplierId: selectedSupplierId,
        categoryId: selectedCategory.id,
        category: selectedCategory.nameZh,
        nameZh: editNameZh.trim(),
        nameFr: editNameFr.trim() ? editNameFr.trim() : null,
        specification: editSpecification.trim()
          ? editSpecification.trim()
          : null,
        unit: editUnit.trim() ? editUnit.trim() : null,
        priceHt: parsedPrice,
        specification2: editSpecification2.trim()
          ? editSpecification2.trim()
          : null,
        unit2: editUnit2.trim() ? editUnit2.trim() : null,
        priceHt2: parsedPrice2,
        specification3: editSpecification3.trim()
          ? editSpecification3.trim()
          : null,
        unit3: editUnit3.trim() ? editUnit3.trim() : null,
        priceHt3: parsedPrice3,
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

  async function handleToggleProductAvailability(product: ProductItem) {
    if (product.isActive) {
      const confirmed = await new Promise<boolean>((resolve) => {
        confirmDeactivateResolverRef.current = resolve;
        setConfirmDialogVisible(true);
      });

      if (!confirmed) {
        return;
      }
    }

    const nextIsActive = !product.isActive;
    setUpdatingProductAvailabilityId(product.id);
    setError(null);

    try {
      const updated = await updateProductAvailability(
        accessToken,
        product.id,
        nextIsActive,
      );
      setProducts((current) =>
        current.map((entry) => (entry.id === updated.id ? updated : entry)),
      );
    } catch (updateError) {
      if (updateError instanceof Error && updateError.message.trim()) {
        setError(updateError.message);
      } else {
        setError(text.supplierManagement.updateProductAvailabilityError);
      }
    } finally {
      setUpdatingProductAvailabilityId(null);
    }
  }

  async function handleCreateProductCategory() {
    if (!selectedSupplierId) {
      setError(text.supplierManagement.selectSupplierFirst);
      return;
    }

    const trimmedNameZh = newCategoryNameZh.trim();
    const trimmedNameFr = newCategoryNameFr.trim();

    if (!trimmedNameZh || !trimmedNameFr) {
      setError(text.supplierManagement.categoryValidationError);
      return;
    }

    setUpdatingCategoryId(0);
    setError(null);

    try {
      const created = await createProductCategory(accessToken, {
        supplierId: selectedSupplierId,
        nameZh: trimmedNameZh,
        nameFr: trimmedNameFr,
      });

      setProductCategories((current) =>
        sortProductCategories([...current, created]),
      );
      setNewProductCategoryId(created.id);
      setManagedProductCategoryId(created.id);
      setNewCategoryNameZh('');
      setNewCategoryNameFr('');
    } catch (createError) {
      if (createError instanceof Error && createError.message.trim()) {
        setError(createError.message);
      } else {
        setError(text.supplierManagement.createCategoryError);
      }
    } finally {
      setUpdatingCategoryId(null);
    }
  }

  async function handleSaveProductCategory() {
    const category = getProductCategoryById(
      productCategories,
      managedProductCategoryId,
    );

    if (!category) {
      return;
    }

    const trimmedNameZh = editCategoryNameZh.trim();
    const trimmedNameFr = editCategoryNameFr.trim();

    if (!trimmedNameZh || !trimmedNameFr) {
      setError(text.supplierManagement.categoryValidationError);
      return;
    }

    setUpdatingCategoryId(category.id);
    setError(null);

    try {
      const updated = await updateProductCategory(accessToken, category.id, {
        nameZh: trimmedNameZh,
        nameFr: trimmedNameFr,
      });

      setProductCategories((current) =>
        sortProductCategories(
          current.map((entry) => (entry.id === updated.id ? updated : entry)),
        ),
      );
      applyProductCategoryToProducts(updated);
    } catch (updateError) {
      if (updateError instanceof Error && updateError.message.trim()) {
        setError(updateError.message);
      } else {
        setError(text.supplierManagement.updateCategoryError);
      }
    } finally {
      setUpdatingCategoryId(null);
    }
  }

  async function handleMoveProductCategory(
    categoryId: number,
    direction: 'up' | 'down',
  ) {
    const currentIndex = productCategories.findIndex(
      (category) => category.id === categoryId,
    );
    const targetIndex =
      direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (
      currentIndex < 0 ||
      targetIndex < 0 ||
      targetIndex >= productCategories.length
    ) {
      return;
    }

    const currentCategory = productCategories[currentIndex];
    const targetCategory = productCategories[targetIndex];

    setUpdatingCategoryId(categoryId);
    setError(null);

    try {
      const [updatedCurrent, updatedTarget] = await Promise.all([
        updateProductCategory(accessToken, currentCategory.id, {
          sortOrder: targetCategory.sortOrder,
        }),
        updateProductCategory(accessToken, targetCategory.id, {
          sortOrder: currentCategory.sortOrder,
        }),
      ]);

      setProductCategories((current) =>
        sortProductCategories(
          current.map((category) => {
            if (category.id === updatedCurrent.id) {
              return updatedCurrent;
            }
            if (category.id === updatedTarget.id) {
              return updatedTarget;
            }
            return category;
          }),
        ),
      );
    } catch (updateError) {
      if (updateError instanceof Error && updateError.message.trim()) {
        setError(updateError.message);
      } else {
        setError(text.supplierManagement.updateCategoryError);
      }
    } finally {
      setUpdatingCategoryId(null);
    }
  }

  async function handleDeleteProductCategory(categoryId: number) {
    setUpdatingCategoryId(categoryId);
    setError(null);

    try {
      await deleteProductCategory(accessToken, categoryId);

      setProductCategories((current) => {
        const remaining = current.filter(
          (category) => category.id !== categoryId,
        );
        const firstCategoryId = remaining[0]?.id ?? null;

        setNewProductCategoryId((selectedId) =>
          selectedId === categoryId ? firstCategoryId : selectedId,
        );
        setEditProductCategoryId((selectedId) =>
          selectedId === categoryId ? firstCategoryId : selectedId,
        );
        setManagedProductCategoryId((selectedId) =>
          selectedId === categoryId ? firstCategoryId : selectedId,
        );

        return remaining;
      });
    } catch (deleteError) {
      if (deleteError instanceof Error && deleteError.message.trim()) {
        setError(deleteError.message);
      } else {
        setError(text.supplierManagement.deleteCategoryError);
      }
    } finally {
      setUpdatingCategoryId(null);
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

  async function handleToggleSupplierOrderTemplate(
    includeAllProductsInOrder: boolean,
  ) {
    if (!selectedSupplier) {
      return;
    }

    const previousSupplier = selectedSupplier;
    setIsUpdatingSupplierOrderSettings(true);
    setError(null);
    setSuppliers((current) =>
      current.map((supplier) =>
        supplier.id === previousSupplier.id
          ? { ...supplier, includeAllProductsInOrder }
          : supplier,
      ),
    );

    try {
      const updated = await updateSupplierOrderSettings(
        accessToken,
        previousSupplier.id,
        {
          includeAllProductsInOrder,
        },
      );
      setSuppliers((current) =>
        current.map((supplier) =>
          supplier.id === updated.id ? updated : supplier,
        ),
      );
    } catch (updateError) {
      setSuppliers((current) =>
        current.map((supplier) =>
          supplier.id === previousSupplier.id ? previousSupplier : supplier,
        ),
      );
      if (updateError instanceof Error && updateError.message.trim()) {
        setError(updateError.message);
      } else {
        setError(text.supplierManagement.updateSupplierOrderSettingsError);
      }
    } finally {
      setIsUpdatingSupplierOrderSettings(false);
    }
  }

  async function handleSaveSupplierOrderNotice() {
    if (!selectedSupplier) {
      return;
    }

    const previousSupplier = selectedSupplier;
    const nextOrderNotice = orderNoticeDraft.trim();
    setIsUpdatingSupplierOrderSettings(true);
    setError(null);

    try {
      const updated = await updateSupplierOrderSettings(
        accessToken,
        previousSupplier.id,
        {
          includeAllProductsInOrder: previousSupplier.includeAllProductsInOrder,
          orderNotice: nextOrderNotice,
        },
      );
      setSuppliers((current) =>
        current.map((supplier) =>
          supplier.id === updated.id ? updated : supplier,
        ),
      );
      setOrderNoticeDraft(updated.orderNotice);
    } catch (updateError) {
      if (updateError instanceof Error && updateError.message.trim()) {
        setError(updateError.message);
      } else {
        setError(text.supplierManagement.updateSupplierOrderSettingsError);
      }
    } finally {
      setIsUpdatingSupplierOrderSettings(false);
    }
  }

  function closeDeleteProductDialog(value: boolean) {
    if (confirmDeactivateResolverRef.current) {
      confirmDeactivateResolverRef.current(value);
      confirmDeactivateResolverRef.current = null;
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

  function parseOptionalPrice(value: string) {
    if (!value.trim()) {
      return null;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  function applyProductCategoryToProducts(category: ProductCategoryItem) {
    setProducts((current) =>
      current.map((product) =>
        product.categoryId === category.id
          ? {
              ...product,
              category: category.nameZh,
              categoryNameZh: category.nameZh,
              categoryNameFr: category.nameFr,
              categorySortOrder: category.sortOrder,
            }
          : product,
      ),
    );
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
    orderNoticeDraft,
    isOrderNoticeDirty,
    productCategories,
    newProductCategoryId,
    editProductCategoryId,
    managedProductCategoryId,
    newCategoryNameZh,
    newCategoryNameFr,
    editCategoryNameZh,
    editCategoryNameFr,
    updatingCategoryId,
    canMoveSelectedSupplierUp,
    canMoveSelectedSupplierDown,

    // Loading / UI state
    isLoading,
    isCreatingSupplier,
    isReorderingSuppliers,
    isSavingProduct,
    isUpdatingSupplierOrderSettings,
    isCreatingProduct,
    isUploadingImage,
    updatingProductAvailabilityId,
    deletingSupplierId,
    isEditorOpen,
    error,
    confirmDialogVisible,
    confirmSupplierDialogVisible,

    // New supplier form
    newSupplierName,
    setNewSupplierName,
    setOrderNoticeDraft,

    // New product form
    newProductReference,
    setNewProductReference,
    setNewProductCategoryId,
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
    newProductSpecification2,
    setNewProductSpecification2,
    newProductUnit2,
    setNewProductUnit2,
    newProductPriceHt2,
    setNewProductPriceHt2,
    newProductSpecification3,
    setNewProductSpecification3,
    newProductUnit3,
    setNewProductUnit3,
    newProductPriceHt3,
    setNewProductPriceHt3,

    // Edit product form
    setEditProductCategoryId,
    setManagedProductCategoryId,
    setNewCategoryNameZh,
    setNewCategoryNameFr,
    setEditCategoryNameZh,
    setEditCategoryNameFr,
    editNameZh,
    setEditNameZh,
    editNameFr,
    setEditNameFr,
    editSpecification,
    setEditSpecification,
    editUnit,
    setEditUnit,
    editPriceHt,
    setEditPriceHt,
    editSpecification2,
    setEditSpecification2,
    editUnit2,
    setEditUnit2,
    editPriceHt2,
    setEditPriceHt2,
    editSpecification3,
    setEditSpecification3,
    editUnit3,
    setEditUnit3,
    editPriceHt3,
    setEditPriceHt3,
    editImage,

    // Actions
    setSelectedSupplierId,
    setProductFilter,
    setCurrentPage,
    setIsEditorOpen,
    selectProductForEditing,
    handleCreateSupplier,
    handleMoveSelectedSupplier,
    handleToggleSupplierOrderTemplate,
    handleSaveSupplierOrderNotice,
    handleCreateProduct,
    handleSaveProduct,
    handleUploadProductImage,
    handleToggleProductAvailability,
    handleCreateProductCategory,
    handleSaveProductCategory,
    handleMoveProductCategory,
    handleDeleteProductCategory,
    handleDeleteSupplier,
    closeDeleteProductDialog,
    closeDeleteSupplierDialog,
  };
}

function sortProductCategories(
  categories: ProductCategoryItem[],
): ProductCategoryItem[] {
  return [...categories].sort((left, right) => {
    if (left.sortOrder !== right.sortOrder) {
      return left.sortOrder - right.sortOrder;
    }

    return left.id - right.id;
  });
}

function hasCategory(
  categories: ProductCategoryItem[],
  categoryId: number | null,
): boolean {
  return (
    categoryId !== null &&
    categories.some((category) => category.id === categoryId)
  );
}

function getProductCategoryById(
  categories: ProductCategoryItem[],
  categoryId: number | null,
): ProductCategoryItem | null {
  if (categoryId === null) {
    return null;
  }

  return categories.find((category) => category.id === categoryId) ?? null;
}

function resolveProductCategoryId(
  product: ProductItem,
  categories: ProductCategoryItem[],
): number | null {
  if (hasCategory(categories, product.categoryId)) {
    return product.categoryId;
  }

  const matchedCategory = categories.find(
    (category) =>
      category.nameZh === product.category ||
      category.nameFr === product.category,
  );

  return matchedCategory?.id ?? categories[0]?.id ?? null;
}
