import type { Request } from 'express';
import { UsersService } from './users.service';
type AuthenticatedRequest = Request & {
    user?: {
        id: number;
        role: string;
        restaurantId: number | null;
    };
};
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    listUsersTrainingAccess(req: AuthenticatedRequest, restaurantIdRaw: string | undefined): Promise<{
        trainingAccess: import("../uploads/upload-taxonomy").UploadSection[];
        id: number;
        email: string;
        name: string | null;
        restaurantId: number | null;
        role: import("@prisma/client").$Enums.Role;
        employeeLevel: import("@prisma/client").$Enums.EmployeeLevel;
        isApproved: boolean;
        isOnProbation: boolean;
        restaurant: {
            id: number;
            name: string;
        } | null;
    }[]>;
    updateTrainingAccess(req: AuthenticatedRequest, userId: number, sections: string[] | undefined): Promise<{
        trainingAccess: import("../uploads/upload-taxonomy").UploadSection[];
        id: number;
        email: string;
        name: string | null;
        restaurantId: number | null;
        role: import("@prisma/client").$Enums.Role;
        employeeLevel: import("@prisma/client").$Enums.EmployeeLevel;
        isApproved: boolean;
        isOnProbation: boolean;
        restaurant: {
            id: number;
            name: string;
        } | null;
    }>;
    listTrainingAccessByLevel(req: AuthenticatedRequest): Promise<{
        employeeLevel: import("@prisma/client").$Enums.EmployeeLevel;
        sections: import("../uploads/upload-taxonomy").UploadSection[];
    }[]>;
    updateTrainingAccessByLevel(req: AuthenticatedRequest, levelRaw: string, sections: string[] | undefined): Promise<{
        employeeLevel: import("@prisma/client").$Enums.EmployeeLevel;
        sections: import("../uploads/upload-taxonomy").UploadSection[];
    }>;
    listUnassignedUsers(req: AuthenticatedRequest): import("@prisma/client").Prisma.PrismaPromise<{
        id: number;
        email: string;
        name: string | null;
        role: import("@prisma/client").$Enums.Role;
    }[]>;
    updateUserRestaurant(req: AuthenticatedRequest, userId: number, restaurantId: number): Promise<{
        id: number;
        email: string;
        name: string | null;
        restaurantId: number | null;
        role: import("@prisma/client").$Enums.Role;
        restaurant: {
            id: number;
            name: string;
            address: string;
        } | null;
    }>;
    updateManagerRole(req: AuthenticatedRequest, userId: number, isManager: boolean | undefined, restaurantIdRaw: number | undefined): Promise<{
        trainingAccess: import("../uploads/upload-taxonomy").UploadSection[];
        id: number;
        email: string;
        name: string | null;
        restaurantId: number | null;
        role: import("@prisma/client").$Enums.Role;
        employeeLevel: import("@prisma/client").$Enums.EmployeeLevel;
        isApproved: boolean;
        isOnProbation: boolean;
        restaurant: {
            id: number;
            name: string;
            address: string;
        } | null;
    }>;
    confirmEmployeeProbation(req: AuthenticatedRequest, userId: number): Promise<{
        id: number;
        role: import("@prisma/client").$Enums.Role;
        employeeLevel: import("@prisma/client").$Enums.EmployeeLevel;
        isOnProbation: boolean;
    }>;
    approveEmployeeAccount(req: AuthenticatedRequest, userId: number): Promise<{
        id: number;
        isApproved: boolean;
    }>;
    deleteEmployeeAccount(req: AuthenticatedRequest, userId: number): Promise<{
        success: boolean;
        id: number;
    }>;
    updateEmployeeLevel(req: AuthenticatedRequest, userId: number, levelRaw: string | undefined): Promise<{
        id: number;
        role: import("@prisma/client").$Enums.Role;
        employeeLevel: import("@prisma/client").$Enums.EmployeeLevel;
        isOnProbation: boolean;
    }>;
    updateOwnProfilePhoto(req: AuthenticatedRequest, file: Express.Multer.File): Promise<{
        trainingAccess: import("../uploads/upload-taxonomy").UploadSection[];
        id: number;
        email: string;
        name: string | null;
        profilePhoto: string | null;
        role: import("@prisma/client").$Enums.Role;
        employeeLevel: import("@prisma/client").$Enums.EmployeeLevel;
        isApproved: boolean;
        isOnProbation: boolean;
        workplaceRole: import("@prisma/client").$Enums.WorkplaceRole;
        restaurant: {
            id: number;
            name: string;
            address: string;
        } | null;
    }>;
}
export {};
