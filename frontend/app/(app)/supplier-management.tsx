import { Redirect } from 'expo-router';
import { SupplierManagementPage } from '../../src/components/SupplierManagementPage';
import { useAuth } from '../../src/hooks/useAuth';
import { useLanguage } from '../../src/hooks/useLanguage';

export default function SupplierManagementScreen() {
  const auth = useAuth();
  const language = useLanguage();

  if (!auth.session) {
    return null;
  }

  if (auth.session.user.role !== 'ADMIN') {
    return <Redirect href="/dashboard" />;
  }

  return (
    <SupplierManagementPage
      text={language.text}
      language={language.language}
      accessToken={auth.session.accessToken}
    />
  );
}
