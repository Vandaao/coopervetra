"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

// A home agora é a página inicial ("/"). Esta rota apenas redireciona.
export default function HomeRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/")
  }, [router])

  return null
}
