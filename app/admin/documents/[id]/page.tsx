// app/admin/documents/[id]/page.tsx
import { cookies } from "next/headers";
import { createServerClient } from "@/lib/supabase";

export default async function DocumentViewPage({ params }: { params: { id: string } }) {
  const supabase = createServerClient();
  if (!supabase) return <div>Supabase not configured.</div>;
  const { data: document, error } = await supabase
    .from("documents")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !document) {
    return <div>Document not found.</div>;
  }

  // If your file_url is a direct link to the file (PDF, image, etc.)
  return (
    <div>
      <h1>{document.file_name}</h1>
      <p>Type: {document.document_type}</p>
      <p>Status: {document.status}</p>
      {/* If PDF */}
      {document.file_url.endsWith(".pdf") ? (
        <iframe src={document.file_url} width="100%" height="600px" />
      ) : (
        <img src={document.file_url} alt={document.file_name} style={{ maxWidth: "100%" }} />
      )}
    </div>
  );
}