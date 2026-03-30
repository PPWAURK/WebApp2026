import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Alert, Linking, Platform } from 'react-native';
import { buildOrderBonUrl } from '../services/ordersApi';
import { throwIfUnauthorized } from '../services/authSession';
import { useLanguage } from './useLanguage';

type OrderBonDownloadTarget = {
  id: number;
  bonUrl: string;
  number?: string;
};

export function useOrderBonDownloader(accessToken: string | null | undefined) {
  const language = useLanguage();

  return async function downloadOrderBon(order: OrderBonDownloadTarget) {
    const url = buildOrderBonUrl(order.id);
    const fileName = `${order.number ?? `order-${order.id}`}.pdf`;

    if (!accessToken) {
      if (typeof window !== 'undefined' && typeof window.alert === 'function') {
        window.alert(language.text.orders.downloadBonError);
      } else {
        Alert.alert(
          language.text.orders.downloadBonButton,
          language.text.orders.downloadBonError,
        );
      }
      return;
    }

    if (Platform.OS === 'web') {
      try {
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          throwIfUnauthorized(response);
          throw new Error('ORDER_BON_DOWNLOAD_FAILED');
        }

        const blob = await response.blob();
        const objectUrl = window.URL.createObjectURL(blob);
        const anchor = window.document.createElement('a');
        anchor.href = objectUrl;
        anchor.setAttribute('download', '');
        window.document.body.append(anchor);
        anchor.click();
        anchor.remove();
        window.setTimeout(() => {
          window.URL.revokeObjectURL(objectUrl);
        }, 1000);
      } catch {
        if (
          typeof window !== 'undefined' &&
          typeof window.alert === 'function'
        ) {
          window.alert(language.text.orders.downloadBonError);
        }
      }

      return;
    }

    try {
      const cacheDir = FileSystem.cacheDirectory;
      if (!cacheDir) {
        throw new Error('CACHE_DIRECTORY_UNAVAILABLE');
      }

      const targetPath = `${cacheDir}${fileName}`;
      const downloadResult = await FileSystem.downloadAsync(url, targetPath, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(downloadResult.uri, {
          dialogTitle: fileName,
          mimeType: 'application/pdf',
          UTI: 'com.adobe.pdf',
        });
        return;
      }

      await Linking.openURL(downloadResult.uri);
    } catch {
      Alert.alert(
        language.text.orders.downloadBonButton,
        language.text.orders.downloadBonError,
      );
    }
  };
}
