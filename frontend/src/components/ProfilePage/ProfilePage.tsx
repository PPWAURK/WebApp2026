import * as DocumentPicker from 'expo-document-picker';
import { useEffect, useState } from 'react';
import { Image, Pressable, Text, TextInput, View } from 'react-native';
import type { AppText } from '../../locales/translations';
import { updateMyProfile, uploadMyProfilePhoto } from '../../services/usersApi';
import { styles } from './ProfilePage.styles';
import type { User } from '../../types/auth';

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
  const [nameDraft, setNameDraft] = useState(user.name ?? '');
  const [nameError, setNameError] = useState<string | null>(null);
  const [isSavingName, setIsSavingName] = useState(false);

  useEffect(() => {
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

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{text.profile.title}</Text>
      <Text style={styles.subtitle}>{text.profile.subtitle}</Text>

      <View style={styles.profileHeader}>
        <View style={styles.profileAvatarFrame}>
          {user.profilePhoto ? (
            <Image
              source={{ uri: user.profilePhoto }}
              style={styles.profileAvatarImage}
              resizeMode="cover"
            />
          ) : (
            <Text style={styles.profileAvatarFallback}>🙂</Text>
          )}
        </View>

        <View style={styles.profileHeaderMeta}>
          <Text style={styles.docItemTitle}>
            {user.name ?? text.dashboard.fallbackName}
          </Text>
          <Text style={styles.docItemMeta}>{user.email}</Text>
        </View>
      </View>

      <View style={styles.nameEditorBlock}>
        <Text style={styles.docBlockTitle}>{text.profile.nameLabel}</Text>
        <TextInput
          style={styles.nameInput}
          value={nameDraft}
          onChangeText={setNameDraft}
          placeholder={text.profile.nameEditPlaceholder}
          placeholderTextColor="#aa7a7e"
          autoCapitalize="words"
          autoCorrect={false}
          editable={!isSavingName}
        />
        <Pressable
          style={[styles.primaryButton, isSavingName && styles.buttonDisabled]}
          disabled={isSavingName}
          onPress={() => {
            void handleSaveName();
          }}
        >
          <Text style={styles.primaryButtonText}>
            {isSavingName
              ? text.profile.savingName
              : text.profile.saveNameButton}
          </Text>
        </Pressable>
        {nameError ? <Text style={styles.error}>{nameError}</Text> : null}
      </View>

      <Pressable
        style={[
          styles.secondaryButton,
          isUploadingPhoto && styles.buttonDisabled,
        ]}
        disabled={isUploadingPhoto}
        onPress={() => {
          void handlePickAndUploadPhoto();
        }}
      >
        <Text style={styles.secondaryButtonText}>
          {isUploadingPhoto
            ? text.profile.uploadingPhoto
            : text.profile.uploadPhotoButton}
        </Text>
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.docBlock}>
        <Text style={styles.docBlockTitle}>{text.profile.userInfoTitle}</Text>
        <Text style={styles.docItemMeta}>
          {text.profile.userIdLabel}: {user.id}
        </Text>
        <Text style={styles.docItemMeta}>
          {text.profile.nameLabel}: {user.name ?? '-'}
        </Text>
        <Text style={styles.docItemMeta}>
          {text.profile.emailLabel}: {user.email}
        </Text>
        <Text style={styles.docItemMeta}>
          {text.dashboard.role}: {roleLabel}
        </Text>
        <Text style={styles.docItemMeta}>
          {text.dashboard.workplace}: {workplaceLabel}
        </Text>
        <Text style={styles.docItemMeta}>
          {text.dashboard.probation}:{' '}
          {user.isOnProbation ? text.dashboard.yes : text.dashboard.no}
        </Text>
        <Text style={styles.docItemMeta}>
          {text.profile.restaurantLabel}:{' '}
          {user.restaurant?.name ?? text.profile.noRestaurant}
        </Text>
        <Text style={styles.docItemMeta}>
          {text.profile.addressLabel}:{' '}
          {user.restaurant?.address ?? text.profile.noAddress}
        </Text>
        <Text style={styles.docItemMeta}>
          {text.profile.trainingAccessLabel}:{' '}
          {user.trainingAccess.join(', ') || '-'}
        </Text>
      </View>
    </View>
  );
}
