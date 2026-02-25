export type OrderRecapItem = {
  productId: number;
  supplierId: number;
  category: string;
  nameZh: string;
  nameFr: string | null;
  unit: string | null;
  priceHt: number | null;
  image: string | null;
  quantity: number;
  lineTotal: number;
};

export type OrderRecapData = {
  items: OrderRecapItem[];
  totalItems: number;
  totalAmount: number;
};
