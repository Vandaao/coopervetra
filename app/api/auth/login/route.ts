import { type NextRequest, NextResponse } from "next/server"
import { authenticateUser } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    console.log("Recebendo requisição de login")

    const body = await request.json()
    const { username, password } = body

    console.log("Dados recebidos:", { username, password: password ? "***" : "vazio" })

    if (!username || !password) {
      console.log("Dados faltando")
      return NextResponse.json({ error: "Usuário e senha são obrigatórios" }, { status: 400 })
    }

    console.log("Chamando authenticateUser")
    const user = await authenticateUser(username, password)

    if (!user) {
      console.log("Autenticação falhou")
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 })
    }

    console.log("Autenticação bem-sucedida:", user.username)
    return NextResponse.json({ user })
  } catch (error) {
    console.error("Erro no login:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
