"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchTrainingAccessUsers = fetchTrainingAccessUsers;
exports.updateUserTrainingAccess = updateUserTrainingAccess;
exports.fetchTrainingAccessByLevel = fetchTrainingAccessByLevel;
exports.updateTrainingAccessByLevel = updateTrainingAccessByLevel;
exports.fetchTrainingQuizLinks = fetchTrainingQuizLinks;
exports.updateTrainingQuizLink = updateTrainingQuizLink;
exports.fetchUnassignedUsers = fetchUnassignedUsers;
exports.assignUserRestaurant = assignUserRestaurant;
exports.updateUserManagerRole = updateUserManagerRole;
exports.uploadMyProfilePhoto = uploadMyProfilePhoto;
exports.updateMyProfile = updateMyProfile;
exports.confirmUserProbation = confirmUserProbation;
exports.approveUserAccount = approveUserAccount;
exports.deleteUserAccount = deleteUserAccount;
exports.updateUserLevel = updateUserLevel;
exports.updateUserWorkplaceRole = updateUserWorkplaceRole;
const config_1 = require("../constants/config");
const authSession_1 = require("./authSession");
async function fetchTrainingAccessUsers(token, filters) {
    const query = filters?.restaurantId && filters.restaurantId > 0
        ? `?restaurantId=${filters.restaurantId}`
        : '';
    const response = await fetch(`${config_1.API_URL}/users/training-access${query}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    const data = (await response.json());
    (0, authSession_1.throwIfUnauthorized)(response);
    if (!response.ok) {
        const errorData = data;
        const message = Array.isArray(errorData.message)
            ? errorData.message.join(', ')
            : (errorData.message ?? 'Failed to load users');
        throw new Error(message);
    }
    return data;
}
async function updateUserTrainingAccess(token, userId, sections) {
    const response = await fetch(`${config_1.API_URL}/users/${userId}/training-access`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ sections }),
    });
    const data = (await response.json());
    (0, authSession_1.throwIfUnauthorized)(response);
    if (!response.ok) {
        const errorData = data;
        const message = Array.isArray(errorData.message)
            ? errorData.message.join(', ')
            : (errorData.message ?? 'Failed to update training access');
        throw new Error(message);
    }
    return data;
}
async function fetchTrainingAccessByLevel(token) {
    const response = await fetch(`${config_1.API_URL}/users/training-access-by-level`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    const data = (await response.json());
    (0, authSession_1.throwIfUnauthorized)(response);
    if (!response.ok) {
        const errorData = data;
        const message = Array.isArray(errorData.message)
            ? errorData.message.join(', ')
            : (errorData.message ?? 'Failed to load level access profiles');
        throw new Error(message);
    }
    return data;
}
async function updateTrainingAccessByLevel(token, level, sections) {
    const response = await fetch(`${config_1.API_URL}/users/training-access-by-level/${level}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ sections }),
    });
    const data = (await response.json());
    (0, authSession_1.throwIfUnauthorized)(response);
    if (!response.ok) {
        const errorData = data;
        const message = Array.isArray(errorData.message)
            ? errorData.message.join(', ')
            : (errorData.message ?? 'Failed to update level access profile');
        throw new Error(message);
    }
    return data;
}
async function fetchTrainingQuizLinks(token) {
    const response = await fetch(`${config_1.API_URL}/users/training-quiz-links`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    const data = (await response.json());
    (0, authSession_1.throwIfUnauthorized)(response);
    if (!response.ok) {
        const errorData = data;
        const message = Array.isArray(errorData.message)
            ? errorData.message.join(', ')
            : (errorData.message ?? 'Failed to load training quiz links');
        throw new Error(message);
    }
    return data;
}
async function updateTrainingQuizLink(token, section, language, quizUrl) {
    const response = await fetch(`${config_1.API_URL}/users/training-quiz-links/${section}/${language}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ quizUrl }),
    });
    const data = (await response.json());
    (0, authSession_1.throwIfUnauthorized)(response);
    if (!response.ok) {
        const errorData = data;
        const message = Array.isArray(errorData.message)
            ? errorData.message.join(', ')
            : (errorData.message ?? 'Failed to update training quiz link');
        throw new Error(message);
    }
    return data;
}
async function fetchUnassignedUsers(token) {
    const response = await fetch(`${config_1.API_URL}/users/unassigned`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    const data = (await response.json());
    (0, authSession_1.throwIfUnauthorized)(response);
    if (!response.ok) {
        const errorData = data;
        const message = Array.isArray(errorData.message)
            ? errorData.message.join(', ')
            : (errorData.message ?? 'Failed to load unassigned users');
        throw new Error(message);
    }
    return data;
}
async function assignUserRestaurant(token, userId, restaurantId) {
    const response = await fetch(`${config_1.API_URL}/users/${userId}/restaurant`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ restaurantId }),
    });
    const data = (await response.json());
    (0, authSession_1.throwIfUnauthorized)(response);
    if (!response.ok) {
        const errorData = data;
        const message = Array.isArray(errorData.message)
            ? errorData.message.join(', ')
            : (errorData.message ?? 'Failed to assign user restaurant');
        throw new Error(message);
    }
    return data;
}
async function updateUserManagerRole(token, userId, payload) {
    const response = await fetch(`${config_1.API_URL}/users/${userId}/manager-role`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });
    const data = (await response.json());
    (0, authSession_1.throwIfUnauthorized)(response);
    if (!response.ok) {
        const errorData = data;
        const message = Array.isArray(errorData.message)
            ? errorData.message.join(', ')
            : (errorData.message ?? 'Failed to update manager role');
        throw new Error(message);
    }
    return data;
}
async function uploadMyProfilePhoto(token, file) {
    const formData = new FormData();
    if (file.file) {
        formData.append('file', file.file);
    }
    else {
        formData.append('file', {
            uri: file.uri,
            name: file.name,
            type: file.mimeType ?? 'image/jpeg',
        });
    }
    const response = await fetch(`${config_1.API_URL}/users/me/profile-photo`, {
        method: 'PATCH',
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: formData,
    });
    const data = (await response.json());
    (0, authSession_1.throwIfUnauthorized)(response);
    if (!response.ok) {
        const errorData = data;
        const message = Array.isArray(errorData.message)
            ? errorData.message.join(', ')
            : (errorData.message ?? 'Failed to upload profile photo');
        throw new Error(message);
    }
    return data;
}
async function updateMyProfile(token, payload) {
    const response = await fetch(`${config_1.API_URL}/users/me/profile`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });
    const data = (await response.json());
    (0, authSession_1.throwIfUnauthorized)(response);
    if (!response.ok) {
        const errorData = data;
        const message = Array.isArray(errorData.message)
            ? errorData.message.join(', ')
            : (errorData.message ?? 'Failed to update profile');
        throw new Error(message);
    }
    return data;
}
async function confirmUserProbation(token, userId) {
    const response = await fetch(`${config_1.API_URL}/users/${userId}/confirm-probation`, {
        method: 'PATCH',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    const data = (await response.json());
    (0, authSession_1.throwIfUnauthorized)(response);
    if (!response.ok) {
        const errorData = data;
        const message = Array.isArray(errorData.message)
            ? errorData.message.join(', ')
            : (errorData.message ?? 'Failed to confirm probation status');
        throw new Error(message);
    }
    return {
        id: typeof data.id === 'number'
            ? data.id
            : userId,
        isOnProbation: typeof data.isOnProbation === 'boolean'
            ? data.isOnProbation
            : false,
    };
}
async function approveUserAccount(token, userId) {
    const response = await fetch(`${config_1.API_URL}/users/${userId}/approve-account`, {
        method: 'PATCH',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    const data = (await response.json());
    (0, authSession_1.throwIfUnauthorized)(response);
    if (!response.ok) {
        const errorData = data;
        const message = Array.isArray(errorData.message)
            ? errorData.message.join(', ')
            : (errorData.message ?? 'Failed to approve account');
        throw new Error(message);
    }
    return {
        id: typeof data.id === 'number'
            ? data.id
            : userId,
        isApproved: typeof data.isApproved === 'boolean'
            ? data.isApproved
            : true,
    };
}
async function deleteUserAccount(token, userId) {
    const response = await fetch(`${config_1.API_URL}/users/${userId}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    (0, authSession_1.throwIfUnauthorized)(response);
    if (response.ok) {
        return;
    }
    const data = (await response.json());
    const message = Array.isArray(data.message)
        ? data.message.join(', ')
        : (data.message ?? 'Failed to delete account');
    throw new Error(message);
}
async function updateUserLevel(token, userId, level) {
    const response = await fetch(`${config_1.API_URL}/users/${userId}/level`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ level }),
    });
    const data = (await response.json());
    (0, authSession_1.throwIfUnauthorized)(response);
    if (!response.ok) {
        const errorData = data;
        const message = Array.isArray(errorData.message)
            ? errorData.message.join(', ')
            : (errorData.message ?? 'Failed to update employee level');
        throw new Error(message);
    }
    return {
        id: typeof data.id === 'number'
            ? data.id
            : userId,
        employeeLevel: typeof data.employeeLevel === 'string'
            ? data
                .employeeLevel
            : level,
        role: typeof data.role === 'string'
            ? data.role
            : 'EMPLOYEE',
        isOnProbation: typeof data.isOnProbation === 'boolean'
            ? data.isOnProbation
            : level === 'L0_PROBATION',
    };
}
async function updateUserWorkplaceRole(token, userId, workplaceRole) {
    const response = await fetch(`${config_1.API_URL}/users/${userId}/workplace-role`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ workplaceRole }),
    });
    const data = (await response.json());
    (0, authSession_1.throwIfUnauthorized)(response);
    if (!response.ok) {
        const errorData = data;
        const message = Array.isArray(errorData.message)
            ? errorData.message.join(', ')
            : (errorData.message ?? 'Failed to update workplace role');
        throw new Error(message);
    }
    return {
        id: typeof data.id === 'number'
            ? data.id
            : userId,
        workplaceRole: typeof data.workplaceRole === 'string'
            ? data
                .workplaceRole
            : workplaceRole,
    };
}
//# sourceMappingURL=usersApi.js.map