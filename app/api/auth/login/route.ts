import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { comparePassword, generateToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, role } = body;

    console.log("Request body:", body);

    /* ------------------------------------------------------------------
       Fallback to demo data if Supabase isn't configured (preview mode)
    -------------------------------------------------------------------*/
    const supabaseReady =
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    console.log("Supabase ready:", supabaseReady);
    if (!supabaseReady) {
      // ----- demo users (hashed pw not needed here) -----
      const demoUsers = {
        "admin@example.com": {
          id: "1",
          password: "admin123",
          role: "admin",
          first_name: "Admin",
          last_name: "User",
        },
        "customer1@example.com": {
          id: "2",
          password: "password123",
          role: "customer",
          first_name: "John",
          last_name: "Doe",
        },
        "customer2@example.com": {
          id: "3",
          password: "password123",
          role: "customer",
          first_name: "Jane",
          last_name: "Smith",
        },
      } as const;

      const demoUser = demoUsers[email as keyof typeof demoUsers];
      if (
        !demoUser ||
        demoUser.password !== password ||
        demoUser.role !== role
      ) {
        return NextResponse.json(
          { error: "Invalid credentials (demo mode)" },
          { status: 401 }
        );
      }

      const token = generateToken({
        id: demoUser.id,
        email,
        role: demoUser.role as any,
        first_name: demoUser.first_name,
        last_name: demoUser.last_name,
        is_blocked: false,
      });

      const res = NextResponse.json({
        user: {
          id: demoUser.id,
          email,
          role: demoUser.role,
          first_name: demoUser.first_name,
          last_name: demoUser.last_name,
        },
        token,
        demo: true,
      });
      res.cookies.set("auth-token", token, { httpOnly: true, sameSite: "lax" });
      return res;
    }
    /* ----------------------- end fallback ----------------------------*/

    const supabase = createServerClient();
    if (!supabase) {
      // Should never hit because of the fallback, but guard just in case
      return NextResponse.json(
        { error: "Supabase not configured" },
        { status: 503 }
      );
    }

    if (!email || !password || !role) {
      return NextResponse.json(
        { error: "Email, password, and role are required" },
        { status: 400 }
      );
    }

    // Fetch user from database
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .eq("role", role)
      .single();

    console.log("User from DB:", user, "Error:", error);

    if (error || !user) {
      console.error("User lookup error:", error);
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    if (user.is_blocked) {
      return NextResponse.json(
        { error: "Account is blocked" },
        { status: 403 }
      );
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password_hash);
    console.log("Password valid:", isValidPassword);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      first_name: user.first_name,
      last_name: user.last_name,
      is_blocked: user.is_blocked,
    });

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name,
      },
      token,
    });

    // Set HTTP-only cookie
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
