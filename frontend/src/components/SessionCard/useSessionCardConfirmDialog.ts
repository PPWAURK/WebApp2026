import { useRef, useState } from 'react';
import type { AppText } from '../../locales/translations';
import type { ConfirmAction, ConfirmDialogState } from './SessionCard.types';

type UseSessionCardConfirmDialogResult = {
  confirmAction: ConfirmAction;
  confirmDialog: ConfirmDialogState;
  closeConfirmDialog: (value: boolean) => void;
};

export function useSessionCardConfirmDialog(
  text: AppText,
): UseSessionCardConfirmDialogResult {
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    visible: false,
    title: '',
    message: '',
    confirmLabel: '',
    cancelLabel: text.adminTraining.confirmProbationCancel,
    destructive: true,
  });
  const confirmResolverRef = useRef<((value: boolean) => void) | null>(null);

  const confirmAction: ConfirmAction = async (
    title,
    message,
    confirmLabel,
  ) =>
    new Promise<boolean>((resolve) => {
      confirmResolverRef.current = resolve;
      setConfirmDialog({
        visible: true,
        title,
        message,
        confirmLabel,
        cancelLabel: text.adminTraining.confirmProbationCancel,
        destructive: true,
      });
    });

  function closeConfirmDialog(value: boolean) {
    if (confirmResolverRef.current) {
      confirmResolverRef.current(value);
      confirmResolverRef.current = null;
    }

    setConfirmDialog((current) => ({
      ...current,
      visible: false,
    }));
  }

  return {
    confirmAction,
    confirmDialog,
    closeConfirmDialog,
  };
}
