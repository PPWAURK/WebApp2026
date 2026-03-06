"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderRecapPage = OrderRecapPage;
const react_1 = require("react");
const react_native_1 = require("react-native");
const OrderRecapPage_styles_1 = require("./OrderRecapPage.styles");
function OrderRecapPage({ text, language, recap, deliveryDate, deliveryAddress, isSubmittingOrder, submitError, latestCreatedOrder, onDeliveryDateChange, onSubmitOrder, onDownloadOrderBon, onBack, }) {
    const { width } = (0, react_native_1.useWindowDimensions)();
    const isSmallScreen = width < 560;
    const [isDatePickerOpen, setIsDatePickerOpen] = (0, react_1.useState)(false);
    const dateOptions = (0, react_1.useMemo)(() => {
        const start = new Date();
        const options = [];
        for (let i = 0; i < 21; i += 1) {
            const next = new Date(start);
            next.setDate(start.getDate() + i);
            const year = next.getFullYear();
            const month = String(next.getMonth() + 1).padStart(2, '0');
            const day = String(next.getDate()).padStart(2, '0');
            options.push(`${year}-${month}-${day}`);
        }
        return options;
    }, []);
    return (<react_native_1.View style={OrderRecapPage_styles_1.styles.card}>
      <react_native_1.Text style={OrderRecapPage_styles_1.styles.title}>{text.orders.recapTitle}</react_native_1.Text>
      <react_native_1.Text style={OrderRecapPage_styles_1.styles.subtitle}>{text.orders.recapSubtitle}</react_native_1.Text>

      <react_native_1.View style={OrderRecapPage_styles_1.styles.docBlock}>
        <react_native_1.Text style={OrderRecapPage_styles_1.styles.uploadFieldTitle}>{text.orders.deliveryDateLabel}</react_native_1.Text>
        <react_native_1.Pressable style={OrderRecapPage_styles_1.styles.restaurantSelectTrigger} onPress={() => setIsDatePickerOpen((currentValue) => !currentValue)}>
          <react_native_1.Text style={OrderRecapPage_styles_1.styles.restaurantSelectTriggerText}>{deliveryDate}</react_native_1.Text>
          <react_native_1.Text style={OrderRecapPage_styles_1.styles.restaurantSelectChevron}>
            {isDatePickerOpen ? '▲' : '▼'}
          </react_native_1.Text>
        </react_native_1.Pressable>

        {isDatePickerOpen ? (<react_native_1.View style={OrderRecapPage_styles_1.styles.restaurantSelectList}>
            {dateOptions.map((dateValue) => (<react_native_1.Pressable key={dateValue} style={[
                    OrderRecapPage_styles_1.styles.restaurantSelectItem,
                    deliveryDate === dateValue && OrderRecapPage_styles_1.styles.restaurantSelectItemActive,
                ]} onPress={() => {
                    onDeliveryDateChange(dateValue);
                    setIsDatePickerOpen(false);
                }}>
                <react_native_1.Text style={[
                    OrderRecapPage_styles_1.styles.restaurantSelectItemText,
                    deliveryDate === dateValue && OrderRecapPage_styles_1.styles.restaurantSelectItemTextActive,
                ]}>
                  {dateValue}
                </react_native_1.Text>
              </react_native_1.Pressable>))}
          </react_native_1.View>) : null}

        <react_native_1.Text style={OrderRecapPage_styles_1.styles.uploadFieldTitle}>{text.orders.deliveryAddressLabel}</react_native_1.Text>
        <react_native_1.Text style={OrderRecapPage_styles_1.styles.docItemMeta}>
          {deliveryAddress || text.orders.deliveryAddressMissing}
        </react_native_1.Text>
      </react_native_1.View>

      {latestCreatedOrder ? (<react_native_1.View style={OrderRecapPage_styles_1.styles.docBlock}>
          <react_native_1.Text style={OrderRecapPage_styles_1.styles.docBlockTitle}>{text.orders.orderSuccessTitle}</react_native_1.Text>
          <react_native_1.Text style={OrderRecapPage_styles_1.styles.docItemMeta}>
            {text.orders.orderNumberLabel}: {latestCreatedOrder.number}
          </react_native_1.Text>
          <react_native_1.Pressable style={OrderRecapPage_styles_1.styles.secondaryButton} onPress={() => onDownloadOrderBon(latestCreatedOrder)}>
            <react_native_1.Text style={OrderRecapPage_styles_1.styles.secondaryButtonText}>{text.orders.downloadBonButton}</react_native_1.Text>
          </react_native_1.Pressable>
        </react_native_1.View>) : null}

      <react_native_1.View style={[OrderRecapPage_styles_1.styles.listBlock, OrderRecapPage_styles_1.styles.productGrid]}>
        {recap.items.map((item) => {
            const productName = language === 'zh' ? item.nameZh : item.nameFr ?? item.nameZh;
            const infoRowStyle = isSmallScreen
                ? { flexDirection: 'column', alignItems: 'flex-start' }
                : OrderRecapPage_styles_1.styles.productInfoRow;
            const productGridItemStyle = isSmallScreen
                ? OrderRecapPage_styles_1.styles.productGridItemSmall
                : OrderRecapPage_styles_1.styles.productGridItem;
            return (<react_native_1.View key={`${item.productId}-${item.quantity}`} style={[OrderRecapPage_styles_1.styles.docItem, productGridItemStyle]}>
              <react_native_1.View style={infoRowStyle}>
                {item.image ? (<react_native_1.View style={[OrderRecapPage_styles_1.styles.productImageFrame, isSmallScreen && OrderRecapPage_styles_1.styles.productImageFrameSmall]}>
                    <react_native_1.Image source={{ uri: item.image }} style={OrderRecapPage_styles_1.styles.productImageThumb} resizeMode="cover"/>
                  </react_native_1.View>) : null}
                <react_native_1.View style={[OrderRecapPage_styles_1.styles.productInfoColumn, isSmallScreen && OrderRecapPage_styles_1.styles.productInfoColumnSmall]}>
                  <react_native_1.Text style={OrderRecapPage_styles_1.styles.docItemTitle}>{productName}</react_native_1.Text>
                  <react_native_1.Text style={OrderRecapPage_styles_1.styles.docItemMeta}>{text.orders.quantityLabel}: {item.quantity}</react_native_1.Text>
                  <react_native_1.Text style={OrderRecapPage_styles_1.styles.docItemMeta}>{text.orders.priceLabel}: {item.priceHt === null ? text.orders.priceNotAvailable : item.priceHt.toFixed(2)}</react_native_1.Text>
                  <react_native_1.Text style={OrderRecapPage_styles_1.styles.docItemMeta}>{text.orders.lineTotalLabel}: {item.lineTotal.toFixed(2)}</react_native_1.Text>
                </react_native_1.View>
              </react_native_1.View>
            </react_native_1.View>);
        })}
      </react_native_1.View>

      <react_native_1.View style={OrderRecapPage_styles_1.styles.docBlock}>
        <react_native_1.Text style={OrderRecapPage_styles_1.styles.docBlockTitle}>{text.orders.summaryTitle}</react_native_1.Text>
        <react_native_1.Text style={OrderRecapPage_styles_1.styles.docItemMeta}>{text.orders.summaryItems}: {recap.totalItems}</react_native_1.Text>
        <react_native_1.Text style={OrderRecapPage_styles_1.styles.docItemMeta}>{text.orders.summaryAmount}: {recap.totalAmount.toFixed(2)}</react_native_1.Text>
      </react_native_1.View>

      <react_native_1.Pressable style={[OrderRecapPage_styles_1.styles.primaryButton, isSubmittingOrder && OrderRecapPage_styles_1.styles.buttonDisabled]} disabled={isSubmittingOrder} onPress={onSubmitOrder}>
        <react_native_1.Text style={OrderRecapPage_styles_1.styles.primaryButtonText}>
          {isSubmittingOrder ? text.orders.submittingOrder : text.orders.submitOrderButton}
        </react_native_1.Text>
      </react_native_1.Pressable>

      {submitError ? <react_native_1.Text style={OrderRecapPage_styles_1.styles.error}>{submitError}</react_native_1.Text> : null}

      <react_native_1.Pressable style={OrderRecapPage_styles_1.styles.primaryButton} onPress={onBack}>
        <react_native_1.Text style={OrderRecapPage_styles_1.styles.primaryButtonText}>{text.orders.backToOrderButton}</react_native_1.Text>
      </react_native_1.Pressable>
    </react_native_1.View>);
}
//# sourceMappingURL=OrderRecapPage.js.map