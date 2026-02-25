import { useEffect, useRef } from 'react';
import { Animated, Platform, Pressable, Text, View } from 'react-native';
import type { AppText } from '../locales/translations';
import { styles } from '../styles/appStyles';
import type { Language } from '../types/language';
import type { MenuPage } from '../types/menu';
import type { User } from '../types/auth';

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
};

export function HeaderDrawer(props: HeaderDrawerProps) {
  const translateX = useRef(new Animated.Value(-280)).current;
  const menuItems: Array<{ key: MenuPage; label: string }> = [
    { key: 'dashboard', label: props.text.drawer.dashboard },
    { key: 'profile', label: props.text.drawer.profile },
    { key: 'training', label: props.text.drawer.training },
    { key: 'restaurantForms', label: props.text.drawer.restaurantForms },
    ...(props.currentUser.role === 'ADMIN' || props.currentUser.role === 'MANAGER'
        ? [
            { key: 'orders' as MenuPage, label: props.text.drawer.orders },
            {
              key: 'orderHistory' as MenuPage,
              label: props.text.drawer.orderHistory,
            },
            {
              key: 'supplierManagement' as MenuPage,
              label: props.text.drawer.supplierManagement,
            },
          ]
      : []),
  ];

  useEffect(() => {
    Animated.timing(translateX, {
      toValue: props.isOpen ? 0 : -280,
      duration: 220,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [props.isOpen, translateX]);

  return (
    <>
      <View style={styles.headerBar}>
        <Pressable style={styles.menuTrigger} onPress={props.onToggle}>
          <Text style={styles.menuTriggerText}>☰</Text>
        </Pressable>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>{props.text.header.title}</Text>
          <Text style={styles.headerSubtitle}>
            {props.text.header.connected}
          </Text>
        </View>

        <View style={styles.headerDot} />
      </View>

      {props.isOpen ? (
        <Pressable style={styles.drawerBackdrop} onPress={props.onClose} />
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
          >
            <Text style={styles.drawerItemText}>{item.label}</Text>
          </Pressable>
        ))}

        <View style={styles.languageSection}>
          <Text style={styles.languageTitle}>{props.text.drawer.languageTitle}</Text>
          <View style={styles.languageRow}>
            <Pressable
              style={[
                styles.languageChip,
                props.language === 'fr' && styles.languageChipActive,
              ]}
              onPress={() => props.onSelectLanguage('fr')}
            >
              <Text style={styles.languageChipText}>{props.text.drawer.fr}</Text>
            </Pressable>
            <Pressable
              style={[
                styles.languageChip,
                props.language === 'zh' && styles.languageChipActive,
              ]}
              onPress={() => props.onSelectLanguage('zh')}
            >
              <Text style={styles.languageChipText}>{props.text.drawer.zh}</Text>
            </Pressable>
          </View>
        </View>
      </Animated.View>
    </>
  );
}
