import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { verifyPassword } from "@/lib/crypto"
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limit"
import { createAuthToken } from "@/lib/api-auth"
import { validateUsername, validatePassword, sanitizeString } from "@/lib/input-validation"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    console.log("Recebendo requisição de login")

    const clientIp = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"

    const rateLimitResult = checkRateLimit(clientIp, 5, 15 * 60 * 1000, 30 * 60 * 1000)
    if (!rateLimitResult.allowed) {
      const minutesRemaining = Math.ceil((rateLimitResult.resetTime - Date.now()) / 60000)
      return NextResponse.json(
        {
          error: `Muitas tentativas de login. Tente novamente em ${minutesRemaining} minutos.`,
          blockedUntil: rateLimitResult.resetTime,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)),
          },
        },
      )
    }

    const body = await request.json()
    const { username, password } = body

    console.log("Dados recebidos:", { username, password: password ? "***" : "vazio" })

    const usernameValidation = validateUsername(username)
    if (!usernameValidation.valid) {
      return NextResponse.json({ error: usernameValidation.error }, { status: 400 })
    }

    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      return NextResponse.json({ error: passwordValidation.error }, { status: 400 })
    }

    if (!username || !password) {
      console.log("Dados faltando")
      return NextResponse.json({ error: "Usuário e senha são obrigatórios" }, { status: 400 })
    }

    const sanitizedUsername = sanitizeString(username, 50)

    const users = await sql`
      SELECT id, username, password, nome, tipo, ativo
      FROM usuarios
      WHERE username = ${sanitizedUsername}
    `

    if (users.length === 0) {
      console.log("Autenticação falhou")
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 })
    }

    const user = users[0]

    if (!user.ativo) {
      return NextResponse.json({ error: "Usuário inativo. Contate o administrador." }, { status: 403 })
    }

    const isValidPassword = await verifyPassword(password, user.password)
    if (!isValidPassword) {
      console.log("Autenticação falhou")
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 })
    }

    console.log("Chamando authenticateUser")
    // const user = await authenticateUser(username, password)

    resetRateLimit(clientIp)

    const token = createAuthToken(user.username)

    await sql`
      INSERT INTO logs_acesso (usuario_id, username, ip, acao, sucesso)
      VALUES (${user.id}, ${user.username}, ${clientIp}, 'login', true)
    `

    console.log("Autenticação bem-sucedida:", user.username)
    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        nome: user.nome,
        tipo: user.tipo,
        ativo: user.ativo,
      },
      token,
    })
  } catch (error) {
    console.error("Erro no login:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
