import type { AuthResponse } from '../types/auth';
export declare function loadStoredSession(): Promise<{
    session: AuthResponse | null;
    rememberMe: boolean;
}>;
export declare function persistSession(session: AuthResponse, rememberMe: boolean): Promise<void>;
export declare function clearSession(): Promise<void>;
