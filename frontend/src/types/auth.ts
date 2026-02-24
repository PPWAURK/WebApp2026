export type Role = 'ADMIN' | 'MANAGER' | 'EMPLOYEE';

export type WorkplaceRole = 'SALLE' | 'CUISINE' | 'BOTH';

export type User = {
  id: number;
  email: string;
  name: string | null;
  role: Role;
  isOnProbation: boolean;
  workplaceRole: WorkplaceRole;
};

export type AuthResponse = {
  accessToken: string;
  user: User;
};

export type AuthMode = 'login' | 'register';
