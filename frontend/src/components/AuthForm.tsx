import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { styles } from '../styles/appStyles';
import type { AuthMode, Restaurant } from '../types/auth';
import type { AppText } from '../locales/translations';
import type { Language } from '../types/language';

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
  error: string | null;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onSelectRestaurant: (restaurantId: number) => void;
  onRememberToggle: () => void;
  onSelectLanguage: (language: Language) => void;
  onSubmit: () => void;
  onToggleMode: () => void;
};

export function AuthForm(props: AuthFormProps) {
  const [isRestaurantListOpen, setIsRestaurantListOpen] = useState(false);
  const selectedRestaurant =
    props.restaurants.find(
      (restaurant) => restaurant.id === props.selectedRestaurantId,
    ) ?? null;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{props.title}</Text>

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
          <TextInput
            autoCapitalize="words"
            placeholder={props.text.auth.namePlaceholder}
            placeholderTextColor="#7f8a8a"
            style={styles.input}
            value={props.name}
            onChangeText={props.onNameChange}
          />

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

      <TextInput
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        placeholder={props.text.auth.emailPlaceholder}
        placeholderTextColor="#7f8a8a"
        style={styles.input}
        value={props.email}
        onChangeText={props.onEmailChange}
      />

      <TextInput
        autoCapitalize="none"
        secureTextEntry
        placeholder={props.text.auth.passwordPlaceholder}
        placeholderTextColor="#7f8a8a"
        style={styles.input}
        value={props.password}
        onChangeText={props.onPasswordChange}
      />

      {props.mode === 'login' ? (
        <Pressable style={styles.rememberRow} onPress={props.onRememberToggle}>
          <View
            style={[styles.rememberBox, props.rememberMe && styles.rememberBoxActive]}
          >
            {props.rememberMe ? <Text style={styles.rememberCheck}>✓</Text> : null}
          </View>
          <Text style={styles.rememberLabel}>{props.text.auth.rememberMe}</Text>
        </Pressable>
      ) : null}

      {props.error ? <Text style={styles.error}>{props.error}</Text> : null}

      <Pressable
        disabled={props.isSubmitting}
        style={[styles.primaryButton, props.isSubmitting && styles.buttonDisabled]}
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
    </View>
  );
}
