import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import type { ReturnPhotoDraft } from './orderReturn.types';

function buildPhotoDraft(
  asset: Pick<
    ImagePicker.ImagePickerAsset,
    'uri' | 'fileName' | 'mimeType' | 'file'
  >,
): ReturnPhotoDraft {
  const timestamp = Date.now();
  const fallbackExtension =
    asset.mimeType?.startsWith('image/') && asset.mimeType.split('/')[1]
      ? asset.mimeType.split('/')[1]
      : 'jpg';

  return {
    id: `return-photo-${timestamp}-${Math.random().toString(36).slice(2, 8)}`,
    uri: asset.uri,
    name:
      asset.fileName?.trim() ||
      `return-photo-${timestamp}.${fallbackExtension}`,
    mimeType: asset.mimeType ?? undefined,
    file: asset.file,
  };
}

async function pickSingleImage(
  source: 'camera' | 'library',
): Promise<ReturnPhotoDraft | null> {
  if (source === 'camera') {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      throw new Error('RETURN_PHOTO_CAMERA_PERMISSION_DENIED');
    }
  } else if (Platform.OS !== 'web') {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      throw new Error('RETURN_PHOTO_LIBRARY_PERMISSION_DENIED');
    }
  }

  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: false,
          quality: 0.8,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: false,
          quality: 0.8,
          allowsMultipleSelection: false,
        });

  if (result.canceled || result.assets.length === 0) {
    return null;
  }

  return buildPhotoDraft(result.assets[0]);
}

export async function captureReturnPhoto(): Promise<ReturnPhotoDraft | null> {
  return pickSingleImage('camera');
}

export async function selectReturnPhotoFromLibrary(): Promise<ReturnPhotoDraft | null> {
  return pickSingleImage('library');
}
