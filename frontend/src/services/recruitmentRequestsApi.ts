import { API_URL } from '../constants/config';
import { throwIfUnauthorized } from './authSession';

export type RecruitmentContractType = 'PART_TIME' | 'FULL_TIME';

export type RecruitmentRequestStatus = 'PENDING' | 'PROCESSED';

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
  processedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateRecruitmentRequestPayload = {
  restaurantId?: number;
  position: string;
  contractType: RecruitmentContractType;
  headcount: number;
  notes?: string;
};

type RawRecruitmentRequestSummary = {
  id?: unknown;
  restaurant?: unknown;
  createdBy?: unknown;
  position?: unknown;
  contractType?: unknown;
  headcount?: unknown;
  notes?: unknown;
  status?: unknown;
  processedBy?: unknown;
  processedAt?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
};

type RawUserSummary = {
  id?: unknown;
  name?: unknown;
  email?: unknown;
};

type RawRestaurantSummary = {
  id?: unknown;
  name?: unknown;
  address?: unknown;
};

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

function toString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function toContractType(value: unknown): RecruitmentContractType {
  return value === 'PART_TIME' ? 'PART_TIME' : 'FULL_TIME';
}

function toRequestStatus(value: unknown): RecruitmentRequestStatus {
  return value === 'PROCESSED' ? 'PROCESSED' : 'PENDING';
}

function mapUserSummary(value: unknown): RecruitmentRequestSummary['createdBy'] {
  const raw = (value ?? {}) as RawUserSummary;

  return {
    id: toNumber(raw.id),
    name: typeof raw.name === 'string' ? raw.name : null,
    email: toString(raw.email),
  };
}

function mapRestaurantSummary(
  value: unknown,
): RecruitmentRequestSummary['restaurant'] {
  const raw = (value ?? {}) as RawRestaurantSummary;

  return {
    id: toNumber(raw.id),
    name: toString(raw.name),
    address: toString(raw.address),
  };
}

function mapRecruitmentRequestSummary(
  value: RawRecruitmentRequestSummary,
): RecruitmentRequestSummary {
  return {
    id: toNumber(value.id),
    restaurant: mapRestaurantSummary(value.restaurant),
    createdBy: mapUserSummary(value.createdBy),
    position: toString(value.position),
    contractType: toContractType(value.contractType),
    headcount: toNumber(value.headcount),
    notes: toString(value.notes),
    status: toRequestStatus(value.status),
    processedBy: value.processedBy ? mapUserSummary(value.processedBy) : null,
    processedAt: typeof value.processedAt === 'string' ? value.processedAt : null,
    createdAt: toString(value.createdAt),
    updatedAt: toString(value.updatedAt),
  };
}

function getErrorMessage(data: unknown, fallback: string): string {
  const errorData = data as { message?: string | string[] };

  if (Array.isArray(errorData.message)) {
    return errorData.message.join(', ');
  }

  return errorData.message ?? fallback;
}

export async function createRecruitmentRequest(
  token: string,
  payload: CreateRecruitmentRequestPayload,
): Promise<RecruitmentRequestSummary> {
  const response = await fetch(`${API_URL}/recruitment-requests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = (await response.json()) as RawRecruitmentRequestSummary | unknown;

  throwIfUnauthorized(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(data, 'Failed to create request'));
  }

  return mapRecruitmentRequestSummary(data as RawRecruitmentRequestSummary);
}

export async function fetchRecruitmentRequests(
  token: string,
  status?: RecruitmentRequestStatus,
): Promise<RecruitmentRequestSummary[]> {
  const params = new URLSearchParams();

  if (status) {
    params.set('status', status);
  }

  const suffix = params.toString() ? `?${params.toString()}` : '';
  const response = await fetch(`${API_URL}/recruitment-requests${suffix}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = (await response.json()) as RawRecruitmentRequestSummary[] | unknown;

  throwIfUnauthorized(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(data, 'Failed to load requests'));
  }

  return Array.isArray(data)
    ? data.map((entry) =>
        mapRecruitmentRequestSummary(entry as RawRecruitmentRequestSummary),
      )
    : [];
}

export async function updateRecruitmentRequestStatus(
  token: string,
  requestId: number,
  status: RecruitmentRequestStatus,
): Promise<RecruitmentRequestSummary> {
  const response = await fetch(
    `${API_URL}/recruitment-requests/${requestId}/status`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    },
  );
  const data = (await response.json()) as RawRecruitmentRequestSummary | unknown;

  throwIfUnauthorized(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(data, 'Failed to update request'));
  }

  return mapRecruitmentRequestSummary(data as RawRecruitmentRequestSummary);
}
