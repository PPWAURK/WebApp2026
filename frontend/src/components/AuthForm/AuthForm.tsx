import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  Image,
  Platform,
  Pressable,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { styles } from './AuthForm.styles';
import { COLORS } from '../../constants/colors';
import type { AuthMode, Restaurant } from '../../types/auth';
import type { AppText } from '../../locales/translations';
import type { Language } from '../../types/language';

type AuthFormProps = {
  mode: AuthMode;
  title: string;
  text: AppText;
  language: Language;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  restaurants: Restaurant[];
  selectedRestaurantId: number | null;
  requestManagerRole: boolean;
  rememberMe: boolean;
  isSubmitting: boolean;
  forgotPasswordCooldownSeconds: number;
  resendVerificationCooldownSeconds: number;
  error: string | null;
  notice?: string | null;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onFirstNameChange: (value: string) => void;
  onLastNameChange: (value: string) => void;
  onSelectRestaurant: (restaurantId: number) => void;
  onToggleRequestManagerRole: () => void;
  onRememberToggle: () => void;
  onSelectLanguage: (language: Language) => void;
  onSubmit: () => void;
  onForgotPassword: () => void;
  onResendVerification: () => void;
  onToggleMode: () => void;
  onBackToLanding?: () => void;
};

type DecorLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
};

type DecorItem = {
  key: string;
  source: number;
  small: DecorLayout;
  tablet: DecorLayout;
  desktop: DecorLayout;
};

const DECOR_ITEMS: DecorItem[] = [
  {
    key: 'pattern-1',
    source: require('../../../assets/四大天王/IMG_9278.png'),
    small: { x: 3, y: 2, width: 150, height: 100, opacity: 0.75 },
    tablet: { x: 2, y: 2, width: 200, height: 120, opacity: 0.75 },
    desktop: { x: 5, y: 5, width: 250, height: 120, opacity: 0.75 },
  },
  {
    key: 'pattern-3',
    source: require('../../../assets/四大天王/IMG_9276.png'),
    small: { x: 98, y: 95, width: 120, height: 100, opacity: 0.75 },
    tablet: { x: 98, y: 95, width: 100, height: 120, opacity: 0.65 },
    desktop: { x: 98, y: 95, width: 150, height: 120, opacity: 0.75 },
  },
];

