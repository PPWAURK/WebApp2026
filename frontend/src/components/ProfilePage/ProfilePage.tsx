import * as DocumentPicker from 'expo-document-picker';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  Image,
  Pressable,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { COLORS } from '../../constants/colors';
import type { AppText } from '../../locales/translations';
import { updateMyProfile, uploadMyProfilePhoto } from '../../services/usersApi';
import { styles } from './ProfilePage.styles';
import type { User } from '../../types/auth';

type ProfileNameDraft = {
  firstName: string;
  lastName: string;
};

function splitProfileName(name: string | null): ProfileNameDraft {
  const normalizedName = name?.trim() ?? '';

  if (!normalizedName) {
    return {
      firstName: '',
      lastName: '',
    };
  }

  const parts = normalizedName.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return {
      firstName: parts[0],
      lastName: '',
    };
  }

  return {
    lastName: parts[0],
    firstName: parts.slice(1).join(' '),
  };
}

type ProfilePageProps = {
  text: AppText;
  user: User;
  accessToken: string;
  isUploadingPhoto: boolean;
  error: string | null;
  onUploadStart: () => void;
  onUploadFinish: () => void;
  onUploadError: (message: string) => void;
  onUserUpdate: (user: User) => void;
};

function getProfileInitials(user: User, fallbackName: string): string {
  const source = user.name?.trim() || fallbackName || user.email;
  const parts = source
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return 'U';
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

export function ProfilePage({
  text,
  user,
  accessToken,
  isUploadingPhoto,
  error,
  onUploadStart,
  onUploadFinish,
  onUploadError,
  onUserUpdate,
}: ProfilePageProps) {
  const { width } = useWindowDimensions();
  const isWideLayout = width >= 980;
  const [firstNameDraft, setFirstNameDraft] = useState(
    () => splitProfileName(user.name).firstName,
  );
  const [lastNameDraft, setLastNameDraft] = useState(
    () => splitProfileName(user.name).lastName,
  );
  const [nameError, setNameError] = useState<string | null>(null);
  const [isSavingName, setIsSavingName] = useState(false);

  useEffect(() => {
    const nextDraft = splitProfileName(user.name);
    setFirstNameDraft(nextDraft.firstName);
    setLastNameDraft(nextDraft.lastName);
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
      const nextUser = await uploadMyProfilePhoto(accessToken, {
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType ?? undefined,
        file: asset.file,
      });

      onUserUpdate(nextUser);
    } catch {
      onUploadError(text.profile.uploadError);
    } finally {
      onUploadFinish();
    }
  }

  async function handleSaveName() {
    const normalizedName = [lastNameDraft.trim(), firstNameDraft.trim()]
      .filter((value) => value.length > 0)
      .join(' ');

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
      const nextUser = await updateMyProfile(accessToken, {
        name: normalizedName,
      });

      onUserUpdate(nextUser);
    } catch {
      setNameError(text.profile.nameUpdateError);
    } finally {
      setIsSavingName(false);
    }
  }

  const roleLabel = text.dashboard.roleValues[user.role];
  const workplaceLabel = text.dashboard.workplaceValues[user.workplaceRole];
  const canEditName = user.role === 'ADMIN';
  const probationLabel = user.isOnProbation
    ? text.dashboard.yes
    : text.dashboard.no;
  const restaurantLabel = user.restaurant?.name ?? text.profile.noRestaurant;
  const addressLabel = user.restaurant?.address ?? text.profile.noAddress;
  const displayName = user.name ?? text.dashboard.fallbackName;
  const trainingAccessLabels = user.trainingAccess.map(
    (section) => text.taxonomy.sections[section],
  );
  const overviewItems: Array<{
    key: string;
    label: string;
    value: string;
    icon: keyof typeof Ionicons.glyphMap;
  }> = [
    {
      key: 'role',
      label: text.dashboard.role,
      value: roleLabel,
      icon: 'shield-outline',
    },
    {
      key: 'workplace',
      label: text.dashboard.workplace,
      value: workplaceLabel,
      icon: 'briefcase-outline',
    },
    {
      key: 'restaurant',
      label: text.profile.restaurantLabel,
      value: restaurantLabel,
      icon: 'business-outline',
    },
    {
      key: 'probation',
      label: text.dashboard.probation,
      value: probationLabel,
      icon: user.isOnProbation
        ? 'hourglass-outline'
        : 'checkmark-circle-outline',
    },
  ];
  const detailItems: Array<{
    key: string;
    label: string;
    value: string;
    icon: keyof typeof Ionicons.glyphMap;
  }> = [
    {
      key: 'id',
      label: text.profile.userIdLabel,
      value: String(user.id),
      icon: 'finger-print-outline',
    },
    {
      key: 'name',
      label: text.profile.nameLabel,
      value: displayName,
      icon: 'person-outline',
    },
    {
      key: 'email',
      label: text.profile.emailLabel,
      value: user.email,
      icon: 'mail-outline',
    },
    {
      key: 'restaurant',
      label: text.profile.restaurantLabel,
      value: restaurantLabel,
      icon: 'business-outline',
    },
    {
      key: 'address',
      label: text.profile.addressLabel,
      value: addressLabel,
      icon: 'location-outline',
    },
  ];

  return (
    <View style={styles.pageStack}>
      <View style={[styles.heroCard, isWideLayout && styles.heroCardWide]}>
        <View
          style={[styles.heroIdentity, isWideLayout && styles.heroIdentityWide]}
        >
          <View style={styles.avatarFrame}>
            {user.profilePhoto ? (
              <Image
                source={{ uri: user.profilePhoto }}
                style={styles.profileAvatarImage}
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.profileAvatarFallback}>
                {getProfileInitials(user, text.dashboard.fallbackName)}
              </Text>
            )}
          </View>

          <View style={styles.heroIdentityText}>
            <Text style={styles.eyebrow}>{text.profile.title}</Text>
            <Text style={styles.heroTitle}>{displayName}</Text>
            <Text style={styles.heroSubtitle}>{text.profile.subtitle}</Text>
            <Text style={styles.heroMeta}>{user.email}</Text>

            <View style={styles.heroChipRow}>
              <View style={styles.heroChip}>
                <Text style={styles.heroChipText}>{roleLabel}</Text>
              </View>
              <View style={styles.heroChip}>
                <Text style={styles.heroChipText}>{workplaceLabel}</Text>
              </View>
              <View style={styles.heroChip}>
                <Text style={styles.heroChipText}>{restaurantLabel}</Text>
              </View>
            </View>
          </View>
        </View>

        <View
          style={[styles.overviewGrid, isWideLayout && styles.overviewGridWide]}
        >
          {overviewItems.map((item) => (
            <View key={item.key} style={styles.overviewCard}>
              <View style={styles.overviewIconWrap}>
                <Ionicons
                  name={item.icon}
                  size={16}
                  color={COLORS.brandPrimary}
                />
              </View>
              <Text style={styles.overviewLabel}>{item.label}</Text>
              <Text style={styles.overviewValue}>{item.value}</Text>
            </View>
          ))}
        </View>
      </View>

      <View
        style={[styles.contentLayout, isWideLayout && styles.contentLayoutWide]}
      >
        <View
          style={[
            styles.primaryColumn,
            isWideLayout && styles.primaryColumnWide,
          ]}
        >
          <View style={styles.panel}>
            <View style={styles.panelHeader}>
              <View style={styles.panelTitleWrap}>
                <Text style={styles.panelEyebrow}>{text.profile.title}</Text>
                <Text style={styles.panelTitle}>
                  {text.profile.uploadPhotoButton}
                </Text>
              </View>
              <View style={styles.panelIconBadge}>
                <Ionicons
                  name="camera-outline"
                  size={18}
                  color={COLORS.brandPrimary}
                />
              </View>
            </View>

            <Text style={styles.panelDescription}>{text.profile.subtitle}</Text>

            <Pressable
              style={[
                styles.primaryButton,
                isUploadingPhoto && styles.buttonDisabled,
              ]}
              disabled={isUploadingPhoto}
              onPress={() => {
                void handlePickAndUploadPhoto();
              }}
              accessibilityRole="button"
              accessibilityLabel={text.profile.uploadPhotoButton}
              accessibilityState={{ disabled: isUploadingPhoto }}
            >
              <Ionicons
                name="cloud-upload-outline"
                size={16}
                color={COLORS.textOnDark}
              />
              <Text style={styles.primaryButtonText}>
                {isUploadingPhoto
                  ? text.profile.uploadingPhoto
                  : text.profile.uploadPhotoButton}
              </Text>
            </Pressable>

            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>

          <View style={styles.panel}>
            <View style={styles.panelHeader}>
              <View style={styles.panelTitleWrap}>
                <Text style={styles.panelEyebrow}>
                  {text.profile.nameLabel}
                </Text>
                <Text style={styles.panelTitle}>{displayName}</Text>
              </View>
              <View style={styles.panelIconBadge}>
                <Ionicons
                  name="create-outline"
                  size={18}
                  color={COLORS.brandPrimary}
                />
              </View>
            </View>

            {canEditName ? (
              <View style={styles.nameEditorBlock}>
                <Text style={styles.nameInputLabel}>
                  {text.profile.lastNameLabel}
                </Text>
                <TextInput
                  style={styles.nameInput}
                  value={lastNameDraft}
                  onChangeText={setLastNameDraft}
                  placeholder={text.profile.lastNamePlaceholder}
                  placeholderTextColor={COLORS.placeholderAlt}
                  autoCapitalize="words"
                  autoCorrect={false}
                  editable={!isSavingName}
                  accessibilityLabel={text.profile.lastNameLabel}
                />
                <Text style={styles.nameInputLabel}>
                  {text.profile.firstNameLabel}
                </Text>
                <TextInput
                  style={styles.nameInput}
                  value={firstNameDraft}
                  onChangeText={setFirstNameDraft}
                  placeholder={text.profile.firstNamePlaceholder}
                  placeholderTextColor={COLORS.placeholderAlt}
                  autoCapitalize="words"
                  autoCorrect={false}
                  editable={!isSavingName}
                  accessibilityLabel={text.profile.firstNameLabel}
                />
                <Pressable
                  style={[
                    styles.secondaryButton,
                    isSavingName && styles.buttonDisabled,
                  ]}
                  disabled={isSavingName}
                  onPress={() => {
                    void handleSaveName();
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={text.profile.saveNameButton}
                  accessibilityState={{ disabled: isSavingName }}
                >
                  <Text style={styles.secondaryButtonText}>
                    {isSavingName
                      ? text.profile.savingName
                      : text.profile.saveNameButton}
                  </Text>
                </Pressable>
                {nameError ? (
                  <Text style={styles.error}>{nameError}</Text>
                ) : null}
              </View>
            ) : (
              <View style={styles.infoNotice}>
                <Text style={styles.infoNoticeTitle}>
                  {text.profile.nameLabel}
                </Text>
                <Text style={styles.infoNoticeBody}>{displayName}</Text>
                <Text style={styles.infoNoticeHint}>
                  {text.profile.nameEditRestricted}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View
          style={[
            styles.secondaryColumn,
            isWideLayout && styles.secondaryColumnWide,
          ]}
        >
          <View style={styles.panel}>
            <View style={styles.panelHeader}>
              <View style={styles.panelTitleWrap}>
                <Text style={styles.panelEyebrow}>
                  {text.profile.userInfoTitle}
                </Text>
                <Text style={styles.panelTitle}>
                  {text.profile.userInfoTitle}
                </Text>
              </View>
              <View style={styles.panelIconBadge}>
                <Ionicons
                  name="person-outline"
                  size={18}
                  color={COLORS.brandPrimary}
                />
              </View>
            </View>

            <View style={styles.detailList}>
              {detailItems.map((item) => (
                <View key={item.key} style={styles.detailRow}>
                  <View style={styles.detailIconWrap}>
                    <Ionicons
                      name={item.icon}
                      size={16}
                      color={COLORS.brandPrimary}
                    />
                  </View>
                  <View style={styles.detailTextWrap}>
                    <Text style={styles.detailLabel}>{item.label}</Text>
                    <Text style={styles.detailValue}>{item.value}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.panel}>
            <View style={styles.panelHeader}>
              <View style={styles.panelTitleWrap}>
                <Text style={styles.panelEyebrow}>
                  {text.profile.trainingAccessLabel}
                </Text>
                <Text style={styles.panelTitle}>
                  {text.profile.trainingAccessLabel}
                </Text>
              </View>
              <View style={styles.panelIconBadge}>
                <Ionicons
                  name="school-outline"
                  size={18}
                  color={COLORS.brandPrimary}
                />
              </View>
            </View>

            {trainingAccessLabels.length > 0 ? (
              <View style={styles.accessChipRow}>
                {trainingAccessLabels.map((label) => (
                  <View key={label} style={styles.accessChip}>
                    <Text style={styles.accessChipText}>{label}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>-</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}
