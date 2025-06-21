"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleLogin = async (formData: FormData, role: "admin" | "customer") => {
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.get("email"),
          password: formData.get("password"),
          role,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = "Login failed"

        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.error || errorMessage
        } catch {
          errorMessage = errorText || errorMessage
        }

        throw new Error(errorMessage)
      }

      const data = await response.json()

      // Store user data in localStorage
      localStorage.setItem("user", JSON.stringify(data.user))

      // Redirect based on role
      if (role === "admin") {
        router.push("/admin/dashboard")
      } else {
        router.push("/customer/dashboard")
      }
    } catch (err) {
      console.error("Login error:", err)
      setError(err instanceof Error ? err.message : "Login failed")
    } finally {
      setLoading(false)
    }
  }

  const LoginForm = ({ role }: { role: "admin" | "customer" }) => (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        handleLogin(formData, role)
      }}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label htmlFor={`${role}-email`}>Email</Label>
        <Input
          id={`${role}-email`}
          name="email"
          type="email"
          placeholder={role === "admin" ? "admin@example.com" : "customer1@example.com"}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${role}-password`}>Password</Label>
        <Input id={`${role}-password`} name="password" type="password" placeholder="Enter your password" required />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Login as {role === "admin" ? "Admin" : "Customer"}
      </Button>
    </form>
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Document Management System</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4" variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="customer" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="customer">Customer</TabsTrigger>
              <TabsTrigger value="admin">Admin</TabsTrigger>
            </TabsList>

            <TabsContent value="customer" className="mt-4">
              <LoginForm role="customer" />
              {/* <div className="mt-4 text-sm text-gray-600">
                <p>Demo credentials:</p>
                <p>Email: customer1@example.com</p>
                <p>Password: password123</p>
              </div> */}
            </TabsContent>

            <TabsContent value="admin" className="mt-4">
              <LoginForm role="admin" />
              {/* <div className="mt-4 text-sm text-gray-600">
                <p>Demo credentials:</p>
                <p>Email: admin@example.com</p>
                <p>Password: admin123</p>
              </div> */}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
