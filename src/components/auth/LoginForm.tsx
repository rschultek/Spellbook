import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "../../lib/validation/auth.schemas";
import { AuthService } from "../../lib/services/auth.service";
import { Button } from "../ui/button";
import { toast } from "../../lib/utils/toast";
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

  const onSubmit = async (data: LoginUserDto) => {
    try {
      const { getSupabaseBrowserClient } = await import("../../lib/utils/supabase-browser");
      const supabase = getSupabaseBrowserClient();
      const authService = new AuthService(supabase);

      const dto: LoginUserDto = {
        email: data.email,
        password: data.password,
      };

      await authService.login(dto);

      toast.success("Login successful!");
      // Force reload to sync session between client and server
      // Add small delay to let user see the toast
      setTimeout(() => {
        window.location.href = returnUrl;
      }, 1000);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to log in");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" data-testid="login-form">
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          Email *
        </label>
        <input
          {...register("email")}
          type="text"
          id="email"
          className="w-full px-3 py-2 border rounded-md bg-background text-foreground"
          data-testid="login-email-input"
        />
        {errors.email && (
          <p className="text-red-500 text-sm mt-1" data-testid="login-email-error">
            {errors.email.message as string}
          </p>
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
          className="w-full px-3 py-2 border rounded-md bg-background text-foreground"
          autoComplete="current-password"
          data-testid="login-password-input"
        />
        {errors.password && (
          <p className="text-red-500 text-sm mt-1" data-testid="login-password-error">
            {errors.password.message as string}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting} data-testid="login-submit-button">
        {isSubmitting ? "Logging in..." : "Log In"}
      </Button>
    </form>
  );
}
