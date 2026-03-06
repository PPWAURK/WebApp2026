"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthForm = AuthForm;
const react_1 = require("react");
const vector_icons_1 = require("@expo/vector-icons");
const react_native_1 = require("react-native");
const AuthForm_styles_1 = require("./AuthForm.styles");
const DECOR_ITEMS = [
    {
        key: 'pattern-1',
        source: require('../../../assets/四大天王/IMG_9278.png'),
        small: { x: 13, y: 6, width: 80, height: 80, opacity: 0.5 },
        tablet: { x: 11, y: 10, width: 180, height: 100, opacity: 0.75 },
        desktop: { x: 5, y: 5, width: 250, height: 120, opacity: 0.75 },
    },
    {
        key: 'pattern-3',
        source: require('../../../assets/四大天王/IMG_9276.png'),
        small: { x: 50, y: 95, width: 75, height: 70, opacity: 0.5 },
        tablet: { x: 50, y: 92, width: 100, height: 120, opacity: 0.65 },
        desktop: { x: 98, y: 95, width: 150, height: 120, opacity: 0.75 },
    },
];
function AuthForm(props) {
    const [isRestaurantListOpen, setIsRestaurantListOpen] = (0, react_1.useState)(false);
    const [passwordVisible, setPasswordVisible] = (0, react_1.useState)(false);
    const selectedRestaurant = props.restaurants.find((restaurant) => restaurant.id === props.selectedRestaurantId) ?? null;
    const hasEmail = props.email.trim().length > 0;
    const hasPassword = props.password.trim().length > 0;
    const hasName = props.name.trim().length > 0;
    const hasRestaurant = props.selectedRestaurantId !== null;
    const isFormValid = props.mode === 'login'
        ? hasEmail && hasPassword
        : hasName && hasEmail && hasPassword && hasRestaurant;
    const isSubmitDisabled = props.isSubmitting || !isFormValid;
    const isForgotPasswordDisabled = props.isSubmitting || props.forgotPasswordCooldownSeconds > 0;
    const forgotPasswordLabel = props.forgotPasswordCooldownSeconds > 0
        ? `${props.text.auth.forgotPassword} (${props.forgotPasswordCooldownSeconds}s)`
        : props.text.auth.forgotPassword;
    const { width } = (0, react_native_1.useWindowDimensions)();
    const isSmall = width < 520;
    const isTablet = width >= 520 && width < 960;
    const decorPreset = isSmall ? 'small' : isTablet ? 'tablet' : 'desktop';
    return (<react_native_1.View style={AuthForm_styles_1.styles.card}>
      <react_native_1.View style={AuthForm_styles_1.styles.decorLayer} pointerEvents="none">
        {DECOR_ITEMS.map((item) => {
            const layout = item[decorPreset];
            return (<react_native_1.Image key={item.key} source={item.source} resizeMode="contain" style={[
                    AuthForm_styles_1.styles.decorImage,
                    {
                        left: `${layout.x}%`,
                        top: `${layout.y}%`,
                        width: layout.width,
                        height: layout.height,
                        marginLeft: -layout.width / 2,
                        marginTop: -layout.height / 2,
                        opacity: layout.opacity,
                    },
                ]}/>);
        })}
      </react_native_1.View>
      <react_native_1.Image source={require('../../../assets/ZHAO-元素element/logo/1.png')} style={AuthForm_styles_1.styles.logo} resizeMode="contain"/>

      <react_native_1.Text style={AuthForm_styles_1.styles.title}>{props.title}</react_native_1.Text>

      <react_native_1.View style={AuthForm_styles_1.styles.authLanguageRow}>
        <react_native_1.Pressable style={[
            AuthForm_styles_1.styles.authLanguageChip,
            props.language === 'fr' && AuthForm_styles_1.styles.authLanguageChipActive,
        ]} onPress={() => props.onSelectLanguage('fr')}>
          <react_native_1.Text style={AuthForm_styles_1.styles.authLanguageChipText}>
            {props.text.drawer.fr}
          </react_native_1.Text>
        </react_native_1.Pressable>
        <react_native_1.Pressable style={[
            AuthForm_styles_1.styles.authLanguageChip,
            props.language === 'zh' && AuthForm_styles_1.styles.authLanguageChipActive,
        ]} onPress={() => props.onSelectLanguage('zh')}>
          <react_native_1.Text style={AuthForm_styles_1.styles.authLanguageChipText}>
            {props.text.drawer.zh}
          </react_native_1.Text>
        </react_native_1.Pressable>
      </react_native_1.View>

      {props.mode === 'register' ? (<>
          <react_native_1.Text style={AuthForm_styles_1.styles.uploadFieldTitle}>
            {props.text.auth.namePlaceholder}
          </react_native_1.Text>
          <react_native_1.View style={AuthForm_styles_1.styles.passwordWrapper}>
            <react_native_1.TextInput autoCapitalize="words" autoComplete="off" autoCorrect={false} spellCheck={false} importantForAutofill="no" selectionColor="#ab1e24" placeholder={props.text.auth.namePlaceholder} placeholderTextColor="#7f8a8a" style={AuthForm_styles_1.styles.passwordInput} value={props.name} onChangeText={props.onNameChange}/>
          </react_native_1.View>

          <react_native_1.Text style={AuthForm_styles_1.styles.uploadFieldTitle}>
            {props.text.auth.restaurantLabel}
          </react_native_1.Text>
          <react_native_1.View style={AuthForm_styles_1.styles.restaurantSelectWrap}>
            <react_native_1.Pressable style={AuthForm_styles_1.styles.restaurantSelectTrigger} onPress={() => setIsRestaurantListOpen((currentValue) => !currentValue)}>
              <react_native_1.Text style={AuthForm_styles_1.styles.restaurantSelectTriggerText}>
                {selectedRestaurant?.name ??
                props.text.auth.restaurantPlaceholder}
              </react_native_1.Text>
              <react_native_1.Text style={AuthForm_styles_1.styles.restaurantSelectChevron}>
                {isRestaurantListOpen ? '▲' : '▼'}
              </react_native_1.Text>
            </react_native_1.Pressable>

            {isRestaurantListOpen ? (<react_native_1.View style={AuthForm_styles_1.styles.restaurantSelectList}>
                {props.restaurants.map((restaurant) => (<react_native_1.Pressable key={restaurant.id} style={[
                        AuthForm_styles_1.styles.restaurantSelectItem,
                        props.selectedRestaurantId === restaurant.id &&
                            AuthForm_styles_1.styles.restaurantSelectItemActive,
                    ]} onPress={() => {
                        props.onSelectRestaurant(restaurant.id);
                        setIsRestaurantListOpen(false);
                    }}>
                    <react_native_1.Text style={[
                        AuthForm_styles_1.styles.restaurantSelectItemText,
                        props.selectedRestaurantId === restaurant.id &&
                            AuthForm_styles_1.styles.restaurantSelectItemTextActive,
                    ]}>
                      {restaurant.name}
                    </react_native_1.Text>
                  </react_native_1.Pressable>))}
              </react_native_1.View>) : null}
          </react_native_1.View>

          {props.restaurants.length === 0 ? (<react_native_1.Text style={AuthForm_styles_1.styles.error}>
              {props.text.auth.restaurantRequired}
            </react_native_1.Text>) : null}
        </>) : null}

      <react_native_1.Text style={AuthForm_styles_1.styles.uploadFieldTitle}>Email</react_native_1.Text>
      <react_native_1.View style={AuthForm_styles_1.styles.passwordWrapper}>
        <react_native_1.TextInput autoCapitalize="none" autoComplete="off" autoCorrect={false} spellCheck={false} importantForAutofill="no" keyboardType="email-address" selectionColor="#ab1e24" placeholder={props.text.auth.emailPlaceholder} placeholderTextColor="#7f8a8a" style={AuthForm_styles_1.styles.passwordInput} value={props.email} onChangeText={props.onEmailChange}/>
      </react_native_1.View>

      <react_native_1.Text style={AuthForm_styles_1.styles.uploadFieldTitle}>
        {props.text.auth.passwordPlaceholder}
      </react_native_1.Text>
      <react_native_1.View style={AuthForm_styles_1.styles.passwordWrapper}>
        <react_native_1.TextInput autoCapitalize="none" autoComplete="off" autoCorrect={false} spellCheck={false} importantForAutofill="no" secureTextEntry={!passwordVisible} selectionColor="#ab1e24" placeholder={props.text.auth.passwordPlaceholder} placeholderTextColor="#7f8a8a" style={AuthForm_styles_1.styles.passwordInput} value={props.password} onChangeText={props.onPasswordChange}/>
        <react_native_1.Pressable style={AuthForm_styles_1.styles.eyeButton} onPress={() => setPasswordVisible((current) => !current)}>
          <vector_icons_1.Ionicons name={passwordVisible ? 'eye-off-outline' : 'eye-outline'} size={18} color="#ab1e24"/>
        </react_native_1.Pressable>
      </react_native_1.View>

      {props.mode === 'login' ? (<react_native_1.View style={AuthForm_styles_1.styles.optionsRow}>
          <react_native_1.Pressable style={AuthForm_styles_1.styles.rememberRow} onPress={props.onRememberToggle}>
            <react_native_1.View style={[
                AuthForm_styles_1.styles.rememberBox,
                props.rememberMe && AuthForm_styles_1.styles.rememberBoxActive,
            ]}>
              {props.rememberMe ? (<react_native_1.Text style={AuthForm_styles_1.styles.rememberCheck}>✓</react_native_1.Text>) : null}
            </react_native_1.View>
            <react_native_1.Text style={AuthForm_styles_1.styles.rememberLabel}>
              {props.text.auth.rememberMe}
            </react_native_1.Text>
          </react_native_1.Pressable>

          <react_native_1.Pressable disabled={isForgotPasswordDisabled} onPress={props.onForgotPassword}>
            <react_native_1.Text style={[
                AuthForm_styles_1.styles.forgotText,
                isForgotPasswordDisabled && AuthForm_styles_1.styles.forgotTextDisabled,
            ]}>
              {forgotPasswordLabel}
            </react_native_1.Text>
          </react_native_1.Pressable>
        </react_native_1.View>) : null}

      {props.error ? <react_native_1.Text style={AuthForm_styles_1.styles.error}>{props.error}</react_native_1.Text> : null}
      {props.notice ? <react_native_1.Text style={AuthForm_styles_1.styles.notice}>{props.notice}</react_native_1.Text> : null}

      <react_native_1.Pressable disabled={isSubmitDisabled} style={[
            AuthForm_styles_1.styles.primaryButton,
            isSubmitDisabled
                ? AuthForm_styles_1.styles.primaryButtonDisabled
                : AuthForm_styles_1.styles.primaryButtonActive,
            props.isSubmitting && AuthForm_styles_1.styles.buttonDisabled,
        ]} onPress={props.onSubmit}>
        <react_native_1.Text style={AuthForm_styles_1.styles.primaryButtonText}>
          {props.isSubmitting
            ? props.text.auth.loading
            : props.mode === 'login'
                ? props.text.auth.loginButton
                : props.text.auth.registerButton}
        </react_native_1.Text>
      </react_native_1.Pressable>

      <react_native_1.Pressable disabled={props.isSubmitting} style={AuthForm_styles_1.styles.linkButton} onPress={props.onToggleMode}>
        <react_native_1.Text style={AuthForm_styles_1.styles.linkText}>
          {props.mode === 'login'
            ? props.text.auth.switchToRegister
            : props.text.auth.switchToLogin}
        </react_native_1.Text>
      </react_native_1.Pressable>

      {props.onBackToLanding ? (<react_native_1.Pressable disabled={props.isSubmitting} style={AuthForm_styles_1.styles.linkButton} onPress={props.onBackToLanding}>
          <react_native_1.Text style={AuthForm_styles_1.styles.linkText}>{props.text.landing.backButton}</react_native_1.Text>
        </react_native_1.Pressable>) : null}
    </react_native_1.View>);
}
//# sourceMappingURL=AuthForm.js.map