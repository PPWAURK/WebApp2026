import type { AppText } from '../../locales/translations';
type ResetPasswordFormProps = {
    text: AppText;
    password: string;
    isSubmitting: boolean;
    error: string | null;
    notice: string | null;
    hasToken: boolean;
    onPasswordChange: (value: string) => void;
    onSubmit: () => void;
    onBackToLogin: () => void;
};
export declare function ResetPasswordForm({ text, password, isSubmitting, error, notice, hasToken, onPasswordChange, onSubmit, onBackToLogin, }: ResetPasswordFormProps): import("react").JSX.Element;
export {};
