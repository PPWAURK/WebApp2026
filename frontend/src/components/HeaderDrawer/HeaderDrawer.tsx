import { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, Text, View } from 'react-native';
import type { AppText } from '../../locales/translations';
import { styles } from './HeaderDrawer.styles';
import type { Language } from '../../types/language';
import type { MenuPage } from '../../types/menu';
import type { User } from '../../types/auth';

type HeaderDrawerProps = {
  isOpen: boolean;
  text: AppText;
  language: Language;
  currentUser: User;
  activePage: MenuPage;
  onToggle: () => void;
  onClose: () => void;
  onSelectPage: (page: MenuPage) => void;
  onSelectLanguage: (language: Language) => void;
  onLogout: () => void;
};

export function HeaderDrawer(props: HeaderDrawerProps) {
  const translateX = useRef(new Animated.Value(-280)).current;
  const [isOrdersGroupOpen, setIsOrdersGroupOpen] = useState(
    props.activePage === 'orders' ||
      props.activePage === 'orderHistory' ||
      props.activePage === 'orderRecap',
  );
  const menuItems: Array<{ key: MenuPage; label: string }> = [
    { key: 'dashboard', label: props.text.drawer.dashboard },
    ...(props.currentUser.role === 'ADMIN' ||
    props.currentUser.role === 'MANAGER'
      ? [
          {
            key: 'teamOverview' as MenuPage,
            label: props.text.drawer.teamOverview,
          },
        ]
      : []),
    { key: 'profile', label: props.text.drawer.profile },
    { key: 'training', label: props.text.drawer.training },
    { key: 'restaurantForms', label: props.text.drawer.restaurantForms },
    ...(props.currentUser.role === 'ADMIN'
      ? [
          {
            key: 'storeManagement' as MenuPage,
            label: props.text.drawer.storeManagement,
          },
          {
            key: 'supplierManagement' as MenuPage,
            label: props.text.drawer.supplierManagement,
          },
        ]
      : []),
  ];
  const displayName =
    props.currentUser.name?.trim() || props.text.dashboard.fallbackName;

  useEffect(() => {
    Animated.timing(translateX, {
      toValue: props.isOpen ? 0 : -280,
      duration: 220,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [props.isOpen, translateX]);

  useEffect(() => {
    if (
      props.activePage === 'orders' ||
      props.activePage === 'orderHistory' ||
      props.activePage === 'orderRecap'
    ) {
      setIsOrdersGroupOpen(true);
    }
  }, [props.activePage]);

  return (
    <>
      <View style={styles.headerBar}>
        <Pressable
          style={styles.menuTrigger}
          onPress={props.onToggle}
          accessibilityRole="button"
          accessibilityLabel={
            props.language === 'zh'
              ? '打开导航菜单'
              : 'Ouvrir le menu de navigation'
          }
          accessibilityState={{ expanded: props.isOpen }}
        >
          <Text style={styles.menuTriggerText}>☰</Text>
        </Pressable>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>{props.text.header.title}</Text>
          <Text style={styles.headerSubtitle}>
            {`${props.text.dashboard.welcome} ${displayName} - ${props.text.header.connected}`}
          </Text>
        </View>

        <View style={styles.headerDot} />
      </View>

      {props.isOpen ? (
        <Pressable
          style={styles.drawerBackdrop}
          onPress={props.onClose}
          accessibilityRole="button"
          accessibilityLabel={
            props.language === 'zh'
              ? '关闭导航菜单'
              : 'Fermer le menu de navigation'
          }
        />
      ) : null}

      <Animated.View
        style={[styles.drawerPanel, { transform: [{ translateX }] }]}
      >
        <Text style={styles.drawerTitle}>{props.text.drawer.title}</Text>
        {menuItems.map((item) => (
          <Pressable
            key={item.key}
            style={[
              styles.drawerItem,
              props.activePage === item.key && styles.drawerItemActive,
            ]}
            onPress={() => {
              props.onSelectPage(item.key);
              props.onClose();
            }}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            accessibilityState={{ selected: props.activePage === item.key }}
          >
            <Text
              style={[
                styles.drawerItemText,
                props.activePage === item.key && styles.drawerItemTextActive,
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        ))}

        {props.currentUser.role === 'ADMIN' ||
        props.currentUser.role === 'MANAGER' ? (
          <View style={styles.drawerGroupWrap}>
            <Pressable
              style={[
                styles.drawerItem,
                (props.activePage === 'orders' ||
                  props.activePage === 'orderHistory' ||
                  props.activePage === 'orderRecap') &&
                  styles.drawerItemActive,
              ]}
              onPress={() => setIsOrdersGroupOpen((isOpen) => !isOpen)}
              accessibilityRole="button"
              accessibilityLabel={props.text.drawer.ordersGroup}
              accessibilityState={{
                expanded: isOrdersGroupOpen,
                selected:
                  props.activePage === 'orders' ||
                  props.activePage === 'orderHistory' ||
                  props.activePage === 'orderRecap',
              }}
            >
              <View style={styles.drawerGroupHeaderRow}>
                <Text
                  style={[
                    styles.drawerItemText,
                    (props.activePage === 'orders' ||
                      props.activePage === 'orderHistory' ||
                      props.activePage === 'orderRecap') &&
                      styles.drawerItemTextActive,
                  ]}
                >
                  {props.text.drawer.ordersGroup}
                </Text>
                <Text
                  style={[
                    styles.drawerGroupChevron,
                    (props.activePage === 'orders' ||
                      props.activePage === 'orderHistory' ||
                      props.activePage === 'orderRecap') &&
                      styles.drawerGroupChevronActive,
                  ]}
                >
                  {isOrdersGroupOpen ? '▾' : '▸'}
                </Text>
              </View>
            </Pressable>

            {isOrdersGroupOpen ? (
              <View style={styles.drawerSubItemWrap}>
                <Pressable
                  style={[
                    styles.drawerSubItem,
                    props.activePage === 'orders' && styles.drawerSubItemActive,
                  ]}
                  onPress={() => {
                    props.onSelectPage('orders');
                    props.onClose();
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={props.text.drawer.ordersPlace}
                  accessibilityState={{
                    selected: props.activePage === 'orders',
                  }}
                >
                  <Text
                    style={[
                      styles.drawerSubItemText,
                      props.activePage === 'orders' &&
                        styles.drawerSubItemTextActive,
                    ]}
                  >
                    {props.text.drawer.ordersPlace}
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.drawerSubItem,
                    props.activePage === 'orderHistory' &&
                      styles.drawerSubItemActive,
                  ]}
                  onPress={() => {
                    props.onSelectPage('orderHistory');
                    props.onClose();
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={props.text.drawer.ordersHistory}
                  accessibilityState={{
                    selected: props.activePage === 'orderHistory',
                  }}
                >
                  <Text
                    style={[
                      styles.drawerSubItemText,
                      props.activePage === 'orderHistory' &&
                        styles.drawerSubItemTextActive,
                    ]}
                  >
                    {props.text.drawer.ordersHistory}
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        ) : null}

        <Pressable
          style={styles.drawerItem}
          onPress={() => {
            props.onClose();
            props.onLogout();
          }}
          accessibilityRole="button"
          accessibilityLabel={props.text.dashboard.logout}
        >
          <Text style={styles.drawerItemText}>
            {props.text.dashboard.logout}
          </Text>
        </Pressable>

        <View style={styles.languageSection}>
          <Text style={styles.languageTitle}>
            {props.text.drawer.languageTitle}
          </Text>
          <View style={styles.languageRow}>
            <Pressable
              style={[
                styles.languageChip,
                props.language === 'fr' && styles.languageChipActive,
              ]}
              onPress={() => props.onSelectLanguage('fr')}
              accessibilityRole="button"
              accessibilityLabel={props.text.drawer.fr}
              accessibilityState={{ selected: props.language === 'fr' }}
            >
              <Text style={styles.languageChipText}>
                {props.text.drawer.fr}
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.languageChip,
                props.language === 'zh' && styles.languageChipActive,
              ]}
              onPress={() => props.onSelectLanguage('zh')}
              accessibilityRole="button"
              accessibilityLabel={props.text.drawer.zh}
              accessibilityState={{ selected: props.language === 'zh' }}
            >
              <Text style={styles.languageChipText}>
                {props.text.drawer.zh}
              </Text>
            </Pressable>
          </View>
        </View>
      </Animated.View>
    </>
  );
}
