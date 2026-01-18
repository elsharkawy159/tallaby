import { revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Verify the request has the correct authorization token
    const authHeader = request.headers.get("authorization");
    const expectedToken = process.env.REVALIDATE_SECRET_TOKEN;

    if (!expectedToken) {
      console.error("REVALIDATE_SECRET_TOKEN is not configured");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Check for Bearer token
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid authorization header" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    // Verify token matches
    if (token !== expectedToken) {
      return NextResponse.json(
        { error: "Invalid authorization token" },
        { status: 403 }
      );
    }

    // Revalidate the products tag
    // In Next.js 16+, revalidateTag requires a second parameter for cache profile
    revalidateTag("products", "max");

    return NextResponse.json({
      success: true,
      message: "Products tag revalidated successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error revalidating products tag:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}

// Allow GET for health checks (without revalidation)
export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "/api/revalidate/products",
    method: "POST",
    message: "Use POST with Bearer token to revalidate products tag",
  });
}
