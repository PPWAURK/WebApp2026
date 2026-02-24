import { Text, View } from 'react-native';
import type { AppText } from '../locales/translations';
import { styles } from '../styles/appStyles';

type TrainingPageProps = {
  text: AppText;
};

export function TrainingPage({ text }: TrainingPageProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{text.training.title}</Text>
      <Text style={styles.subtitle}>{text.training.intro}</Text>

      <View style={styles.listBlock}>
        <Text style={styles.listItem}>- {text.training.item1}</Text>
        <Text style={styles.listItem}>- {text.training.item2}</Text>
        <Text style={styles.listItem}>- {text.training.item3}</Text>
        <Text style={styles.listItem}>- {text.training.item4}</Text>
      </View>
    </View>
  );
}
