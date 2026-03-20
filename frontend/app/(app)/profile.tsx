import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { ProfilePage } from '../../src/components/ProfilePage';
import { useAuth } from '../../src/hooks/useAuth';
import { useLanguage } from '../../src/hooks/useLanguage';
import { styles } from '../../src/styles/App.styles';

export default function ProfileScreen() {
  const auth = useAuth();
  const language = useLanguage();
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  if (!auth.session) {
    return null;
  }

  return (
    <ScrollView
      contentContainerStyle={styles.authenticatedContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.pageTransitionLayer}>
        <ProfilePage
          text={language.text}
          user={auth.session.user}
          accessToken={auth.session.accessToken}
          isUploadingPhoto={isUploadingPhoto}
          error={profileError}
          onUploadStart={() => {
            setProfileError(null);
            setIsUploadingPhoto(true);
          }}
          onUploadFinish={() => {
            setIsUploadingPhoto(false);
          }}
          onUploadError={setProfileError}
          onUserUpdate={(nextUser) => {
            void auth.updateSessionUser(nextUser);
          }}
        />
      </View>
    </ScrollView>
  );
}
