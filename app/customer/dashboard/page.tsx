"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";

interface Document {
  id: string;
  document_type: string;
  file_name: string;
  file_url: string;
  status: "pending" | "approved" | "rejected";
  rejection_reason?: string;
  uploaded_at: string;
}

const DOCUMENT_TYPES = [
  "Identity Card",
  "Passport",
  "Driver License",
  "Utility Bill",
  "Bank Statement",
  "Tax Document",
  "Insurance Document",
  "Other",
];

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function CustomerDashboard() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedDocumentType, setSelectedDocumentType] = useState("");
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/login");
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== "customer") {
      router.push("/login");
      return;
    }

    setUser(parsedUser);
    fetchDocuments();
  }, [router]);

  const fetchDocuments = async () => {
    try {
      const response = await fetch("/api/customer/documents");
      const data = await response.json();

      if (response.ok) {
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error("Failed to fetch documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !selectedDocumentType) {
      return;
    }

    setUploadLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("document_type", selectedDocumentType);

      const response = await fetch("/api/customer/documents", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        fetchDocuments();
        setSelectedFile(null);
        setSelectedDocumentType("");
      }
    } catch (error) {
      console.error("Failed to upload document:", error);
    } finally {
      setUploadLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    localStorage.removeItem("user");
    router.push("/login");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const stats = {
    total: documents.length,
    pending: documents.filter((d) => d.status === "pending").length,
    approved: documents.filter((d) => d.status === "approved").length,
    rejected: documents.filter((d) => d.status === "rejected").length,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Customer Portal
              </h1>
              <p className="text-gray-600">
                Welcome, {user?.first_name} {user?.last_name}
              </p>
            </div>
            <Button onClick={handleLogout} variant="outline">
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Documents
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pending Review
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pending}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approved</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.approved}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                <XCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.rejected}</div>
              </CardContent>
            </Card>
          </div>

          {/* Upload Document Section */}
          <Card className="mb-8 shadow-lg border border-gray-200">
            <CardHeader className="bg-gray-50 rounded-t-lg border-b border-gray-200">
              <CardTitle className="text-xl font-semibold text-gray-800">Upload New Document</CardTitle>
              <CardDescription className="text-gray-600">
                Select a document type and upload your file for review
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!selectedFile || !selectedDocumentType) return;
                  // 1. Upload to Supabase Storage
                  const filePath = `${Date.now()}-${selectedFile.name}`;
                  const { error: uploadError } = await supabase.storage
                    .from("uploads")
                    .upload(filePath, selectedFile);
                  if (uploadError) {
                    alert("Upload failed: " + uploadError.message);
                    return;
                  }
                  // 2. Get public URL
                  const { data } = supabase.storage
                    .from("uploads")
                    .getPublicUrl(filePath);
                  const fileUrl = data?.publicUrl;
                  if (!fileUrl) {
                    alert("Failed to get public URL");
                    return;
                  }
                  // 3. Send to your backend to save in DB
                  const response = await fetch("/api/customer/documents", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      document_type: selectedDocumentType,
                      file_name: selectedFile.name,
                      file_url: fileUrl,
                      file_size: selectedFile.size,
                      // add other fields as needed
                    }),
                  });
                  if (response.ok) {
                    alert("Document uploaded successfully!");
                    // Optionally refresh the document list or reset form
                  } else {
                    alert("Failed to save document in database.");
                  }
                }}
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end bg-gray-50 p-6 rounded-lg border border-gray-100">
                  <div className="space-y-2">
                    <Label htmlFor="document-type" className="text-gray-700 font-medium">Document Type</Label>
                    <Select
                      value={selectedDocumentType}
                      onValueChange={setSelectedDocumentType}
                    >
                      <SelectTrigger className="w-full bg-white border border-gray-300 focus:ring-2 focus:ring-blue-500">
                        <SelectValue placeholder="Select document type" />
                      </SelectTrigger>
                      <SelectContent>
                        {DOCUMENT_TYPES.map((type) => (
                          <SelectItem key={type} value={type} className="capitalize">
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="file-upload" className="text-gray-700 font-medium">File</Label>
                    <input
                      id="file-upload"
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      required
                      className="block w-full text-sm text-gray-700 border border-gray-300 rounded-lg cursor-pointer bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2 flex flex-col justify-end">
                    <button
                      type="submit"
                      className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow transition-colors duration-200 flex items-center justify-center"
                      disabled={uploadLoading}
                    >
                      {uploadLoading ? (
                        <>
                          <Upload className="h-5 w-5 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        "Upload"
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Documents Table */}
          <Card>
            <CardHeader>
              <CardTitle>My Documents</CardTitle>
              <CardDescription>
                View all your uploaded documents and their review status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No documents uploaded
                  </h3>
                  <p className="text-gray-500">
                    Upload your first document to get started.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document Type</TableHead>
                      <TableHead>File Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Uploaded</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map((document) => (
                      <TableRow key={document.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(document.status)}
                            <span>{document.document_type}</span>
                          </div>
                        </TableCell>
                        <TableCell>{document.file_name}</TableCell>
                        <TableCell>{getStatusBadge(document.status)}</TableCell>
                        <TableCell>
                          {new Date(document.uploaded_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                View Details
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Document Details</DialogTitle>
                                <DialogDescription>
                                  View information about your uploaded document
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <strong>Document Type:</strong>{" "}
                                    {document.document_type}
                                  </div>
                                  <div>
                                    <strong>File Name:</strong>{" "}
                                    {document.file_name}
                                  </div>
                                  <div>
                                    <strong>Status:</strong>{" "}
                                    {getStatusBadge(document.status)}
                                  </div>
                                  <div>
                                    <strong>Uploaded:</strong>{" "}
                                    {new Date(
                                      document.uploaded_at
                                    ).toLocaleString()}
                                  </div>
                                </div>

                                {document.status === "rejected" &&
                                  document.rejection_reason && (
                                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                      <h4 className="font-medium text-red-800 mb-2">
                                        Rejection Reason:
                                      </h4>
                                      <p className="text-red-700">
                                        {document.rejection_reason}
                                      </p>
                                    </div>
                                  )}

                                {document.status === "approved" && (
                                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                    <p className="text-green-700">
                                      ✅ Your document has been approved!
                                    </p>
                                  </div>
                                )}

                                {document.status === "pending" && (
                                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <p className="text-yellow-700">
                                      ⏳ Your document is pending review.
                                    </p>
                                  </div>
                                )}

                                <div className="border rounded-lg p-4 bg-gray-50">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <FileText className="h-4 w-4" />
                                    <span className="font-medium">Document Preview</span>
                                  </div>
                                  <p className="text-sm text-gray-600">File: {document.file_name}</p>
                                  {document.file_url.endsWith(".pdf") ? (
                                    <iframe
                                      src={document.file_url}
                                      width="100%"
                                      height="400px"
                                      style={{ border: "1px solid #ccc", borderRadius: "4px" }}
                                      title="Document Preview"
                                    />
                                  ) : (
                                    <img
                                      src={document.file_url}
                                      alt={document.file_name}
                                      style={{ maxWidth: "100%", maxHeight: "300px", borderRadius: "4px" }}
                                    />
                                  )}
                                </div>
                              </div>
                              <DialogFooter>
                                <Button variant="outline">Close</Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
