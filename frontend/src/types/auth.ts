export type Role = 'ADMIN' | 'MANAGER' | 'EMPLOYEE';

export type WorkplaceRole = 'SALLE' | 'CUISINE' | 'BOTH';

export type TrainingSection =
  | 'RECIPE_TRAINING'
  | 'RECIPE'
  | 'MISE_EN_PLACE_SOP'
  | 'RED_RULES'
  | 'BLACK_RULES'
  | 'SALLE_TOOLS'
  | 'CUISINE_TOOLS'
  | 'MEAT_DATE_FORM'
  | 'CLEANING_FORM';

export type User = {
  id: number;
  email: string;
  name: string | null;
  role: Role;
  isOnProbation: boolean;
  workplaceRole: WorkplaceRole;
  trainingAccess: TrainingSection[];
};

export type AuthResponse = {
  accessToken: string;
  user: User;
};

export type AuthMode = 'login' | 'register';
