import { defineMiddleware } from "astro:middleware";
import { createSupabaseServerClient } from "../db/supabase.client";

export const onRequest = defineMiddleware(async (context, next) => {
  // Create response headers for Set-Cookie
  const responseHeaders = new Headers();

  // Create Supabase client
  const supabase = createSupabaseServerClient(context.request, responseHeaders);

  // Attach to locals
  context.locals.supabase = supabase;

  // Refresh session if exists
  await supabase.auth.getUser();

  // Get response
  const response = await next();

  // Apply Set-Cookie headers from Supabase
  responseHeaders.forEach((value, key) => {
    response.headers.append(key, value);
  });

  return response;
});
