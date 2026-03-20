import { Platform } from 'react-native';
import type { AppText } from '../../../locales/translations';
import type { EmployeeLevel, WorkplaceRole } from '../../../types/auth';
import type { NewsAudience } from '../../../services/newsApi';

export const EMPLOYEE_LEVELS: EmployeeLevel[] = [
  'L0_PROBATION',
  'L1_PARTNER',
  'L2_PARTNER',
  'L3_PARTNER',
  'L4_EXCELLENT',
  'L5_PAM',
  'L5_AM',
  'L6_PM',
  'L6_MA',
  'L7_PDI',
  'L7_D',
];

export const WORKPLACE_ROLES: WorkplaceRole[] = ['SALLE', 'CUISINE', 'BOTH'];

export const PICKER_TYPES = [
  'image/*',
  'video/*',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
];

export const NEWS_ATTACHMENT_MODULE = 'TRAINING';
export const NEWS_ATTACHMENT_SECTION = 'RECIPE_TRAINING';

export type NewsLane = 'NEWS' | 'CONGRATS' | 'CRITIQUE';

export const NEWS_LANE_MARKERS: Record<NewsLane, string> = {
  NEWS: '[NEWS]',
  CONGRATS: '[CONGRATS]',
  CRITIQUE: '[CRITIQUE]',
};

export function canEmbedWebDocument(src: string): boolean {
  if (Platform.OS !== 'web') {
    return false;
  }

  if (
    src.startsWith('blob:') ||
    src.startsWith('data:') ||
    src.startsWith('about:')
  ) {
    return true;
  }

  try {
    const targetUrl = new URL(src, window.location.href);
    return targetUrl.origin === window.location.origin;
  } catch {
    return false;
  }
}

export function getNewsLaneFromTitle(title: string): NewsLane {
  const normalizedTitle = title.trim().toUpperCase();
  if (normalizedTitle.startsWith(NEWS_LANE_MARKERS.CONGRATS)) {
    return 'CONGRATS';
  }
  if (normalizedTitle.startsWith(NEWS_LANE_MARKERS.CRITIQUE)) {
    return 'CRITIQUE';
  }
  return 'NEWS';
}

export function stripNewsLaneMarker(title: string): string {
  return title.replace(/^\s*\[(NEWS|CONGRATS|CRITIQUE)\]\s*/i, '').trim();
}

export function normalizeNewsTagKey(tag: string): string {
  return tag.trim().toLocaleLowerCase();
}

export function parseNewsTagsInput(value: string): string[] {
  const seen = new Set<string>();
  const tags: string[] = [];

  for (const entry of value.split(/[\n,]/)) {
    const normalizedTag = entry.trim().replace(/^#+/, '').replace(/\s+/g, ' ');

    if (!normalizedTag) {
      continue;
    }

    const key = normalizeNewsTagKey(normalizedTag);
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    tags.push(normalizedTag);
  }

  return tags;
}

export function formatNewsTag(tag: string): string {
  return `#${tag}`;
}

export function getNewsAudienceLabel(
  audience: NewsAudience,
  text: AppText,
): string {
  if (audience === 'MANAGERS') {
    return text.dashboard.whatsNewAudienceManagers;
  }

  if (audience === 'EMPLOYEES') {
    return text.dashboard.whatsNewAudienceEmployees;
  }

  return text.dashboard.whatsNewAudienceAll;
}

export function getVisibleLevelsSummary(
  visibleEmployeeLevels: EmployeeLevel[],
  text: AppText,
): string {
  if (visibleEmployeeLevels.length === 0) {
    return text.dashboard.newsVisibleLevelsAll;
  }

  const labels = visibleEmployeeLevels.map(
    (level) => text.dashboard.levels[level],
  );

  if (labels.length <= 2) {
    return labels.join(' / ');
  }

  return `${labels.slice(0, 2).join(' / ')} +${labels.length - 2}`;
}
