import { Text, View } from 'react-native';
import type { AppText } from '../locales/translations';
import { styles } from '../styles/appStyles';

type RestaurantFormsPageProps = {
  text: AppText;
};

export function RestaurantFormsPage({ text }: RestaurantFormsPageProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{text.forms.title}</Text>
      <Text style={styles.subtitle}>{text.forms.intro}</Text>

      <View style={styles.listBlock}>
        <Text style={styles.listItem}>- {text.forms.item1}</Text>
        <Text style={styles.listItem}>- {text.forms.item2}</Text>
        <Text style={styles.listItem}>- {text.forms.item3}</Text>
        <Text style={styles.listItem}>- {text.forms.item4}</Text>
      </View>
    </View>
  );
}
