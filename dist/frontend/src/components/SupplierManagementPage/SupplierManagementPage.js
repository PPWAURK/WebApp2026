"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupplierManagementPage = SupplierManagementPage;
const DocumentPicker = __importStar(require("expo-document-picker"));
const react_1 = require("react");
const react_native_1 = require("react-native");
const productsApi_1 = require("../../services/productsApi");
const suppliersApi_1 = require("../../services/suppliersApi");
const ConfirmDialog_1 = require("../ConfirmDialog");
const SupplierManagementPage_styles_1 = require("./SupplierManagementPage.styles");
const PRODUCTS_PER_PAGE = 8;
function SupplierManagementPage({ text, accessToken, }) {
    const [suppliers, setSuppliers] = (0, react_1.useState)([]);
    const [products, setProducts] = (0, react_1.useState)([]);
    const [selectedSupplierId, setSelectedSupplierId] = (0, react_1.useState)(null);
    const [selectedProductId, setSelectedProductId] = (0, react_1.useState)(null);
    const [currentPage, setCurrentPage] = (0, react_1.useState)(1);
    const [productFilter, setProductFilter] = (0, react_1.useState)('');
    const [newSupplierName, setNewSupplierName] = (0, react_1.useState)('');
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const [isCreatingSupplier, setIsCreatingSupplier] = (0, react_1.useState)(false);
    const [isSavingProduct, setIsSavingProduct] = (0, react_1.useState)(false);
    const [isUploadingImage, setIsUploadingImage] = (0, react_1.useState)(false);
    const [deletingProductId, setDeletingProductId] = (0, react_1.useState)(null);
    const [isEditorOpen, setIsEditorOpen] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const [confirmDialogVisible, setConfirmDialogVisible] = (0, react_1.useState)(false);
    const confirmDeleteResolverRef = (0, react_1.useRef)(null);
    const [editCategory, setEditCategory] = (0, react_1.useState)('');
    const [editNameZh, setEditNameZh] = (0, react_1.useState)('');
    const [editNameFr, setEditNameFr] = (0, react_1.useState)('');
    const [editSpecification, setEditSpecification] = (0, react_1.useState)('');
    const [editPriceHt, setEditPriceHt] = (0, react_1.useState)('');
    const [editImage, setEditImage] = (0, react_1.useState)('');
    (0, react_1.useEffect)(() => {
        let isActive = true;
        setIsLoading(true);
        setError(null);
        void Promise.all([(0, suppliersApi_1.fetchSuppliers)(accessToken), (0, productsApi_1.fetchProducts)(accessToken)])
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
    const supplierProducts = (0, react_1.useMemo)(() => selectedSupplierId
        ? products.filter((product) => product.supplierId === selectedSupplierId)
        : [], [products, selectedSupplierId]);
    const filteredSupplierProducts = (0, react_1.useMemo)(() => {
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
            return fields.some((field) => typeof field === 'string' && field.toLowerCase().includes(normalizedFilter));
        });
    }, [productFilter, supplierProducts]);
    const totalPages = (0, react_1.useMemo)(() => Math.max(1, Math.ceil(filteredSupplierProducts.length / PRODUCTS_PER_PAGE)), [filteredSupplierProducts.length]);
    const paginatedProducts = (0, react_1.useMemo)(() => {
        const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
        return filteredSupplierProducts.slice(startIndex, startIndex + PRODUCTS_PER_PAGE);
    }, [currentPage, filteredSupplierProducts]);
    const selectedProduct = (0, react_1.useMemo)(() => supplierProducts.find((product) => product.id === selectedProductId) ?? null, [selectedProductId, supplierProducts]);
    (0, react_1.useEffect)(() => {
        if (!supplierProducts.some((product) => product.id === selectedProductId)) {
            setSelectedProductId(supplierProducts[0]?.id ?? null);
        }
    }, [selectedProductId, supplierProducts]);
    (0, react_1.useEffect)(() => {
        setCurrentPage(1);
    }, [selectedSupplierId]);
    (0, react_1.useEffect)(() => {
        setCurrentPage(1);
    }, [productFilter]);
    (0, react_1.useEffect)(() => {
        setCurrentPage((previous) => Math.min(previous, totalPages));
    }, [totalPages]);
    (0, react_1.useEffect)(() => {
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
        setEditPriceHt(selectedProduct.priceHt === null ? '' : selectedProduct.priceHt.toString());
        setEditImage(selectedProduct.image ?? '');
    }, [selectedProduct]);
    async function onCreateSupplier() {
        setIsCreatingSupplier(true);
        setError(null);
        try {
            const created = await (0, suppliersApi_1.createSupplier)(accessToken, { name: newSupplierName });
            const next = [...suppliers, created].sort((a, b) => a.name.localeCompare(b.name));
            setSuppliers(next);
            setSelectedSupplierId(created.id);
            setNewSupplierName('');
        }
        catch {
            setError(text.supplierManagement.createSupplierError);
        }
        finally {
            setIsCreatingSupplier(false);
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
            const updated = await (0, productsApi_1.updateProduct)(accessToken, selectedProduct.id, {
                supplierId: selectedSupplierId,
                category: editCategory.trim(),
                nameZh: editNameZh.trim(),
                nameFr: editNameFr.trim() ? editNameFr.trim() : null,
                specification: editSpecification.trim() ? editSpecification.trim() : null,
                priceHt: parsedPrice,
            });
            setProducts((current) => current.map((product) => (product.id === updated.id ? updated : product)));
        }
        catch {
            setError(text.supplierManagement.saveProductError);
        }
        finally {
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
            const imageUrl = await (0, productsApi_1.uploadProductImage)(accessToken, selectedProduct.id, {
                uri: asset.uri,
                name: asset.name,
                mimeType: asset.mimeType ?? undefined,
                file: asset.file,
            });
            setEditImage(imageUrl);
            setProducts((current) => current.map((product) => product.id === selectedProduct.id ? { ...product, image: imageUrl } : product));
        }
        catch {
            setError(text.supplierManagement.uploadImageError);
        }
        finally {
            setIsUploadingImage(false);
        }
    }
    async function onDeleteProduct(product) {
        const confirmed = await new Promise((resolve) => {
            confirmDeleteResolverRef.current = resolve;
            setConfirmDialogVisible(true);
        });
        if (!confirmed) {
            return;
        }
        setDeletingProductId(product.id);
        setError(null);
        try {
            await (0, productsApi_1.deleteProduct)(accessToken, product.id);
            setProducts((current) => current.filter((entry) => entry.id !== product.id));
            if (selectedProductId === product.id) {
                setSelectedProductId(null);
                setIsEditorOpen(false);
            }
        }
        catch (deleteError) {
            if (deleteError instanceof Error && deleteError.message.trim()) {
                setError(deleteError.message);
            }
            else {
                setError(text.supplierManagement.deleteProductError);
            }
        }
        finally {
            setDeletingProductId(null);
        }
    }
    function closeDeleteProductDialog(value) {
        if (confirmDeleteResolverRef.current) {
            confirmDeleteResolverRef.current(value);
            confirmDeleteResolverRef.current = null;
        }
        setConfirmDialogVisible(false);
    }
    return (<react_native_1.View style={SupplierManagementPage_styles_1.styles.card}>
      <react_native_1.Text style={SupplierManagementPage_styles_1.styles.title}>{text.supplierManagement.title}</react_native_1.Text>
      <react_native_1.Text style={SupplierManagementPage_styles_1.styles.subtitle}>{text.supplierManagement.subtitle}</react_native_1.Text>

      {error ? <react_native_1.Text style={SupplierManagementPage_styles_1.styles.error}>{error}</react_native_1.Text> : null}
      {isLoading ? <react_native_1.Text style={SupplierManagementPage_styles_1.styles.docEmpty}>{text.supplierManagement.loading}</react_native_1.Text> : null}

      <react_native_1.Text style={SupplierManagementPage_styles_1.styles.uploadFieldTitle}>{text.supplierManagement.newSupplierLabel}</react_native_1.Text>
      <react_native_1.TextInput style={SupplierManagementPage_styles_1.styles.input} placeholder={text.supplierManagement.newSupplierPlaceholder} placeholderTextColor="#a98a8d" value={newSupplierName} onChangeText={setNewSupplierName}/>
      <react_native_1.Pressable style={[SupplierManagementPage_styles_1.styles.primaryButton, isCreatingSupplier && SupplierManagementPage_styles_1.styles.buttonDisabled]} disabled={isCreatingSupplier} onPress={() => {
            void onCreateSupplier();
        }}>
        <react_native_1.Text style={SupplierManagementPage_styles_1.styles.primaryButtonText}>
          {isCreatingSupplier
            ? text.supplierManagement.creatingSupplier
            : text.supplierManagement.createSupplierButton}
        </react_native_1.Text>
      </react_native_1.Pressable>

      <react_native_1.Text style={SupplierManagementPage_styles_1.styles.uploadFieldTitle}>{text.supplierManagement.suppliersLabel}</react_native_1.Text>
      <react_native_1.View style={SupplierManagementPage_styles_1.styles.trainingTabRow}>
        {suppliers.map((supplier) => (<react_native_1.Pressable key={supplier.id} style={[
                SupplierManagementPage_styles_1.styles.trainingTab,
                selectedSupplierId === supplier.id && SupplierManagementPage_styles_1.styles.trainingTabActive,
            ]} onPress={() => setSelectedSupplierId(supplier.id)}>
            <react_native_1.Text style={[
                SupplierManagementPage_styles_1.styles.trainingTabText,
                selectedSupplierId === supplier.id && SupplierManagementPage_styles_1.styles.trainingTabTextActive,
            ]}>
              {supplier.name}
            </react_native_1.Text>
          </react_native_1.Pressable>))}
      </react_native_1.View>

      <react_native_1.Text style={SupplierManagementPage_styles_1.styles.uploadFieldTitle}>{text.supplierManagement.productsLabel}</react_native_1.Text>
      <react_native_1.TextInput style={SupplierManagementPage_styles_1.styles.input} placeholder={text.supplierManagement.filterProductsPlaceholder} placeholderTextColor="#a98a8d" value={productFilter} onChangeText={setProductFilter}/>
      <react_native_1.View style={[SupplierManagementPage_styles_1.styles.listBlock, SupplierManagementPage_styles_1.styles.productGrid]}>
        {supplierProducts.length === 0 ? (<react_native_1.Text style={SupplierManagementPage_styles_1.styles.docEmpty}>{text.supplierManagement.noProduct}</react_native_1.Text>) : filteredSupplierProducts.length === 0 ? (<react_native_1.Text style={SupplierManagementPage_styles_1.styles.docEmpty}>{text.supplierManagement.noFilteredProduct}</react_native_1.Text>) : (paginatedProducts.map((product) => (<react_native_1.View key={product.id} style={[
                SupplierManagementPage_styles_1.styles.docItem,
                SupplierManagementPage_styles_1.styles.productGridItem,
                selectedProductId === product.id && SupplierManagementPage_styles_1.styles.trainingTabActive,
            ]}>
              <react_native_1.View style={SupplierManagementPage_styles_1.styles.productCardHeaderRow}>
                <react_native_1.Pressable style={SupplierManagementPage_styles_1.styles.productCardContentPressable} onPress={() => {
                setSelectedProductId(product.id);
                setIsEditorOpen(true);
            }}>
                  <react_native_1.View style={SupplierManagementPage_styles_1.styles.productInfoRow}>
                    {product.image ? (<react_native_1.View style={SupplierManagementPage_styles_1.styles.productImageFrame}>
                        <react_native_1.Image source={{ uri: product.image }} style={SupplierManagementPage_styles_1.styles.productImageThumb} resizeMode="cover"/>
                      </react_native_1.View>) : null}

                    <react_native_1.View style={SupplierManagementPage_styles_1.styles.productInfoColumn}>
                      <react_native_1.Text style={[
                SupplierManagementPage_styles_1.styles.docItemTitle,
                selectedProductId === product.id && SupplierManagementPage_styles_1.styles.trainingTabTextActive,
            ]}>
                        {product.nameFr ?? product.nameZh}
                      </react_native_1.Text>
                      {product.nameFr && product.nameZh && product.nameFr !== product.nameZh ? (<react_native_1.Text style={[
                    SupplierManagementPage_styles_1.styles.docItemMeta,
                    selectedProductId === product.id && SupplierManagementPage_styles_1.styles.trainingTabTextActive,
                ]}>
                          {product.nameZh}
                        </react_native_1.Text>) : null}
                      <react_native_1.Text style={[
                SupplierManagementPage_styles_1.styles.docItemMeta,
                selectedProductId === product.id && SupplierManagementPage_styles_1.styles.trainingTabTextActive,
            ]}>
                        {product.category}
                      </react_native_1.Text>
                      {product.specification ? (<react_native_1.Text style={[
                    SupplierManagementPage_styles_1.styles.docItemMeta,
                    selectedProductId === product.id && SupplierManagementPage_styles_1.styles.trainingTabTextActive,
                ]}>
                          {text.supplierManagement.fields.specification}: {product.specification}
                        </react_native_1.Text>) : null}
                      <react_native_1.Text style={[
                SupplierManagementPage_styles_1.styles.docItemMeta,
                selectedProductId === product.id && SupplierManagementPage_styles_1.styles.trainingTabTextActive,
            ]}>
                        {text.supplierManagement.tapToEdit}
                      </react_native_1.Text>
                    </react_native_1.View>
                  </react_native_1.View>
                </react_native_1.Pressable>

                <react_native_1.Pressable style={SupplierManagementPage_styles_1.styles.productDeleteIconButton} disabled={deletingProductId === product.id} onPress={() => {
                void onDeleteProduct(product);
            }}>
                  {deletingProductId === product.id ? (<react_native_1.Text style={SupplierManagementPage_styles_1.styles.productDeleteLoading}>…</react_native_1.Text>) : (<react_native_1.View style={SupplierManagementPage_styles_1.styles.trashIcon}>
                      <react_native_1.View style={SupplierManagementPage_styles_1.styles.trashLid}/>
                      <react_native_1.View style={SupplierManagementPage_styles_1.styles.trashBody}>
                        <react_native_1.View style={SupplierManagementPage_styles_1.styles.trashBar}/>
                        <react_native_1.View style={SupplierManagementPage_styles_1.styles.trashBar}/>
                      </react_native_1.View>
                    </react_native_1.View>)}
                </react_native_1.Pressable>
              </react_native_1.View>
            </react_native_1.View>)))}
      </react_native_1.View>

      {filteredSupplierProducts.length > PRODUCTS_PER_PAGE ? (<react_native_1.View style={SupplierManagementPage_styles_1.styles.paginationRow}>
          <react_native_1.Pressable style={[SupplierManagementPage_styles_1.styles.secondaryButton, currentPage === 1 && SupplierManagementPage_styles_1.styles.buttonDisabled]} disabled={currentPage === 1} onPress={() => setCurrentPage((previous) => Math.max(1, previous - 1))}>
            <react_native_1.Text style={SupplierManagementPage_styles_1.styles.secondaryButtonText}>
              {text.supplierManagement.paginationPrevious}
            </react_native_1.Text>
          </react_native_1.Pressable>

          <react_native_1.Text style={SupplierManagementPage_styles_1.styles.paginationInfo}>
            {text.supplierManagement.paginationPageLabel} {currentPage}/{totalPages}
          </react_native_1.Text>

          <react_native_1.Pressable style={[SupplierManagementPage_styles_1.styles.secondaryButton, currentPage >= totalPages && SupplierManagementPage_styles_1.styles.buttonDisabled]} disabled={currentPage >= totalPages} onPress={() => setCurrentPage((previous) => Math.min(totalPages, previous + 1))}>
            <react_native_1.Text style={SupplierManagementPage_styles_1.styles.secondaryButtonText}>
              {text.supplierManagement.paginationNext}
            </react_native_1.Text>
          </react_native_1.Pressable>
        </react_native_1.View>) : null}

      <react_native_1.Modal visible={isEditorOpen && Boolean(selectedProduct)} transparent animationType="fade" onRequestClose={() => setIsEditorOpen(false)}>
        <react_native_1.View style={SupplierManagementPage_styles_1.styles.modalBackdrop}> 
          <react_native_1.View style={SupplierManagementPage_styles_1.styles.modalCard}>
            <react_native_1.ScrollView contentContainerStyle={SupplierManagementPage_styles_1.styles.modalContent}>
              <react_native_1.View style={SupplierManagementPage_styles_1.styles.modalHeaderRow}>
                <react_native_1.Text style={SupplierManagementPage_styles_1.styles.docBlockTitle}>{text.supplierManagement.editProductTitle}</react_native_1.Text>
                <react_native_1.Pressable style={SupplierManagementPage_styles_1.styles.secondaryButton} onPress={() => setIsEditorOpen(false)}>
                  <react_native_1.Text style={SupplierManagementPage_styles_1.styles.secondaryButtonText}>{text.supplierManagement.closeEditor}</react_native_1.Text>
                </react_native_1.Pressable>
              </react_native_1.View>

              {selectedProduct ? (<>
                  <react_native_1.TextInput style={SupplierManagementPage_styles_1.styles.input} placeholder={text.supplierManagement.fields.nameZh} placeholderTextColor="#a98a8d" value={editNameZh} onChangeText={setEditNameZh}/>
                  <react_native_1.TextInput style={SupplierManagementPage_styles_1.styles.input} placeholder={text.supplierManagement.fields.nameFr} placeholderTextColor="#a98a8d" value={editNameFr} onChangeText={setEditNameFr}/>
                  <react_native_1.TextInput style={SupplierManagementPage_styles_1.styles.input} placeholder={text.supplierManagement.fields.specification} placeholderTextColor="#a98a8d" value={editSpecification} onChangeText={setEditSpecification}/>
                  <react_native_1.TextInput style={SupplierManagementPage_styles_1.styles.input} placeholder={text.supplierManagement.fields.category} placeholderTextColor="#a98a8d" value={editCategory} onChangeText={setEditCategory}/>
                  <react_native_1.TextInput style={SupplierManagementPage_styles_1.styles.input} placeholder={text.supplierManagement.fields.priceHt} placeholderTextColor="#a98a8d" keyboardType="decimal-pad" value={editPriceHt} onChangeText={setEditPriceHt}/>

                  <react_native_1.Text style={SupplierManagementPage_styles_1.styles.docItemMeta}>{text.supplierManagement.fields.image}</react_native_1.Text>
                  {editImage ? (<react_native_1.View style={SupplierManagementPage_styles_1.styles.productImageFrame}>
                      <react_native_1.Image source={{ uri: editImage }} style={SupplierManagementPage_styles_1.styles.productImagePreview} resizeMode="cover"/>
                    </react_native_1.View>) : null}
                  <react_native_1.Text style={SupplierManagementPage_styles_1.styles.docItemLink}>{editImage || text.supplierManagement.noImage}</react_native_1.Text>
                  <react_native_1.Pressable style={[SupplierManagementPage_styles_1.styles.secondaryButton, isUploadingImage && SupplierManagementPage_styles_1.styles.buttonDisabled]} disabled={isUploadingImage} onPress={() => {
                void onUploadProductImage();
            }}>
                    <react_native_1.Text style={SupplierManagementPage_styles_1.styles.secondaryButtonText}>
                      {isUploadingImage
                ? text.supplierManagement.uploadingImage
                : text.supplierManagement.uploadImageButton}
                    </react_native_1.Text>
                  </react_native_1.Pressable>

                  <react_native_1.Pressable style={[SupplierManagementPage_styles_1.styles.primaryButton, isSavingProduct && SupplierManagementPage_styles_1.styles.buttonDisabled]} disabled={isSavingProduct} onPress={() => {
                void onSaveProduct();
            }}>
                    <react_native_1.Text style={SupplierManagementPage_styles_1.styles.primaryButtonText}>
                      {isSavingProduct
                ? text.supplierManagement.savingProduct
                : text.supplierManagement.saveProductButton}
                    </react_native_1.Text>
                  </react_native_1.Pressable>
                </>) : null}
            </react_native_1.ScrollView>
          </react_native_1.View>
        </react_native_1.View>
      </react_native_1.Modal>

      <ConfirmDialog_1.ConfirmDialog visible={confirmDialogVisible} title={text.supplierManagement.deleteProductButton} message={text.supplierManagement.deleteProductConfirm} cancelLabel={text.supplierManagement.deleteProductCancel} confirmLabel={text.supplierManagement.deleteProductConfirmButton} destructive onCancel={() => closeDeleteProductDialog(false)} onConfirm={() => closeDeleteProductDialog(true)}/>
    </react_native_1.View>);
}
//# sourceMappingURL=SupplierManagementPage.js.map