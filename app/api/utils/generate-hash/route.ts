import { NextResponse } from "next/server"
import { hashPassword } from "@/lib/crypto"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function POST(request: Request) {
  try {
    const { password } = await request.json()

    if (!password) {
      return NextResponse.json({ error: "Senha é obrigatória" }, { status: 400 })
    }

    // Gera hash SHA-256 com salt
    const hashedPassword = await hashPassword(password)

    // Gera também o Base64 legado para compatibilidade
    const base64Password = Buffer.from(password).toString("base64")

    return NextResponse.json({
      password_original: password,
      hash_sha256: hashedPassword,
      hash_base64_legado: base64Password,
      instrucoes: {
        sha256: `Para usar SHA-256 (recomendado), insira no banco: '${hashedPassword}'`,
        base64: `Para usar Base64 legado, insira no banco: '${base64Password}'`,
      },
    })
  } catch (error) {
    console.error("[v0] Erro ao gerar hash:", error)
    return NextResponse.json({ error: "Erro ao gerar hash" }, { status: 500 })
  }
}
