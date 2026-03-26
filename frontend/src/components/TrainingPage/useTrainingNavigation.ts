import { useEffect, useMemo, useState } from 'react';
import {
  getTrainingScenarios,
  type TrainingScenario,
} from '../../constants/trainingScenario';
import type { AppText } from '../../locales/translations';
import type { LibraryFileItem } from '../../services/uploadsApi';
import type { TrainingSection } from '../../types/auth';

type UseTrainingNavigationParams = {
  text: AppText;
  userTrainingAccess: TrainingSection[];
};

export function useTrainingNavigation({
  text,
  userTrainingAccess,
}: UseTrainingNavigationParams) {
  const [activeScenarioKey, setActiveScenarioKey] = useState<string | null>(
    null,
  );
  const [activeSection, setActiveSection] = useState<TrainingSection | null>(
    null,
  );
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<LibraryFileItem | null>(
    null,
  );
  const [shouldAutoFullscreen, setShouldAutoFullscreen] = useState(false);

  const scenarios = useMemo(() => getTrainingScenarios(text), [text]);

  const sectionLabelByKey = useMemo(() => {
    const map = new Map<TrainingSection, string>();

    for (const scenario of scenarios) {
      for (const section of scenario.sections) {
        map.set(section, text.taxonomy.sections[section]);
      }
    }

    return map;
  }, [scenarios, text]);

  const availableScenarios = useMemo<TrainingScenario[]>(
    () =>
      scenarios
        .map((scenario) => ({
          ...scenario,
          sections: scenario.sections.filter((section) =>
            userTrainingAccess.includes(section),
          ),
        }))
        .filter((scenario) => scenario.sections.length > 0),
    [scenarios, userTrainingAccess],
  );

  useEffect(() => {
    if (!availableScenarios.length) {
      setActiveScenarioKey(null);
      setActiveSection(null);
      return;
    }

    setActiveScenarioKey((current) => {
      if (
        current &&
        availableScenarios.some((scenario) => scenario.key === current)
      ) {
        return current;
      }

      return availableScenarios[0].key;
    });
  }, [availableScenarios]);

  const activeScenario = useMemo(
    () =>
      availableScenarios.find(
        (scenario) => scenario.key === activeScenarioKey,
      ) ??
      availableScenarios[0] ??
      null,
    [activeScenarioKey, availableScenarios],
  );

  useEffect(() => {
    if (!activeScenario) {
      setActiveSection(null);
      return;
    }

    setActiveSection((current) => {
      if (current && activeScenario.sections.includes(current)) {
        return current;
      }

      return activeScenario.sections[0] ?? null;
    });
  }, [activeScenario]);

  useEffect(() => {
    setSearchKeyword('');
    setSelectedVideo(null);
    setShouldAutoFullscreen(false);
  }, [activeScenarioKey, activeSection]);

  const selectedSectionLabel =
    (activeSection ? sectionLabelByKey.get(activeSection) : null) ?? '';

  function openVideo(item: LibraryFileItem) {
    setSelectedVideo(item);
    setShouldAutoFullscreen(true);
  }

  function closeVideo() {
    setSelectedVideo(null);
    setShouldAutoFullscreen(false);
  }

  function clearAutoFullscreen() {
    setShouldAutoFullscreen(false);
  }

  return {
    sectionLabelByKey,
    availableScenarios,
    activeScenario,
    activeSection,
    selectedSectionLabel,
    searchKeyword,
    selectedVideo,
    shouldAutoFullscreen,
    setActiveScenarioKey,
    setActiveSection,
    setSearchKeyword,
    openVideo,
    closeVideo,
    clearAutoFullscreen,
  };
}
