import { NextRequest, NextResponse } from "next/server";

export function proxy(req: NextRequest) {
  const user = process.env.SITE_AUTH_USER || "cafe";
  const pass = process.env.SITE_AUTH_PASSWORD;

  // 비밀번호가 설정되지 않았으면 보호를 걸지 않음 (설정 전 개발 편의용)
  if (!pass) return NextResponse.next();

  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Basic ")) {
    const decoded = Buffer.from(authHeader.slice(6), "base64").toString();
    const [inputUser, inputPass] = decoded.split(":");
    if (inputUser === user && inputPass === pass) {
      return NextResponse.next();
    }
  }

  return new NextResponse("인증이 필요합니다.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Cafe Dashboard"' },
  });
}

export const config = {
  // 정적 리소스(_next 등)를 제외한 모든 경로(페이지+API) 보호
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
