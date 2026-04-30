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
  preferShare?: boolean;
};

export type OrderBonDownloadResult =
  | 'shared'
  | 'cancelled'
  | 'unsupported'
  | 'downloaded'
  | 'opened'
  | 'failed';

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

function scheduleObjectUrlRevoke(objectUrl: string, delayMs: number) {
  if (typeof window === 'undefined') {
    return;
  }

  window.setTimeout(() => {
    window.URL.revokeObjectURL(objectUrl);
  }, delayMs);
}

async function shareOrderBonFile(
  blob: Blob,
  fileName: string,
): Promise<'shared' | 'cancelled' | 'unsupported' | 'failed'> {
  if (
    typeof navigator === 'undefined' ||
    typeof navigator.share !== 'function' ||
    typeof File === 'undefined'
  ) {
    return 'unsupported';
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
    return 'unsupported';
  }

  try {
    await navigator.share(shareData);
    return 'shared';
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return 'cancelled';
    }

    return 'failed';
  }
}

export function openPendingOrderBonWindow(): Window | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return null;
  }

  return window.open('about:blank', '_blank');
}

export function useOrderBonDownloader(accessToken: string | null | undefined) {
  const language = useLanguage();

  return async function downloadOrderBon(
    order: OrderBonDownloadTarget,
    options?: OrderBonDownloadOptions,
  ): Promise<OrderBonDownloadResult> {
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
      return 'failed';
    }

    if (Platform.OS === 'web') {
      const pendingWindow = options?.pendingWindow ?? null;

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
        const shareResult = options?.preferShare
          ? await shareOrderBonFile(blob, downloadFileName)
          : 'unsupported';

        if (shareResult === 'shared' || shareResult === 'cancelled') {
          if (pendingWindow && !pendingWindow.closed) {
            pendingWindow.close();
          }
          return shareResult;
        }

        const objectUrl = window.URL.createObjectURL(blob);
        const anchor = window.document.createElement('a');
        anchor.href = objectUrl;
        anchor.setAttribute('download', downloadFileName);
        window.document.body.append(anchor);
        anchor.click();
        anchor.remove();

        if (pendingWindow && !pendingWindow.closed) {
          pendingWindow.location.href = objectUrl;
          return 'opened';
        }

        scheduleObjectUrlRevoke(objectUrl, 60000);
        return 'downloaded';
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

        return 'failed';
      }
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
        return 'shared';
      }

      await Linking.openURL(fileUri);
      return 'opened';
    } catch {
      Alert.alert(
        language.text.orders.downloadBonButton,
        language.text.orders.downloadBonError,
      );
      return 'failed';
    }
  };
}
