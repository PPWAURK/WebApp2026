"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcrypt"));
const crypto_1 = require("crypto");
const mail_service_1 = require("../mail/mail.service");
const prisma_service_1 = require("../prisma/prisma.service");
const restaurants_service_1 = require("../restaurants/restaurants.service");
const users_service_1 = require("../users/users.service");
let AuthService = class AuthService {
    usersService;
    restaurantsService;
    jwtService;
    configService;
    prisma;
    mailService;
    constructor(usersService, restaurantsService, jwtService, configService, prisma, mailService) {
        this.usersService = usersService;
        this.restaurantsService = restaurantsService;
        this.jwtService = jwtService;
        this.configService = configService;
        this.prisma = prisma;
        this.mailService = mailService;
    }
    resetTokenLifetimeMinutes = 30;
    resetEmailCooldownMs = 30_000;
    async login(loginDto) {
        const user = await this.usersService.findByEmail(loginDto.email);
        if (!user) {
            throw new common_1.UnauthorizedException('USER_NOT_FOUND');
        }
        const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('INCORRECT_PASSWORD');
        }
        if (!user.isApproved) {
            throw new common_1.UnauthorizedException('ACCOUNT_PENDING_APPROVAL');
        }
        if (loginDto.language === 'fr' || loginDto.language === 'zh') {
            await this.usersService.updatePreferredLanguage(user.id, loginDto.language);
        }
        const authenticatedUser = await this.usersService.findById(user.id);
        if (!authenticatedUser) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        return this.buildAuthResponse(authenticatedUser);
    }
    async register(registerDto) {
        const existingUser = await this.usersService.findByEmail(registerDto.email);
        if (existingUser) {
            throw new common_1.ConflictException('EMAIL_ALREADY_REGISTERED');
        }
        await this.restaurantsService.ensureRestaurantExists(registerDto.restaurantId);
        const passwordHash = await bcrypt.hash(registerDto.password, 10);
        const createdUser = await this.usersService.createEmployee({
            email: registerDto.email,
            passwordHash,
            name: registerDto.name,
            restaurantId: registerDto.restaurantId,
            isApproved: false,
            preferredLanguage: registerDto.language === 'fr' || registerDto.language === 'zh'
                ? registerDto.language
                : 'fr',
        });
        return {
            pendingApproval: true,
            userId: createdUser.id,
            message: 'ACCOUNT_PENDING_APPROVAL',
        };
    }
    async forgotPassword(dto) {
        const normalizedEmail = dto.email.trim().toLowerCase();
        const user = await this.usersService.findByEmail(normalizedEmail);
        if (!user) {
            return {
                success: true,
                message: 'PASSWORD_RESET_EMAIL_SENT_IF_EXISTS',
            };
        }
        const lastResetRequest = await this.prisma.passwordResetToken.findFirst({
            where: {
                userId: user.id,
            },
            orderBy: {
                createdAt: 'desc',
            },
            select: {
                createdAt: true,
            },
        });
        if (lastResetRequest) {
            const elapsedSinceLastRequestMs = Date.now() - lastResetRequest.createdAt.getTime();
            if (elapsedSinceLastRequestMs < this.resetEmailCooldownMs) {
                return {
                    success: true,
                    message: 'PASSWORD_RESET_EMAIL_SENT_IF_EXISTS',
                };
            }
        }
        const plainToken = (0, crypto_1.randomBytes)(32).toString('hex');
        const tokenHash = this.hashResetToken(plainToken);
        const expiresAt = new Date(Date.now() + this.resetTokenLifetimeMinutes * 60 * 1000);
        await this.prisma.passwordResetToken.create({
            data: {
                userId: user.id,
                tokenHash,
                expiresAt,
            },
        });
        try {
            const effectiveLanguage = dto.language === 'fr' || dto.language === 'zh'
                ? dto.language
                : user.preferredLanguage === 'zh'
                    ? 'zh'
                    : 'fr';
            await this.mailService.sendForgotPasswordEmail({
                email: user.email,
                recipientName: user.name,
                resetToken: plainToken,
                language: effectiveLanguage,
            });
        }
        catch {
        }
        return {
            success: true,
            message: 'PASSWORD_RESET_EMAIL_SENT_IF_EXISTS',
        };
    }
    async resetPassword(dto) {
        const tokenHash = this.hashResetToken(dto.token);
        const now = new Date();
        const resetRecord = await this.prisma.passwordResetToken.findFirst({
            where: {
                tokenHash,
                consumedAt: null,
                expiresAt: {
                    gt: now,
                },
            },
            include: {
                user: {
                    select: {
                        id: true,
                    },
                },
            },
        });
        if (!resetRecord) {
            throw new common_1.UnauthorizedException('INVALID_OR_EXPIRED_RESET_TOKEN');
        }
        const passwordHash = await bcrypt.hash(dto.password, 10);
        await this.prisma.$transaction([
            this.prisma.user.update({
                where: { id: resetRecord.user.id },
                data: {
                    passwordHash,
                },
            }),
            this.prisma.passwordResetToken.update({
                where: { id: resetRecord.id },
                data: {
                    consumedAt: now,
                },
            }),
        ]);
        return {
            success: true,
            message: 'PASSWORD_RESET_SUCCESS',
        };
    }
    async buildAuthResponse(user) {
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
            workplaceRole: user.workplaceRole,
        };
        const trainingAccess = await this.usersService.getTrainingAccessByLevel(user.employeeLevel, user.role);
        return {
            accessToken: await this.jwtService.signAsync(payload, {
                expiresIn: this.configService.get('JWT_EXPIRES_IN', '15m'),
            }),
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                profilePhoto: user.profilePhoto,
                role: user.role,
                employeeLevel: user.employeeLevel,
                isOnProbation: user.isOnProbation,
                workplaceRole: user.workplaceRole,
                trainingAccess,
                restaurant: user.restaurant,
            },
        };
    }
    async validateUserById(userId) {
        const user = await this.usersService.findById(userId);
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid token');
        }
        if (!user.isApproved) {
            throw new common_1.UnauthorizedException('ACCOUNT_PENDING_APPROVAL');
        }
        const trainingAccess = await this.usersService.getTrainingAccessByLevel(user.employeeLevel, user.role);
        return {
            ...user,
            trainingAccess,
        };
    }
    hashResetToken(value) {
        return (0, crypto_1.createHash)('sha256').update(value).digest('hex');
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        restaurants_service_1.RestaurantsService,
        jwt_1.JwtService,
        config_1.ConfigService,
        prisma_service_1.PrismaService,
        mail_service_1.MailService])
], AuthService);
//# sourceMappingURL=auth.service.js.map