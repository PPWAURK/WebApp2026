export type OrderRecapItem = {
  orderItemKey: string;
  productId: number;
  specificationSlot: number | null;
  supplierId: number;
  category: string;
  nameZh: string;
  nameFr: string | null;
  specification: string | null;
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
