import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables")
}

// Client-side Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side Supabase client.
// 1. If the service-role key exists → full admin access
// 2. Else if anon key exists        → limited access (RLS must allow)
// 3. Else                           → return null (caller will fall back to demo data)
export const createServerClient = () => {
  if (supabaseServiceKey) {
    return createClient(supabaseUrl, supabaseServiceKey)
  }
  if (supabaseAnonKey) {
    return createClient(supabaseUrl, supabaseAnonKey)
  }
  return null
}

// Database types
export interface User {
  id: string
  email: string
  password_hash: string
  role: "admin" | "customer"
  first_name: string
  last_name: string
  is_blocked: boolean
  created_at: string
  updated_at: string
}

export interface Document {
  id: string
  user_id: string
  document_type: string
  file_name: string
  file_url: string
  file_size: number
  status: "pending" | "approved" | "rejected"
  rejection_reason?: string
  reviewed_by?: string
  reviewed_at?: string
  uploaded_at: string
}
