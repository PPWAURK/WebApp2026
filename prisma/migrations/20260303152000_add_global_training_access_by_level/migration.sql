-- CreateTable
CREATE TABLE `employee_level_access_profiles` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `employee_level` ENUM(
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
  ) NOT NULL,
  `sections` JSON NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,

  UNIQUE INDEX `employee_level_access_profiles_employee_level_key`(`employee_level`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Seed strict empty access for all levels
INSERT INTO `employee_level_access_profiles` (`employee_level`, `sections`, `created_at`, `updated_at`)
VALUES
  ('L0_PROBATION', JSON_ARRAY(), NOW(3), NOW(3)),
  ('L1_PARTNER', JSON_ARRAY(), NOW(3), NOW(3)),
  ('L2_PARTNER', JSON_ARRAY(), NOW(3), NOW(3)),
  ('L3_PARTNER', JSON_ARRAY(), NOW(3), NOW(3)),
  ('L4_EXCELLENT', JSON_ARRAY(), NOW(3), NOW(3)),
  ('L5_PAM', JSON_ARRAY(), NOW(3), NOW(3)),
  ('L5_AM', JSON_ARRAY(), NOW(3), NOW(3)),
  ('L6_PM', JSON_ARRAY(), NOW(3), NOW(3)),
  ('L6_MA', JSON_ARRAY(), NOW(3), NOW(3)),
  ('L7_PDI', JSON_ARRAY(), NOW(3), NOW(3)),
  ('L7_D', JSON_ARRAY(), NOW(3), NOW(3));
