import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, TextInput, View } from 'react-native';
import { COLORS } from '../../constants/colors';
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
  const [passwordVisible, setPasswordVisible] = useState(false);

  const canSubmit = hasToken && password.trim().length >= 8 && !isSubmitting;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{text.auth.resetPasswordTitle}</Text>
      <Text style={styles.subtitle}>{text.auth.resetPasswordSubtitle}</Text>

      {!hasToken ? (
        <Text style={styles.error}>{text.auth.resetTokenMissing}</Text>
      ) : null}

      <Text style={styles.label}>{text.auth.newPasswordLabel}</Text>
      <View style={styles.inputWrap}>
        <TextInput
          autoCapitalize="none"
          autoComplete="off"
          autoCorrect={false}
          spellCheck={false}
          importantForAutofill="no"
          secureTextEntry={!passwordVisible}
          selectionColor={COLORS.brandPrimary}
          placeholder={text.auth.newPasswordPlaceholder}
          placeholderTextColor={COLORS.textMutedCool}
          style={styles.input}
          value={password}
          onChangeText={onPasswordChange}
        />
        <Pressable
          style={styles.eyeButton}
          onPress={() => setPasswordVisible((current) => !current)}
        >
          <Ionicons
            name={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
            size={18}
            color={COLORS.brandPrimary}
          />
        </Pressable>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {notice ? <Text style={styles.notice}>{notice}</Text> : null}

      <Pressable
        disabled={!canSubmit}
        style={[
          styles.primaryButton,
          !canSubmit && styles.primaryButtonDisabled,
        ]}
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
