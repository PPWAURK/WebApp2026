import { Redirect } from 'expo-router';
import { StoreManagementPage } from '../../src/components/StoreManagementPage/StoreManagementPage';
import { useAuth } from '../../src/hooks/useAuth';
import { useLanguage } from '../../src/hooks/useLanguage';

export default function StoreManagementScreen() {
  const auth = useAuth();
  const language = useLanguage();

  if (!auth.session) {
    return null;
  }

  if (auth.session.user.role !== 'ADMIN') {
    return <Redirect href="/dashboard" />;
  }

  return (
    <StoreManagementPage
      text={language.text}
      accessToken={auth.session.accessToken}
    />
  );
}
