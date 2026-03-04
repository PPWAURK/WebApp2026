import type { Request } from 'express';
import { SuppliersService } from './suppliers.service';
type AuthenticatedRequest = Request & {
    user?: {
        role?: string;
    };
};
export declare class SuppliersController {
    private readonly suppliersService;
    constructor(suppliersService: SuppliersService);
    listSuppliers(req: AuthenticatedRequest): Promise<{
        id: number;
        name: string;
    }[]>;
    createSupplier(req: AuthenticatedRequest, name: string | undefined): Promise<{
        id: number;
        name: string;
    }>;
}
export {};
