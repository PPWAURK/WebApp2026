import { Redirect } from 'expo-router';
import { RecruitmentRequestsPage } from '../../src/components/RecruitmentRequestsPage';
import { useAuth } from '../../src/hooks/useAuth';
import { useLanguage } from '../../src/hooks/useLanguage';

export default function RecruitmentRequestsScreen() {
  const auth = useAuth();
  const language = useLanguage();

  if (!auth.session) {
    return null;
  }

  if (auth.session.user.role === 'EMPLOYEE') {
    return <Redirect href="/dashboard" />;
  }

  return (
    <RecruitmentRequestsPage
      text={language.text}
      accessToken={auth.session.accessToken}
      currentUser={auth.session.user}
    />
  );
}
