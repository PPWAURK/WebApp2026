import { API_URL } from '../constants/config';
import type {
  EmployeeLevel,
  Restaurant,
  TrainingSection,
  User,
  WorkplaceRole,
} from '../types/auth';
import { throwIfUnauthorized } from './authSession';

export type TrainingAccessUser = {
  id: number;
  email: string;
  name: string | null;
  profilePhoto?: string | null;
  role: 'ADMIN' | 'REGIONAL_MANAGER' | 'MANAGER' | 'EMPLOYEE';
  workplaceRole: WorkplaceRole;
  employeeLevel: EmployeeLevel;
  isApproved: boolean;
  isEmailVerified: boolean;
  isOnProbation: boolean;
  trainingAccess: TrainingSection[];
  restaurantId?: number | null;
  restaurant?: Pick<Restaurant, 'id' | 'name'> | null;
  managedRestaurants: Restaurant[];
};

export type TrainingAccessByLevelProfile = {
  employeeLevel: EmployeeLevel;
  sections: TrainingSection[];
};

export type TrainingQuizLinkLanguage = 'fr' | 'bn' | 'zh';

export type TrainingQuizLinkItem = {
  section: TrainingSection;
  language: TrainingQuizLinkLanguage;
  quizUrl: string | null;
};

export type UnassignedUser = {
  id: number;
  email: string;
  name: string | null;
  role: 'ADMIN' | 'REGIONAL_MANAGER' | 'MANAGER' | 'EMPLOYEE';
};

export async function fetchTrainingAccessUsers(
  token: string,
  filters?: { restaurantId?: number },
): Promise<TrainingAccessUser[]> {
  const query =
    filters?.restaurantId && filters.restaurantId > 0
      ? `?restaurantId=${filters.restaurantId}`
      : '';

  const response = await fetch(`${API_URL}/users/training-access${query}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = (await response.json()) as
    | TrainingAccessUser[]
    | { message?: string | string[] };

  throwIfUnauthorized(response);

  if (!response.ok) {
    const errorData = data as { message?: string | string[] };
    const message = Array.isArray(errorData.message)
      ? errorData.message.join(', ')
      : (errorData.message ?? 'Failed to load users');
    throw new Error(message);
  }

  return data as TrainingAccessUser[];
}

export async function updateUserTrainingAccess(
  token: string,
  userId: number,
  sections: TrainingSection[],
): Promise<TrainingAccessUser> {
  const response = await fetch(`${API_URL}/users/${userId}/training-access`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ sections }),
  });

  const data = (await response.json()) as
    | TrainingAccessUser
    | { message?: string | string[] };

  throwIfUnauthorized(response);

  if (!response.ok) {
    const errorData = data as { message?: string | string[] };
    const message = Array.isArray(errorData.message)
      ? errorData.message.join(', ')
      : (errorData.message ?? 'Failed to update training access');
    throw new Error(message);
  }

  return data as TrainingAccessUser;
}

export async function fetchTrainingAccessByLevel(
  token: string,
): Promise<TrainingAccessByLevelProfile[]> {
  const response = await fetch(`${API_URL}/users/training-access-by-level`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = (await response.json()) as
    | TrainingAccessByLevelProfile[]
    | { message?: string | string[] };

  throwIfUnauthorized(response);

  if (!response.ok) {
    const errorData = data as { message?: string | string[] };
    const message = Array.isArray(errorData.message)
      ? errorData.message.join(', ')
      : (errorData.message ?? 'Failed to load level access profiles');
    throw new Error(message);
  }

  return data as TrainingAccessByLevelProfile[];
}

export async function updateTrainingAccessByLevel(
  token: string,
  level: EmployeeLevel,
  sections: TrainingSection[],
): Promise<TrainingAccessByLevelProfile> {
  const response = await fetch(
    `${API_URL}/users/training-access-by-level/${level}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ sections }),
    },
  );

  const data = (await response.json()) as
    | TrainingAccessByLevelProfile
    | { message?: string | string[] };

  throwIfUnauthorized(response);

  if (!response.ok) {
    const errorData = data as { message?: string | string[] };
    const message = Array.isArray(errorData.message)
      ? errorData.message.join(', ')
      : (errorData.message ?? 'Failed to update level access profile');
    throw new Error(message);
  }

  return data as TrainingAccessByLevelProfile;
}

