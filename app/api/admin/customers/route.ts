import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { requireRole } from "@/lib/middleware"
import { hashPassword } from "@/lib/auth"

async function getCustomers(req: NextRequest, context: any) {
  try {
    const supabase = createServerClient()

    const { data: customers, error } = await supabase
      .from("users")
      .select("id, email, first_name, last_name, is_blocked, created_at")
      .eq("role", "customer")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 })
    }

    return NextResponse.json({ customers: customers || [] })
  } catch (error) {
    console.error("Server error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function createCustomer(req: NextRequest, context: any) {
  try {
    const { email, password, first_name, last_name } = await req.json()

    if (!email || !password || !first_name || !last_name) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    const supabase = createServerClient()
    const password_hash = await hashPassword(password)

    const { data: customer, error } = await supabase
      .from("users")
      .insert({
        email,
        password_hash,
        first_name,
        last_name,
        role: "customer",
      })
      .select("id, email, first_name, last_name, is_blocked, created_at")
      .single()

    if (error) {
      console.error("Database error:", error)
      if (error.code === "23505") {
        return NextResponse.json({ error: "Email already exists" }, { status: 409 })
      }
      return NextResponse.json({ error: "Failed to create customer" }, { status: 500 })
    }

    return NextResponse.json({ customer }, { status: 201 })
  } catch (error) {
    console.error("Server error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const GET = requireRole("admin")(getCustomers)
export const POST = requireRole("admin")(createCustomer)
