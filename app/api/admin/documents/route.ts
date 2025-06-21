import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { requireRole } from "@/lib/middleware"

async function getDocuments(req: NextRequest, context: any) {
  try {
    const supabase = createServerClient()
    if (!supabase) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 })
    }

    const { data: documents, error } = await supabase
      .from("documents")
      .select(`
        *,
        user:users!documents_user_id_fkey(first_name, last_name, email),
        reviewer:users!documents_reviewed_by_fkey(first_name, last_name)
      `)
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

export const GET = requireRole("admin")(getDocuments)
