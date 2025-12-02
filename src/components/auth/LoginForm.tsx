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
      window.location.href = returnUrl;
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to log in");
      }
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
        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message as string}</p>}
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
        {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message as string}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Logging in..." : "Log In"}
      </Button>
    </form>
  );
}
