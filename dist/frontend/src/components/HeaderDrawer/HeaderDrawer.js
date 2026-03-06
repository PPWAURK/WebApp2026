"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HeaderDrawer = HeaderDrawer;
const react_1 = require("react");
const react_native_1 = require("react-native");
const HeaderDrawer_styles_1 = require("./HeaderDrawer.styles");
function HeaderDrawer(props) {
    const translateX = (0, react_1.useRef)(new react_native_1.Animated.Value(-280)).current;
    const [isOrdersGroupOpen, setIsOrdersGroupOpen] = (0, react_1.useState)(props.activePage === 'orders' ||
        props.activePage === 'orderHistory' ||
        props.activePage === 'orderRecap');
    const menuItems = [
        { key: 'dashboard', label: props.text.drawer.dashboard },
        { key: 'profile', label: props.text.drawer.profile },
        { key: 'training', label: props.text.drawer.training },
        { key: 'restaurantForms', label: props.text.drawer.restaurantForms },
        ...(props.currentUser.role === 'ADMIN'
            ? [
                {
                    key: 'supplierManagement',
                    label: props.text.drawer.supplierManagement,
                },
            ]
            : []),
    ];
    const displayName = props.currentUser.name?.trim() || props.text.dashboard.fallbackName;
    (0, react_1.useEffect)(() => {
        react_native_1.Animated.timing(translateX, {
            toValue: props.isOpen ? 0 : -280,
            duration: 220,
            useNativeDriver: react_native_1.Platform.OS !== 'web',
        }).start();
    }, [props.isOpen, translateX]);
    (0, react_1.useEffect)(() => {
        if (props.activePage === 'orders' ||
            props.activePage === 'orderHistory' ||
            props.activePage === 'orderRecap') {
            setIsOrdersGroupOpen(true);
        }
    }, [props.activePage]);
    return (<>
      <react_native_1.View style={HeaderDrawer_styles_1.styles.headerBar}>
        <react_native_1.Pressable style={HeaderDrawer_styles_1.styles.menuTrigger} onPress={props.onToggle}>
          <react_native_1.Text style={HeaderDrawer_styles_1.styles.menuTriggerText}>☰</react_native_1.Text>
        </react_native_1.Pressable>

        <react_native_1.View style={HeaderDrawer_styles_1.styles.headerTitleWrap}>
          <react_native_1.Text style={HeaderDrawer_styles_1.styles.headerTitle}>{props.text.header.title}</react_native_1.Text>
          <react_native_1.Text style={HeaderDrawer_styles_1.styles.headerSubtitle}>
            {`${props.text.dashboard.welcome} ${displayName} - ${props.text.header.connected}`}
          </react_native_1.Text>
        </react_native_1.View>

        <react_native_1.View style={HeaderDrawer_styles_1.styles.headerDot}/>
      </react_native_1.View>

      {props.isOpen ? (<react_native_1.Pressable style={HeaderDrawer_styles_1.styles.drawerBackdrop} onPress={props.onClose}/>) : null}

      <react_native_1.Animated.View style={[HeaderDrawer_styles_1.styles.drawerPanel, { transform: [{ translateX }] }]}>
        <react_native_1.Text style={HeaderDrawer_styles_1.styles.drawerTitle}>{props.text.drawer.title}</react_native_1.Text>
        {menuItems.map((item) => (<react_native_1.Pressable key={item.key} style={[
                HeaderDrawer_styles_1.styles.drawerItem,
                props.activePage === item.key && HeaderDrawer_styles_1.styles.drawerItemActive,
            ]} onPress={() => {
                props.onSelectPage(item.key);
                props.onClose();
            }}>
            <react_native_1.Text style={[
                HeaderDrawer_styles_1.styles.drawerItemText,
                props.activePage === item.key && HeaderDrawer_styles_1.styles.drawerItemTextActive,
            ]}>
              {item.label}
            </react_native_1.Text>
          </react_native_1.Pressable>))}

        {props.currentUser.role === 'ADMIN' || props.currentUser.role === 'MANAGER' ? (<react_native_1.View style={HeaderDrawer_styles_1.styles.drawerGroupWrap}>
            <react_native_1.Pressable style={[
                HeaderDrawer_styles_1.styles.drawerItem,
                (props.activePage === 'orders' ||
                    props.activePage === 'orderHistory' ||
                    props.activePage === 'orderRecap') &&
                    HeaderDrawer_styles_1.styles.drawerItemActive,
            ]} onPress={() => setIsOrdersGroupOpen((isOpen) => !isOpen)}>
              <react_native_1.View style={HeaderDrawer_styles_1.styles.drawerGroupHeaderRow}>
                <react_native_1.Text style={[
                HeaderDrawer_styles_1.styles.drawerItemText,
                (props.activePage === 'orders' ||
                    props.activePage === 'orderHistory' ||
                    props.activePage === 'orderRecap') &&
                    HeaderDrawer_styles_1.styles.drawerItemTextActive,
            ]}>
                  {props.text.drawer.ordersGroup}
                </react_native_1.Text>
                <react_native_1.Text style={[
                HeaderDrawer_styles_1.styles.drawerGroupChevron,
                (props.activePage === 'orders' ||
                    props.activePage === 'orderHistory' ||
                    props.activePage === 'orderRecap') &&
                    HeaderDrawer_styles_1.styles.drawerGroupChevronActive,
            ]}>
                  {isOrdersGroupOpen ? '▾' : '▸'}
                </react_native_1.Text>
              </react_native_1.View>
            </react_native_1.Pressable>

            {isOrdersGroupOpen ? (<react_native_1.View style={HeaderDrawer_styles_1.styles.drawerSubItemWrap}>
                <react_native_1.Pressable style={[
                    HeaderDrawer_styles_1.styles.drawerSubItem,
                    props.activePage === 'orders' && HeaderDrawer_styles_1.styles.drawerSubItemActive,
                ]} onPress={() => {
                    props.onSelectPage('orders');
                    props.onClose();
                }}>
                  <react_native_1.Text style={[
                    HeaderDrawer_styles_1.styles.drawerSubItemText,
                    props.activePage === 'orders' && HeaderDrawer_styles_1.styles.drawerSubItemTextActive,
                ]}>
                    {props.text.drawer.ordersPlace}
                  </react_native_1.Text>
                </react_native_1.Pressable>

                <react_native_1.Pressable style={[
                    HeaderDrawer_styles_1.styles.drawerSubItem,
                    props.activePage === 'orderHistory' && HeaderDrawer_styles_1.styles.drawerSubItemActive,
                ]} onPress={() => {
                    props.onSelectPage('orderHistory');
                    props.onClose();
                }}>
                  <react_native_1.Text style={[
                    HeaderDrawer_styles_1.styles.drawerSubItemText,
                    props.activePage === 'orderHistory' && HeaderDrawer_styles_1.styles.drawerSubItemTextActive,
                ]}>
                    {props.text.drawer.ordersHistory}
                  </react_native_1.Text>
                </react_native_1.Pressable>
              </react_native_1.View>) : null}
          </react_native_1.View>) : null}

        <react_native_1.Pressable style={HeaderDrawer_styles_1.styles.drawerItem} onPress={() => {
            props.onClose();
            props.onLogout();
        }}>
          <react_native_1.Text style={HeaderDrawer_styles_1.styles.drawerItemText}>{props.text.dashboard.logout}</react_native_1.Text>
        </react_native_1.Pressable>

        <react_native_1.View style={HeaderDrawer_styles_1.styles.languageSection}>
          <react_native_1.Text style={HeaderDrawer_styles_1.styles.languageTitle}>{props.text.drawer.languageTitle}</react_native_1.Text>
          <react_native_1.View style={HeaderDrawer_styles_1.styles.languageRow}>
            <react_native_1.Pressable style={[
            HeaderDrawer_styles_1.styles.languageChip,
            props.language === 'fr' && HeaderDrawer_styles_1.styles.languageChipActive,
        ]} onPress={() => props.onSelectLanguage('fr')}>
              <react_native_1.Text style={HeaderDrawer_styles_1.styles.languageChipText}>{props.text.drawer.fr}</react_native_1.Text>
            </react_native_1.Pressable>
            <react_native_1.Pressable style={[
            HeaderDrawer_styles_1.styles.languageChip,
            props.language === 'zh' && HeaderDrawer_styles_1.styles.languageChipActive,
        ]} onPress={() => props.onSelectLanguage('zh')}>
              <react_native_1.Text style={HeaderDrawer_styles_1.styles.languageChipText}>{props.text.drawer.zh}</react_native_1.Text>
            </react_native_1.Pressable>
          </react_native_1.View>
        </react_native_1.View>
      </react_native_1.Animated.View>
    </>);
}
//# sourceMappingURL=HeaderDrawer.js.map