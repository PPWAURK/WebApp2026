import * as DocumentPicker from 'expo-document-picker';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import type { AppText } from '../locales/translations';
import {
  fetchProducts,
  uploadProductImage,
  updateProduct,
  type ProductItem,
} from '../services/productsApi';
import {
  createSupplier,
  fetchSuppliers,
  type SupplierItem,
} from '../services/suppliersApi';
import { styles } from '../styles/appStyles';

type SupplierManagementPageProps = {
  text: AppText;
  accessToken: string;
};

export function SupplierManagementPage({
  text,
  accessToken,
}: SupplierManagementPageProps) {
  const [suppliers, setSuppliers] = useState<SupplierItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingSupplier, setIsCreatingSupplier] = useState(false);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editReference, setEditReference] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editNameZh, setEditNameZh] = useState('');
  const [editNameFr, setEditNameFr] = useState('');
  const [editUnit, setEditUnit] = useState('');
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

        const firstSupplierId = supplierResult[0]?.id ?? null;
        setSelectedSupplierId(firstSupplierId);
      })
      .catch(() => {
        if (isActive) {
          setSuppliers([]);
          setProducts([]);
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
        ? products.filter((product) => product.supplierId === selectedSupplierId)
        : [],
    [products, selectedSupplierId],
  );

  const selectedProduct = useMemo(
    () =>
      supplierProducts.find((product) => product.id === selectedProductId) ?? null,
    [selectedProductId, supplierProducts],
  );

  useEffect(() => {
    const firstProductId = supplierProducts[0]?.id ?? null;
    if (!selectedProductId || !supplierProducts.some((p) => p.id === selectedProductId)) {
      setSelectedProductId(firstProductId);
    }
  }, [selectedProductId, supplierProducts]);

  useEffect(() => {
    if (!selectedProduct) {
      setEditReference('');
      setEditCategory('');
      setEditNameZh('');
      setEditNameFr('');
      setEditUnit('');
      setEditPriceHt('');
      setEditImage('');
      return;
    }

    setEditReference(selectedProduct.reference ?? '');
    setEditCategory(selectedProduct.category);
    setEditNameZh(selectedProduct.nameZh);
    setEditNameFr(selectedProduct.nameFr ?? '');
    setEditUnit(selectedProduct.unit ?? '');
    setEditPriceHt(
      selectedProduct.priceHt === null ? '' : selectedProduct.priceHt.toString(),
    );
    setEditImage(selectedProduct.image ?? '');
  }, [selectedProduct]);

  async function onCreateSupplier() {
    setIsCreatingSupplier(true);
    setError(null);
    try {
      const created = await createSupplier(accessToken, { name: newSupplierName });
      const nextSuppliers = [...suppliers, created].sort((a, b) =>
        a.name.localeCompare(b.name),
      );
      setSuppliers(nextSuppliers);
      setSelectedSupplierId(created.id);
      setNewSupplierName('');
    } catch {
      setError(text.supplierManagement.createSupplierError);
    } finally {
      setIsCreatingSupplier(false);
    }
  }

  async function onSaveProduct() {
    if (!selectedProduct) {
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
        supplierId: selectedSupplierId ?? undefined,
        reference: editReference.trim() ? editReference.trim() : null,
        category: editCategory.trim(),
        nameZh: editNameZh.trim(),
        nameFr: editNameFr.trim() ? editNameFr.trim() : null,
        unit: editUnit.trim() ? editUnit.trim() : null,
        priceHt: parsedPrice,
        image: editImage.trim() ? editImage.trim() : null,
      });

      setProducts((current) =>
        current.map((product) => (product.id === updated.id ? updated : product)),
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
      const imageUrl = await uploadProductImage(accessToken, selectedProduct.id, {
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType ?? undefined,
        file: (asset as { file?: File }).file,
      });

      setEditImage(imageUrl);
      setProducts((current) =>
        current.map((product) =>
          product.id === selectedProduct.id ? { ...product, image: imageUrl } : product,
        ),
      );
    } catch {
      setError(text.supplierManagement.uploadImageError);
    } finally {
      setIsUploadingImage(false);
    }
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{text.supplierManagement.title}</Text>
      <Text style={styles.subtitle}>{text.supplierManagement.subtitle}</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {isLoading ? <Text style={styles.docEmpty}>{text.supplierManagement.loading}</Text> : null}

      <Text style={styles.uploadFieldTitle}>{text.supplierManagement.suppliersLabel}</Text>
      <View style={styles.uploadChipWrap}>
        {suppliers.map((supplier) => (
          <Pressable
            key={supplier.id}
            style={[
              styles.uploadChip,
              selectedSupplierId === supplier.id && styles.uploadChipActive,
            ]}
            onPress={() => setSelectedSupplierId(supplier.id)}
          >
            <Text
              style={[
                styles.uploadChipText,
                selectedSupplierId === supplier.id && styles.uploadChipTextActive,
              ]}
            >
              {supplier.name}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.uploadFieldTitle}>{text.supplierManagement.newSupplierLabel}</Text>
      <TextInput
        style={styles.input}
        placeholder={text.supplierManagement.newSupplierPlaceholder}
        placeholderTextColor="#a98a8d"
        value={newSupplierName}
        onChangeText={setNewSupplierName}
      />
      <Pressable
        style={[styles.primaryButton, isCreatingSupplier && styles.buttonDisabled]}
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

      <Text style={styles.uploadFieldTitle}>{text.supplierManagement.productsLabel}</Text>
      <View style={styles.uploadChipWrap}>
        {supplierProducts.map((product) => (
          <Pressable
            key={product.id}
            style={[
              styles.uploadChip,
              selectedProductId === product.id && styles.uploadChipActive,
            ]}
            onPress={() => setSelectedProductId(product.id)}
          >
            <Text
              style={[
                styles.uploadChipText,
                selectedProductId === product.id && styles.uploadChipTextActive,
              ]}
            >
              {product.nameFr ?? product.nameZh}
            </Text>
          </Pressable>
        ))}
      </View>

      {selectedProduct ? (
        <View style={styles.docBlock}>
          <Text style={styles.docBlockTitle}>{text.supplierManagement.editProductTitle}</Text>

          <TextInput style={styles.input} placeholder={text.supplierManagement.fields.reference} placeholderTextColor="#a98a8d" value={editReference} onChangeText={setEditReference} />
          <TextInput style={styles.input} placeholder={text.supplierManagement.fields.category} placeholderTextColor="#a98a8d" value={editCategory} onChangeText={setEditCategory} />
          <TextInput style={styles.input} placeholder={text.supplierManagement.fields.nameZh} placeholderTextColor="#a98a8d" value={editNameZh} onChangeText={setEditNameZh} />
          <TextInput style={styles.input} placeholder={text.supplierManagement.fields.nameFr} placeholderTextColor="#a98a8d" value={editNameFr} onChangeText={setEditNameFr} />
          <TextInput style={styles.input} placeholder={text.supplierManagement.fields.unit} placeholderTextColor="#a98a8d" value={editUnit} onChangeText={setEditUnit} />
          <TextInput style={styles.input} placeholder={text.supplierManagement.fields.priceHt} placeholderTextColor="#a98a8d" keyboardType="decimal-pad" value={editPriceHt} onChangeText={setEditPriceHt} />
          <Text style={styles.docItemMeta}>{text.supplierManagement.fields.image}</Text>
          <Text style={styles.docItemLink}>{editImage || text.supplierManagement.noImage}</Text>
          <Pressable
            style={[styles.secondaryButton, isUploadingImage && styles.buttonDisabled]}
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
            style={[styles.primaryButton, isSavingProduct && styles.buttonDisabled]}
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
        </View>
      ) : (
        <Text style={styles.docEmpty}>{text.supplierManagement.noProduct}</Text>
      )}
    </View>
  );
}
