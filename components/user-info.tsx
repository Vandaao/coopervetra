"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LogOut, Settings, User } from "lucide-react"
import { getSession, clearSession, isAdmin } from "@/lib/session"
import type { User as UserType } from "@/lib/auth"
import Link from "next/link"

export function UserInfo() {
  const [user, setUser] = useState<UserType | null>(null)
  const router = useRouter()

  useEffect(() => {
    setUser(getSession())
  }, [])

  const handleLogout = () => {
    clearSession()
    router.push("/login")
  }

  if (!user) return null

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <User className="h-4 w-4" />
        <span className="font-medium">{user.nome}</span>
        <Badge variant={user.tipo === "admin" ? "default" : "secondary"}>
          {user.tipo === "admin" ? "Admin" : "Usuário"}
        </Badge>
      </div>

      <div className="flex items-center gap-2">
        {isAdmin() && (
          <Link href="/usuarios">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Usuários
            </Button>
          </Link>
        )}

        <Button variant="outline" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Sair
        </Button>
      </div>
    </div>
  )
}
