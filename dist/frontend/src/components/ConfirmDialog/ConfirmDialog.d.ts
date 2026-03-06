type ConfirmDialogProps = {
    visible: boolean;
    title: string;
    message: string;
    cancelLabel: string;
    confirmLabel: string;
    destructive?: boolean;
    onCancel: () => void;
    onConfirm: () => void;
};
export declare function ConfirmDialog({ visible, title, message, cancelLabel, confirmLabel, destructive, onCancel, onConfirm, }: ConfirmDialogProps): import("react").JSX.Element;
export {};
