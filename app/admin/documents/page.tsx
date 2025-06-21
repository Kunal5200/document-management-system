"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ArrowLeft, Search, Eye, CheckCircle, XCircle, FileText } from "lucide-react"

interface Document {
  id: string
  document_type: string
  file_name: string
  file_url: string
  status: "pending" | "approved" | "rejected"
  rejection_reason?: string
  uploaded_at: string
  user: {
    first_name: string
    last_name: string
    email: string
  }
  reviewer?: {
    first_name: string
    last_name: string
  }
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [reviewLoading, setReviewLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const user = localStorage.getItem("user")
    if (!user) {
      router.push("/login")
      return
    }

    const userData = JSON.parse(user)
    if (userData.role !== "admin") {
      router.push("/login")
      return
    }

    fetchDocuments()
  }, [router])

  useEffect(() => {
    const filtered = documents.filter(
      (doc) =>
        doc.document_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.user.email.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    setFilteredDocuments(filtered)
  }, [documents, searchTerm])

  const fetchDocuments = async () => {
    try {
      const response = await fetch("/api/admin/documents")
      const data = await response.json()

      if (response.ok) {
        setDocuments(data.documents || [])
      }
    } catch (error) {
      console.error("Failed to fetch documents:", error)
    } finally {
      setLoading(false)
    }
  }

  const reviewDocument = async (documentId: string, status: "approved" | "rejected") => {
    setReviewLoading(true)

    try {
      const response = await fetch(`/api/admin/documents/${documentId}/review`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          rejection_reason: status === "rejected" ? rejectionReason : undefined,
        }),
      })

      if (response.ok) {
        fetchDocuments()
        setSelectedDocument(null)
        setRejectionReason("")
      }
    } catch (error) {
      console.error("Failed to review document:", error)
    } finally {
      setReviewLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>
      default:
        return <Badge variant="secondary">Pending</Badge>
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Button variant="ghost" onClick={() => router.push("/admin/dashboard")} className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">Document Review</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Card>
            <CardHeader>
              <CardTitle>Document Management</CardTitle>
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document Type</TableHead>
                    <TableHead>File Name</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.map((document) => (
                    <TableRow key={document.id}>
                      <TableCell className="font-medium">{document.document_type}</TableCell>
                      <TableCell>{document.file_name}</TableCell>
                      <TableCell>
                        {document.user.first_name} {document.user.last_name}
                        <br />
                        <span className="text-sm text-gray-500">{document.user.email}</span>
                      </TableCell>
                      <TableCell>{getStatusBadge(document.status)}</TableCell>
                      <TableCell>{new Date(document.uploaded_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => setSelectedDocument(document)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Review Document</DialogTitle>
                                <DialogDescription>Review and approve or reject this document</DialogDescription>
                              </DialogHeader>

                              {selectedDocument && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <strong>Document Type:</strong> {selectedDocument.document_type}
                                    </div>
                                    <div>
                                      <strong>File Name:</strong> {selectedDocument.file_name}
                                    </div>
                                    <div>
                                      <strong>Customer:</strong> {selectedDocument.user.first_name}{" "}
                                      {selectedDocument.user.last_name}
                                    </div>
                                    <div>
                                      <strong>Email:</strong> {selectedDocument.user.email}
                                    </div>
                                    <div>
                                      <strong>Status:</strong> {getStatusBadge(selectedDocument.status)}
                                    </div>
                                    <div>
                                      <strong>Uploaded:</strong>{" "}
                                      {new Date(selectedDocument.uploaded_at).toLocaleString()}
                                    </div>
                                  </div>

                                  {selectedDocument.status === "rejected" && selectedDocument.rejection_reason && (
                                    <div>
                                      <strong>Rejection Reason:</strong>
                                      <p className="mt-1 text-sm text-gray-600">{selectedDocument.rejection_reason}</p>
                                    </div>
                                  )}

                                  <div className="border rounded-lg p-4 bg-gray-50">
                                    <div className="flex items-center space-x-2 mb-2">
                                      <FileText className="h-4 w-4" />
                                      <span className="font-medium">Document Preview</span>
                                    </div>
                                    {selectedDocument.file_url.endsWith(".pdf") ? (
                                      <iframe
                                        src={selectedDocument.file_url}
                                        width="100%"
                                        height="200px"
                                        style={{ border: "1px solid #ccc", borderRadius: "4px" }}
                                        title="Document Preview"
                                      />
                                    ) : (
                                      <img
                                        src={selectedDocument.file_url}
                                        alt={selectedDocument.file_name}
                                        style={{ maxWidth: "100%", maxHeight: "400px", borderRadius: "4px" }}
                                      />
                                    )}
                                    <div className="mt-2">
                                      <a
                                        href={`/admin/documents/${selectedDocument.id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline text-sm"
                                      >
                                        View Full Page
                                      </a>
                                    </div>
                                  </div>

                                  {selectedDocument.status === "pending" && (
                                    <div className="space-y-4">
                                      <div>
                                        <label className="block text-sm font-medium mb-2">
                                          Rejection Reason (if rejecting)
                                        </label>
                                        <Textarea
                                          value={rejectionReason}
                                          onChange={(e) => setRejectionReason(e.target.value)}
                                          placeholder="Enter reason for rejection..."
                                          rows={3}
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              <DialogFooter>
                                {selectedDocument?.status === "pending" && (
                                  <div className="flex space-x-2">
                                    <Button
                                      variant="destructive"
                                      onClick={() => reviewDocument(selectedDocument.id, "rejected")}
                                      disabled={reviewLoading}
                                    >
                                      <XCircle className="h-4 w-4 mr-2" />
                                      Reject
                                    </Button>
                                    <Button
                                      onClick={() => reviewDocument(selectedDocument.id, "approved")}
                                      disabled={reviewLoading}
                                    >
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Approve
                                    </Button>
                                  </div>
                                )}
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