export function AuthForm(props: AuthFormProps) {
  const [isRestaurantListOpen, setIsRestaurantListOpen] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const selectedRestaurant =
    props.restaurants.find(
      (restaurant) => restaurant.id === props.selectedRestaurantId,
    ) ?? null;

  const hasEmail = props.email.trim().length > 0;
  const hasPassword = props.password.trim().length > 0;
  const hasFirstName = props.firstName.trim().length > 0;
  const hasLastName = props.lastName.trim().length > 0;
  const hasRestaurant = props.selectedRestaurantId !== null;

  const isFormValid =
    props.mode === 'login'
      ? hasEmail && hasPassword
      : hasFirstName && hasLastName && hasEmail && hasPassword && hasRestaurant;

  const isSubmitDisabled = props.isSubmitting || !isFormValid;
  const isForgotPasswordDisabled =
    props.isSubmitting || props.forgotPasswordCooldownSeconds > 0;
  const isResendVerificationDisabled =
    props.isSubmitting ||
    props.resendVerificationCooldownSeconds > 0 ||
    !hasEmail;
  const forgotPasswordLabel =
    props.forgotPasswordCooldownSeconds > 0
      ? `${props.text.auth.forgotPassword} (${props.forgotPasswordCooldownSeconds}s)`
      : props.text.auth.forgotPassword;
  const resendVerificationLabel =
    props.resendVerificationCooldownSeconds > 0
      ? `${props.text.auth.resendVerificationEmail} (${props.resendVerificationCooldownSeconds}s)`
      : props.text.auth.resendVerificationEmail;

  const { width } = useWindowDimensions();
  const isSmall = width < 520;
  const isTablet = width >= 520 && width < 960;
  const decorPreset = isSmall ? 'small' : isTablet ? 'tablet' : 'desktop';
  const nonInteractiveStyle =
    Platform.OS === 'web' ? ({ pointerEvents: 'none' } as never) : null;
  const webInputResetStyle =
    Platform.OS === 'web'
      ? ({
          outlineStyle: 'none',
          outlineWidth: 0,
          outlineColor: 'transparent',
          boxShadow: 'none',
          appearance: 'none',
          WebkitAppearance: 'none',
        } as never)
      : null;

  return (
    <View style={styles.card}>
      <View
        style={[styles.decorLayer, nonInteractiveStyle]}
        pointerEvents={Platform.OS === 'web' ? undefined : 'none'}
      >
        {DECOR_ITEMS.map((item) => {
          const layout = item[decorPreset];

          return (
            <Image
              key={item.key}
              source={item.source}
              resizeMode="contain"
              style={[
                styles.decorImage,
                {
                  left: `${layout.x}%`,
                  top: `${layout.y}%`,
                  width: layout.width,
                  height: layout.height,
                  marginLeft: -layout.width / 2,
                  marginTop: -layout.height / 2,
                  opacity: layout.opacity,
                },
              ]}
            />
          );
        })}
      </View>
      <Image
        source={require('../../../assets/ZHAO-元素element/logo/1.png')}
        style={styles.logo}
        resizeMode="contain"
      />

      <Text style={styles.title}>{props.title}</Text>

      <View style={styles.authLanguageRow}>
        <Pressable
          style={[
            styles.authLanguageChip,
            props.language === 'fr' && styles.authLanguageChipActive,
          ]}
          onPress={() => props.onSelectLanguage('fr')}
          accessibilityRole="button"
          accessibilityLabel={props.text.drawer.fr}
          accessibilityState={{ selected: props.language === 'fr' }}
        >
          <Text style={styles.authLanguageChipText}>
            {props.text.drawer.fr}
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.authLanguageChip,
            props.language === 'zh' && styles.authLanguageChipActive,
          ]}
          onPress={() => props.onSelectLanguage('zh')}
          accessibilityRole="button"
          accessibilityLabel={props.text.drawer.zh}
          accessibilityState={{ selected: props.language === 'zh' }}
        >
          <Text style={styles.authLanguageChipText}>
            {props.text.drawer.zh}
          </Text>
        </Pressable>
      </View>

      {props.mode === 'register' ? (
        <>
          <Text style={styles.uploadFieldTitle}>
            {props.text.auth.lastNamePlaceholder}
          </Text>
          <View style={styles.passwordWrapper}>
            <TextInput
              autoCapitalize="words"
              autoComplete="off"
              autoCorrect={false}
              spellCheck={false}
              importantForAutofill="no"
              selectionColor={COLORS.brandPrimary}
              placeholder={props.text.auth.lastNamePlaceholder}
              placeholderTextColor={COLORS.textMutedCool}
              style={[styles.passwordInput, webInputResetStyle]}
              value={props.lastName}
              onChangeText={props.onLastNameChange}
              accessibilityLabel={props.text.auth.lastNamePlaceholder}
            />
          </View>

          <Text style={styles.uploadFieldTitle}>
            {props.text.auth.firstNamePlaceholder}
          </Text>
          <View style={styles.passwordWrapper}>
            <TextInput
              autoCapitalize="words"
              autoComplete="off"
              autoCorrect={false}
              spellCheck={false}
              importantForAutofill="no"
              selectionColor={COLORS.brandPrimary}
              placeholder={props.text.auth.firstNamePlaceholder}
              placeholderTextColor={COLORS.textMutedCool}
              style={[styles.passwordInput, webInputResetStyle]}
              value={props.firstName}
              onChangeText={props.onFirstNameChange}
              accessibilityLabel={props.text.auth.firstNamePlaceholder}
            />
          </View>

          <Text style={styles.uploadFieldTitle}>
            {props.requestManagerRole
              ? props.text.auth.managerRestaurantLabel
              : props.text.auth.restaurantLabel}
          </Text>
          <View style={styles.restaurantSelectWrap}>
            <Pressable
              style={styles.restaurantSelectTrigger}
              onPress={() =>
                setIsRestaurantListOpen((currentValue) => !currentValue)
              }
              accessibilityRole="button"
              accessibilityLabel={`${props.text.auth.restaurantLabel} ${selectedRestaurant?.name ?? props.text.auth.restaurantPlaceholder}`}
              accessibilityState={{ expanded: isRestaurantListOpen }}
            >
              <Text style={styles.restaurantSelectTriggerText}>
                {selectedRestaurant?.name ??
                  props.text.auth.restaurantPlaceholder}
              </Text>
              <Text style={styles.restaurantSelectChevron}>
                {isRestaurantListOpen ? '▲' : '▼'}
              </Text>
            </Pressable>

            {isRestaurantListOpen ? (
              <View style={styles.restaurantSelectList}>
                {props.restaurants.map((restaurant) => (
                  <Pressable
                    key={restaurant.id}
                    style={[
                      styles.restaurantSelectItem,
                      props.selectedRestaurantId === restaurant.id &&
                        styles.restaurantSelectItemActive,
                    ]}
                    onPress={() => {
                      props.onSelectRestaurant(restaurant.id);
                      setIsRestaurantListOpen(false);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={restaurant.name}
                    accessibilityState={{
                      selected: props.selectedRestaurantId === restaurant.id,
                    }}
                  >
                    <Text
                      style={[
                        styles.restaurantSelectItemText,
                        props.selectedRestaurantId === restaurant.id &&
                          styles.restaurantSelectItemTextActive,
                      ]}
                    >
                      {restaurant.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>

          {props.requestManagerRole ? (
            <Text style={styles.registerOptionHint}>
              {props.text.auth.managerRestaurantHint}
            </Text>
          ) : null}

          {props.restaurants.length === 0 ? (
            <Text style={styles.error}>
              {props.text.auth.restaurantRequired}
            </Text>
          ) : null}

          <Pressable
            style={styles.registerOptionRow}
            onPress={props.onToggleRequestManagerRole}
            accessibilityRole="button"
            accessibilityLabel={props.text.auth.registerManagerRequestLabel}
            accessibilityState={{ selected: props.requestManagerRole }}
          >
            <View
              style={[
                styles.rememberBox,
                props.requestManagerRole && styles.rememberBoxActive,
              ]}
            >
              {props.requestManagerRole ? (
                <Text style={styles.rememberCheck}>✓</Text>
              ) : null}
            </View>
            <View style={styles.registerOptionTextWrap}>
              <Text style={styles.registerOptionLabel}>
                {props.text.auth.registerManagerRequestLabel}
              </Text>
              <Text style={styles.registerOptionHint}>
                {props.text.auth.registerManagerRequestHint}
              </Text>
            </View>
          </Pressable>
        </>
      ) : null}

      <Text style={styles.uploadFieldTitle}>Email</Text>
      <View style={styles.passwordWrapper}>
        <TextInput
          autoCapitalize="none"
          autoComplete="off"
          autoCorrect={false}
          spellCheck={false}
          importantForAutofill="no"
          keyboardType="email-address"
          selectionColor={COLORS.brandPrimary}
          placeholder={props.text.auth.emailPlaceholder}
          placeholderTextColor={COLORS.textMutedCool}
          style={[styles.passwordInput, webInputResetStyle]}
          value={props.email}
          onChangeText={props.onEmailChange}
          accessibilityLabel={props.text.auth.emailPlaceholder}
        />
      </View>

      <Text style={styles.uploadFieldTitle}>
        {props.text.auth.passwordPlaceholder}
      </Text>
      <View style={styles.passwordWrapper}>
        <TextInput
          autoCapitalize="none"
          autoComplete="off"
          autoCorrect={false}
          spellCheck={false}
          importantForAutofill="no"
          secureTextEntry={!passwordVisible}
          selectionColor={COLORS.brandPrimary}
          placeholder={props.text.auth.passwordPlaceholder}
          placeholderTextColor={COLORS.textMutedCool}
          style={[styles.passwordInput, webInputResetStyle]}
          value={props.password}
          onChangeText={props.onPasswordChange}
          accessibilityLabel={props.text.auth.passwordPlaceholder}
        />
        <Pressable
          style={styles.eyeButton}
          onPress={() => setPasswordVisible((current) => !current)}
          accessibilityRole="button"
          accessibilityLabel={
            passwordVisible
              ? props.language === 'zh'
                ? '隐藏密码'
                : 'Masquer le mot de passe'
              : props.language === 'zh'
                ? '显示密码'
                : 'Afficher le mot de passe'
          }
          accessibilityState={{ selected: passwordVisible }}
        >
          <Ionicons
            name={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
            size={18}
            color={COLORS.brandPrimary}
          />
        </Pressable>
      </View>

      {props.mode === 'login' ? (
        <View style={styles.optionsRow}>
          <Pressable
            style={styles.rememberRow}
            onPress={props.onRememberToggle}
            accessibilityRole="button"
            accessibilityLabel={props.text.auth.rememberMe}
            accessibilityState={{ selected: props.rememberMe }}
          >
            <View
              style={[
                styles.rememberBox,
                props.rememberMe && styles.rememberBoxActive,
              ]}
            >
              {props.rememberMe ? (
                <Text style={styles.rememberCheck}>✓</Text>
              ) : null}
            </View>
            <Text style={styles.rememberLabel}>
              {props.text.auth.rememberMe}
            </Text>
          </Pressable>

          <Pressable
            disabled={isForgotPasswordDisabled}
            onPress={props.onForgotPassword}
            accessibilityRole="button"
            accessibilityLabel={props.text.auth.forgotPassword}
            accessibilityState={{ disabled: isForgotPasswordDisabled }}
          >
            <Text
              style={[
                styles.forgotText,
                isForgotPasswordDisabled && styles.forgotTextDisabled,
              ]}
            >
              {forgotPasswordLabel}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {props.error ? <Text style={styles.error}>{props.error}</Text> : null}
      {props.notice ? <Text style={styles.notice}>{props.notice}</Text> : null}

      {props.mode === 'login' ? (
        <Pressable
          disabled={isResendVerificationDisabled}
          style={styles.linkButton}
          onPress={props.onResendVerification}
          accessibilityRole="button"
          accessibilityLabel={props.text.auth.resendVerificationEmail}
          accessibilityState={{ disabled: isResendVerificationDisabled }}
        >
          <Text
            style={[
              styles.linkText,
              isResendVerificationDisabled && styles.forgotTextDisabled,
            ]}
          >
            {resendVerificationLabel}
          </Text>
        </Pressable>
      ) : null}

      <Pressable
        disabled={isSubmitDisabled}
        style={[
          styles.primaryButton,
          isSubmitDisabled
            ? styles.primaryButtonDisabled
            : styles.primaryButtonActive,
          props.isSubmitting && styles.buttonDisabled,
        ]}
        onPress={props.onSubmit}
        accessibilityRole="button"
        accessibilityLabel={
          props.mode === 'login'
            ? props.text.auth.loginButton
            : props.text.auth.registerButton
        }
        accessibilityState={{ disabled: isSubmitDisabled }}
      >
        <Text style={styles.primaryButtonText}>
          {props.isSubmitting
            ? props.text.auth.loading
            : props.mode === 'login'
              ? props.text.auth.loginButton
              : props.text.auth.registerButton}
        </Text>
      </Pressable>

      <Pressable
        disabled={props.isSubmitting}
        style={styles.linkButton}
        onPress={props.onToggleMode}
        accessibilityRole="button"
        accessibilityLabel={
          props.mode === 'login'
            ? props.text.auth.switchToRegister
            : props.text.auth.switchToLogin
        }
        accessibilityState={{ disabled: props.isSubmitting }}
      >
        <Text style={styles.linkText}>
          {props.mode === 'login'
            ? props.text.auth.switchToRegister
            : props.text.auth.switchToLogin}
        </Text>
      </Pressable>

      {props.onBackToLanding ? (
        <Pressable
          disabled={props.isSubmitting}
          style={styles.linkButton}
          onPress={props.onBackToLanding}
          accessibilityRole="button"
          accessibilityLabel={props.text.landing.backButton}
          accessibilityState={{ disabled: props.isSubmitting }}
        >
          <Text style={styles.linkText}>{props.text.landing.backButton}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
