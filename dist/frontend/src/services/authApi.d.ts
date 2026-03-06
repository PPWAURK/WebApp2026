import type { Language } from '../types/language';
import type { AuthMode, AuthResponse, RegisterResponse } from '../types/auth';
type AuthPayload = {
    email: string;
    password: string;
    name?: string;
    restaurantId?: number;
    language?: Language;
};
export declare function requestAuth(mode: AuthMode, payload: AuthPayload): Promise<AuthResponse | RegisterResponse>;
export declare function requestForgotPassword(email: string, language: Language): Promise<{
    message: string;
}>;
export declare function requestResetPassword(token: string, password: string): Promise<{
    message: string;
}>;
export {};
