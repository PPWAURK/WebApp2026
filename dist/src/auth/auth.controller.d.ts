import type { Request } from 'express';
import { AuthService } from './auth.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
type AuthenticatedRequest = Request & {
    user: unknown;
};
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(loginDto: LoginDto): Promise<{
        accessToken: string;
        user: {
            id: number;
            email: string;
            name: string | null;
            profilePhoto: string | null;
            role: string;
            employeeLevel: import("@prisma/client").$Enums.EmployeeLevel;
            isOnProbation: boolean;
            workplaceRole: string;
            trainingAccess: import("../uploads/upload-taxonomy").UploadSection[];
            restaurant: {
                id: number;
                name: string;
                address: string;
            } | null;
        };
    }>;
    register(registerDto: RegisterDto): Promise<{
        pendingApproval: boolean;
        userId: number;
        message: string;
    }>;
    forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{
        success: boolean;
        message: string;
    }>;
    resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{
        success: boolean;
        message: string;
    }>;
    me(req: AuthenticatedRequest): Express.User | undefined;
}
export {};
