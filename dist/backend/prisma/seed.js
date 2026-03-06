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
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const prisma = new client_1.PrismaClient();
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function parseAdminEmails(value) {
    if (!value) {
        return [];
    }
    const parsed = value
        .split(',')
        .map((entry) => entry.trim().toLowerCase())
        .filter((entry) => entry.length > 0);
    const unique = Array.from(new Set(parsed));
    const invalid = unique.find((email) => !EMAIL_REGEX.test(email));
    if (invalid) {
        throw new Error(`Invalid admin email: ${invalid}`);
    }
    return unique;
}
async function main() {
    const adminEmailsFromEnv = parseAdminEmails(process.env.ADMIN_EMAILS);
    const adminDefaultPassword = process.env.ADMIN_DEFAULT_PASSWORD?.trim() ?? '';
    const seedDemoUsers = process.env.SEED_DEMO_USERS === 'true';
    const adminEmails = adminEmailsFromEnv.length > 0
        ? adminEmailsFromEnv
        : ['admin@webapp2026.local'];
    let adminsCreated = 0;
    let adminsUpdated = 0;
    for (const email of adminEmails) {
        const existing = await prisma.user.findUnique({
            where: { email },
            select: { id: true },
        });
        if (existing) {
            await prisma.user.update({
                where: { id: existing.id },
                data: {
                    role: client_1.Role.ADMIN,
                    isApproved: true,
                    isOnProbation: false,
                    workplaceRole: client_1.WorkplaceRole.BOTH,
                },
            });
            adminsUpdated += 1;
            continue;
        }
        if (!adminDefaultPassword) {
            throw new Error(`ADMIN_DEFAULT_PASSWORD is required to create admin account: ${email}`);
        }
        const passwordHash = await bcrypt.hash(adminDefaultPassword, 10);
        await prisma.user.create({
            data: {
                email,
                name: null,
                role: client_1.Role.ADMIN,
                isApproved: true,
                isOnProbation: false,
                workplaceRole: client_1.WorkplaceRole.BOTH,
                passwordHash,
            },
        });
        adminsCreated += 1;
    }
    const shouldSeedDemoUsers = adminEmailsFromEnv.length === 0 || seedDemoUsers;
    if (shouldSeedDemoUsers) {
        const demoPassword = await bcrypt.hash('ChangeMe123!', 10);
        await prisma.user.upsert({
            where: { email: 'manager@webapp2026.local' },
            update: {
                name: 'Manager Salle',
                role: client_1.Role.MANAGER,
                isOnProbation: false,
                workplaceRole: client_1.WorkplaceRole.SALLE,
            },
            create: {
                email: 'manager@webapp2026.local',
                name: 'Manager Salle',
                role: client_1.Role.MANAGER,
                isOnProbation: false,
                workplaceRole: client_1.WorkplaceRole.SALLE,
                passwordHash: demoPassword,
            },
        });
        await prisma.user.upsert({
            where: { email: 'employee@webapp2026.local' },
            update: {
                name: 'Employe Cuisine',
                role: client_1.Role.EMPLOYEE,
                isOnProbation: true,
                workplaceRole: client_1.WorkplaceRole.CUISINE,
            },
            create: {
                email: 'employee@webapp2026.local',
                name: 'Employe Cuisine',
                role: client_1.Role.EMPLOYEE,
                isOnProbation: true,
                workplaceRole: client_1.WorkplaceRole.CUISINE,
                passwordHash: demoPassword,
            },
        });
    }
    console.log(`Seed summary: adminsCreated=${adminsCreated}, adminsUpdated=${adminsUpdated}`);
}
main()
    .then(async () => {
    await prisma.$disconnect();
})
    .catch(async (error) => {
    await prisma.$disconnect();
    throw error;
});
//# sourceMappingURL=seed.js.map