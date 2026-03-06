export type ProductItem = {
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
};
type PickedFile = {
    uri: string;
    name: string;
    mimeType?: string;
    file?: File;
};
export declare function fetchProducts(token: string): Promise<ProductItem[]>;
export declare function updateProduct(token: string, productId: number, payload: {
    supplierId?: number;
    reference?: string | null;
    category?: string;
    nameZh?: string;
    nameFr?: string | null;
    specification?: string | null;
    unit?: string | null;
    priceHt?: number | null;
    image?: string | null;
}): Promise<ProductItem>;
export declare function deleteProduct(token: string, productId: number): Promise<void>;
export declare function uploadProductImage(token: string, productId: number, file: PickedFile): Promise<string>;
export {};
