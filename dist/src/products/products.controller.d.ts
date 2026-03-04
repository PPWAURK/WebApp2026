import type { Request } from 'express';
import { ProductsService } from './products.service';
type AuthenticatedRequest = Request & {
    user?: {
        role?: string;
    };
};
export declare class ProductsController {
    private readonly productsService;
    constructor(productsService: ProductsService);
    listProducts(req: AuthenticatedRequest): Promise<{
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
    updateProduct(req: AuthenticatedRequest, productId: number, body: {
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
    updateProductImage(req: Request & {
        user?: {
            role?: string;
        };
    }, productId: number, file: Express.Multer.File): Promise<{
        id: number;
        image: string | null;
    }>;
    deleteProduct(req: AuthenticatedRequest, productId: number): Promise<{
        success: boolean;
        id: number;
    }>;
}
export {};
