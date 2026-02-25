import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { sectionsByModule } from '../constants/documentTaxonomy';
import {
  fetchTrainingAccessUsers,
  updateUserTrainingAccess,
  type TrainingAccessUser,
} from '../services/usersApi';
import { styles } from '../styles/appStyles';
import type { TrainingSection } from '../types/auth';

type AdminTrainingAccessPanelProps = {
  accessToken: string;
};

const allSections = Object.values(sectionsByModule)
  .flat()
  .map((option) => ({
    key: option.key as TrainingSection,
    label: option.label,
  }));

export function AdminTrainingAccessPanel({ accessToken }: AdminTrainingAccessPanelProps) {
  const [users, setUsers] = useState<TrainingAccessUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [draftSections, setDraftSections] = useState<TrainingSection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    setIsLoading(true);
    setError(null);

    void fetchTrainingAccessUsers(accessToken)
      .then((result) => {
        if (!isActive) {
          return;
        }

        const nonAdminUsers = result.filter((user) => user.role !== 'ADMIN');
        setUsers(nonAdminUsers);
        const firstUser = nonAdminUsers[0];
        if (firstUser) {
          setSelectedUserId(firstUser.id);
          setDraftSections(firstUser.trainingAccess);
        }
      })
      .catch((requestError) => {
        if (isActive) {
          setError(requestError instanceof Error ? requestError.message : 'Cannot load users');
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [accessToken]);

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId) ?? null,
    [selectedUserId, users],
  );

  function toggleSection(section: TrainingSection) {
    setDraftSections((current) =>
      current.includes(section)
        ? current.filter((item) => item !== section)
        : [...current, section],
    );
  }

  async function saveAccess() {
    if (!selectedUser) {
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const updated = await updateUserTrainingAccess(
        accessToken,
        selectedUser.id,
        draftSections,
      );
      setUsers((current) =>
        current.map((user) => (user.id === updated.id ? updated : user)),
      );
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Cannot save access');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <View style={styles.uploadCard}>
      <Text style={styles.uploadTitle}>Training Access Manager</Text>
      <Text style={styles.uploadSubtitle}>
        Configure which formation sections each user can view.
      </Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Text style={styles.uploadFieldTitle}>User</Text>
      <View style={styles.uploadChipWrap}>
        {users.map((user) => (
          <Pressable
            key={user.id}
            style={[
              styles.uploadChip,
              selectedUserId === user.id && styles.uploadChipActive,
            ]}
            onPress={() => {
              setSelectedUserId(user.id);
              setDraftSections(user.trainingAccess);
            }}
          >
            <Text
              style={[
                styles.uploadChipText,
                selectedUserId === user.id && styles.uploadChipTextActive,
              ]}
            >
              {user.name ?? user.email}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.uploadFieldTitle}>Allowed Sections</Text>
      <View style={styles.uploadChipWrap}>
        {allSections.map((section) => (
          <Pressable
            key={section.key}
            style={[
              styles.uploadChip,
              draftSections.includes(section.key) && styles.uploadChipActive,
            ]}
            onPress={() => toggleSection(section.key)}
          >
            <Text
              style={[
                styles.uploadChipText,
                draftSections.includes(section.key) && styles.uploadChipTextActive,
              ]}
            >
              {section.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        style={[styles.primaryButton, (isSaving || isLoading) && styles.buttonDisabled]}
        disabled={isSaving || isLoading || !selectedUser}
        onPress={() => {
          void saveAccess();
        }}
      >
        <Text style={styles.primaryButtonText}>
          {isSaving ? 'Saving access...' : 'Save access'}
        </Text>
      </Pressable>
    </View>
  );
}
