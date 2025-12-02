import { createServerClient } from "@supabase/ssr";
import type { Database } from "./database.types";

/**
 * Parse cookies from Cookie header string
 */
function parseCookies(cookieHeader: string | null): { name: string; value: string }[] {
  if (!cookieHeader) return [];

  return cookieHeader.split(";").map((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    return { name, value: rest.join("=") };
  });
}

/**
 * Create Supabase server client for Astro
 */
export function createSupabaseServerClient(request: Request, headers: Headers) {
  return createServerClient<Database>(
    import.meta.env.PUBLIC_SUPABASE_URL || "",
    import.meta.env.PUBLIC_SUPABASE_KEY || "",
    {
      cookies: {
        getAll() {
          return parseCookies(request.headers.get("cookie"));
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            const cookieParts = [`${name}=${value}`];

            if (options?.maxAge) {
              cookieParts.push(`Max-Age=${options.maxAge}`);
            }
            if (options?.path) {
              cookieParts.push(`Path=${options.path}`);
            }
            if (options?.domain) {
              cookieParts.push(`Domain=${options.domain}`);
            }
            if (options?.sameSite) {
              cookieParts.push(`SameSite=${options.sameSite}`);
            }
            if (options?.secure) {
              cookieParts.push("Secure");
            }
            if (options?.httpOnly) {
              cookieParts.push("HttpOnly");
            }

            headers.append("Set-Cookie", cookieParts.join("; "));
          });
        },
      },
    }
  );
}
