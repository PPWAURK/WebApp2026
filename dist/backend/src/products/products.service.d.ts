import { PrismaService } from '../prisma/prisma.service';
export declare class ProductsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private readonly publicApiBaseUrl;
    listProducts(): Promise<{
        id: number;
        supplierId: number;
        reference: string | null;
        category: string;
        nameZh: string;
        nameFr: string | null;
        specification: string | null;
        unit: string | null;
        priceHt: number | null;
        image: string | null;
    }[]>;
    updateProduct(productId: number, payload: {
        supplierId?: number;
        reference?: string | null;
        category?: string;
        nameZh?: string;
        nameFr?: string | null;
        specification?: string | null;
        unit?: string | null;
        priceHt?: number | null;
        image?: string | null;
    }): Promise<{
        id: number;
        supplierId: number;
        reference: string | null;
        category: string;
        nameZh: string;
        nameFr: string | null;
        specification: string | null;
        unit: string | null;
        priceHt: number | null;
        image: string | null;
    }>;
    updateProductImage(productId: number, file: Express.Multer.File, req: {
        protocol: string;
        get: (name: string) => string | undefined;
    }): Promise<{
        id: number;
        image: string | null;
    }>;
    deleteProduct(productId: number): Promise<{
        success: boolean;
        id: number;
    }>;
    private buildImageUrl;
}