export async function fetchTrainingQuizLinks(
  token: string,
): Promise<TrainingQuizLinkItem[]> {
  const response = await fetch(`${API_URL}/users/training-quiz-links`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = (await response.json()) as
    | TrainingQuizLinkItem[]
    | { message?: string | string[] };

  throwIfUnauthorized(response);

  if (!response.ok) {
    const errorData = data as { message?: string | string[] };
    const message = Array.isArray(errorData.message)
      ? errorData.message.join(', ')
      : (errorData.message ?? 'Failed to load training quiz links');
    throw new Error(message);
  }

  return data as TrainingQuizLinkItem[];
}

export async function updateTrainingQuizLink(
  token: string,
  section: TrainingSection,
  language: TrainingQuizLinkLanguage,
  quizUrl: string | null,
): Promise<TrainingQuizLinkItem> {
  const response = await fetch(
    `${API_URL}/users/training-quiz-links/${section}/${language}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ quizUrl }),
    },
  );

  const data = (await response.json()) as
    | TrainingQuizLinkItem
    | { message?: string | string[] };

  throwIfUnauthorized(response);

  if (!response.ok) {
    const errorData = data as { message?: string | string[] };
    const message = Array.isArray(errorData.message)
      ? errorData.message.join(', ')
      : (errorData.message ?? 'Failed to update training quiz link');
    throw new Error(message);
  }

  return data as TrainingQuizLinkItem;
}

export async function fetchUnassignedUsers(
  token: string,
): Promise<UnassignedUser[]> {
  const response = await fetch(`${API_URL}/users/unassigned`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = (await response.json()) as
    | UnassignedUser[]
    | { message?: string | string[] };

  throwIfUnauthorized(response);

  if (!response.ok) {
    const errorData = data as { message?: string | string[] };
    const message = Array.isArray(errorData.message)
      ? errorData.message.join(', ')
      : (errorData.message ?? 'Failed to load unassigned users');
    throw new Error(message);
  }

  return data as UnassignedUser[];
}

export async function assignUserRestaurant(
  token: string,
  userId: number,
  restaurantId: number,
) {
  const response = await fetch(`${API_URL}/users/${userId}/restaurant`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ restaurantId }),
  });

  const data = (await response.json()) as
    | { id: number }
    | { message?: string | string[] };

  throwIfUnauthorized(response);

  if (!response.ok) {
    const errorData = data as { message?: string | string[] };
    const message = Array.isArray(errorData.message)
      ? errorData.message.join(', ')
      : (errorData.message ?? 'Failed to assign user restaurant');
    throw new Error(message);
  }

  return data as { id: number };
}

export async function updateUserManagerRole(
  token: string,
  userId: number,
  payload: { isManager: boolean; restaurantId?: number },
): Promise<TrainingAccessUser> {
  const response = await fetch(`${API_URL}/users/${userId}/manager-role`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as
    | TrainingAccessUser
    | { message?: string | string[] };

  throwIfUnauthorized(response);

  if (!response.ok) {
    const errorData = data as { message?: string | string[] };
    const message = Array.isArray(errorData.message)
      ? errorData.message.join(', ')
      : (errorData.message ?? 'Failed to update manager role');
    throw new Error(message);
  }

  return data as TrainingAccessUser;
}

export async function updateUserSupervisorRole(
  token: string,
  userId: number,
  payload: {
    role: 'EMPLOYEE' | 'MANAGER' | 'REGIONAL_MANAGER';
    primaryRestaurantId?: number;
    managedRestaurantIds?: number[];
  },
): Promise<TrainingAccessUser> {
  const response = await fetch(`${API_URL}/users/${userId}/supervisor-role`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as
    | TrainingAccessUser
    | { message?: string | string[] };

  throwIfUnauthorized(response);

  if (!response.ok) {
    const errorData = data as { message?: string | string[] };
    const message = Array.isArray(errorData.message)
      ? errorData.message.join(', ')
      : (errorData.message ?? 'Failed to update supervisor role');
    throw new Error(message);
  }

  return data as TrainingAccessUser;
}

type PickedFile = {
  uri: string;
  name: string;
  mimeType?: string;
  file?: File;
};

export async function uploadMyProfilePhoto(
  token: string,
  file: PickedFile,
): Promise<User> {
  const formData = new FormData();

  if (file.file) {
    formData.append('file', file.file);
  } else {
    formData.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.mimeType ?? 'image/jpeg',
    } as never);
  }

  const response = await fetch(`${API_URL}/users/me/profile-photo`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = (await response.json()) as
    | User
    | { message?: string | string[] };

  throwIfUnauthorized(response);

  if (!response.ok) {
    const errorData = data as { message?: string | string[] };
    const message = Array.isArray(errorData.message)
      ? errorData.message.join(', ')
      : (errorData.message ?? 'Failed to upload profile photo');
    throw new Error(message);
  }

  return data as User;
}

export async function updateMyProfile(
  token: string,
  payload: { name: string },
): Promise<User> {
  const response = await fetch(`${API_URL}/users/me/profile`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as
    | User
    | { message?: string | string[] };

  throwIfUnauthorized(response);

  if (!response.ok) {
    const errorData = data as { message?: string | string[] };
    const message = Array.isArray(errorData.message)
      ? errorData.message.join(', ')
      : (errorData.message ?? 'Failed to update profile');
    throw new Error(message);
  }

  return data as User;
}

export async function updateMyEmail(
  token: string,
  payload: { email: string; currentPassword: string },
): Promise<User> {
  const response = await fetch(`${API_URL}/users/me/email`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as
    | User
    | { message?: string | string[] };

  throwIfUnauthorized(response);

  if (!response.ok) {
    const errorData = data as { message?: string | string[] };
    const message = Array.isArray(errorData.message)
      ? errorData.message.join(', ')
      : (errorData.message ?? 'Failed to update email');
    throw new Error(message);
  }

  return data as User;
}

export async function updateMyPassword(
  token: string,
  payload: { currentPassword: string; newPassword: string },
): Promise<{ success: boolean }> {
  const response = await fetch(`${API_URL}/users/me/password`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as
    | { success?: unknown }
    | { message?: string | string[] };

  throwIfUnauthorized(response);

  if (!response.ok) {
    const errorData = data as { message?: string | string[] };
    const message = Array.isArray(errorData.message)
      ? errorData.message.join(', ')
      : (errorData.message ?? 'Failed to update password');
    throw new Error(message);
  }

  return {
    success: Boolean((data as { success?: unknown }).success),
  };
}

export async function confirmUserProbation(
  token: string,
  userId: number,
): Promise<{ id: number; isOnProbation: boolean }> {
  const response = await fetch(`${API_URL}/users/${userId}/confirm-probation`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = (await response.json()) as
    | { id?: unknown; isOnProbation?: unknown; message?: string | string[] }
    | { message?: string | string[] };

  throwIfUnauthorized(response);

  if (!response.ok) {
    const errorData = data as { message?: string | string[] };
    const message = Array.isArray(errorData.message)
      ? errorData.message.join(', ')
      : (errorData.message ?? 'Failed to confirm probation status');
    throw new Error(message);
  }

  return {
    id:
      typeof (data as { id?: unknown }).id === 'number'
        ? ((data as { id: number }).id as number)
        : userId,
    isOnProbation:
      typeof (data as { isOnProbation?: unknown }).isOnProbation === 'boolean'
        ? ((data as { isOnProbation: boolean }).isOnProbation as boolean)
        : false,
  };
}

export async function approveUserAccount(
  token: string,
  userId: number,
): Promise<{ id: number; isApproved: boolean }> {
  const response = await fetch(`${API_URL}/users/${userId}/approve-account`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = (await response.json()) as
    | { id?: unknown; isApproved?: unknown; message?: string | string[] }
    | { message?: string | string[] };

  throwIfUnauthorized(response);

  if (!response.ok) {
    const errorData = data as { message?: string | string[] };
    const message = Array.isArray(errorData.message)
      ? errorData.message.join(', ')
      : (errorData.message ?? 'Failed to approve account');
    throw new Error(message);
  }

  return {
    id:
      typeof (data as { id?: unknown }).id === 'number'
        ? ((data as { id: number }).id as number)
        : userId,
    isApproved:
      typeof (data as { isApproved?: unknown }).isApproved === 'boolean'
        ? ((data as { isApproved: boolean }).isApproved as boolean)
        : true,
  };
}

export async function deleteUserAccount(
  token: string,
  userId: number,
): Promise<void> {
  const response = await fetch(`${API_URL}/users/${userId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  throwIfUnauthorized(response);

  if (response.ok) {
    return;
  }

  const data = (await response.json()) as { message?: string | string[] };
  const message = Array.isArray(data.message)
    ? data.message.join(', ')
    : (data.message ?? 'Failed to delete account');
  throw new Error(message);
}

export async function rejectUserAccount(
  token: string,
  userId: number,
): Promise<void> {
  const response = await fetch(`${API_URL}/users/${userId}/reject-account`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  throwIfUnauthorized(response);

  if (response.ok) {
    return;
  }

  const data = (await response.json()) as { message?: string | string[] };
  const message = Array.isArray(data.message)
    ? data.message.join(', ')
    : (data.message ?? 'Failed to reject account');
  throw new Error(message);
}

export async function updateUserLevel(
  token: string,
  userId: number,
  level: EmployeeLevel,
): Promise<{
  id: number;
  employeeLevel: EmployeeLevel;
  role: 'ADMIN' | 'REGIONAL_MANAGER' | 'MANAGER' | 'EMPLOYEE';
  isOnProbation: boolean;
}> {
  const response = await fetch(`${API_URL}/users/${userId}/level`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ level }),
  });

  const data = (await response.json()) as
    | {
        id?: unknown;
        employeeLevel?: unknown;
        role?: unknown;
        isOnProbation?: unknown;
        message?: string | string[];
      }
    | { message?: string | string[] };

  throwIfUnauthorized(response);

  if (!response.ok) {
    const errorData = data as { message?: string | string[] };
    const message = Array.isArray(errorData.message)
      ? errorData.message.join(', ')
      : (errorData.message ?? 'Failed to update employee level');
    throw new Error(message);
  }

  return {
    id:
      typeof (data as { id?: unknown }).id === 'number'
        ? (data as { id: number }).id
        : userId,
    employeeLevel:
      typeof (data as { employeeLevel?: unknown }).employeeLevel === 'string'
        ? ((data as { employeeLevel: EmployeeLevel })
            .employeeLevel as EmployeeLevel)
        : level,
    role:
      typeof (data as { role?: unknown }).role === 'string'
        ? ((data as {
            role: 'ADMIN' | 'REGIONAL_MANAGER' | 'MANAGER' | 'EMPLOYEE';
          }).role as
            | 'ADMIN'
            | 'REGIONAL_MANAGER'
            | 'MANAGER'
            | 'EMPLOYEE')
        : 'EMPLOYEE',
    isOnProbation:
      typeof (data as { isOnProbation?: unknown }).isOnProbation === 'boolean'
        ? (data as { isOnProbation: boolean }).isOnProbation
        : level === 'L0_PROBATION',
  };
}

export async function updateUserWorkplaceRole(
  token: string,
  userId: number,
  workplaceRole: WorkplaceRole,
): Promise<{ id: number; workplaceRole: WorkplaceRole }> {
  const response = await fetch(`${API_URL}/users/${userId}/workplace-role`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ workplaceRole }),
  });

  const data = (await response.json()) as
    | {
        id?: unknown;
        workplaceRole?: unknown;
        message?: string | string[];
      }
    | { message?: string | string[] };

  throwIfUnauthorized(response);

  if (!response.ok) {
    const errorData = data as { message?: string | string[] };
    const message = Array.isArray(errorData.message)
      ? errorData.message.join(', ')
      : (errorData.message ?? 'Failed to update workplace role');
    throw new Error(message);
  }

  return {
    id:
      typeof (data as { id?: unknown }).id === 'number'
        ? (data as { id: number }).id
        : userId,
    workplaceRole:
      typeof (data as { workplaceRole?: unknown }).workplaceRole === 'string'
        ? ((data as { workplaceRole: WorkplaceRole })
            .workplaceRole as WorkplaceRole)
        : workplaceRole,
  };
}
