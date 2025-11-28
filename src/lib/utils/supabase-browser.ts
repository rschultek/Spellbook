import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "../../db/database.types";

/**
 * Create Supabase browser client for React components
 * IMPORTANT: Uses cookies for session storage (not localStorage)
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    import.meta.env.PUBLIC_SUPABASE_URL || "",
    import.meta.env.PUBLIC_SUPABASE_KEY || "",
    {
      cookies: {
        get(name) {
          const cookies = document.cookie.split("; ");
          const cookie = cookies.find((c) => c.startsWith(`${name}=`));
          return cookie ? decodeURIComponent(cookie.split("=")[1]) : undefined;
        },
        set(name, value, options) {
          let cookie = `${name}=${encodeURIComponent(value)}`;
          if (options?.maxAge) {
            cookie += `; max-age=${options.maxAge}`;
          }
          if (options?.path) {
            cookie += `; path=${options.path}`;
          }
          if (options?.domain) {
            cookie += `; domain=${options.domain}`;
          }
          if (options?.sameSite) {
            cookie += `; samesite=${options.sameSite}`;
          }
          if (options?.secure) {
            cookie += "; secure";
          }
          document.cookie = cookie;
        },
        remove(name, options) {
          this.set(name, "", { ...options, maxAge: 0 });
        },
      },
    }
  );
}

// Singleton instance
let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function getSupabaseBrowserClient() {
  if (!browserClient) {
    browserClient = createSupabaseBrowserClient();
  }
  return browserClient;
}
