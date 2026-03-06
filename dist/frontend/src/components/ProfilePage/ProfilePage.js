"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfilePage = ProfilePage;
const DocumentPicker = __importStar(require("expo-document-picker"));
const react_1 = require("react");
const react_native_1 = require("react-native");
const usersApi_1 = require("../../services/usersApi");
const ProfilePage_styles_1 = require("./ProfilePage.styles");
function ProfilePage({ text, user, accessToken, isUploadingPhoto, error, onUploadStart, onUploadFinish, onUploadError, onUserUpdate, }) {
    const [nameDraft, setNameDraft] = (0, react_1.useState)(user.name ?? '');
    const [nameError, setNameError] = (0, react_1.useState)(null);
    const [isSavingName, setIsSavingName] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        setNameDraft(user.name ?? '');
    }, [user.name]);
    async function handlePickAndUploadPhoto() {
        const result = await DocumentPicker.getDocumentAsync({
            type: 'image/*',
            copyToCacheDirectory: true,
            multiple: false,
        });
        if (result.canceled || result.assets.length === 0) {
            return;
        }
        const asset = result.assets[0];
        onUploadStart();
        try {
            const nextUser = await (0, usersApi_1.uploadMyProfilePhoto)(accessToken, {
                uri: asset.uri,
                name: asset.name,
                mimeType: asset.mimeType ?? undefined,
                file: asset.file,
            });
            onUserUpdate(nextUser);
        }
        catch {
            onUploadError(text.profile.uploadError);
        }
        finally {
            onUploadFinish();
        }
    }
    async function handleSaveName() {
        const normalizedName = nameDraft.trim();
        if (!normalizedName) {
            setNameError(text.profile.nameUpdateError);
            return;
        }
        if (normalizedName === (user.name ?? '').trim()) {
            return;
        }
        setIsSavingName(true);
        setNameError(null);
        try {
            const nextUser = await (0, usersApi_1.updateMyProfile)(accessToken, {
                name: normalizedName,
            });
            onUserUpdate(nextUser);
        }
        catch {
            setNameError(text.profile.nameUpdateError);
        }
        finally {
            setIsSavingName(false);
        }
    }
    const roleLabel = text.dashboard.roleValues[user.role];
    const workplaceLabel = text.dashboard.workplaceValues[user.workplaceRole];
    return (<react_native_1.View style={ProfilePage_styles_1.styles.card}>
      <react_native_1.Text style={ProfilePage_styles_1.styles.title}>{text.profile.title}</react_native_1.Text>
      <react_native_1.Text style={ProfilePage_styles_1.styles.subtitle}>{text.profile.subtitle}</react_native_1.Text>

      <react_native_1.View style={ProfilePage_styles_1.styles.profileHeader}>
        <react_native_1.View style={ProfilePage_styles_1.styles.profileAvatarFrame}>
          {user.profilePhoto ? (<react_native_1.Image source={{ uri: user.profilePhoto }} style={ProfilePage_styles_1.styles.profileAvatarImage} resizeMode="cover"/>) : (<react_native_1.Text style={ProfilePage_styles_1.styles.profileAvatarFallback}>🙂</react_native_1.Text>)}
        </react_native_1.View>

        <react_native_1.View style={ProfilePage_styles_1.styles.profileHeaderMeta}>
          <react_native_1.Text style={ProfilePage_styles_1.styles.docItemTitle}>
            {user.name ?? text.dashboard.fallbackName}
          </react_native_1.Text>
          <react_native_1.Text style={ProfilePage_styles_1.styles.docItemMeta}>{user.email}</react_native_1.Text>
        </react_native_1.View>
      </react_native_1.View>

      <react_native_1.View style={ProfilePage_styles_1.styles.nameEditorBlock}>
        <react_native_1.Text style={ProfilePage_styles_1.styles.docBlockTitle}>{text.profile.nameLabel}</react_native_1.Text>
        <react_native_1.TextInput style={ProfilePage_styles_1.styles.nameInput} value={nameDraft} onChangeText={setNameDraft} placeholder={text.profile.nameEditPlaceholder} placeholderTextColor="#aa7a7e" autoCapitalize="words" autoCorrect={false} editable={!isSavingName}/>
        <react_native_1.Pressable style={[ProfilePage_styles_1.styles.primaryButton, isSavingName && ProfilePage_styles_1.styles.buttonDisabled]} disabled={isSavingName} onPress={() => {
            void handleSaveName();
        }}>
          <react_native_1.Text style={ProfilePage_styles_1.styles.primaryButtonText}>
            {isSavingName
            ? text.profile.savingName
            : text.profile.saveNameButton}
          </react_native_1.Text>
        </react_native_1.Pressable>
        {nameError ? <react_native_1.Text style={ProfilePage_styles_1.styles.error}>{nameError}</react_native_1.Text> : null}
      </react_native_1.View>

      <react_native_1.Pressable style={[
            ProfilePage_styles_1.styles.secondaryButton,
            isUploadingPhoto && ProfilePage_styles_1.styles.buttonDisabled,
        ]} disabled={isUploadingPhoto} onPress={() => {
            void handlePickAndUploadPhoto();
        }}>
        <react_native_1.Text style={ProfilePage_styles_1.styles.secondaryButtonText}>
          {isUploadingPhoto
            ? text.profile.uploadingPhoto
            : text.profile.uploadPhotoButton}
        </react_native_1.Text>
      </react_native_1.Pressable>

      {error ? <react_native_1.Text style={ProfilePage_styles_1.styles.error}>{error}</react_native_1.Text> : null}

      <react_native_1.View style={ProfilePage_styles_1.styles.docBlock}>
        <react_native_1.Text style={ProfilePage_styles_1.styles.docBlockTitle}>{text.profile.userInfoTitle}</react_native_1.Text>
        <react_native_1.Text style={ProfilePage_styles_1.styles.docItemMeta}>
          {text.profile.userIdLabel}: {user.id}
        </react_native_1.Text>
        <react_native_1.Text style={ProfilePage_styles_1.styles.docItemMeta}>
          {text.profile.nameLabel}: {user.name ?? '-'}
        </react_native_1.Text>
        <react_native_1.Text style={ProfilePage_styles_1.styles.docItemMeta}>
          {text.profile.emailLabel}: {user.email}
        </react_native_1.Text>
        <react_native_1.Text style={ProfilePage_styles_1.styles.docItemMeta}>
          {text.dashboard.role}: {roleLabel}
        </react_native_1.Text>
        <react_native_1.Text style={ProfilePage_styles_1.styles.docItemMeta}>
          {text.dashboard.workplace}: {workplaceLabel}
        </react_native_1.Text>
        <react_native_1.Text style={ProfilePage_styles_1.styles.docItemMeta}>
          {text.dashboard.probation}:{' '}
          {user.isOnProbation ? text.dashboard.yes : text.dashboard.no}
        </react_native_1.Text>
        <react_native_1.Text style={ProfilePage_styles_1.styles.docItemMeta}>
          {text.profile.restaurantLabel}:{' '}
          {user.restaurant?.name ?? text.profile.noRestaurant}
        </react_native_1.Text>
        <react_native_1.Text style={ProfilePage_styles_1.styles.docItemMeta}>
          {text.profile.addressLabel}:{' '}
          {user.restaurant?.address ?? text.profile.noAddress}
        </react_native_1.Text>
        <react_native_1.Text style={ProfilePage_styles_1.styles.docItemMeta}>
          {text.profile.trainingAccessLabel}:{' '}
          {user.trainingAccess.join(', ') || '-'}
        </react_native_1.Text>
      </react_native_1.View>
    </react_native_1.View>);
}
//# sourceMappingURL=ProfilePage.js.map