import { RestaurantFormsPage } from '../../src/components/RestaurantFormsPage';
import { useAuth } from '../../src/hooks/useAuth';
import { useLanguage } from '../../src/hooks/useLanguage';

export default function RestaurantFormsScreen() {
  const auth = useAuth();
  const language = useLanguage();

  if (!auth.session) {
    return null;
  }

  return (
    <RestaurantFormsPage
      text={language.text}
      accessToken={auth.session.accessToken}
      currentUser={auth.session.user}
    />
  );
}
