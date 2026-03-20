import { View } from 'react-native';
import type { AppText } from '../../locales/translations';
import { styles } from './SessionCard.styles';
import { SessionCardLevelManagementModule } from './SessionCardLevelManagementModule';
import { SessionCardManagerApprovalModule } from './SessionCardManagerApprovalModule';
import { SessionCardManagerDeleteModule } from './SessionCardManagerDeleteModule';
import { SessionCardManagerTransferModule } from './SessionCardManagerTransferModule';
import type { SessionCardSupervisorState } from './useSessionCardSupervisorState';

type SessionCardManagerToolsGridProps = {
  isWideLayout: boolean;
  supervisorState: SessionCardSupervisorState;
  text: AppText;
};

export function SessionCardManagerToolsGrid({
  isWideLayout,
  supervisorState,
  text,
}: SessionCardManagerToolsGridProps) {
  return (
    <View
      style={[
        styles.managerEmployeeToolsGrid,
        isWideLayout && styles.managerEmployeeToolsGridWide,
      ]}
    >
      <View
        style={[
          styles.managerEmployeeToolsCell,
          isWideLayout && styles.managerEmployeeToolsCellWide,
        ]}
      >
        <SessionCardManagerApprovalModule
          supervisorState={supervisorState}
          text={text}
        />
      </View>
      <View
        style={[
          styles.managerEmployeeToolsCell,
          isWideLayout && styles.managerEmployeeToolsCellWide,
        ]}
      >
        <SessionCardManagerDeleteModule
          supervisorState={supervisorState}
          text={text}
        />
      </View>
      <View
        style={[
          styles.managerEmployeeToolsCell,
          isWideLayout && styles.managerEmployeeToolsCellWide,
        ]}
      >
        <SessionCardManagerTransferModule
          supervisorState={supervisorState}
          text={text}
        />
      </View>
      <View
        style={[
          styles.managerEmployeeToolsCell,
          isWideLayout && styles.managerEmployeeToolsCellWide,
        ]}
      >
        <SessionCardLevelManagementModule
          supervisorState={supervisorState}
          text={text}
        />
      </View>
    </View>
  );
}
