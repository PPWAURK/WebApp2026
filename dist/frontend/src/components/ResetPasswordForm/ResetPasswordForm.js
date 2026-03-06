"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResetPasswordForm = ResetPasswordForm;
const react_1 = require("react");
const vector_icons_1 = require("@expo/vector-icons");
const react_native_1 = require("react-native");
const ResetPasswordForm_styles_1 = require("./ResetPasswordForm.styles");
function ResetPasswordForm({ text, password, isSubmitting, error, notice, hasToken, onPasswordChange, onSubmit, onBackToLogin, }) {
    const [passwordVisible, setPasswordVisible] = (0, react_1.useState)(false);
    const canSubmit = hasToken && password.trim().length >= 8 && !isSubmitting;
    return (<react_native_1.View style={ResetPasswordForm_styles_1.styles.card}>
      <react_native_1.Text style={ResetPasswordForm_styles_1.styles.title}>{text.auth.resetPasswordTitle}</react_native_1.Text>
      <react_native_1.Text style={ResetPasswordForm_styles_1.styles.subtitle}>{text.auth.resetPasswordSubtitle}</react_native_1.Text>

      {!hasToken ? (<react_native_1.Text style={ResetPasswordForm_styles_1.styles.error}>{text.auth.resetTokenMissing}</react_native_1.Text>) : null}

      <react_native_1.Text style={ResetPasswordForm_styles_1.styles.label}>{text.auth.newPasswordLabel}</react_native_1.Text>
      <react_native_1.View style={ResetPasswordForm_styles_1.styles.inputWrap}>
        <react_native_1.TextInput autoCapitalize="none" autoComplete="off" autoCorrect={false} spellCheck={false} importantForAutofill="no" secureTextEntry={!passwordVisible} selectionColor="#ab1e24" placeholder={text.auth.newPasswordPlaceholder} placeholderTextColor="#7f8a8a" style={ResetPasswordForm_styles_1.styles.input} value={password} onChangeText={onPasswordChange}/>
        <react_native_1.Pressable style={ResetPasswordForm_styles_1.styles.eyeButton} onPress={() => setPasswordVisible((current) => !current)}>
          <vector_icons_1.Ionicons name={passwordVisible ? 'eye-off-outline' : 'eye-outline'} size={18} color="#ab1e24"/>
        </react_native_1.Pressable>
      </react_native_1.View>

      {error ? <react_native_1.Text style={ResetPasswordForm_styles_1.styles.error}>{error}</react_native_1.Text> : null}
      {notice ? <react_native_1.Text style={ResetPasswordForm_styles_1.styles.notice}>{notice}</react_native_1.Text> : null}

      <react_native_1.Pressable disabled={!canSubmit} style={[
            ResetPasswordForm_styles_1.styles.primaryButton,
            !canSubmit && ResetPasswordForm_styles_1.styles.primaryButtonDisabled,
        ]} onPress={onSubmit}>
        <react_native_1.Text style={ResetPasswordForm_styles_1.styles.primaryButtonText}>
          {isSubmitting ? text.auth.loading : text.auth.resetPasswordButton}
        </react_native_1.Text>
      </react_native_1.Pressable>

      <react_native_1.Pressable style={ResetPasswordForm_styles_1.styles.linkButton} onPress={onBackToLogin}>
        <react_native_1.Text style={ResetPasswordForm_styles_1.styles.linkText}>{text.auth.backToLogin}</react_native_1.Text>
      </react_native_1.Pressable>
    </react_native_1.View>);
}
//# sourceMappingURL=ResetPasswordForm.js.map