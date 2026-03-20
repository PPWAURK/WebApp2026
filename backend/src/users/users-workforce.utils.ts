import { EmployeeLevel, Role } from '@prisma/client';

export function deriveRoleFromLevel(level: EmployeeLevel): Role {
  if (
    level === EmployeeLevel.L6_PM ||
    level === EmployeeLevel.L6_MA ||
    level === EmployeeLevel.L7_PDI ||
    level === EmployeeLevel.L7_D
  ) {
    return Role.MANAGER;
  }

  return Role.EMPLOYEE;
}
