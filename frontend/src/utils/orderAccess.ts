import type { EmployeeLevel, User } from '../types/auth';

const ORDER_ACCESS_LEVELS: EmployeeLevel[] = [
  'L5_PAM',
  'L5_AM',
  'L6_PM',
  'L6_MA',
  'L7_PDI',
  'L7_D',
];

export function canUserAccessOrders(
  user: Pick<User, 'role' | 'employeeLevel'>,
): boolean {
  if (user.role === 'ADMIN') {
    return true;
  }

  return ORDER_ACCESS_LEVELS.includes(user.employeeLevel);
}
