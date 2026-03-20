import { BadRequestException } from '@nestjs/common';
import { Role, type Prisma } from '@prisma/client';
import {
  isUploadSection,
  UPLOAD_SECTION_BY_MODULE,
  type UploadSection,
} from '../uploads/upload-taxonomy';

export const TRAINING_QUIZ_LINK_LANGUAGES = ['fr', 'bn'] as const;

export type TrainingQuizLinkLanguage =
  (typeof TRAINING_QUIZ_LINK_LANGUAGES)[number];

export function isTrainingQuizLinkLanguage(
  value: string,
): value is TrainingQuizLinkLanguage {
  return (TRAINING_QUIZ_LINK_LANGUAGES as ReadonlyArray<string>).includes(
    value,
  );
}

export function normalizeTrainingAccess(
  value: Prisma.JsonValue | null,
): UploadSection[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const valid = value.filter(
    (entry): entry is string =>
      typeof entry === 'string' && isUploadSection(entry),
  );

  return valid as UploadSection[];
}

export function getAllTrainingSections(): UploadSection[] {
  return Object.values(UPLOAD_SECTION_BY_MODULE).flat();
}

export function ensureAdminRole(actorRole: string, message: string): void {
  if (actorRole !== Role.ADMIN) {
    throw new BadRequestException(message);
  }
}

export function validateTrainingSections(
  sections: string[] | undefined,
): UploadSection[] {
  if (!sections) {
    throw new BadRequestException('sections is required');
  }

  const uniqueSections = Array.from(new Set(sections));
  if (!uniqueSections.every((section) => isUploadSection(section))) {
    throw new BadRequestException('Invalid training section');
  }

  return uniqueSections;
}

export function normalizeQuizUrl(
  value: string | undefined | null,
): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error('INVALID_PROTOCOL');
    }

    return parsed.toString();
  } catch {
    throw new BadRequestException('quizUrl must be a valid URL');
  }
}
