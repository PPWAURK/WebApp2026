import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, TextInput, View } from 'react-native';
import type { AppText } from '../../locales/translations';
import { styles } from './ResetPasswordForm.styles';

type ResetPasswordFormProps = {
  text: AppText;
  password: string;
  isSubmitting: boolean;
  error: string | null;
  notice: string | null;
  hasToken: boolean;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
  onBackToLogin: () => void;
};

export function ResetPasswordForm({
  text,
  password,
  isSubmitting,
  error,
  notice,
  hasToken,
  onPasswordChange,
  onSubmit,
  onBackToLogin,
}: ResetPasswordFormProps) {
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  const canSubmit = hasToken && password.trim().length >= 8 && !isSubmitting;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{text.auth.resetPasswordTitle}</Text>
      <Text style={styles.subtitle}>{text.auth.resetPasswordSubtitle}</Text>

      {!hasToken ? <Text style={styles.error}>{text.auth.resetTokenMissing}</Text> : null}

      <Text style={styles.label}>{text.auth.newPasswordLabel}</Text>
      <View style={[styles.inputWrap, passwordFocused && styles.inputFocused]}>
        <TextInput
          autoCapitalize="none"
          secureTextEntry={!passwordVisible}
          placeholder={text.auth.newPasswordPlaceholder}
          placeholderTextColor="#7f8a8a"
          style={styles.input}
          value={password}
          onChangeText={onPasswordChange}
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

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {notice ? <Text style={styles.notice}>{notice}</Text> : null}

      <Pressable
        disabled={!canSubmit}
        style={[styles.primaryButton, !canSubmit && styles.primaryButtonDisabled]}
        onPress={onSubmit}
      >
        <Text style={styles.primaryButtonText}>
          {isSubmitting ? text.auth.loading : text.auth.resetPasswordButton}
        </Text>
      </Pressable>

      <Pressable style={styles.linkButton} onPress={onBackToLogin}>
        <Text style={styles.linkText}>{text.auth.backToLogin}</Text>
      </Pressable>
    </View>
  );
}
