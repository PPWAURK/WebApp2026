export type SupplierItem = {
    id: number;
    name: string;
};
export declare function fetchSuppliers(token: string): Promise<SupplierItem[]>;
export declare function createSupplier(token: string, payload: {
    name: string;
}): Promise<SupplierItem>;
