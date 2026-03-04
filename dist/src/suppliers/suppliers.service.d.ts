import { PrismaService } from '../prisma/prisma.service';
export declare class SuppliersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    listSuppliers(): Promise<{
        id: number;
        name: string;
    }[]>;
    createSupplier(name: string): Promise<{
        id: number;
        name: string;
    }>;
}
