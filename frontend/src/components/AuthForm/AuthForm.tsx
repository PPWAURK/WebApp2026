import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  Image,
  Pressable,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { styles } from './AuthForm.styles';
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
  name: string;
  restaurants: Restaurant[];
  selectedRestaurantId: number | null;
  requestManagerRole: boolean;
  rememberMe: boolean;
  isSubmitting: boolean;
  forgotPasswordCooldownSeconds: number;
  error: string | null;
  notice?: string | null;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onSelectRestaurant: (restaurantId: number) => void;
  onToggleRequestManagerRole: () => void;
  onRememberToggle: () => void;
  onSelectLanguage: (language: Language) => void;
  onSubmit: () => void;
  onForgotPassword: () => void;
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
  const hasName = props.name.trim().length > 0;
  const hasRestaurant = props.selectedRestaurantId !== null;

  const isFormValid =
    props.mode === 'login'
      ? hasEmail && hasPassword
      : hasName && hasEmail && hasPassword && hasRestaurant;

  const isSubmitDisabled = props.isSubmitting || !isFormValid;
  const isForgotPasswordDisabled =
    props.isSubmitting || props.forgotPasswordCooldownSeconds > 0;
  const forgotPasswordLabel =
    props.forgotPasswordCooldownSeconds > 0
      ? `${props.text.auth.forgotPassword} (${props.forgotPasswordCooldownSeconds}s)`
      : props.text.auth.forgotPassword;

  const { width } = useWindowDimensions();
  const isSmall = width < 520;
  const isTablet = width >= 520 && width < 960;
  const decorPreset = isSmall ? 'small' : isTablet ? 'tablet' : 'desktop';

  return (
    <View style={styles.card}>
      <View style={styles.decorLayer} pointerEvents="none">
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
        >
          <Text style={styles.authLanguageChipText}>
            {props.text.drawer.zh}
          </Text>
        </Pressable>
      </View>

      {props.mode === 'register' ? (
        <>
          <Text style={styles.uploadFieldTitle}>
            {props.text.auth.namePlaceholder}
          </Text>
          <View style={styles.passwordWrapper}>
            <TextInput
              autoCapitalize="words"
              autoComplete="off"
              autoCorrect={false}
              spellCheck={false}
              importantForAutofill="no"
              selectionColor="#ab1e24"
              placeholder={props.text.auth.namePlaceholder}
              placeholderTextColor="#7f8a8a"
              style={styles.passwordInput}
              value={props.name}
              onChangeText={props.onNameChange}
            />
          </View>

          <Text style={styles.uploadFieldTitle}>
            {props.text.auth.restaurantLabel}
          </Text>
          <View style={styles.restaurantSelectWrap}>
            <Pressable
              style={styles.restaurantSelectTrigger}
              onPress={() =>
                setIsRestaurantListOpen((currentValue) => !currentValue)
              }
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

          {props.restaurants.length === 0 ? (
            <Text style={styles.error}>
              {props.text.auth.restaurantRequired}
            </Text>
          ) : null}

          <Pressable
            style={styles.registerOptionRow}
            onPress={props.onToggleRequestManagerRole}
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
          selectionColor="#ab1e24"
          placeholder={props.text.auth.emailPlaceholder}
          placeholderTextColor="#7f8a8a"
          style={styles.passwordInput}
          value={props.email}
          onChangeText={props.onEmailChange}
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
          selectionColor="#ab1e24"
          placeholder={props.text.auth.passwordPlaceholder}
          placeholderTextColor="#7f8a8a"
          style={styles.passwordInput}
          value={props.password}
          onChangeText={props.onPasswordChange}
        />
        <Pressable
          style={styles.eyeButton}
          onPress={() => setPasswordVisible((current) => !current)}
        >
          <Ionicons
            name={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
            size={18}
            color="#ab1e24"
          />
        </Pressable>
      </View>

      {props.mode === 'login' ? (
        <View style={styles.optionsRow}>
          <Pressable
            style={styles.rememberRow}
            onPress={props.onRememberToggle}
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
        >
          <Text style={styles.linkText}>{props.text.landing.backButton}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
