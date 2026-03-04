"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const mail_service_1 = require("../mail/mail.service");
const prisma_service_1 = require("../prisma/prisma.service");
const upload_taxonomy_1 = require("../uploads/upload-taxonomy");
let UsersService = class UsersService {
    prisma;
    mailService;
    constructor(prisma, mailService) {
        this.prisma = prisma;
        this.mailService = mailService;
    }
    publicApiBaseUrl = process.env.PUBLIC_API_BASE_URL;
    ensureRoleScope(actor) {
        if (actor.actorRole === client_1.Role.ADMIN) {
            return;
        }
        if (actor.actorRole !== client_1.Role.MANAGER) {
            throw new common_1.BadRequestException('Only ADMIN and MANAGER are allowed');
        }
        if (!actor.actorRestaurantId) {
            throw new common_1.BadRequestException('Manager must be assigned to a restaurant');
        }
    }
    findById(id) {
        return this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                name: true,
                profilePhoto: true,
                restaurantId: true,
                restaurant: {
                    select: {
                        id: true,
                        name: true,
                        address: true,
                    },
                },
                role: true,
                employeeLevel: true,
                isApproved: true,
                isOnProbation: true,
                workplaceRole: true,
                trainingAccess: true,
                createdAt: true,
                updatedAt: true,
            },
        });
    }
    findByEmail(email) {
        return this.prisma.user.findUnique({
            where: { email },
        });
    }
    async listUsersTrainingAccess(restaurantId, actor) {
        this.ensureRoleScope(actor);
        const effectiveRestaurantId = actor.actorRole === client_1.Role.ADMIN ? restaurantId : actor.actorRestaurantId;
        const users = await this.prisma.user.findMany({
            where: {
                ...(actor.actorRole === client_1.Role.ADMIN
                    ? {
                        role: {
                            not: client_1.Role.ADMIN,
                        },
                    }
                    : {
                        role: {
                            not: client_1.Role.ADMIN,
                        },
                    }),
                ...(effectiveRestaurantId ? { restaurantId: effectiveRestaurantId } : {}),
            },
            orderBy: {
                createdAt: 'asc',
            },
            select: {
                id: true,
                email: true,
                name: true,
                restaurantId: true,
                restaurant: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                role: true,
                employeeLevel: true,
                isApproved: true,
                isOnProbation: true,
                trainingAccess: true,
            },
        });
        const levelAccessMap = await this.getTrainingAccessMapByLevel();
        return users.map((user) => ({
            ...user,
            trainingAccess: levelAccessMap.get(user.employeeLevel) ?? [],
        }));
    }
    async listTrainingAccessByLevel(actorRole) {
        if (actorRole !== client_1.Role.ADMIN) {
            throw new common_1.BadRequestException('Only ADMIN can manage level access profiles');
        }
        const profiles = await this.prisma.employeeLevelAccessProfile.findMany({
            orderBy: {
                employeeLevel: 'asc',
            },
            select: {
                employeeLevel: true,
                sections: true,
            },
        });
        return profiles.map((profile) => ({
            employeeLevel: profile.employeeLevel,
            sections: this.normalizeTrainingAccess(profile.sections),
        }));
    }
    async updateTrainingAccessByLevel(level, sections, actor) {
        if (actor.actorRole !== client_1.Role.ADMIN) {
            throw new common_1.BadRequestException('Only ADMIN can manage level access profiles');
        }
        if (!sections) {
            throw new common_1.BadRequestException('sections is required');
        }
        const uniqueSections = Array.from(new Set(sections));
        if (!uniqueSections.every((section) => (0, upload_taxonomy_1.isUploadSection)(section))) {
            throw new common_1.BadRequestException('Invalid training section');
        }
        const updated = await this.prisma.employeeLevelAccessProfile.upsert({
            where: {
                employeeLevel: level,
            },
            create: {
                employeeLevel: level,
                sections: uniqueSections,
            },
            update: {
                sections: uniqueSections,
            },
            select: {
                employeeLevel: true,
                sections: true,
            },
        });
        return {
            employeeLevel: updated.employeeLevel,
            sections: this.normalizeTrainingAccess(updated.sections),
        };
    }
    async updateTrainingAccess(userId, sections, actor) {
        this.ensureRoleScope(actor);
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                role: true,
                restaurantId: true,
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (user.role === client_1.Role.ADMIN) {
            throw new common_1.BadRequestException('Cannot update ADMIN training access');
        }
        if (actor.actorRole === client_1.Role.MANAGER && user.role !== client_1.Role.EMPLOYEE) {
            throw new common_1.BadRequestException('Manager can only update EMPLOYEE training access');
        }
        if (actor.actorRole === client_1.Role.MANAGER &&
            user.restaurantId !== actor.actorRestaurantId) {
            throw new common_1.BadRequestException('Manager can only update users in own restaurant');
        }
        if (!sections) {
            throw new common_1.BadRequestException('sections is required');
        }
        const uniqueSections = Array.from(new Set(sections));
        if (!uniqueSections.every((section) => (0, upload_taxonomy_1.isUploadSection)(section))) {
            throw new common_1.BadRequestException('Invalid training section');
        }
        const updatedUser = await this.prisma.user.update({
            where: { id: userId },
            data: {
                trainingAccess: uniqueSections,
            },
            select: {
                id: true,
                email: true,
                name: true,
                restaurantId: true,
                restaurant: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                role: true,
                employeeLevel: true,
                isApproved: true,
                isOnProbation: true,
                trainingAccess: true,
            },
        });
        return {
            ...updatedUser,
            trainingAccess: this.normalizeTrainingAccess(updatedUser.trainingAccess),
        };
    }
    createEmployee(params) {
        return this.prisma.user.create({
            data: {
                email: params.email,
                passwordHash: params.passwordHash,
                name: params.name,
                restaurantId: params.restaurantId,
                role: client_1.Role.EMPLOYEE,
                employeeLevel: client_1.EmployeeLevel.L0_PROBATION,
                isApproved: params.isApproved ?? true,
                isOnProbation: true,
                preferredLanguage: params.preferredLanguage ?? 'fr',
                workplaceRole: client_1.WorkplaceRole.BOTH,
                trainingAccess: [],
            },
        });
    }
    normalizeTrainingAccess(value) {
        if (!Array.isArray(value)) {
            return [];
        }
        const valid = value.filter((entry) => typeof entry === 'string' && (0, upload_taxonomy_1.isUploadSection)(entry));
        return valid;
    }
    getAllTrainingSections() {
        return Object.values(upload_taxonomy_1.UPLOAD_SECTION_BY_MODULE).flat();
    }
    async getTrainingAccessByLevel(level, role) {
        if (role === client_1.Role.ADMIN) {
            return this.getAllTrainingSections();
        }
        const profile = await this.prisma.employeeLevelAccessProfile.findUnique({
            where: {
                employeeLevel: level,
            },
            select: {
                sections: true,
            },
        });
        return this.normalizeTrainingAccess(profile?.sections ?? null);
    }
    async getTrainingAccessMapByLevel() {
        const profiles = await this.prisma.employeeLevelAccessProfile.findMany({
            select: {
                employeeLevel: true,
                sections: true,
            },
        });
        return new Map(profiles.map((profile) => [
            profile.employeeLevel,
            this.normalizeTrainingAccess(profile.sections),
        ]));
    }
    listUnassignedEmployees() {
        return this.prisma.user.findMany({
            where: {
                role: {
                    not: client_1.Role.ADMIN,
                },
                restaurantId: null,
            },
            orderBy: {
                createdAt: 'asc',
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
            },
        });
    }
    async assignUserRestaurant(userId, restaurantId) {
        const restaurant = await this.prisma.restaurant.findUnique({
            where: { id: restaurantId },
            select: { id: true },
        });
        if (!restaurant) {
            throw new common_1.NotFoundException('Restaurant not found');
        }
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                role: true,
                restaurantId: true,
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (user.role === client_1.Role.ADMIN) {
            throw new common_1.BadRequestException('Cannot assign restaurant to ADMIN via this endpoint');
        }
        return this.prisma.user.update({
            where: { id: userId },
            data: {
                restaurantId,
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                restaurantId: true,
                restaurant: {
                    select: {
                        id: true,
                        name: true,
                        address: true,
                    },
                },
            },
        });
    }
    async updateManagerRole(userId, params) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                role: true,
                restaurantId: true,
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (user.role === client_1.Role.ADMIN) {
            throw new common_1.BadRequestException('Cannot change ADMIN role here');
        }
        if (params.actorId === userId) {
            throw new common_1.BadRequestException('Admin cannot edit own role in this endpoint');
        }
        const nextRestaurantId = params.restaurantId ?? user.restaurantId;
        if (params.isManager && !nextRestaurantId) {
            throw new common_1.BadRequestException('Manager must be assigned to a restaurant');
        }
        if (nextRestaurantId) {
            const restaurant = await this.prisma.restaurant.findUnique({
                where: { id: nextRestaurantId },
                select: { id: true },
            });
            if (!restaurant) {
                throw new common_1.NotFoundException('Restaurant not found');
            }
        }
        const updatedUser = await this.prisma.user.update({
            where: { id: userId },
            data: {
                role: params.isManager ? client_1.Role.MANAGER : client_1.Role.EMPLOYEE,
                ...(params.restaurantId ? { restaurantId: params.restaurantId } : {}),
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                employeeLevel: true,
                restaurantId: true,
                isApproved: true,
                isOnProbation: true,
                trainingAccess: true,
                restaurant: {
                    select: {
                        id: true,
                        name: true,
                        address: true,
                    },
                },
            },
        });
        return {
            ...updatedUser,
            trainingAccess: this.normalizeTrainingAccess(updatedUser.trainingAccess),
        };
    }
    async confirmEmployeeProbation(userId, actor) {
        this.ensureRoleScope(actor);
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                role: true,
                restaurantId: true,
                isOnProbation: true,
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (user.role !== client_1.Role.EMPLOYEE) {
            throw new common_1.BadRequestException('Only EMPLOYEE probation can be confirmed');
        }
        if (actor.actorRole === client_1.Role.MANAGER &&
            user.restaurantId !== actor.actorRestaurantId) {
            throw new common_1.BadRequestException('Manager can only update users in own restaurant');
        }
        if (!user.isOnProbation) {
            return {
                id: user.id,
                role: client_1.Role.EMPLOYEE,
                employeeLevel: client_1.EmployeeLevel.L1_PARTNER,
                isOnProbation: false,
            };
        }
        const updated = await this.prisma.user.update({
            where: { id: userId },
            data: {
                role: client_1.Role.EMPLOYEE,
                employeeLevel: client_1.EmployeeLevel.L1_PARTNER,
                isOnProbation: false,
            },
            select: {
                id: true,
                role: true,
                employeeLevel: true,
                isOnProbation: true,
            },
        });
        return updated;
    }
    async approveEmployeeAccount(userId, actor) {
        this.ensureRoleScope(actor);
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                role: true,
                restaurantId: true,
                isApproved: true,
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (user.role !== client_1.Role.EMPLOYEE) {
            throw new common_1.BadRequestException('Only EMPLOYEE accounts can be approved');
        }
        if (actor.actorRole === client_1.Role.MANAGER &&
            user.restaurantId !== actor.actorRestaurantId) {
            throw new common_1.BadRequestException('Manager can only approve users in own restaurant');
        }
        if (user.isApproved) {
            return { id: user.id, isApproved: true };
        }
        const updated = await this.prisma.user.update({
            where: { id: userId },
            data: {
                isApproved: true,
            },
            select: {
                id: true,
                email: true,
                name: true,
                preferredLanguage: true,
                isApproved: true,
            },
        });
        try {
            await this.mailService.sendAccountApprovedEmail({
                email: updated.email,
                recipientName: updated.name,
                language: updated.preferredLanguage === 'zh' ? 'zh' : 'fr',
            });
        }
        catch {
        }
        return {
            id: updated.id,
            isApproved: updated.isApproved,
        };
    }
    async updateEmployeeLevel(userId, level, actor) {
        this.ensureRoleScope(actor);
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                role: true,
                restaurantId: true,
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (user.role === client_1.Role.ADMIN) {
            throw new common_1.BadRequestException('Cannot update ADMIN level');
        }
        if (actor.actorRole === client_1.Role.MANAGER && actor.actorId === userId) {
            throw new common_1.BadRequestException('Manager cannot update own level');
        }
        if (actor.actorRole === client_1.Role.MANAGER &&
            user.restaurantId !== actor.actorRestaurantId) {
            throw new common_1.BadRequestException('Manager can only update users in own restaurant');
        }
        const nextRole = this.deriveRoleFromLevel(level);
        return this.prisma.user.update({
            where: { id: userId },
            data: {
                employeeLevel: level,
                role: nextRole,
                isOnProbation: level === client_1.EmployeeLevel.L0_PROBATION,
            },
            select: {
                id: true,
                role: true,
                employeeLevel: true,
                isOnProbation: true,
            },
        });
    }
    async updatePreferredLanguage(userId, language) {
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                preferredLanguage: language,
            },
            select: {
                id: true,
            },
        });
    }
    async deleteEmployeeAccount(userId, actor) {
        this.ensureRoleScope(actor);
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                role: true,
                restaurantId: true,
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (user.role !== client_1.Role.EMPLOYEE) {
            throw new common_1.BadRequestException('Only EMPLOYEE accounts can be deleted');
        }
        if (actor.actorRole === client_1.Role.MANAGER &&
            user.restaurantId !== actor.actorRestaurantId) {
            throw new common_1.BadRequestException('Manager can only delete users in own restaurant');
        }
        try {
            await this.prisma.user.delete({
                where: { id: userId },
            });
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2003') {
                throw new common_1.BadRequestException('User cannot be deleted because it is linked to existing records');
            }
            throw error;
        }
        return { success: true, id: userId };
    }
    async updateOwnProfilePhoto(userId, file, req) {
        if (!file) {
            throw new common_1.BadRequestException('A file is required');
        }
        const existing = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true },
        });
        if (!existing) {
            throw new common_1.NotFoundException('User not found');
        }
        const profilePhoto = this.buildProfilePhotoUrl(req, file.filename);
        const updated = await this.prisma.user.update({
            where: { id: userId },
            data: {
                profilePhoto,
            },
            select: {
                id: true,
                email: true,
                name: true,
                profilePhoto: true,
                role: true,
                employeeLevel: true,
                isApproved: true,
                isOnProbation: true,
                workplaceRole: true,
                trainingAccess: true,
                restaurant: {
                    select: {
                        id: true,
                        name: true,
                        address: true,
                    },
                },
            },
        });
        return {
            ...updated,
            trainingAccess: this.normalizeTrainingAccess(updated.trainingAccess),
        };
    }
    buildProfilePhotoUrl(req, fileName) {
        if (this.publicApiBaseUrl) {
            const normalizedBaseUrl = this.publicApiBaseUrl.replace(/\/$/, '');
            return `${normalizedBaseUrl}/uploads/images/${fileName}`;
        }
        const host = req.get('host');
        return `${req.protocol}://${host}/uploads/images/${fileName}`;
    }
    deriveRoleFromLevel(level) {
        if (level === client_1.EmployeeLevel.L6_PM ||
            level === client_1.EmployeeLevel.L6_MA ||
            level === client_1.EmployeeLevel.L7_PDI ||
            level === client_1.EmployeeLevel.L7_D) {
            return client_1.Role.MANAGER;
        }
        return client_1.Role.EMPLOYEE;
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        mail_service_1.MailService])
], UsersService);
//# sourceMappingURL=users.service.js.map