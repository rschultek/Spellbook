import { AuthService } from "../../lib/services/auth.service";
import { Button } from "../ui/button";
import { toast } from "../../lib/utils/toast";

export default function LogoutButton() {
  const handleLogout = async () => {
    try {
      const { getSupabaseBrowserClient } = await import("../../lib/utils/supabase-browser");
      const supabase = getSupabaseBrowserClient();
      const authService = new AuthService(supabase);

      await authService.logout();

      toast.success("Logged out successfully");
      window.location.href = "/login";
    } catch {
      toast.error("Failed to log out");
    }
  };

  return (
    <Button onClick={handleLogout} variant="outline">
      Log Out
    </Button>
  );
}
