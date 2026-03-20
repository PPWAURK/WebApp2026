import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import {
  Animated,
  Image,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import type { AppText } from '../../locales/translations';
import type { User } from '../../types/auth';
import type { Language } from '../../types/language';
import type { MenuPage } from '../../types/menu';
import type { AppTheme } from '../../types/theme';
import {
  createStyles,
  DESKTOP_BREAKPOINT,
  getShellPalette,
  SIDEBAR_WIDTH,
} from './AuthenticatedShell.styles';

type AuthenticatedShellProps = {
  isSidebarOpen: boolean;
  text: AppText;
  language: Language;
  theme: AppTheme;
  currentUser: User;
  activePage: MenuPage;
  onToggleSidebar: () => void;
  onCloseSidebar: () => void;
  onSelectPage: (page: MenuPage) => void;
  onSelectLanguage: (language: Language) => void;
  onSelectTheme: (theme: AppTheme) => void;
  onLogout: () => void;
  children: ReactNode;
};

type PrimaryNavItem = {
  key: MenuPage;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

function getActivePageLabel(text: AppText, page: MenuPage): string {
  if (page === 'profile') {
    return text.drawer.profile;
  }

  if (page === 'training') {
    return text.drawer.training;
  }

  if (page === 'restaurantForms') {
    return text.drawer.restaurantForms;
  }

  if (page === 'orders') {
    return text.drawer.ordersPlace;
  }

  if (page === 'orderRecap') {
    return text.drawer.orders;
  }

  if (page === 'orderHistory') {
    return text.drawer.ordersHistory;
  }

  if (page === 'supplierManagement') {
    return text.drawer.supplierManagement;
  }

  return text.drawer.dashboard;
}

export function AuthenticatedShell(props: AuthenticatedShellProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= DESKTOP_BREAKPOINT;
  const styles = useMemo(() => createStyles(props.theme), [props.theme]);
  const palette = useMemo(() => getShellPalette(props.theme), [props.theme]);
  const nonInteractiveStyle =
    Platform.OS === 'web' ? ({ pointerEvents: 'none' } as never) : null;
  const mobileDrawerPointerEvents = props.isSidebarOpen ? 'auto' : 'none';
  const mobileDrawerInteractiveStyle =
    Platform.OS === 'web'
      ? ({ pointerEvents: mobileDrawerPointerEvents } as never)
      : null;
  const drawerTranslateX = useRef(new Animated.Value(-SIDEBAR_WIDTH - 24)).current;
  const locale = props.language === 'zh' ? 'zh-CN' : 'fr-FR';
  const todayLabel = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());
  const displayName = props.currentUser.name?.trim() || props.text.dashboard.fallbackName;
  const roleLabel = props.text.dashboard.roleValues[props.currentUser.role];
  const restaurantLabel =
    props.currentUser.restaurant?.name || props.text.profile.noRestaurant;
  const activePageLabel = getActivePageLabel(props.text, props.activePage);
  const statusLabel = props.language === 'zh' ? '当前状态' : 'Statut';
  const brandValueLines =
    props.language === 'zh'
      ? ['双手改变命运，', '奋斗成就自我，', '坚持不懈才能实现最大的价值']
      : [
          'Nos mains changent le destin,',
          'L’effort forge l’accomplissement,',
          'La persévérance crée la valeur',
        ];
  const canAccessOrders =
    props.currentUser.role === 'ADMIN' || props.currentUser.role === 'MANAGER';
  const primaryItems: PrimaryNavItem[] = [
    {
      key: 'dashboard',
      label: props.text.drawer.dashboard,
      icon: 'grid-outline',
    },
    {
      key: 'profile',
      label: props.text.drawer.profile,
      icon: 'person-circle-outline',
    },
    {
      key: 'training',
      label: props.text.drawer.training,
      icon: 'school-outline',
    },
    {
      key: 'restaurantForms',
      label: props.text.drawer.restaurantForms,
      icon: 'document-text-outline',
    },
  ];

  if (props.currentUser.role === 'ADMIN') {
    primaryItems.push({
      key: 'supplierManagement',
      label: props.text.drawer.supplierManagement,
      icon: 'layers-outline',
    });
  }

  useEffect(() => {
    if (isDesktop) {
      drawerTranslateX.setValue(0);
      return;
    }

    Animated.timing(drawerTranslateX, {
      toValue: props.isSidebarOpen ? 0 : -SIDEBAR_WIDTH - 24,
      duration: 220,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [drawerTranslateX, isDesktop, props.isSidebarOpen]);

  function handleSelectPage(page: MenuPage) {
    props.onSelectPage(page);

    if (!isDesktop) {
      props.onCloseSidebar();
    }
  }

  function renderNavItem(item: PrimaryNavItem) {
    const isActive = props.activePage === item.key;

    return (
      <Pressable
        key={item.key}
        style={[styles.navItem, isActive && styles.navItemActive]}
        onPress={() => handleSelectPage(item.key)}
      >
        <View style={[styles.navItemIconWrap, isActive && styles.navItemIconWrapActive]}>
          <Ionicons
            name={item.icon}
            size={18}
            color={isActive ? palette.navIconActive : palette.navIconDefault}
          />
        </View>
        <Text style={[styles.navItemText, isActive && styles.navItemTextActive]}>
          {item.label}
        </Text>
      </Pressable>
    );
  }

  function renderOrdersSection() {
    if (!canAccessOrders) {
      return null;
    }

    const orderPages: Array<{
      key: MenuPage;
      label: string;
      icon: keyof typeof Ionicons.glyphMap;
    }> = [
      {
        key: 'orders',
        label: props.text.drawer.ordersPlace,
        icon: 'bag-handle-outline',
      },
      {
        key: 'orderHistory',
        label: props.text.drawer.ordersHistory,
        icon: 'time-outline',
      },
    ];

    return (
      <View style={styles.navGroup}>
        <Text style={styles.sidebarLabel}>{props.text.drawer.ordersGroup}</Text>
        <View style={styles.navSubList}>
          {orderPages.map((item) => {
            const isActive = props.activePage === item.key;

            return (
              <Pressable
                key={item.key}
                style={[styles.navSubItem, isActive && styles.navSubItemActive]}
                onPress={() => handleSelectPage(item.key)}
              >
                <View style={[styles.navSubIconWrap, isActive && styles.navSubIconWrapActive]}>
                  <Ionicons
                    name={item.icon}
                    size={15}
                    color={isActive ? palette.navIconActive : palette.navIconDefault}
                  />
                </View>
                <Text
                  style={[styles.navSubItemText, isActive && styles.navSubItemTextActive]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

  function renderSidebar() {
    return (
      <View style={styles.sidebarPanel}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          bounces={false}
          contentContainerStyle={styles.sidebarPanelContent}
        >
          <View style={styles.brandBlock}>
            <View style={styles.brandBadge}>
              <Text style={styles.brandBadgeText}>{props.text.header.title}</Text>
            </View>
            <View style={styles.brandValuesStack}>
              {brandValueLines.map((line) => (
                <Text key={line} style={styles.brandValuesText} numberOfLines={1}>
                  {line}
                </Text>
              ))}
            </View>
          </View>

          <View style={styles.navSection}>
            <Text style={styles.sidebarLabel}>{props.text.drawer.title}</Text>
            <View style={styles.navList}>{primaryItems.map(renderNavItem)}</View>
          </View>

          {renderOrdersSection()}

          <View style={styles.sidebarFooter}>
            <View style={styles.sidebarUserCard}>
              <View style={styles.sidebarUserTopRow}>
                <View style={styles.sidebarUserAvatar}>
                  {props.currentUser.profilePhoto ? (
                    <Image
                      source={{ uri: props.currentUser.profilePhoto }}
                      style={styles.sidebarUserAvatarImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text style={styles.sidebarUserAvatarText}>
                      {displayName.slice(0, 1).toUpperCase()}
                    </Text>
                  )}
                </View>
                <View style={styles.sidebarUserTextWrap}>
                  <Text style={styles.sidebarUserName}>{displayName}</Text>
                  <Text style={styles.sidebarUserRole}>{roleLabel}</Text>
                </View>
              </View>

              <View style={styles.sidebarUserDetailRow}>
                <View style={styles.sidebarUserDetailIcon}>
                  <Ionicons name="business-outline" size={14} color={palette.surfaceIcon} />
                </View>
                <View style={styles.sidebarUserDetailTextWrap}>
                  <Text
                    style={styles.sidebarUserDetailText}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {restaurantLabel}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.themeGroup}>
              <Text style={styles.sidebarLabel}>{props.text.drawer.themeTitle}</Text>
              <View style={styles.themeRow}>
                <Pressable
                  style={[styles.themeChip, props.theme === 'light' && styles.themeChipActive]}
                  onPress={() => props.onSelectTheme('light')}
                >
                  <Ionicons
                    name="sunny-outline"
                    size={16}
                    color={props.theme === 'light' ? palette.brand : palette.navIconDefault}
                  />
                  <Text
                    style={[
                      styles.themeChipText,
                      props.theme === 'light' && styles.themeChipTextActive,
                    ]}
                  >
                    {props.text.drawer.themeLight}
                  </Text>
                </Pressable>

                <Pressable
                  style={[styles.themeChip, props.theme === 'dark' && styles.themeChipActive]}
                  onPress={() => props.onSelectTheme('dark')}
                >
                  <Ionicons
                    name="moon-outline"
                    size={16}
                    color={props.theme === 'dark' ? palette.brand : palette.navIconDefault}
                  />
                  <Text
                    style={[
                      styles.themeChipText,
                      props.theme === 'dark' && styles.themeChipTextActive,
                    ]}
                  >
                    {props.text.drawer.themeDark}
                  </Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.languageGroup}>
              <Text style={styles.sidebarLabel}>{props.text.drawer.languageTitle}</Text>
              <View style={styles.languageRow}>
                <Pressable
                  style={[styles.languageChip, props.language === 'fr' && styles.languageChipActive]}
                  onPress={() => props.onSelectLanguage('fr')}
                >
                  <Text
                    style={[
                      styles.languageChipText,
                      props.language === 'fr' && styles.languageChipTextActive,
                    ]}
                  >
                    {props.text.drawer.fr}
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.languageChip, props.language === 'zh' && styles.languageChipActive]}
                  onPress={() => props.onSelectLanguage('zh')}
                >
                  <Text
                    style={[
                      styles.languageChipText,
                      props.language === 'zh' && styles.languageChipTextActive,
                    ]}
                  >
                    {props.text.drawer.zh}
                  </Text>
                </Pressable>
              </View>
            </View>
            <View style={styles.logoutSection}>
              <Pressable style={styles.logoutButton} onPress={props.onLogout}>
                <Ionicons name="log-out-outline" size={16} color={palette.surfaceIcon} />
                <Text style={styles.logoutButtonText}>{props.text.dashboard.logout}</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.shellRoot}>
      <View
        style={[styles.shellBackdrop, nonInteractiveStyle]}
        pointerEvents={Platform.OS === 'web' ? undefined : 'none'}
      >
        <View style={styles.backdropOrbPrimary} />
        <View style={styles.backdropOrbSecondary} />
      </View>

      {!isDesktop && props.isSidebarOpen ? (
        <Pressable style={styles.mobileBackdrop} onPress={props.onCloseSidebar} />
      ) : null}

      {!isDesktop ? (
        <Animated.View
          style={[
            styles.mobileDrawerWrap,
            mobileDrawerInteractiveStyle,
            { transform: [{ translateX: drawerTranslateX }] },
          ]}
          pointerEvents={
            Platform.OS === 'web' ? undefined : mobileDrawerPointerEvents
          }
        >
          {renderSidebar()}
        </Animated.View>
      ) : null}

      <View style={styles.shellLayout}>
        {isDesktop ? <View style={styles.sidebarRail}>{renderSidebar()}</View> : null}

        <View style={styles.mainColumn}>
          <View style={styles.topBar}>
            <View style={styles.topBarTextWrap}>
              <Text style={styles.topBarEyebrow}>{todayLabel}</Text>
              <Text style={styles.topBarTitle}>{`${props.text.dashboard.welcome} ${displayName}`}</Text>
              <Text style={styles.topBarSubtitle}>{`${activePageLabel} · ${restaurantLabel}`}</Text>
            </View>

            <View style={styles.topBarMetaRow}>
              {isDesktop ? (
                <View style={styles.topBarInfoCard}>
                  <Text style={styles.topBarInfoLabel}>{statusLabel}</Text>
                  <View style={styles.topBarInfoStatusRow}>
                    <View style={styles.brandStatusDot} />
                    <Text style={styles.topBarInfoValue}>{props.text.header.connected}</Text>
                  </View>
                </View>
              ) : (
                <>
                  <View style={styles.statusPill}>
                    <View style={styles.brandStatusDot} />
                    <Text style={styles.statusPillText}>{props.text.header.connected}</Text>
                  </View>
                  <Pressable style={styles.mobileMenuButton} onPress={props.onToggleSidebar}>
                    <Ionicons name="menu-outline" size={22} color={palette.surfaceIcon} />
                  </Pressable>
                </>
              )}
            </View>
          </View>

          <View style={styles.contentViewport}>
            {props.children}
            {props.theme === 'dark' ? (
              <View
                style={[styles.contentDarkScrim, nonInteractiveStyle]}
                pointerEvents={Platform.OS === 'web' ? undefined : 'none'}
              />
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
}
