import type {
  RecruitmentContractType,
  RecruitmentRequestStatus,
} from '@prisma/client';

export type RecruitmentRequestActor = {
  id: number;
  role: string;
  restaurantId: number | null;
  managedRestaurantIds: number[];
};

export type RecruitmentRequestSummary = {
  id: number;
  restaurant: {
    id: number;
    name: string;
    address: string;
  };
  createdBy: {
    id: number;
    name: string | null;
    email: string;
  };
  position: string;
  contractType: RecruitmentContractType;
  headcount: number;
  notes: string;
  status: RecruitmentRequestStatus;
  processedBy: {
    id: number;
    name: string | null;
    email: string;
  } | null;
  processedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};
