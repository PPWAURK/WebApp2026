-- AlterTable
ALTER TABLE `User`
ADD COLUMN `employeeLevel` ENUM(
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
  'L7_D'
) NOT NULL DEFAULT 'L0_PROBATION';

-- Backfill from legacy probation flag
UPDATE `User`
SET `employeeLevel` = 'L0_PROBATION'
WHERE `isOnProbation` = TRUE;

UPDATE `User`
SET `employeeLevel` = 'L1_PARTNER'
WHERE `isOnProbation` = FALSE;
