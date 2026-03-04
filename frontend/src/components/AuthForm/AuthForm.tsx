import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, Text, TextInput, View } from 'react-native';
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
  rememberMe: boolean;
  isSubmitting: boolean;
  forgotPasswordCooldownSeconds: number;
  error: string | null;
  notice?: string | null;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onSelectRestaurant: (restaurantId: number) => void;
  onRememberToggle: () => void;
  onSelectLanguage: (language: Language) => void;
  onSubmit: () => void;
  onForgotPassword: () => void;
  onToggleMode: () => void;
  onBackToLanding?: () => void;
};

export function AuthForm(props: AuthFormProps) {
  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
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
  const isForgotPasswordDisabled = props.isSubmitting || props.forgotPasswordCooldownSeconds > 0;
  const forgotPasswordLabel =
    props.forgotPasswordCooldownSeconds > 0
      ? `${props.text.auth.forgotPassword} (${props.forgotPasswordCooldownSeconds}s)`
      : props.text.auth.forgotPassword;

  return (
    <View style={styles.card}>
      <Image
        source={require('../../../assets/ZHAO-元素element/logo/1.png')}
        style={styles.logo}
        resizeMode="contain"
      />


      <View style={styles.authLanguageRow}>
        <Pressable
          style={[
            styles.authLanguageChip,
            props.language === 'fr' && styles.authLanguageChipActive,
          ]}
          onPress={() => props.onSelectLanguage('fr')}
        >
          <Text style={styles.authLanguageChipText}>{props.text.drawer.fr}</Text>
        </Pressable>
        <Pressable
          style={[
            styles.authLanguageChip,
            props.language === 'zh' && styles.authLanguageChipActive,
          ]}
          onPress={() => props.onSelectLanguage('zh')}
        >
          <Text style={styles.authLanguageChipText}>{props.text.drawer.zh}</Text>
        </Pressable>
      </View>

      {props.mode === 'register' ? (
        <>
          <View
            style={[
              styles.passwordWrapper,
              nameFocused && styles.inputFocused,
            ]}
          >
            <TextInput
              autoCapitalize="words"
              placeholder={props.text.auth.namePlaceholder}
              placeholderTextColor="#7f8a8a"
              style={styles.passwordInput}
              value={props.name}
              onChangeText={props.onNameChange}
              onFocus={() => setNameFocused(true)}
              onBlur={() => setNameFocused(false)}
            />
          </View>

          <Text style={styles.uploadFieldTitle}>{props.text.auth.restaurantLabel}</Text>
          <View style={styles.restaurantSelectWrap}>
            <Pressable
              style={styles.restaurantSelectTrigger}
              onPress={() => setIsRestaurantListOpen((currentValue) => !currentValue)}
            >
              <Text style={styles.restaurantSelectTriggerText}>
                {selectedRestaurant?.name ?? props.text.auth.restaurantPlaceholder}
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
            <Text style={styles.error}>{props.text.auth.restaurantRequired}</Text>
          ) : null}
        </>
      ) : null}

      <Text style={styles.uploadFieldTitle}>Email</Text>
      <View
        style={[
          styles.passwordWrapper,
          emailFocused && styles.inputFocused,
        ]}
      >
        <TextInput
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          placeholder={props.text.auth.emailPlaceholder}
          placeholderTextColor="#7f8a8a"
          style={styles.passwordInput}
          value={props.email}
          onChangeText={props.onEmailChange}
          onFocus={() => setEmailFocused(true)}
          onBlur={() => setEmailFocused(false)}
        />
      </View>

      <Text style={styles.uploadFieldTitle}>{props.text.auth.passwordPlaceholder}</Text>
      <View
        style={[
          styles.passwordWrapper,
          passwordFocused && styles.inputFocused
        ]}
      >
        <TextInput
          autoCapitalize="none"
          secureTextEntry={!passwordVisible}
          placeholder={props.text.auth.passwordPlaceholder}
          placeholderTextColor="#7f8a8a"
          style={styles.passwordInput}
          value={props.password}
          onChangeText={props.onPasswordChange}
          onFocus={() => setPasswordFocused(true)}
          onBlur={() => setPasswordFocused(false)}
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
          <Pressable style={styles.rememberRow} onPress={props.onRememberToggle}>
            <View
              style={[styles.rememberBox, props.rememberMe && styles.rememberBoxActive]}
            >
              {props.rememberMe ? <Text style={styles.rememberCheck}>✓</Text> : null}
            </View>
            <Text style={styles.rememberLabel}>{props.text.auth.rememberMe}</Text>
          </Pressable>

          <Pressable disabled={isForgotPasswordDisabled} onPress={props.onForgotPassword}>
            <Text style={[styles.forgotText, isForgotPasswordDisabled && styles.forgotTextDisabled]}>
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
          isSubmitDisabled ? styles.primaryButtonDisabled : styles.primaryButtonActive,
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
        <Pressable disabled={props.isSubmitting} style={styles.linkButton} onPress={props.onBackToLanding}>
          <Text style={styles.linkText}>{props.text.landing.backButton}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
