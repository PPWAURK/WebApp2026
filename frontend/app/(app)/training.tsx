import { TrainingPage } from '../../src/components/TrainingPage';
import { useAuth } from '../../src/hooks/useAuth';
import { useLanguage } from '../../src/hooks/useLanguage';

export default function TrainingScreen() {
  const auth = useAuth();
  const language = useLanguage();

  if (!auth.session) {
    return null;
  }

  return (
    <TrainingPage
      text={language.text}
      language={language.language}
      accessToken={auth.session.accessToken}
      currentUser={auth.session.user}
    />
  );
}
