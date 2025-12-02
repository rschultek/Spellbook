import type { SupabaseClient, AuthError } from "@supabase/supabase-js";
import type { RegisterUserDto, LoginUserDto } from "../../types";

/**
 * Authentication service
 * Handles all auth-related business logic
 */
export class AuthService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Register a new user
   */
  async register(dto: RegisterUserDto) {
    const { data, error } = await this.supabase.auth.signUp({
      email: dto.email,
      password: dto.password,
    });

    if (error) {
      throw this.mapAuthError(error);
    }

    return data;
  }

  /**
   * Login existing user
   */
  async login(dto: LoginUserDto) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: dto.email,
      password: dto.password,
    });

    if (error) {
      throw this.mapAuthError(error);
    }

    return data;
  }

  /**
   * Logout current user
   */
  async logout() {
    const { error } = await this.supabase.auth.signOut();

    if (error) {
      throw this.mapAuthError(error);
    }
  }

  /**
   * Get current session
   */
  async getSession() {
    const { data, error } = await this.supabase.auth.getSession();

    if (error) {
      return null;
    }

    return data.session;
  }

  /**
   * Map Supabase auth errors to user-friendly messages
   */
  private mapAuthError(error: AuthError): Error {
    const errorMessages: Record<string, string> = {
      "Invalid login credentials": "Invalid email or password",
      "User already registered": "An account with this email already exists",
      "Email not confirmed": "Please confirm your email address",
      "Invalid email": "Please enter a valid email address",
    };

    const message = errorMessages[error.message] || `Error: ${error.message}`;
    return new Error(message);
  }
}
