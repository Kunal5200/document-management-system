import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { requireRole } from "@/lib/middleware"

async function getCustomer(req: NextRequest, context: any) {
  try {
    const { params } = context
    const supabase = createServerClient()

    // Get customer details
    const { data: customer, error: customerError } = await supabase
      .from("users")
      .select("id, email, first_name, last_name, is_blocked, created_at")
      .eq("id", params.id)
      .eq("role", "customer")
      .single()

    if (customerError || !customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    // Get customer's documents
    const { data: documents, error: documentsError } = await supabase
      .from("documents")
      .select("id, document_type, file_name, status, uploaded_at")
      .eq("user_id", params.id)
      .order("uploaded_at", { ascending: false })

    if (documentsError) {
      console.error("Documents fetch error:", documentsError)
    }

    return NextResponse.json({
      customer: {
        ...customer,
        documents: documents || [],
      },
    })
  } catch (error) {
    console.error("Server error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function updateCustomer(req: NextRequest, context: any) {
  try {
    const { params } = context
    const { is_blocked } = await req.json()
    const supabase = createServerClient()

    const { data: customer, error } = await supabase
      .from("users")
      .update({ is_blocked })
      .eq("id", params.id)
      .eq("role", "customer")
      .select("id, email, first_name, last_name, is_blocked, created_at")
      .single()

    if (error || !customer) {
      console.error("Update error:", error)
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    return NextResponse.json({ customer })
  } catch (error) {
    console.error("Server error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const GET = requireRole("admin")(getCustomer)
export const PATCH = requireRole("admin")(updateCustomer)
