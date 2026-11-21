import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const isPasswordReset =
    request.nextUrl.searchParams.get("next") === "/reset-password";

  if (!code) {
    const fallback = isPasswordReset ? "/reset-password?error=expired" : "/login?error=callback";
    return NextResponse.redirect(new URL(fallback, request.url));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error("Could not complete the authentication callback.", error);
    const fallback = isPasswordReset ? "/reset-password?error=expired" : "/login?error=callback";
    return NextResponse.redirect(new URL(fallback, request.url));
  }

  const destination = isPasswordReset ? "/reset-password" : "/account";
  return NextResponse.redirect(new URL(destination, request.url));
}
