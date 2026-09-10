import { NextResponse, type NextRequest } from "next/server";
import { verifySessionToken } from "@/lib/auth/jwt";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";

const PUBLIC_PAGE_PATHS = ["/login"];
const PUBLIC_API_PATHS = ["/api/auth/login"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  const isApiRoute = pathname.startsWith("/api/");
  const isPublicPage = PUBLIC_PAGE_PATHS.some((p) => pathname === p);
  const isPublicApi = PUBLIC_API_PATHS.some((p) => pathname.startsWith(p));

  // Đã đăng nhập nhưng vẫn vào trang Login -> chuyển thẳng vào dashboard.
  if (isPublicPage && session) {
    return NextResponse.redirect(new URL("/customers", request.url));
  }

  if (isPublicPage || isPublicApi) {
    return NextResponse.next();
  }

  if (!session) {
    if (isApiRoute) {
      return NextResponse.json(
        { success: false, message: "Chưa đăng nhập hoặc phiên đã hết hạn" },
        { status: 401 },
      );
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
