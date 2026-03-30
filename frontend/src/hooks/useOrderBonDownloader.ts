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

type OrderBonDownloadOptions = {
  pendingWindow?: Window | null;
};

function isIosWebBrowser(): boolean {
  if (Platform.OS !== 'web' || typeof navigator === 'undefined') {
    return false;
  }

  const userAgent = navigator.userAgent;
  const isTouchMac =
    navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;

  return /iPad|iPhone|iPod/i.test(userAgent) || isTouchMac;
}

export function openPendingOrderBonWindow(): Window | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return null;
  }

  if (!isIosWebBrowser()) {
    return null;
  }

  return window.open('about:blank', '_blank');
}

function scheduleObjectUrlRevoke(objectUrl: string, delayMs: number) {
  if (typeof window === 'undefined') {
    return;
  }

  window.setTimeout(() => {
    window.URL.revokeObjectURL(objectUrl);
  }, delayMs);
}

export function useOrderBonDownloader(accessToken: string | null | undefined) {
  const language = useLanguage();

  return async function downloadOrderBon(
    order: OrderBonDownloadTarget,
    options?: OrderBonDownloadOptions,
  ) {
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
      const pendingWindow =
        options?.pendingWindow ?? openPendingOrderBonWindow();

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

        if (pendingWindow && !pendingWindow.closed) {
          pendingWindow.location.href = objectUrl;
          scheduleObjectUrlRevoke(objectUrl, 60000);
          return;
        }

        if (isIosWebBrowser()) {
          window.location.assign(objectUrl);
          scheduleObjectUrlRevoke(objectUrl, 60000);
          return;
        }

        const anchor = window.document.createElement('a');
        anchor.href = objectUrl;
        anchor.setAttribute('download', '');
        window.document.body.append(anchor);
        anchor.click();
        anchor.remove();
        scheduleObjectUrlRevoke(objectUrl, 1000);
      } catch {
        if (pendingWindow && !pendingWindow.closed) {
          pendingWindow.close();
        }

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
