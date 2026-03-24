import { Alert, Platform } from 'react-native';
import { useState } from 'react';
import type { AppText } from '../../locales/translations';
import {
  createOrderReturn,
  fetchOrderReturnDraft,
  type CreateOrderReturnPayload,
  type OrderReturnDraft,
  type OrderSummary,
} from '../../services/ordersApi';

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

  async function submitReturn(payload: CreateOrderReturnPayload) {
    setSubmittingReturn(true);

    try {
      await createOrderReturn(accessToken, payload);
      resetReturnState();
      onRefresh();
      showFeedback(
        text.orders.returnSuccessTitle,
        text.orders.returnSuccessMessage,
      );
    } catch (error) {
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
    openReturnDraft,
    returnDraft,
    returnDraftLoadingOrderId,
    returnModalVisible: Boolean(activeOrder && returnDraft),
    submitReturn,
    submittingReturn,
  };
}
