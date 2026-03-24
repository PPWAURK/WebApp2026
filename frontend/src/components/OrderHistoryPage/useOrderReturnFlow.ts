import { Alert, Platform } from 'react-native';
import { useState } from 'react';
import type { AppText } from '../../locales/translations';
import {
  createOrderReturn,
  fetchOrderReturnDraft,
  type OrderReturnDraft,
  type OrderSummary,
} from '../../services/ordersApi';
import { deleteLibraryFile, uploadSingleFile } from '../../services/uploadsApi';
import type { SubmitOrderReturnPayload } from './orderReturn.types';

type UseOrderReturnFlowArgs = {
  accessToken: string;
  onRefresh: () => void;
  text: AppText;
};

function resolveErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

function showFeedback(title: string, message: string) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.alert(message);
    }
    return;
  }

  Alert.alert(title, message);
}

async function cleanupUploadedReturnPhotos(
  accessToken: string,
  documentIds: number[],
) {
  if (documentIds.length === 0) {
    return;
  }

  await Promise.allSettled(
    documentIds.map((documentId) => deleteLibraryFile(accessToken, documentId)),
  );
}

async function uploadReturnPhotoDocuments(
  accessToken: string,
  items: SubmitOrderReturnPayload['items'],
  text: AppText,
) {
  const uploadedDocumentIds: number[] = [];
  const payloadItems = [];

  for (const item of items) {
    let photoDocumentIds: number[] = [];

    if (item.photos.length > 0) {
      try {
        const uploadedPhotos = await Promise.all(
          item.photos.map((photo) =>
            uploadSingleFile(accessToken, photo, {
              module: 'MANAGEMENT',
              section: 'ORDER_RETURNS',
            }),
          ),
        );
        photoDocumentIds = uploadedPhotos.map((photo) => photo.documentId);
        uploadedDocumentIds.push(...photoDocumentIds);
      } catch (error) {
        throw new Error(
          resolveErrorMessage(error, text.orders.returnPhotoUploadError),
        );
      }
    }

    payloadItems.push({
      purchaseOrderItemId: item.purchaseOrderItemId,
      quantity: item.quantity,
      ...(photoDocumentIds.length > 0 ? { photoDocumentIds } : {}),
    });
  }

  return {
    payloadItems,
    uploadedDocumentIds,
  };
}

export function useOrderReturnFlow({
  accessToken,
  onRefresh,
  text,
}: UseOrderReturnFlowArgs) {
  const [activeOrder, setActiveOrder] = useState<OrderSummary | null>(null);
  const [returnDraft, setReturnDraft] = useState<OrderReturnDraft | null>(null);
  const [returnDraftLoadingOrderId, setReturnDraftLoadingOrderId] = useState<
    number | null
  >(null);
  const [submittingReturn, setSubmittingReturn] = useState(false);
  const [successDialogVisible, setSuccessDialogVisible] = useState(false);

  function resetReturnState() {
    setActiveOrder(null);
    setReturnDraft(null);
  }

  async function openReturnDraft(order: OrderSummary) {
    if (returnDraftLoadingOrderId !== null || submittingReturn) {
      return;
    }

    setReturnDraftLoadingOrderId(order.id);

    try {
      const draft = await fetchOrderReturnDraft(accessToken, order.id);
      const availableItems = draft.items.filter(
        (item) => item.remainingQuantity > 0,
      );

      if (availableItems.length === 0) {
        showFeedback(
          text.orders.returnTitle,
          text.orders.returnNoRemainingItemsMessage,
        );
        return;
      }

      setActiveOrder(order);
      setReturnDraft({
        ...draft,
        items: availableItems,
      });
    } catch (error) {
      showFeedback(
        text.orders.returnTitle,
        resolveErrorMessage(error, text.orders.returnDraftLoadError),
      );
    } finally {
      setReturnDraftLoadingOrderId(null);
    }
  }

  function closeReturnModal() {
    if (submittingReturn) {
      return;
    }

    resetReturnState();
  }

  function closeSuccessDialog() {
    setSuccessDialogVisible(false);
  }

  async function submitReturn(payload: SubmitOrderReturnPayload) {
    setSubmittingReturn(true);
    let uploadedDocumentIds: number[] = [];

    try {
      const uploadResult = await uploadReturnPhotoDocuments(
        accessToken,
        payload.items,
        text,
      );
      uploadedDocumentIds = uploadResult.uploadedDocumentIds;

      await createOrderReturn(accessToken, {
        orderId: payload.orderId,
        reason: payload.reason,
        notes: payload.notes,
        items: uploadResult.payloadItems,
      });
      resetReturnState();
      onRefresh();
      setSuccessDialogVisible(true);
    } catch (error) {
      await cleanupUploadedReturnPhotos(accessToken, uploadedDocumentIds);
      throw new Error(
        resolveErrorMessage(error, text.orders.returnSubmitError),
      );
    } finally {
      setSubmittingReturn(false);
    }
  }

  return {
    activeOrder,
    closeReturnModal,
    closeSuccessDialog,
    openReturnDraft,
    returnDraft,
    returnDraftLoadingOrderId,
    returnModalVisible: Boolean(activeOrder && returnDraft),
    successDialogVisible,
    submitReturn,
    submittingReturn,
  };
}
