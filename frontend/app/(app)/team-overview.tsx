import { Redirect } from 'expo-router';
import { TeamOverviewPage } from '../../src/components/TeamOverviewPage';
import { useAuth } from '../../src/hooks/useAuth';
import { useLanguage } from '../../src/hooks/useLanguage';

export default function TeamOverviewScreen() {
  const auth = useAuth();
  const language = useLanguage();

  if (!auth.session) {
    return null;
  }

  if (auth.session.user.role === 'EMPLOYEE') {
    return <Redirect href="/dashboard" />;
  }

  return (
    <TeamOverviewPage
      text={language.text}
      accessToken={auth.session.accessToken}
      currentUser={auth.session.user}
    />
  );
}
