import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { requireRole } from "@/lib/middleware"

async function getCustomerDocuments(req: NextRequest, context: any) {
  try {
    const { user } = context
    const supabase = createServerClient()

    if (!supabase) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 })
    }

    const { data: documents, error } = await supabase
      .from("documents")
      .select("*")
      .eq("user_id", user.id)
      .order("uploaded_at", { ascending: false })

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 })
    }

    return NextResponse.json({ documents: documents || [] })
  } catch (error) {
    console.error("Server error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function uploadDocument(req: NextRequest, context: any) {
  try {
    const { user } = context
    const body = await req.json();
    const { document_type, file_name, file_url, file_size } = body;
    if (!document_type || !file_name || !file_url || !file_size) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = createServerClient()

    if (!supabase) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 })
    }

    const { data: document, error } = await supabase
      .from("documents")
      .insert({
        user_id: user.id,
        document_type,
        file_name: file_name,
        file_url,
        file_size: file_size,
      })
      .select("*")
      .single()

    if (error) {
      console.error("Insert error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: "Document saved successfully" }, { status: 201 })
  } catch (error) {
    console.error("API Route Error:", error)
    return NextResponse.json({ error: (error as any).message || String(error) }, { status: 500 })
  }
}

export const GET = requireRole("customer")(getCustomerDocuments)
export const POST = requireRole("customer")(uploadDocument)
