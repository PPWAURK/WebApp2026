import { ConfigService } from '@nestjs/config';
import { Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly configService;
    private readonly authService;
    constructor(configService: ConfigService, authService: AuthService);
    validate(payload: JwtPayload): Promise<{
        trainingAccess: import("../../uploads/upload-taxonomy").UploadSection[];
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
}
export {};
