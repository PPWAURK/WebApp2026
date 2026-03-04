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
async function main() {
    const passwordHash = await bcrypt.hash('ChangeMe123!', 10);
    await prisma.user.upsert({
        where: { email: 'admin@webapp2026.local' },
        update: {
            name: 'Admin Principal',
            role: client_1.Role.ADMIN,
            isOnProbation: false,
            workplaceRole: client_1.WorkplaceRole.BOTH,
            passwordHash,
        },
        create: {
            email: 'admin@webapp2026.local',
            name: 'Admin Principal',
            role: client_1.Role.ADMIN,
            isOnProbation: false,
            workplaceRole: client_1.WorkplaceRole.BOTH,
            passwordHash,
        },
    });
    await prisma.user.upsert({
        where: { email: 'manager@webapp2026.local' },
        update: {
            name: 'Manager Salle',
            role: client_1.Role.MANAGER,
            isOnProbation: false,
            workplaceRole: client_1.WorkplaceRole.SALLE,
            passwordHash,
        },
        create: {
            email: 'manager@webapp2026.local',
            name: 'Manager Salle',
            role: client_1.Role.MANAGER,
            isOnProbation: false,
            workplaceRole: client_1.WorkplaceRole.SALLE,
            passwordHash,
        },
    });
    await prisma.user.upsert({
        where: { email: 'employee@webapp2026.local' },
        update: {
            name: 'Employe Cuisine',
            role: client_1.Role.EMPLOYEE,
            isOnProbation: true,
            workplaceRole: client_1.WorkplaceRole.CUISINE,
            passwordHash,
        },
        create: {
            email: 'employee@webapp2026.local',
            name: 'Employe Cuisine',
            role: client_1.Role.EMPLOYEE,
            isOnProbation: true,
            workplaceRole: client_1.WorkplaceRole.CUISINE,
            passwordHash,
        },
    });
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