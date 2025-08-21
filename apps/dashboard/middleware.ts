import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: "",
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: "",
            ...options,
          });
        },
      },
    }
  );

  // Check if user is authenticated
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  // If not authenticated, redirect to auth page
  if (!user || authError) {
    const url = new URL("/auth", request.url);
    url.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  try {
    // Check if user has a seller profile
    const { data: seller, error: sellerError } = await supabase
      .from("sellers")
      .select(
        "id, status, business_name, display_name, is_verified, join_date, updated_at"
      )
      .eq("id", user.id)
      .single();

    // If no seller profile found, redirect to unauthorized page
    if (sellerError || !seller) {
      const url = new URL("/auth/unauthorized", request.url);
      url.searchParams.set("reason", "no_seller_profile");
      url.searchParams.set("title", "No Seller Account Found");
      url.searchParams.set(
        "message",
        "You need to create a seller account to access the dashboard."
      );
      url.searchParams.set("action", "create_seller");
      return NextResponse.redirect(url);
    }

    // Handle seller status - only approved sellers get full access
    switch (seller.status) {
      case "approved":
        // Full access granted - continue to dashboard
        response.headers.set("X-Seller-Status", "approved");
        response.headers.set(
          "X-Seller-Verified",
          seller.is_verified ? "true" : "false"
        );
        response.headers.set("X-Seller-Id", seller.id);
        response.headers.set(
          "X-Seller-Name",
          seller.display_name || seller.business_name
        );
        break;

      case "pending":
        // Redirect to unauthorized page with pending message
        const pendingUrl = new URL("/auth/unauthorized", request.url);
        pendingUrl.searchParams.set("reason", "pending");
        pendingUrl.searchParams.set("title", "Account Under Review");
        pendingUrl.searchParams.set(
          "message",
          "Your seller account is currently being reviewed. You'll receive an email once it's approved."
        );
        pendingUrl.searchParams.set("businessName", seller.business_name);
        pendingUrl.searchParams.set(
          "displayName",
          seller.display_name || seller.business_name
        );
        pendingUrl.searchParams.set("joinDate", seller.join_date);
        pendingUrl.searchParams.set("updatedAt", seller.updated_at);
        pendingUrl.searchParams.set("status", seller.status);
        return NextResponse.redirect(pendingUrl);

      case "suspended":
        // Redirect to unauthorized page with suspension message
        const suspendedUrl = new URL("/auth/unauthorized", request.url);
        suspendedUrl.searchParams.set("reason", "suspended");
        suspendedUrl.searchParams.set("title", "Account Suspended");
        suspendedUrl.searchParams.set(
          "message",
          "Your seller account has been suspended. Please contact support for assistance."
        );
        suspendedUrl.searchParams.set("businessName", seller.business_name);
        suspendedUrl.searchParams.set(
          "displayName",
          seller.display_name || seller.business_name
        );
        suspendedUrl.searchParams.set("joinDate", seller.join_date);
        suspendedUrl.searchParams.set("updatedAt", seller.updated_at);
        suspendedUrl.searchParams.set("status", seller.status);
        return NextResponse.redirect(suspendedUrl);

      case "restricted":
        // Redirect to unauthorized page with restriction message
        const restrictedUrl = new URL("/auth/unauthorized", request.url);
        restrictedUrl.searchParams.set("reason", "restricted");
        restrictedUrl.searchParams.set("title", "Account Restricted");
        restrictedUrl.searchParams.set(
          "message",
          "Your seller account has limited access. Please contact support for more information."
        );
        restrictedUrl.searchParams.set("businessName", seller.business_name);
        restrictedUrl.searchParams.set(
          "displayName",
          seller.display_name || seller.business_name
        );
        restrictedUrl.searchParams.set("joinDate", seller.join_date);
        restrictedUrl.searchParams.set("updatedAt", seller.updated_at);
        restrictedUrl.searchParams.set("status", seller.status);
        return NextResponse.redirect(restrictedUrl);

      default:
        // Unknown status, redirect to unauthorized
        const unknownUrl = new URL("/auth/unauthorized", request.url);
        unknownUrl.searchParams.set("reason", "unknown_status");
        unknownUrl.searchParams.set("title", "Unknown Status");
        unknownUrl.searchParams.set(
          "message",
          "Please contact support for account status information."
        );
        unknownUrl.searchParams.set("businessName", seller.business_name);
        unknownUrl.searchParams.set(
          "displayName",
          seller.display_name || seller.business_name
        );
        unknownUrl.searchParams.set("joinDate", seller.join_date);
        unknownUrl.searchParams.set("updatedAt", seller.updated_at);
        unknownUrl.searchParams.set("status", seller.status);
        return NextResponse.redirect(unknownUrl);
    }
  } catch (error) {
    console.error("Middleware error:", error);

    // If there's an error checking seller status, redirect to auth page for safety
    const url = new URL("/auth", request.url);
    url.searchParams.set("error", "middleware_error");
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
