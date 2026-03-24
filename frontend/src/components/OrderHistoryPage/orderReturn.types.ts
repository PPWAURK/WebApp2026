export type ReturnPhotoDraft = {
  id: string;
  uri: string;
  name: string;
  mimeType?: string;
  file?: File;
};

export type SubmitOrderReturnPayload = {
  orderId: number;
  reason: string;
  notes?: string;
  items: Array<{
    purchaseOrderItemId: number;
    quantity: number;
    photos: ReturnPhotoDraft[];
  }>;
};
