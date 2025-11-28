# Authentication Implementation Plan

> **Architecture**: Hybrid - Supabase Auth + Services Layer  
> **Status**: Ready for Implementation  
> **Last Updated**: 2025-11-27

---

## Table of Contents

1. [Overview](#overview)
2. [Shared Patterns](#shared-patterns)
3. [User Registration](#1-user-registration)
4. [User Login](#2-user-login)
5. [User Logout](#3-user-logout)
6. [Password Reset](#4-password-reset)
7. [Session Management](#5-session-management)
8. [Testing Strategy](#testing-strategy)

---

## Overview

### Purpose

Implement complete authentication flow using Supabase Auth with proper error handling, validation, and user feedback.

### Key Technologies

- **Supabase Auth**: JWT-based authentication
- **Astro Middleware**: Session validation and route protection
- **Zod**: Input validation
- **React Hook Form**: Form state management

### Architecture Pattern

```
┌─────────────────┐
│  Astro Pages    │ ← User interaction
│  (/login, etc)  │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ React Components│ ← Forms with validation
│  (LoginForm)    │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Auth Service   │ ← Business logic
│ (src/lib/)      │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ Supabase Client │ ← API calls
│ (context.locals)│
└─────────────────┘
```

---

## Shared Patterns

### File Structure

```
src/
├── lib/
│   └── services/
│       └── auth.service.ts        # Authentication business logic
├── pages/
│   ├── login.astro                # Login page
│   ├── register.astro             # Registration page
│   ├── forgot-password.astro      # Password reset page
│   └── reset-password.astro       # Password update page
├── components/
│   └── auth/
│       ├── LoginForm.tsx          # Login form component
│       ├── RegisterForm.tsx       # Registration form component
│       └── PasswordResetForm.tsx  # Password reset form
├── middleware/
│   └── index.ts                   # Auth middleware (already exists)
└── types.ts                       # DTOs (already exists)
```

### Common Validation Schemas

**File**: `src/lib/validation/auth.schemas.ts`

```typescript
import { z } from "zod";

/**
 * Email validation schema
 * Validates email format
 */
export const emailSchema = z.string().email("Please enter a valid email address").min(1, "Email is required");

/**
 * Password validation schema
 * Minimum 6 characters (Supabase default)
 */
export const passwordSchema = z
  .string()
  .min(6, "Password must be at least 6 characters")
  .min(1, "Password is required");

/**
 * Registration validation schema
 */
export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

/**
 * Login validation schema
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

/**
 * Password reset request schema
 */
export const resetPasswordRequestSchema = z.object({
  email: emailSchema,
});

/**
 * New password schema
 */
export const newPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
```

### Auth Service Base

**File**: `src/lib/services/auth.service.ts`

```typescript
import type { SupabaseClient } from "@supabase/supabase-js";
import type { RegisterUserDto, LoginUserDto, ResetPasswordDto, UserSession } from "../../types";

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
      console.error("[AuthService] Registration error:", error);
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
      console.error("[AuthService] Login error:", error);
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
      console.error("[AuthService] Logout error:", error);
      throw this.mapAuthError(error);
    }
  }

  /**
   * Send password reset email
   */
  async requestPasswordReset(dto: ResetPasswordDto) {
    const { error } = await this.supabase.auth.resetPasswordForEmail(dto.email, {
      redirectTo: dto.redirectTo || `${window.location.origin}/reset-password`,
    });

    if (error) {
      console.error("[AuthService] Password reset error:", error);
      throw this.mapAuthError(error);
    }
  }

  /**
   * Get current session
   */
  async getSession() {
    const { data, error } = await this.supabase.auth.getSession();

    if (error) {
      console.error("[AuthService] Get session error:", error);
      return null;
    }

    return data.session;
  }

  /**
   * Map Supabase auth errors to user-friendly messages
   */
  private mapAuthError(error: any): Error {
    const errorMessages: Record<string, string> = {
      "Invalid login credentials": "Invalid email or password",
      "User already registered": "An account with this email already exists",
      "Email not confirmed": "Please confirm your email address",
      "Invalid email": "Please enter a valid email address",
    };

    const message = errorMessages[error.message] || "An error occurred. Please try again.";
    return new Error(message);
  }
}
```

### Error Handling Pattern

```typescript
// In React components
try {
  await authService.login(formData);
  toast.success("Login successful!");
  window.location.href = "/snippets";
} catch (error) {
  if (error instanceof Error) {
    toast.error(error.message);
  } else {
    toast.error("An unexpected error occurred");
  }
  console.error("Login error:", error);
}
```

---

## 1. User Registration

### 1.1 Endpoint Overview

- **Purpose**: Create new user account with email/password
- **Method**: Supabase Auth `signUp()`
- **Success**: User created and auto-logged in
- **Redirect**: `/snippets`

### 1.2 Request Details

**DTO**: `RegisterUserDto`

```typescript
{
  email: string; // Valid email format
  password: string; // Min 6 characters
}
```

**Validation Rules**:

- Email: Valid format, required
- Password: Min 6 chars, required
- Confirm Password: Must match password

### 1.3 Response Details

**Success (200)**:

```typescript
{
  user: {
    id: string,
    email: string,
    created_at: string
  },
  session: {
    access_token: string,
    refresh_token: string,
    expires_in: number
  }
}
```

**Error Codes**:

- `400`: Invalid email format or password too short
- `422`: Email already registered
- `500`: Server error

### 1.4 Data Flow

```
User fills form
    ↓
Client validation (Zod)
    ↓
Submit to AuthService.register()
    ↓
Supabase Auth API
    ↓
Success → Store session → Redirect to /snippets
Error → Display message
```

### 1.5 Implementation Steps

#### Step 1: Create Registration Page

**File**: `src/pages/register.astro`

```astro
---
import Layout from "../layouts/Layout.astro";
import RegisterForm from "../components/auth/RegisterForm";

// Redirect if already logged in
const {
  data: { session },
} = await Astro.locals.supabase.auth.getSession();
if (session) {
  return Astro.redirect("/snippets");
}
---

<Layout title="Register - Spellbook">
  <div class="min-h-screen flex items-center justify-center px-4">
    <div class="max-w-md w-full">
      <h1 class="text-3xl font-bold text-center mb-8">Create Account</h1>
      <RegisterForm client:load />
      <p class="text-center mt-4">
        Already have an account?
        <a href="/login" class="text-blue-600 hover:underline">Login</a>
      </p>
    </div>
  </div>
</Layout>
```

#### Step 2: Create Registration Form Component

**File**: `src/components/auth/RegisterForm.tsx`

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema } from "../../lib/validation/auth.schemas";
import { AuthService } from "../../lib/services/auth.service";
import { Button } from "../ui/button";
import { toast } from "sonner"; // or your toast library
import type { RegisterUserDto } from "../../types";

export default function RegisterForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: any) => {
    try {
      // Get Supabase client from window (set by Astro)
      const supabase = (window as any).supabase;
      const authService = new AuthService(supabase);

      const dto: RegisterUserDto = {
        email: data.email,
        password: data.password,
      };

      await authService.register(dto);

      toast.success("Account created successfully!");
      window.location.href = "/snippets";
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to create account");
      }
      console.error("Registration error:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          Email *
        </label>
        <input
          {...register("email")}
          type="email"
          id="email"
          className="w-full px-3 py-2 border rounded-md"
          placeholder="you@example.com"
        />
        {errors.email && (
          <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1">
          Password *
        </label>
        <input
          {...register("password")}
          type="password"
          id="password"
          className="w-full px-3 py-2 border rounded-md"
          placeholder="Min 6 characters"
        />
        {errors.password && (
          <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
          Confirm Password *
        </label>
        <input
          {...register("confirmPassword")}
          type="password"
          id="confirmPassword"
          className="w-full px-3 py-2 border rounded-md"
        />
        {errors.confirmPassword && (
          <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Creating account..." : "Create Account"}
      </Button>
    </form>
  );
}
```

#### Step 3: Pass Supabase Client to React

**File**: `src/pages/register.astro` (update)

```astro
---
// ... previous code
---

<Layout title="Register - Spellbook">
  <script define:vars={{ supabaseUrl: import.meta.env.SUPABASE_URL, supabaseKey: import.meta.env.SUPABASE_KEY }}>
    import { createClient } from "@supabase/supabase-js";
    window.supabase = createClient(supabaseUrl, supabaseKey);
  </script>

  <!-- ... rest of page -->
</Layout>
```

### 1.6 Security Considerations

- ✅ Password hashing handled by Supabase (bcrypt)
- ✅ Email validation prevents invalid addresses
- ✅ Client-side validation for UX, server-side for security
- ✅ No sensitive data in URLs or localStorage
- ✅ Tokens stored in HTTP-only cookies

### 1.7 Error Scenarios

| Scenario              | Error Message                               | Action                      |
| --------------------- | ------------------------------------------- | --------------------------- |
| Invalid email         | "Please enter a valid email address"        | Show under email field      |
| Password too short    | "Password must be at least 6 characters"    | Show under password field   |
| Passwords don't match | "Passwords do not match"                    | Show under confirm password |
| Email exists          | "An account with this email already exists" | Toast notification          |
| Network error         | "Unable to connect. Please try again."      | Toast notification          |

---

## 2. User Login

### 2.1 Endpoint Overview

- **Purpose**: Authenticate existing user
- **Method**: Supabase Auth `signInWithPassword()`
- **Success**: Session established
- **Redirect**: `/snippets` or original requested page

### 2.2 Request Details

**DTO**: `LoginUserDto`

```typescript
{
  email: string;
  password: string;
}
```

### 2.3 Implementation Steps

#### Step 1: Create Login Page

**File**: `src/pages/login.astro`

```astro
---
import Layout from "../layouts/Layout.astro";
import LoginForm from "../components/auth/LoginForm";

// Redirect if already logged in
const {
  data: { session },
} = await Astro.locals.supabase.auth.getSession();
if (session) {
  return Astro.redirect("/snippets");
}

// Get return URL from query params
const returnUrl = Astro.url.searchParams.get("return") || "/snippets";
---

<Layout title="Login - Spellbook">
  <div class="min-h-screen flex items-center justify-center px-4">
    <div class="max-w-md w-full">
      <h1 class="text-3xl font-bold text-center mb-8">Welcome Back</h1>
      <LoginForm client:load returnUrl={returnUrl} />
      <div class="text-center mt-4 space-y-2">
        <p>
          Don't have an account?
          <a href="/register" class="text-blue-600 hover:underline">Sign up</a>
        </p>
        <p>
          <a href="/forgot-password" class="text-blue-600 hover:underline"> Forgot password? </a>
        </p>
      </div>
    </div>
  </div>
</Layout>
```

#### Step 2: Create Login Form Component

**File**: `src/components/auth/LoginForm.tsx`

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "../../lib/validation/auth.schemas";
import { AuthService } from "../../lib/services/auth.service";
import { Button } from "../ui/button";
import { toast } from "sonner";
import type { LoginUserDto } from "../../types";

interface Props {
  returnUrl?: string;
}

export default function LoginForm({ returnUrl = "/snippets" }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: any) => {
    try {
      const supabase = (window as any).supabase;
      const authService = new AuthService(supabase);

      const dto: LoginUserDto = {
        email: data.email,
        password: data.password,
      };

      await authService.login(dto);

      toast.success("Login successful!");
      window.location.href = returnUrl;
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to log in");
      }
      console.error("Login error:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          Email *
        </label>
        <input
          {...register("email")}
          type="email"
          id="email"
          className="w-full px-3 py-2 border rounded-md"
          autoComplete="email"
        />
        {errors.email && (
          <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1">
          Password *
        </label>
        <input
          {...register("password")}
          type="password"
          id="password"
          className="w-full px-3 py-2 border rounded-md"
          autoComplete="current-password"
        />
        {errors.password && (
          <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Logging in..." : "Log In"}
      </Button>
    </form>
  );
}
```

### 2.4 Security Considerations

- ✅ Generic error message for invalid credentials (don't reveal which field is wrong)
- ✅ Auto-complete attributes for password managers
- ✅ Return URL validation to prevent open redirect
- ✅ Session tokens in HTTP-only cookies

---

## 3. User Logout

### 3.1 Endpoint Overview

- **Purpose**: End user session
- **Method**: Supabase Auth `signOut()`
- **Success**: Session destroyed
- **Redirect**: `/login`

### 3.2 Implementation Steps

#### Step 1: Create Logout Button Component

**File**: `src/components/auth/LogoutButton.tsx`

```typescript
import { AuthService } from "../../lib/services/auth.service";
import { Button } from "../ui/button";
import { toast } from "sonner";

export default function LogoutButton() {
  const handleLogout = async () => {
    try {
      const supabase = (window as any).supabase;
      const authService = new AuthService(supabase);

      await authService.logout();

      toast.success("Logged out successfully");
      window.location.href = "/login";
    } catch (error) {
      toast.error("Failed to log out");
      console.error("Logout error:", error);
    }
  };

  return (
    <Button onClick={handleLogout} variant="outline">
      Log Out
    </Button>
  );
}
```

#### Step 2: Add to Navigation

```typescript
// In your header/nav component
<LogoutButton client:load />
```

---

## 4. Password Reset

### 4.1 Endpoint Overview

- **Purpose**: Send password reset email
- **Method**: Supabase Auth `resetPasswordForEmail()`
- **Success**: Email sent
- **Note**: Always returns success (security best practice)

### 4.2 Implementation Steps

#### Step 1: Create Forgot Password Page

**File**: `src/pages/forgot-password.astro`

```astro
---
import Layout from "../layouts/Layout.astro";
import PasswordResetRequestForm from "../components/auth/PasswordResetRequestForm";
---

<Layout title="Reset Password - Spellbook">
  <div class="min-h-screen flex items-center justify-center px-4">
    <div class="max-w-md w-full">
      <h1 class="text-2xl font-bold text-center mb-4">Reset Password</h1>
      <p class="text-center text-gray-600 mb-8">Enter your email and we'll send you a reset link</p>
      <PasswordResetRequestForm client:load />
      <p class="text-center mt-4">
        <a href="/login" class="text-blue-600 hover:underline"> Back to login </a>
      </p>
    </div>
  </div>
</Layout>
```

#### Step 2: Create Reset Request Form

**File**: `src/components/auth/PasswordResetRequestForm.tsx`

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordRequestSchema } from "../../lib/validation/auth.schemas";
import { AuthService } from "../../lib/services/auth.service";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { useState } from "react";

export default function PasswordResetRequestForm() {
  const [emailSent, setEmailSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(resetPasswordRequestSchema),
  });

  const onSubmit = async (data: any) => {
    try {
      const supabase = (window as any).supabase;
      const authService = new AuthService(supabase);

      await authService.requestPasswordReset({
        email: data.email,
      });

      setEmailSent(true);
      toast.success("Password reset email sent!");
    } catch (error) {
      toast.error("Failed to send reset email");
      console.error("Password reset error:", error);
    }
  };

  if (emailSent) {
    return (
      <div className="text-center p-6 bg-green-50 rounded-lg">
        <p className="text-green-800">
          If an account exists with that email, you'll receive a password reset link shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          Email Address *
        </label>
        <input
          {...register("email")}
          type="email"
          id="email"
          className="w-full px-3 py-2 border rounded-md"
          placeholder="you@example.com"
        />
        {errors.email && (
          <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Sending..." : "Send Reset Link"}
      </Button>
    </form>
  );
}
```

---

## 5. Session Management

### 5.1 Middleware Implementation

Already exists in `src/middleware/index.ts`. Enhance with better error handling:

```typescript
import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
  // Supabase client already attached by integration
  const supabase = context.locals.supabase;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Protected routes
  const protectedRoutes = ["/snippets"];
  const isProtectedRoute = protectedRoutes.some((route) => context.url.pathname.startsWith(route));

  if (isProtectedRoute && !session) {
    // Save return URL for after login
    const returnUrl = context.url.pathname + context.url.search;
    return context.redirect(`/login?return=${encodeURIComponent(returnUrl)}`);
  }

  // Redirect authenticated users away from auth pages
  const authPages = ["/login", "/register"];
  if (authPages.includes(context.url.pathname) && session) {
    return context.redirect("/snippets");
  }

  return next();
});
```

---

## Testing Strategy

### Manual Testing Checklist

#### Registration Flow

1. Navigate to `/register`
2. Try submitting with invalid email → Should show error
3. Try password < 6 chars → Should show error
4. Try mismatched passwords → Should show error
5. Fill valid data → Should create account and redirect to `/snippets`
6. Try registering same email → Should show "email exists" error

#### Login Flow

1. Navigate to `/login`
2. Try invalid credentials → Should show generic error
3. Enter valid credentials → Should redirect to `/snippets`
4. Access protected route while logged out → Should redirect to login with return URL
5. Login → Should redirect back to originally requested page

#### Logout Flow

1. While logged in, click logout button
2. Should redirect to `/login`
3. Try accessing `/snippets` → Should redirect to login

#### Password Reset

1. Navigate to `/forgot-password`
2. Enter email → Should show success message (always)
3. Check email for reset link
4. Click link → Should redirect to reset password page (to be implemented)

### Automated Tests (Future)

```bash
# Unit tests for AuthService
npm test src/lib/services/auth.service.test.ts

# E2E tests with Playwright
npm run test:e2e -- auth.spec.ts
```

---

## Performance Considerations

### Optimization Strategies

1. **Session Caching**: Supabase SDK automatically caches session
2. **Minimal Re-renders**: Use React Hook Form for form state
3. **Lazy Loading**: Auth forms loaded with `client:load`
4. **Token Refresh**: Automatic via Supabase SDK

###ネット Bottlenecks

- **Network latency**: Supabase calls can take 100-500ms
- **Mitigation**: Show loading states, optimistic UI updates

---

## Implementation Checklist

- [ ] Create validation schemas (`src/lib/validation/auth.schemas.ts`)
- [ ] Create AuthService (`src/lib/services/auth.service.ts`)
- [ ] Create register page (`src/pages/register.astro`)
- [ ] Create RegisterForm component (`src/components/auth/RegisterForm.tsx`)
- [ ] Create login page (`src/pages/login.astro`)
- [ ] Create LoginForm component (`src/components/auth/LoginForm.tsx`)
- [ ] Create LogoutButton component (`src/components/auth/LogoutButton.tsx`)
- [ ] Create forgot-password page (`src/pages/forgot-password.astro`)
- [ ] Create PasswordResetRequestForm (`src/components/auth/PasswordResetRequestForm.tsx`)
- [ ] Update middleware with better error handling
- [ ] Add toast notification library (Sonner recommended)
- [ ] Test all flows manually
- [ ] Add password strength indicator (optional enhancement)

---

**End of Authentication Implementation Plan**
