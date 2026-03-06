import type { EmployeeLevel, Restaurant, TrainingSection, User, WorkplaceRole } from '../types/auth';
export type TrainingAccessUser = {
    id: number;
    email: string;
    name: string | null;
    role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
    workplaceRole: WorkplaceRole;
    employeeLevel: EmployeeLevel;
    isApproved: boolean;
    isOnProbation: boolean;
    trainingAccess: TrainingSection[];
    restaurantId?: number | null;
    restaurant?: Pick<Restaurant, 'id' | 'name'> | null;
};
export type TrainingAccessByLevelProfile = {
    employeeLevel: EmployeeLevel;
    sections: TrainingSection[];
};
export type TrainingQuizLinkLanguage = 'fr' | 'bn';
export type TrainingQuizLinkItem = {
    section: TrainingSection;
    language: TrainingQuizLinkLanguage;
    quizUrl: string | null;
};
export type UnassignedUser = {
    id: number;
    email: string;
    name: string | null;
    role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
};
export declare function fetchTrainingAccessUsers(token: string, filters?: {
    restaurantId?: number;
}): Promise<TrainingAccessUser[]>;
export declare function updateUserTrainingAccess(token: string, userId: number, sections: TrainingSection[]): Promise<TrainingAccessUser>;
export declare function fetchTrainingAccessByLevel(token: string): Promise<TrainingAccessByLevelProfile[]>;
export declare function updateTrainingAccessByLevel(token: string, level: EmployeeLevel, sections: TrainingSection[]): Promise<TrainingAccessByLevelProfile>;
export declare function fetchTrainingQuizLinks(token: string): Promise<TrainingQuizLinkItem[]>;
export declare function updateTrainingQuizLink(token: string, section: TrainingSection, language: TrainingQuizLinkLanguage, quizUrl: string | null): Promise<TrainingQuizLinkItem>;
export declare function fetchUnassignedUsers(token: string): Promise<UnassignedUser[]>;
export declare function assignUserRestaurant(token: string, userId: number, restaurantId: number): Promise<{
    id: number;
}>;
export declare function updateUserManagerRole(token: string, userId: number, payload: {
    isManager: boolean;
    restaurantId?: number;
}): Promise<TrainingAccessUser>;
type PickedFile = {
    uri: string;
    name: string;
    mimeType?: string;
    file?: File;
};
export declare function uploadMyProfilePhoto(token: string, file: PickedFile): Promise<User>;
export declare function updateMyProfile(token: string, payload: {
    name: string;
}): Promise<User>;
export declare function confirmUserProbation(token: string, userId: number): Promise<{
    id: number;
    isOnProbation: boolean;
}>;
export declare function approveUserAccount(token: string, userId: number): Promise<{
    id: number;
    isApproved: boolean;
}>;
export declare function deleteUserAccount(token: string, userId: number): Promise<void>;
export declare function updateUserLevel(token: string, userId: number, level: EmployeeLevel): Promise<{
    id: number;
    employeeLevel: EmployeeLevel;
    role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
    isOnProbation: boolean;
}>;
export declare function updateUserWorkplaceRole(token: string, userId: number, workplaceRole: WorkplaceRole): Promise<{
    id: number;
    workplaceRole: WorkplaceRole;
}>;
export {};
