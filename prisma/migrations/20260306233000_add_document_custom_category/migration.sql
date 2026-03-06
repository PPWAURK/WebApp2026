ALTER TABLE `Document`
  ADD COLUMN `custom_category` VARCHAR(80) NULL;

CREATE INDEX `Document_module_section_custom_category_uploadedAt_idx`
  ON `Document`(`module`, `section`, `custom_category`, `uploadedAt`);
