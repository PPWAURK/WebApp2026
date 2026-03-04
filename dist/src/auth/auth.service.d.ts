import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { RestaurantsService } from '../restaurants/restaurants.service';
import { UsersService } from '../users/users.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
export declare class AuthService {
    private readonly usersService;
    private readonly restaurantsService;
    private readonly jwtService;
    private readonly configService;
    private readonly prisma;
    private readonly mailService;
    constructor(usersService: UsersService, restaurantsService: RestaurantsService, jwtService: JwtService, configService: ConfigService, prisma: PrismaService, mailService: MailService);
    private readonly resetTokenLifetimeMinutes;
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
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        success: boolean;
        message: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        success: boolean;
        message: string;
    }>;
    private buildAuthResponse;
    validateUserById(userId: number): Promise<{
        trainingAccess: import("../uploads/upload-taxonomy").UploadSection[];
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
        createdAt: Date;
        updatedAt: Date;
        restaurant: {
            id: number;
            name: string;
            address: string;
        } | null;
    }>;
    private hashResetToken;
}
