import type { AppText } from '../../locales/translations';
import type { User } from '../../types/auth';

export type SessionCardProps = {
  user: User;
  accessToken: string;
  text: AppText;
};

export type RestaurantFilterSection = 'approval' | 'level';
export type RestaurantFilterValue = number | 'ALL' | 'NONE';

export type RestaurantOption = {
  id: number;
  name: string;
};

export type ConfirmDialogState = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  destructive: boolean;
};

export type ConfirmAction = (
  title: string,
  message: string,
  confirmLabel: string,
) => Promise<boolean>;
