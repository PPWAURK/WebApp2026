"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersPage = OrdersPage;
const react_1 = require("react");
const react_native_1 = require("react-native");
const productsApi_1 = require("../../services/productsApi");
const suppliersApi_1 = require("../../services/suppliersApi");
const OrdersPage_styles_1 = require("./OrdersPage.styles");
function OrdersPage({ text, accessToken, language, quantities, onQuantitiesChange, onSubmitOrder, }) {
    const { width } = (0, react_native_1.useWindowDimensions)();
    const isSmallScreen = width < 560;
    const [products, setProducts] = (0, react_1.useState)([]);
    const [suppliers, setSuppliers] = (0, react_1.useState)([]);
    const [selectedSupplierId, setSelectedSupplierId] = (0, react_1.useState)('ALL');
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const [selectedCategory, setSelectedCategory] = (0, react_1.useState)('ALL');
    const [productSearch, setProductSearch] = (0, react_1.useState)('');
    (0, react_1.useEffect)(() => {
        let isActive = true;
        setLoading(true);
        setError(null);
        void Promise.all([(0, productsApi_1.fetchProducts)(accessToken), (0, suppliersApi_1.fetchSuppliers)(accessToken)])
            .then(([productResult, supplierResult]) => {
            if (!isActive) {
                return;
            }
            setProducts(productResult);
            setSuppliers(supplierResult);
            if (supplierResult.length > 0) {
                setSelectedSupplierId((current) => current === 'ALL' ? supplierResult[0].id : current);
            }
            else {
                setSelectedSupplierId('ALL');
            }
        })
            .catch(() => {
            if (isActive) {
                setProducts([]);
                setSuppliers([]);
                setError(text.orders.loadError);
            }
        })
            .finally(() => {
            if (isActive) {
                setLoading(false);
            }
        });
        return () => {
            isActive = false;
        };
    }, [accessToken, text.orders.loadError]);
    function changeQuantity(productId, delta) {
        const next = (quantities[productId] ?? 0) + delta;
        const clamped = Math.max(0, next);
        onQuantitiesChange({
            ...quantities,
            [productId]: clamped,
        });
    }
    const supplierProducts = (0, react_1.useMemo)(() => {
        if (selectedSupplierId === 'ALL') {
            return products;
        }
        return products.filter((product) => product.supplierId === selectedSupplierId);
    }, [products, selectedSupplierId]);
    const summary = (0, react_1.useMemo)(() => {
        return supplierProducts.reduce((acc, product) => {
            const qty = quantities[product.id] ?? 0;
            acc.totalItems += qty;
            acc.totalAmount += qty * (product.priceHt ?? 0);
            return acc;
        }, { totalItems: 0, totalAmount: 0 });
    }, [quantities, supplierProducts]);
    const selectedItems = (0, react_1.useMemo)(() => {
        return supplierProducts
            .map((product) => {
            const quantity = quantities[product.id] ?? 0;
            if (quantity <= 0) {
                return null;
            }
            const price = product.priceHt ?? 0;
            return {
                productId: product.id,
                supplierId: product.supplierId,
                category: product.category,
                nameZh: product.nameZh,
                nameFr: product.nameFr,
                unit: product.unit,
                priceHt: product.priceHt,
                image: product.image,
                quantity,
                lineTotal: quantity * price,
            };
        })
            .filter((item) => item !== null);
    }, [quantities, supplierProducts]);
    const categories = (0, react_1.useMemo)(() => {
        const unique = Array.from(new Set(supplierProducts
            .map((product) => product.category)
            .filter((value) => typeof value === 'string' && value.trim())));
        return unique.sort((a, b) => a.localeCompare(b));
    }, [supplierProducts]);
    const filteredProducts = (0, react_1.useMemo)(() => {
        const normalizedQuery = productSearch.trim().toLowerCase();
        return supplierProducts.filter((product) => {
            const matchCategory = selectedCategory === 'ALL' || product.category === selectedCategory;
            if (!matchCategory) {
                return false;
            }
            if (!normalizedQuery) {
                return true;
            }
            const nameFr = (product.nameFr ?? '').toLowerCase();
            const nameZh = (product.nameZh ?? '').toLowerCase();
            const reference = (product.reference ?? '').toLowerCase();
            const specification = (product.specification ?? '').toLowerCase();
            return (nameFr.includes(normalizedQuery) ||
                nameZh.includes(normalizedQuery) ||
                reference.includes(normalizedQuery) ||
                specification.includes(normalizedQuery));
        });
    }, [productSearch, selectedCategory, supplierProducts]);
    return (<react_native_1.View style={OrdersPage_styles_1.styles.card}>
      <react_native_1.Text style={OrdersPage_styles_1.styles.title}>{text.orders.title}</react_native_1.Text>
      <react_native_1.Text style={OrdersPage_styles_1.styles.subtitle}>{text.orders.subtitle}</react_native_1.Text>

      {error ? <react_native_1.Text style={OrdersPage_styles_1.styles.error}>{error}</react_native_1.Text> : null}

      {loading ? <react_native_1.Text style={OrdersPage_styles_1.styles.docEmpty}>{text.orders.loading}</react_native_1.Text> : null}

      {suppliers.length > 0 ? (<>
          <react_native_1.Text style={OrdersPage_styles_1.styles.uploadFieldTitle}>{text.orders.supplierLabel}</react_native_1.Text>
          <react_native_1.View style={OrdersPage_styles_1.styles.trainingTabRow}>
            {suppliers.map((supplier) => (<react_native_1.Pressable key={supplier.id} style={[
                    OrdersPage_styles_1.styles.trainingTab,
                    selectedSupplierId === supplier.id && OrdersPage_styles_1.styles.trainingTabActive,
                ]} onPress={() => {
                    setSelectedSupplierId(supplier.id);
                    setSelectedCategory('ALL');
                }}>
                <react_native_1.Text style={[
                    OrdersPage_styles_1.styles.trainingTabText,
                    selectedSupplierId === supplier.id && OrdersPage_styles_1.styles.trainingTabTextActive,
                ]}>
                  {supplier.name}
                </react_native_1.Text>
              </react_native_1.Pressable>))}
          </react_native_1.View>
        </>) : null}

      {categories.length > 0 ? (<>
          <react_native_1.Text style={OrdersPage_styles_1.styles.uploadFieldTitle}>{text.orders.filterLabel}</react_native_1.Text>
          <react_native_1.TextInput style={OrdersPage_styles_1.styles.searchInput} value={productSearch} onChangeText={setProductSearch} placeholder={text.orders.searchProductsPlaceholder} placeholderTextColor="#aa777b"/>
          <react_native_1.View style={OrdersPage_styles_1.styles.uploadChipWrap}>
            <react_native_1.Pressable style={[
                OrdersPage_styles_1.styles.uploadChip,
                selectedCategory === 'ALL' && OrdersPage_styles_1.styles.uploadChipActive,
            ]} onPress={() => setSelectedCategory('ALL')}>
              <react_native_1.Text style={[
                OrdersPage_styles_1.styles.uploadChipText,
                selectedCategory === 'ALL' && OrdersPage_styles_1.styles.uploadChipTextActive,
            ]}>
                {text.orders.allTypes}
              </react_native_1.Text>
            </react_native_1.Pressable>

            {categories.map((category) => (<react_native_1.Pressable key={category} style={[
                    OrdersPage_styles_1.styles.uploadChip,
                    selectedCategory === category && OrdersPage_styles_1.styles.uploadChipActive,
                ]} onPress={() => setSelectedCategory(category)}>
                <react_native_1.Text style={[
                    OrdersPage_styles_1.styles.uploadChipText,
                    selectedCategory === category && OrdersPage_styles_1.styles.uploadChipTextActive,
                ]}>
                  {category}
                </react_native_1.Text>
              </react_native_1.Pressable>))}
          </react_native_1.View>
        </>) : null}

      {!loading && supplierProducts.length === 0 ? (<react_native_1.Text style={OrdersPage_styles_1.styles.docEmpty}>{text.orders.empty}</react_native_1.Text>) : null}

      {!loading && supplierProducts.length > 0 && filteredProducts.length === 0 ? (<react_native_1.Text style={OrdersPage_styles_1.styles.docEmpty}>{text.orders.emptyForType}</react_native_1.Text>) : null}

      <react_native_1.View style={[OrdersPage_styles_1.styles.listBlock, OrdersPage_styles_1.styles.productGrid]}>
        {filteredProducts.map((product) => {
            const qty = quantities[product.id] ?? 0;
            const productName = language === 'zh' ? product.nameZh : product.nameFr ?? product.nameZh;
            const infoRowStyle = isSmallScreen
                ? { flexDirection: 'column', alignItems: 'flex-start' }
                : OrdersPage_styles_1.styles.productInfoRow;
            const productGridItemStyle = isSmallScreen
                ? OrdersPage_styles_1.styles.productGridItemSmall
                : OrdersPage_styles_1.styles.productGridItem;
            return (<react_native_1.View key={product.id} style={[OrdersPage_styles_1.styles.docItem, productGridItemStyle]}>
              <react_native_1.View style={infoRowStyle}>
                {product.image ? (<react_native_1.View style={[OrdersPage_styles_1.styles.productImageFrame, isSmallScreen && OrdersPage_styles_1.styles.productImageFrameSmall]}>
                    <react_native_1.Image source={{ uri: product.image }} style={OrdersPage_styles_1.styles.productImageThumb} resizeMode="cover"/>
                  </react_native_1.View>) : null}

                <react_native_1.View style={[OrdersPage_styles_1.styles.productInfoColumn, isSmallScreen && OrdersPage_styles_1.styles.productInfoColumnSmall]}>
                  <react_native_1.Text style={OrdersPage_styles_1.styles.docItemTitle}>{productName}</react_native_1.Text>
                  {product.reference ? (<react_native_1.Text style={OrdersPage_styles_1.styles.docItemMeta}>
                      {text.orders.referenceLabel}: {product.reference}
                    </react_native_1.Text>) : null}
                  {product.specification ? (<react_native_1.Text style={OrdersPage_styles_1.styles.docItemMeta}>
                      {text.orders.specificationLabel}: {product.specification}
                    </react_native_1.Text>) : null}
                  {product.unit ? (<react_native_1.Text style={OrdersPage_styles_1.styles.docItemMeta}>
                      {text.orders.unitLabel}: {product.unit}
                    </react_native_1.Text>) : null}
                  <react_native_1.Text style={OrdersPage_styles_1.styles.docItemMeta}>
                    {text.orders.priceLabel}:{' '}
                    {product.priceHt === null
                    ? text.orders.priceNotAvailable
                    : product.priceHt.toFixed(2)}
                  </react_native_1.Text>
                </react_native_1.View>
              </react_native_1.View>

              <react_native_1.View style={OrdersPage_styles_1.styles.pillRow}>
                <react_native_1.Pressable style={OrdersPage_styles_1.styles.uploadChip} onPress={() => changeQuantity(product.id, -1)}>
                  <react_native_1.Text style={OrdersPage_styles_1.styles.uploadChipText}>-</react_native_1.Text>
                </react_native_1.Pressable>
                <react_native_1.Text style={OrdersPage_styles_1.styles.pill}>
                  {text.orders.quantityLabel}: {qty}
                </react_native_1.Text>
                <react_native_1.Pressable style={OrdersPage_styles_1.styles.uploadChip} onPress={() => changeQuantity(product.id, 1)}>
                  <react_native_1.Text style={OrdersPage_styles_1.styles.uploadChipText}>+</react_native_1.Text>
                </react_native_1.Pressable>
              </react_native_1.View>
            </react_native_1.View>);
        })}
      </react_native_1.View>

      <react_native_1.View style={OrdersPage_styles_1.styles.docBlock}>
        <react_native_1.Text style={OrdersPage_styles_1.styles.docBlockTitle}>{text.orders.summaryTitle}</react_native_1.Text>
        <react_native_1.Text style={OrdersPage_styles_1.styles.docItemMeta}>
          {text.orders.summaryItems}: {summary.totalItems}
        </react_native_1.Text>
        <react_native_1.Text style={OrdersPage_styles_1.styles.docItemMeta}>
          {text.orders.summaryAmount}: {summary.totalAmount.toFixed(2)}
        </react_native_1.Text>
      </react_native_1.View>

      <react_native_1.Pressable style={[OrdersPage_styles_1.styles.primaryButton, summary.totalItems === 0 && OrdersPage_styles_1.styles.buttonDisabled]} disabled={summary.totalItems === 0} onPress={() => {
            onSubmitOrder({
                items: selectedItems,
                totalItems: summary.totalItems,
                totalAmount: summary.totalAmount,
            });
        }}>
        <react_native_1.Text style={OrdersPage_styles_1.styles.primaryButtonText}>{text.orders.submitButton}</react_native_1.Text>
      </react_native_1.Pressable>

    </react_native_1.View>);
}
//# sourceMappingURL=OrdersPage.js.map