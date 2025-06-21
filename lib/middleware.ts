import { type NextRequest, NextResponse } from "next/server";
import { verifyToken } from "./auth";

export const authenticateRequest = (req: NextRequest) => {
  const token =
    req.cookies.get("auth-token")?.value ||
    req.headers.get("authorization")?.replace("Bearer ", "");

  if (!token) {
    return null;
  }

  const decoded = verifyToken(token);
  return decoded;
};

export const requireAuth = (handler: Function) => {
  return async (req: NextRequest, context: any = {}) => {
    const user = authenticateRequest(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return handler(req, { ...context, user });
  };
};

export const requireRole = (role: string) => {
  return (handler: Function) => {
    return async (req: NextRequest, context: any = {}) => {
      const user = authenticateRequest(req);

      if (!user || user.role !== role) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      return handler(req, { ...context, user });
    };
  };
};
