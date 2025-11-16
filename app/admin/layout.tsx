"use client"

import { AdminLayout } from "@/components/admin/admin-layout"

export default function AdminLayoutWrapper({ children }: { children: React.ReactNode }) {
  // AdminLayout handles all auth checking and access control
  return <AdminLayout>{children}</AdminLayout>
}
