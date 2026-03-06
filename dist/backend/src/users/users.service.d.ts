import { EmployeeLevel, Prisma, WorkplaceRole } from '@prisma/client';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { type UploadSection } from '../uploads/upload-taxonomy';
export declare class UsersService {
    private readonly prisma;
    private readonly mailService;
    constructor(prisma: PrismaService, mailService: MailService);
    private readonly publicApiBaseUrl;
    private ensureRoleScope;
    findById(id: number): Prisma.Prisma__UserClient<{
        id: number;
        email: string;
        name: string | null;
        profilePhoto: string | null;
        restaurantId: number | null;
        role: import("@prisma/client").$Enums.Role;
        employeeLevel: import("@prisma/client").$Enums.EmployeeLevel;
        isApproved: boolean;
        isOnProbation: boolean;
        workplaceRole: import("@prisma/client").$Enums.WorkplaceRole;
        trainingAccess: Prisma.JsonValue;
        createdAt: Date;
        updatedAt: Date;
        restaurant: {
            id: number;
            name: string;
            address: string;
        } | null;
    } | null, null, import("@prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    findByEmail(email: string): Prisma.Prisma__UserClient<{
        id: number;
        email: string;
        passwordHash: string;
        name: string | null;
        profilePhoto: string | null;
        restaurantId: number | null;
        role: import("@prisma/client").$Enums.Role;
        employeeLevel: import("@prisma/client").$Enums.EmployeeLevel;
        isApproved: boolean;
        isOnProbation: boolean;
        preferredLanguage: string;
        workplaceRole: import("@prisma/client").$Enums.WorkplaceRole;
        trainingAccess: Prisma.JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
    } | null, null, import("@prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    listUsersTrainingAccess(restaurantId: number | undefined, actor: {
        actorId: number;
        actorRole: string;
        actorRestaurantId: number | null;
    }): Promise<{
        trainingAccess: UploadSection[];
        id: number;
        email: string;
        name: string | null;
        restaurantId: number | null;
        role: import("@prisma/client").$Enums.Role;
        employeeLevel: import("@prisma/client").$Enums.EmployeeLevel;
        isApproved: boolean;
        isOnProbation: boolean;
        workplaceRole: import("@prisma/client").$Enums.WorkplaceRole;
        restaurant: {
            id: number;
            name: string;
        } | null;
    }[]>;
    listTrainingAccessByLevel(actorRole: string): Promise<{
        employeeLevel: import("@prisma/client").$Enums.EmployeeLevel;
        sections: UploadSection[];
    }[]>;
    updateTrainingAccessByLevel(level: EmployeeLevel, sections: string[] | undefined, actor: {
        actorRole: string;
    }): Promise<{
        employeeLevel: import("@prisma/client").$Enums.EmployeeLevel;
        sections: UploadSection[];
    }>;
    listTrainingQuizLinks(): Promise<{
        section: UploadSection;
        language: "fr" | "bn";
        quizUrl: string | null;
    }[]>;
    upsertTrainingQuizLink(sectionRaw: string, languageRaw: string, quizUrlRaw: string | undefined | null, actorRole: string): Promise<{
        section: UploadSection;
        language: "fr" | "bn";
        quizUrl: null;
    } | {
        section: import("@prisma/client").$Enums.UploadSection;
        language: "fr" | "bn";
        quizUrl: string;
    }>;
    updateTrainingAccess(userId: number, sections: string[] | undefined, actor: {
        actorId: number;
        actorRole: string;
        actorRestaurantId: number | null;
    }): Promise<{
        trainingAccess: UploadSection[];
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
    createEmployee(params: {
        email: string;
        passwordHash: string;
        name?: string;
        restaurantId: number;
        isApproved?: boolean;
        preferredLanguage?: 'fr' | 'zh';
    }): Prisma.Prisma__UserClient<{
        id: number;
        email: string;
        passwordHash: string;
        name: string | null;
        profilePhoto: string | null;
        restaurantId: number | null;
        role: import("@prisma/client").$Enums.Role;
        employeeLevel: import("@prisma/client").$Enums.EmployeeLevel;
        isApproved: boolean;
        isOnProbation: boolean;
        preferredLanguage: string;
        workplaceRole: import("@prisma/client").$Enums.WorkplaceRole;
        trainingAccess: Prisma.JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    normalizeTrainingAccess(value: Prisma.JsonValue | null): UploadSection[];
    private getAllTrainingSections;
    getTrainingAccessByLevel(level: EmployeeLevel, role?: string): Promise<UploadSection[]>;
    private getTrainingAccessMapByLevel;
    listUnassignedEmployees(): Prisma.PrismaPromise<{
        id: number;
        email: string;
        name: string | null;
        role: import("@prisma/client").$Enums.Role;
    }[]>;
    assignUserRestaurant(userId: number, restaurantId: number): Promise<{
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
    updateManagerRole(userId: number, params: {
        isManager: boolean;
        restaurantId?: number;
        actorId: number;
    }): Promise<{
        trainingAccess: UploadSection[];
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
    confirmEmployeeProbation(userId: number, actor: {
        actorId: number;
        actorRole: string;
        actorRestaurantId: number | null;
    }): Promise<{
        id: number;
        role: import("@prisma/client").$Enums.Role;
        employeeLevel: import("@prisma/client").$Enums.EmployeeLevel;
        isOnProbation: boolean;
    }>;
    approveEmployeeAccount(userId: number, actor: {
        actorRole: string;
        actorRestaurantId: number | null;
    }): Promise<{
        id: number;
        isApproved: boolean;
    }>;
    updateEmployeeLevel(userId: number, level: EmployeeLevel, actor: {
        actorId: number;
        actorRole: string;
        actorRestaurantId: number | null;
    }): Promise<{
        id: number;
        role: import("@prisma/client").$Enums.Role;
        employeeLevel: import("@prisma/client").$Enums.EmployeeLevel;
        isOnProbation: boolean;
    }>;
    updateEmployeeWorkplaceRole(userId: number, workplaceRole: WorkplaceRole, actor: {
        actorId: number;
        actorRole: string;
        actorRestaurantId: number | null;
    }): Promise<{
        id: number;
        workplaceRole: import("@prisma/client").$Enums.WorkplaceRole;
    }>;
    updatePreferredLanguage(userId: number, language: 'fr' | 'zh'): Promise<void>;
    deleteEmployeeAccount(userId: number, actor: {
        actorRole: string;
        actorRestaurantId: number | null;
    }): Promise<{
        success: boolean;
        id: number;
    }>;
    updateOwnProfilePhoto(userId: number, file: Express.Multer.File, req: {
        protocol: string;
        get: (name: string) => string | undefined;
    }): Promise<{
        trainingAccess: UploadSection[];
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
    updateOwnProfile(userId: number, payload: {
        name: string;
    }): Promise<{
        trainingAccess: UploadSection[];
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
    private buildProfilePhotoUrl;
    private deriveRoleFromLevel;
    private normalizeQuizUrl;
}
