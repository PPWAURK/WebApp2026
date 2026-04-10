UPDATE `User`
SET `isOnProbation` = CASE
  WHEN `employeeLevel` = 'L0_PROBATION' THEN TRUE
  ELSE FALSE
END;
