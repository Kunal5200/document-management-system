import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { requireRole } from "@/lib/middleware";

async function reviewDocument(req: NextRequest, context: any) {
  try {
    const { params } = context;
    const { status, rejection_reason } = await req.json();
    const { user } = context;

    if (!["approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "Status must be approved or rejected" },
        { status: 400 }
      );
    }

    if (status === "rejected" && !rejection_reason) {
      return NextResponse.json(
        { error: "Rejection reason is required when rejecting" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase not configured" },
        { status: 500 }
      );
    }
    const { data: document, error } = await supabase
      .from("documents")
      .update({
        status,
        rejection_reason: status === "rejected" ? rejection_reason : null,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select(
        `
        *,
        user:users!documents_user_id_fkey(first_name, last_name, email),
        reviewer:users!documents_reviewed_by_fkey(first_name, last_name)
      `
      )
      .single();

    if (error || !document) {
      console.error("Update error:", error);
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ document });
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const PATCH = requireRole("admin")(reviewDocument);
