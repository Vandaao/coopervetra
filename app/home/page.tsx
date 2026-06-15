"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { isAuthenticated } from "@/lib/session"
import { Eye, EyeOff, ArrowRight, Truck, DollarSign, BarChart3, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

export default function HomePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  useEffect(() => {
    // Se já estiver autenticado, redirecionar para dashboard
    if (isAuthenticated()) {
      router.push("/")
    }

    // Carregar credenciais salvas se existirem
    const savedUsername = localStorage.getItem("coopervetra_username")
    if (savedUsername) {
      setUsername(savedUsername)
      setRememberMe(true)
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!username.trim() || !password.trim()) {
      toast({
        title: "Erro",
        description: "Digite seu usuário e senha",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erro ao fazer login")
      }

      const data = await response.json()

      // Guardar token e dados do usuário
      localStorage.setItem("coopervetra_token", data.token)
      localStorage.setItem("coopervetra_user", JSON.stringify(data.user))

      if (rememberMe) {
        localStorage.setItem("coopervetra_username", username)
      } else {
        localStorage.removeItem("coopervetra_username")
      }

      toast({
        title: "Sucesso",
        description: `Bem-vindo, ${data.user.nome}!`,
      })

      router.push("/")
    } catch (error) {
      toast({
        title: "Erro na autenticação",
        description: error instanceof Error ? error.message : "Verifique suas credenciais",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <html lang="pt-BR">
      <body className="font-sans antialiased">
        <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-blue-50 via-white to-blue-50">
          {/* Elementos decorativos de fundo */}
          <div className="absolute -right-40 -top-32 w-96 h-96 rounded-full bg-gradient-to-br from-blue-200 to-blue-300 opacity-20 blur-3xl" />
          <div className="absolute -right-20 bottom-0 w-96 h-96 rounded-full bg-gradient-to-tl from-blue-100 to-blue-200 opacity-30 blur-3xl" />

          <main className="relative z-10 min-h-screen grid grid-cols-1 lg:grid-cols-2 max-w-7xl mx-auto">
            {/* Seção Esquerda - Branding */}
            <section className="flex flex-col justify-center px-6 py-12 md:px-12 lg:py-0">
              <div className="max-w-xl">
                {/* Ícone da marca */}
                <div className="mb-8">
                  <div className="w-28 h-28 rounded-full bg-white shadow-xl flex items-center justify-center">
                    <Truck className="w-14 h-14 text-blue-600" strokeWidth={1.5} />
                  </div>
                </div>

                {/* Título */}
                <h1 className="text-5xl md:text-6xl font-black text-blue-600 mb-4 leading-tight">
                  COOPERVETRA
                </h1>

                {/* Subtitle */}
                <p className="text-lg text-gray-700 mb-8 leading-relaxed font-medium">
                  Cooperativa de Transportadores Autônomos de Rio Pomba e Região
                </p>

                {/* Linha decorativa */}
                <div className="w-14 h-1 bg-blue-600 rounded-full mb-10" />

                {/* Recursos */}
                <div className="space-y-5">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                      <Truck className="w-6 h-6 text-blue-600" strokeWidth={2} />
                    </div>
                    <span className="text-base font-semibold text-gray-800">Fretes</span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-blue-600" strokeWidth={2} />
                    </div>
                    <span className="text-base font-semibold text-gray-800">Débitos</span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                      <BarChart3 className="w-6 h-6 text-blue-600" strokeWidth={2} />
                    </div>
                    <span className="text-base font-semibold text-gray-800">Relatórios</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Seção Direita - Formulário de Login */}
            <section className="flex flex-col justify-center px-6 py-12 md:px-12 lg:py-0">
              <div className="w-full max-w-md mx-auto lg:mx-0 lg:ml-auto">
                {/* Card com vidro frosted */}
                <div className="relative p-1 rounded-3xl bg-gradient-to-br from-white/40 to-white/20 backdrop-blur-xl border border-white/60 shadow-2xl">
                  <div className="bg-white/95 backdrop-blur rounded-3xl p-8 md:p-10">
                    {/* Ícone do card */}
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center mb-8 shadow-lg">
                      <Lock className="w-8 h-8 text-blue-600" strokeWidth={1.5} />
                    </div>

                    {/* Títulos */}
                    <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">
                      Acessar sistema
                    </h2>
                    <p className="text-gray-600 mb-8 leading-relaxed font-medium">
                      Entre com suas credenciais para acessar o painel administrativo.
                    </p>

                    {/* Formulário */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                      {/* Campo Usuário */}
                      <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">
                          E-mail ou usuário
                        </label>
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2">
                            <svg
                              className="w-5 h-5 text-gray-500"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M20 21a8 8 0 0 0-16 0" />
                              <circle cx="12" cy="7" r="4" />
                            </svg>
                          </div>
                          <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Digite seu e-mail ou usuário"
                            className="w-full min-h-14 pl-12 pr-4 bg-white border-2 border-gray-200 rounded-2xl outline-none font-medium text-gray-900 placeholder-gray-500 transition-all focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                            disabled={isLoading}
                          />
                        </div>
                      </div>

                      {/* Campo Senha */}
                      <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">
                          Senha
                        </label>
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2">
                            <svg
                              className="w-5 h-5 text-gray-500"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <rect x="4" y="11" width="16" height="10" rx="2" />
                              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                            </svg>
                          </div>
                          <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Digite sua senha"
                            className="w-full min-h-14 pl-12 pr-12 bg-white border-2 border-gray-200 rounded-2xl outline-none font-medium text-gray-900 placeholder-gray-500 transition-all focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                            disabled={isLoading}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                            disabled={isLoading}
                          >
                            {showPassword ? (
                              <EyeOff className="w-5 h-5" />
                            ) : (
                              <Eye className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Lembrar e Esqueci senha */}
                      <div className="flex items-center justify-between gap-3 pt-2">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="w-4 h-4 rounded border-2 border-gray-300 accent-blue-600 cursor-pointer"
                            disabled={isLoading}
                          />
                          <span className="text-sm font-bold text-gray-700">Lembrar acesso</span>
                        </label>
                        <a
                          href="#"
                          className="text-sm font-bold text-blue-600 hover:underline transition-all"
                        >
                          Esqueci minha senha
                        </a>
                      </div>

                      {/* Botão Entrar */}
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full min-h-14 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isLoading ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Entrando...
                          </>
                        ) : (
                          <>
                            Entrar no sistema
                            <ArrowRight className="w-5 h-5" />
                          </>
                        )}
                      </button>

                      {/* Divisor de segurança */}
                      <div className="flex items-center gap-3 pt-4">
                        <div className="flex-1 h-px bg-gray-200" />
                        <div className="flex items-center gap-1 text-xs font-bold text-gray-600">
                          <Lock className="w-4 h-4" />
                          Acesso seguro e protegido
                        </div>
                        <div className="flex-1 h-px bg-gray-200" />
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </section>
          </main>

          {/* Footer */}
          <footer className="absolute bottom-0 left-0 right-0 bg-gradient-to-r from-blue-900 to-blue-800 text-blue-100 py-4">
            <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 text-center md:text-left">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                <span className="text-sm font-medium">Desenvolvido por Grupo Modelo</span>
              </div>
              <div className="hidden md:block w-px h-5 bg-blue-300/40" />
              <span className="text-sm font-medium">© 2026 Todos os direitos reservados</span>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
