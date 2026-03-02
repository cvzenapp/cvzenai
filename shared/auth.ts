/**
 * Authentication related types and interfaces
 */

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
  emailVerified: boolean;
  profile?: {
    bio?: string;
    location?: string;
    website?: string;
    linkedin?: string;
    github?: string;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
  errors?: Record<string, string>;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UpdateProfileRequest {
  name?: string;
  avatar?: string;
  profile?: {
    bio?: string;
    location?: string;
    website?: string;
    linkedin?: string;
    github?: string;
  };
}

export interface AuthError {
  code: string;
  message: string;
  field?: string;
}

export interface LoginAttempt {
  ip: string;
  userAgent: string;
  timestamp: string;
  success: boolean;
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  loginAttempts: LoginAttempt[];
  lastLogin?: string;
  sessionTimeout: number;
}
