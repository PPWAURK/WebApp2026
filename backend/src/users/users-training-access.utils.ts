import { BadRequestException } from '@nestjs/common';
import { Role, type Prisma } from '@prisma/client';
import { type UploadSection } from '../uploads/upload-taxonomy';

export const TRAINING_QUIZ_LINK_LANGUAGES = ['fr', 'bn'] as const;

export const TRAINING_ACCESS_SECTIONS = [
  'RECIPE_TRAINING',
  'RECIPE',
  'MISE_EN_PLACE_SOP',
  'RED_RULES',
  'BLACK_RULES',
  'SALLE_TOOLS',
  'CUISINE_TOOLS',
  'MEAT_DATE_FORM',
  'CLEANING_FORM',
] as const satisfies ReadonlyArray<UploadSection>;

export type TrainingAccessSection = (typeof TRAINING_ACCESS_SECTIONS)[number];

export type TrainingQuizLinkLanguage =
  (typeof TRAINING_QUIZ_LINK_LANGUAGES)[number];

export function isTrainingQuizLinkLanguage(
  value: string,
): value is TrainingQuizLinkLanguage {
  return (TRAINING_QUIZ_LINK_LANGUAGES as ReadonlyArray<string>).includes(
    value,
  );
}

export function isTrainingAccessSection(
  value: string,
): value is TrainingAccessSection {
  return (TRAINING_ACCESS_SECTIONS as ReadonlyArray<string>).includes(value);
}

export function normalizeTrainingAccess(
  value: Prisma.JsonValue | null,
): TrainingAccessSection[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const valid = value.filter(
    (entry): entry is string =>
      typeof entry === 'string' && isTrainingAccessSection(entry),
  );

  return valid as TrainingAccessSection[];
}

export function getAllTrainingSections(): TrainingAccessSection[] {
  return [...TRAINING_ACCESS_SECTIONS];
}

export function ensureAdminRole(actorRole: string, message: string): void {
  if (actorRole !== Role.ADMIN) {
    throw new BadRequestException(message);
  }
}

export function validateTrainingSections(
  sections: string[] | undefined,
): TrainingAccessSection[] {
  if (!sections) {
    throw new BadRequestException('sections is required');
  }

  const uniqueSections = Array.from(new Set(sections));
  if (!uniqueSections.every((section) => isTrainingAccessSection(section))) {
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
