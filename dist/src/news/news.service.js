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
exports.NewsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const upload_taxonomy_1 = require("../uploads/upload-taxonomy");
let NewsService = class NewsService {
    prisma;
    publicApiBaseUrl = process.env.PUBLIC_API_BASE_URL;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createNewsPost(req, input) {
        const title = input.title.trim();
        const message = input.message.trim();
        if (!title) {
            throw new common_1.BadRequestException('title is required');
        }
        if (!message) {
            throw new common_1.BadRequestException('message is required');
        }
        const audience = this.parseAudience(input.audience);
        const module = this.parseUploadModule(input.module);
        const section = this.parseUploadSection(input.section);
        if (section && !module) {
            throw new common_1.BadRequestException('module is required when section is provided');
        }
        if (module && section && !(0, upload_taxonomy_1.isSectionInModule)(module, section)) {
            throw new common_1.BadRequestException('Section does not belong to selected module');
        }
        let attachmentDocumentId = null;
        if (input.attachmentDocumentId !== undefined) {
            if (!Number.isInteger(input.attachmentDocumentId) || input.attachmentDocumentId <= 0) {
                throw new common_1.BadRequestException('attachmentDocumentId must be a positive integer');
            }
            const foundDocument = await this.prisma.document.findUnique({
                where: {
                    id: input.attachmentDocumentId,
                },
            });
            if (!foundDocument) {
                throw new common_1.NotFoundException('attachment document not found');
            }
            attachmentDocumentId = foundDocument.id;
        }
        const created = await this.prisma.newsPost.create({
            data: {
                title,
                message,
                audience,
                module: module ?? null,
                section: section ?? null,
                attachmentDocumentId,
                createdByUserId: input.createdByUserId,
            },
            include: {
                createdByUser: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                attachmentDocument: true,
            },
        });
        return {
            id: created.id,
            title: created.title,
            message: created.message,
            audience: created.audience,
            module: created.module,
            section: created.section,
            createdAt: created.createdAt,
            isRead: false,
            createdBy: created.createdByUser,
            attachment: created.attachmentDocument
                ? {
                    documentId: created.attachmentDocument.id,
                    originalName: created.attachmentDocument.originalName,
                    mimeType: created.attachmentDocument.mimeType,
                    mediaType: created.attachmentDocument.mediaType,
                    fileUrl: this.buildFileUrl(req, created.attachmentDocument.category, created.attachmentDocument.fileName),
                }
                : null,
        };
    }
    async listNewsPosts(req, context) {
        const limit = context.limit && Number.isInteger(context.limit)
            ? Math.max(1, Math.min(50, context.limit))
            : 20;
        const where = {};
        if (context.role === 'MANAGER') {
            where.audience = {
                in: [client_1.NewsAudience.ALL, client_1.NewsAudience.MANAGERS],
            };
        }
        if (context.role === 'EMPLOYEE') {
            where.audience = {
                in: [client_1.NewsAudience.ALL, client_1.NewsAudience.EMPLOYEES],
            };
        }
        if (context.role !== 'ADMIN') {
            const allowedSections = (context.trainingAccess ?? []).filter((section) => (0, upload_taxonomy_1.isUploadSection)(section));
            where.AND = [
                {
                    OR: [
                        { section: null },
                        ...(allowedSections.length > 0 ? [{ section: { in: allowedSections } }] : []),
                    ],
                },
            ];
        }
        const monthRange = this.parseMonthRange(context.month);
        const whereWithMonth = {
            ...where,
            ...(monthRange
                ? {
                    createdAt: {
                        gte: monthRange.start,
                        lt: monthRange.end,
                    },
                }
                : {}),
        };
        const rows = await this.prisma.newsPost.findMany({
            where: whereWithMonth,
            orderBy: {
                createdAt: 'desc',
            },
            take: limit,
            include: {
                createdByUser: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                attachmentDocument: true,
                reads: {
                    where: {
                        userId: context.userId,
                    },
                    select: {
                        id: true,
                    },
                    take: 1,
                },
            },
        });
        const monthRows = await this.prisma.newsPost.findMany({
            where,
            select: {
                createdAt: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        const availableMonths = Array.from(new Set(monthRows.map((entry) => {
            const year = entry.createdAt.getUTCFullYear();
            const month = `${entry.createdAt.getUTCMonth() + 1}`.padStart(2, '0');
            return `${year}-${month}`;
        })));
        return {
            items: rows.map((row) => ({
                id: row.id,
                title: row.title,
                message: row.message,
                audience: row.audience,
                module: row.module,
                section: row.section,
                createdAt: row.createdAt,
                isRead: row.reads.length > 0,
                createdBy: row.createdByUser,
                attachment: row.attachmentDocument
                    ? {
                        documentId: row.attachmentDocument.id,
                        originalName: row.attachmentDocument.originalName,
                        mimeType: row.attachmentDocument.mimeType,
                        mediaType: row.attachmentDocument.mediaType,
                        fileUrl: this.buildFileUrl(req, row.attachmentDocument.category, row.attachmentDocument.fileName),
                    }
                    : null,
            })),
            availableMonths,
        };
    }
    async deleteNewsPost(newsPostId) {
        const existing = await this.prisma.newsPost.findUnique({
            where: {
                id: newsPostId,
            },
            select: {
                id: true,
            },
        });
        if (!existing) {
            throw new common_1.NotFoundException('News post not found');
        }
        await this.prisma.newsPost.delete({
            where: {
                id: newsPostId,
            },
        });
        return { success: true };
    }
    async markNewsAsRead(newsPostId, userId, context) {
        const post = await this.prisma.newsPost.findUnique({
            where: {
                id: newsPostId,
            },
            select: {
                id: true,
                audience: true,
                section: true,
            },
        });
        if (!post) {
            throw new common_1.NotFoundException('News post not found');
        }
        this.ensureCanReadPost(post, context);
        await this.prisma.newsPostRead.upsert({
            where: {
                newsPostId_userId: {
                    newsPostId,
                    userId,
                },
            },
            create: {
                newsPostId,
                userId,
            },
            update: {
                readAt: new Date(),
            },
        });
        return { success: true };
    }
    async getNewsReadTracking(newsPostId) {
        const post = await this.prisma.newsPost.findUnique({
            where: {
                id: newsPostId,
            },
            select: {
                id: true,
                audience: true,
                section: true,
            },
        });
        if (!post) {
            throw new common_1.NotFoundException('News post not found');
        }
        const targetRoles = this.getAudienceRoles(post.audience);
        const targetUsers = await this.prisma.user.findMany({
            where: {
                isApproved: true,
                role: {
                    in: targetRoles,
                },
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                employeeLevel: true,
                restaurant: {
                    select: {
                        id: true,
                        name: true,
                        address: true,
                    },
                },
            },
            orderBy: [
                {
                    restaurantId: 'asc',
                },
                {
                    name: 'asc',
                },
            ],
        });
        const usersInAudience = await this.filterUsersBySectionAccess(targetUsers, post.section);
        const reads = await this.prisma.newsPostRead.findMany({
            where: {
                newsPostId,
                userId: {
                    in: usersInAudience.map((user) => user.id),
                },
            },
            select: {
                userId: true,
                readAt: true,
            },
        });
        const readByUserId = new Map(reads.map((read) => [read.userId, read.readAt]));
        const grouped = new Map();
        for (const user of usersInAudience) {
            const key = user.restaurant?.id ?? 'UNASSIGNED';
            if (!grouped.has(key)) {
                grouped.set(key, {
                    restaurant: user.restaurant
                        ? {
                            id: user.restaurant.id,
                            name: user.restaurant.name,
                            address: user.restaurant.address,
                        }
                        : null,
                    users: [],
                });
            }
            const bucket = grouped.get(key);
            if (!bucket) {
                continue;
            }
            bucket.users.push({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                readAt: readByUserId.get(user.id) ?? null,
            });
        }
        const byRestaurant = Array.from(grouped.values())
            .map((entry) => {
            const unreadUsers = entry.users
                .filter((user) => !user.readAt)
                .map((user) => ({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            }));
            const readUsers = entry.users
                .filter((user) => user.readAt)
                .map((user) => ({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                readAt: user.readAt,
            }));
            return {
                restaurant: entry.restaurant,
                totalUsers: entry.users.length,
                readCount: readUsers.length,
                unreadCount: unreadUsers.length,
                unreadUsers,
                readUsers,
            };
        })
            .sort((left, right) => {
            if (!left.restaurant && !right.restaurant) {
                return 0;
            }
            if (!left.restaurant) {
                return 1;
            }
            if (!right.restaurant) {
                return -1;
            }
            return left.restaurant.name.localeCompare(right.restaurant.name);
        });
        const totalUsers = byRestaurant.reduce((acc, item) => acc + item.totalUsers, 0);
        const readCount = byRestaurant.reduce((acc, item) => acc + item.readCount, 0);
        return {
            newsPostId,
            totalUsers,
            readCount,
            unreadCount: totalUsers - readCount,
            byRestaurant,
        };
    }
    parseAudience(value) {
        if (!value) {
            return client_1.NewsAudience.ALL;
        }
        if (value === client_1.NewsAudience.ALL ||
            value === client_1.NewsAudience.MANAGERS ||
            value === client_1.NewsAudience.EMPLOYEES) {
            return value;
        }
        throw new common_1.BadRequestException('Invalid audience');
    }
    getAudienceRoles(audience) {
        if (audience === client_1.NewsAudience.MANAGERS) {
            return [client_1.Role.MANAGER];
        }
        if (audience === client_1.NewsAudience.EMPLOYEES) {
            return [client_1.Role.EMPLOYEE];
        }
        return [client_1.Role.MANAGER, client_1.Role.EMPLOYEE];
    }
    ensureCanReadPost(post, context) {
        if (context.role !== 'ADMIN' && context.role !== 'MANAGER' && context.role !== 'EMPLOYEE') {
            throw new common_1.ForbiddenException('Unsupported role');
        }
        if (context.role === 'MANAGER') {
            if (post.audience !== client_1.NewsAudience.ALL && post.audience !== client_1.NewsAudience.MANAGERS) {
                throw new common_1.ForbiddenException('Cannot mark this news as read');
            }
        }
        if (context.role === 'EMPLOYEE') {
            if (post.audience !== client_1.NewsAudience.ALL && post.audience !== client_1.NewsAudience.EMPLOYEES) {
                throw new common_1.ForbiddenException('Cannot mark this news as read');
            }
        }
        if (context.role !== 'ADMIN' && post.section) {
            const allowedSections = (context.trainingAccess ?? []).filter((section) => (0, upload_taxonomy_1.isUploadSection)(section));
            if (!allowedSections.includes(post.section)) {
                throw new common_1.ForbiddenException('Cannot mark this news as read');
            }
        }
    }
    async filterUsersBySectionAccess(users, section) {
        if (!section) {
            return users;
        }
        const profiles = await this.prisma.employeeLevelAccessProfile.findMany({
            select: {
                employeeLevel: true,
                sections: true,
            },
        });
        const accessByLevel = new Map(profiles.map((profile) => {
            const allowedSections = Array.isArray(profile.sections)
                ? profile.sections.filter((entry) => typeof entry === 'string' && (0, upload_taxonomy_1.isUploadSection)(entry))
                : [];
            return [profile.employeeLevel, allowedSections];
        }));
        return users.filter((user) => {
            if (user.role === client_1.Role.ADMIN) {
                return true;
            }
            const allowedSections = accessByLevel.get(user.employeeLevel) ?? [];
            return allowedSections.includes(section);
        });
    }
    parseUploadModule(module) {
        if (!module) {
            return undefined;
        }
        if (module === 'TRAINING' ||
            module === 'POLICY' ||
            module === 'MANAGEMENT' ||
            module === 'FORMS') {
            return module;
        }
        throw new common_1.BadRequestException('Invalid module');
    }
    parseUploadSection(section) {
        if (!section) {
            return undefined;
        }
        if (!(0, upload_taxonomy_1.isUploadSection)(section)) {
            throw new common_1.BadRequestException('Invalid section');
        }
        return section;
    }
    parseMonthRange(month) {
        if (!month) {
            return null;
        }
        const match = /^(\d{4})-(\d{2})$/.exec(month);
        if (!match) {
            throw new common_1.BadRequestException('Invalid month format. Use YYYY-MM');
        }
        const parsedYear = Number(match[1]);
        const parsedMonth = Number(match[2]);
        if (!Number.isInteger(parsedYear) || !Number.isInteger(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
            throw new common_1.BadRequestException('Invalid month value');
        }
        const start = new Date(Date.UTC(parsedYear, parsedMonth - 1, 1, 0, 0, 0));
        const end = new Date(Date.UTC(parsedYear, parsedMonth, 1, 0, 0, 0));
        return { start, end };
    }
    buildFileUrl(req, category, fileName) {
        if (this.publicApiBaseUrl) {
            const normalizedBaseUrl = this.publicApiBaseUrl.replace(/\/$/, '');
            return `${normalizedBaseUrl}/uploads/${category}/${fileName}`;
        }
        const host = req.get('host');
        return `${req.protocol}://${host}/uploads/${category}/${fileName}`;
    }
};
exports.NewsService = NewsService;
exports.NewsService = NewsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NewsService);
//# sourceMappingURL=news.service.js.map