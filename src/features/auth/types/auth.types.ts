import { User, Session } from '@supabase/supabase-js';

export type AuthUser = User;
export type AuthSession = Session;

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface AuthState {
  user: AuthUser | null;
  session: AuthSession | null;
  isLoading: boolean;
  error: string | null;
}

export interface AuthError {
  message: string;
  code?: string;
}

export type AuthResponse = {
  success: boolean;
  error?: AuthError;
};

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetUpdate {
  password: string;
  confirmPassword: string;
}

export interface PasswordResetState {
  isLoading: boolean;
  error: string | null;
  success: boolean;
  message: string | null;
}

export interface PasswordValidation {
  isValid: boolean;
  errors: string[];
}
