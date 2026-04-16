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

function buildFallbackOrderBonFileName(order: OrderBonDownloadTarget): string {
  return `${order.number ?? `order-${order.id}`}.pdf`;
}

function sanitizeDownloadFileName(fileName: string): string {
  const trimmedFileName = fileName.trim();
  if (!trimmedFileName) {
    return '';
  }

  return trimmedFileName.replace(/[/\\?%*:|"<>]/g, '');
}

function extractContentDispositionFileName(
  contentDisposition: string | null,
): string | null {
  if (!contentDisposition) {
    return null;
  }

  const encodedFileNameMatch = contentDisposition.match(
    /filename\*\s*=\s*UTF-8''([^;]+)/i,
  );

  if (encodedFileNameMatch?.[1]) {
    try {
      const decodedFileName = decodeURIComponent(encodedFileNameMatch[1]);
      const safeFileName = sanitizeDownloadFileName(decodedFileName);

      if (safeFileName) {
        return safeFileName;
      }
    } catch {
      return null;
    }
  }

  const quotedFileNameMatch = contentDisposition.match(
    /filename\s*=\s*"([^"]+)"/i,
  );

  if (quotedFileNameMatch?.[1]) {
    const safeFileName = sanitizeDownloadFileName(quotedFileNameMatch[1]);

    if (safeFileName) {
      return safeFileName;
    }
  }

  const bareFileNameMatch = contentDisposition.match(/filename\s*=\s*([^;]+)/i);

  if (!bareFileNameMatch?.[1]) {
    return null;
  }

  const safeFileName = sanitizeDownloadFileName(bareFileNameMatch[1]);

  return safeFileName || null;
}

function getHeaderValue(
  headers: Record<string, string>,
  headerName: string,
): string | null {
  const normalizedHeaderName = headerName.toLowerCase();

  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === normalizedHeaderName) {
      return value;
    }
  }

  return null;
}

function resolveOrderBonFileName(
  contentDisposition: string | null,
  fallbackFileName: string,
): string {
  return (
    extractContentDispositionFileName(contentDisposition) ?? fallbackFileName
  );
}

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

async function shareOrderBonFileOnIosWeb(
  blob: Blob,
  fileName: string,
): Promise<boolean> {
  if (
    typeof navigator === 'undefined' ||
    typeof navigator.share !== 'function' ||
    typeof File === 'undefined'
  ) {
    return false;
  }

  const file = new File([blob], fileName, { type: 'application/pdf' });
  const shareData = {
    files: [file],
    title: fileName,
  };

  if (
    typeof navigator.canShare === 'function' &&
    !navigator.canShare(shareData)
  ) {
    return false;
  }

  try {
    await navigator.share(shareData);
    return true;
  } catch (error) {
    return error instanceof DOMException && error.name === 'AbortError';
  }
}

export function useOrderBonDownloader(accessToken: string | null | undefined) {
  const language = useLanguage();

  return async function downloadOrderBon(
    order: OrderBonDownloadTarget,
    options?: OrderBonDownloadOptions,
  ) {
    const url = buildOrderBonUrl(order.id);
    const fallbackFileName = buildFallbackOrderBonFileName(order);

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

        const downloadFileName = resolveOrderBonFileName(
          response.headers.get('content-disposition'),
          fallbackFileName,
        );
        const blob = await response.blob();

        if (
          isIosWebBrowser() &&
          (await shareOrderBonFileOnIosWeb(blob, downloadFileName))
        ) {
          if (pendingWindow && !pendingWindow.closed) {
            pendingWindow.close();
          }
          return;
        }

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
        anchor.setAttribute('download', downloadFileName);
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

      const temporaryPath = `${cacheDir}order-bon-${order.id}-${Date.now()}.pdf`;
      const downloadResult = await FileSystem.downloadAsync(url, temporaryPath, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const downloadFileName = resolveOrderBonFileName(
        getHeaderValue(downloadResult.headers, 'content-disposition'),
        fallbackFileName,
      );
      const targetPath = `${cacheDir}${downloadFileName}`;
      let fileUri = downloadResult.uri;

      if (downloadResult.uri !== targetPath) {
        await FileSystem.deleteAsync(targetPath, { idempotent: true });
        await FileSystem.moveAsync({
          from: downloadResult.uri,
          to: targetPath,
        });
        fileUri = targetPath;
      }

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          dialogTitle: downloadFileName,
          mimeType: 'application/pdf',
          UTI: 'com.adobe.pdf',
        });
        return;
      }

      await Linking.openURL(fileUri);
    } catch {
      Alert.alert(
        language.text.orders.downloadBonButton,
        language.text.orders.downloadBonError,
      );
    }
  };
}
