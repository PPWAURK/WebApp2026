import { Text, TextInput, View } from 'react-native';
import { COLORS } from '../../constants/colors';
import { styles } from './SupplierManagementPage.styles';

type FieldInputProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: 'default' | 'decimal-pad';
  fullWidth?: boolean;
  isMediumScreen: boolean;
};

export function FieldInput({
  label,
  value,
  onChangeText,
  keyboardType = 'default',
  fullWidth = false,
  isMediumScreen,
}: FieldInputProps) {
  return (
    <View
      style={[
        styles.fieldGroup,
        isMediumScreen && !fullWidth && styles.fieldGroupHalf,
        fullWidth && styles.fieldGroupFull,
      ]}
    >
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholder={label}
        placeholderTextColor={COLORS.placeholder}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
      />
    </View>
  );
}
