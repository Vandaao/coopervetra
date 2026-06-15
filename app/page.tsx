"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, ArrowRight, Truck, DollarSign, BarChart3, ShieldCheck, User, Lock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { setSession, isAuthenticated } from "@/lib/session"

export default function HomePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  useEffect(() => {
    if (isAuthenticated()) {
      router.push("/dashboard")
      return
    }

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

    setLoading(true)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Credenciais inválidas")
      }

      setSession(data.user)

      if (rememberMe) {
        localStorage.setItem("coopervetra_username", username)
      } else {
        localStorage.removeItem("coopervetra_username")
      }

      toast({
        title: "Sucesso",
        description: `Bem-vindo, ${data.user.nome}!`,
      })

      router.push("/dashboard")
    } catch (error) {
      toast({
        title: "Erro na autenticação",
        description: error instanceof Error ? error.message : "Verifique suas credenciais",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen grid grid-rows-[1fr_auto] overflow-hidden bg-gradient-to-br from-white via-sky-50 to-blue-100">
      {/* Elementos decorativos de fundo */}
      <div className="pointer-events-none absolute -right-[17vw] -top-[18vh] h-[82vh] w-[58vw] -rotate-3 rounded-bl-[55%] bg-gradient-to-b from-blue-500/10 to-blue-500/25" />
      <div className="pointer-events-none absolute -right-[10vw] bottom-0 h-[42vh] w-[54vw] rounded-tl-[70%] bg-gradient-to-br from-blue-500/10 to-blue-600/70" />
      <div className="pointer-events-none absolute -right-[4vw] bottom-20 hidden h-[55vh] w-[37vw] min-w-[430px] -rotate-[9deg] rounded-tl-[55%] border-4 border-l-transparent border-b-transparent border-white/70 lg:block" />

      <section className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-12 px-6 py-12 md:px-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
        {/* Branding */}
        <div className="max-w-xl text-center lg:text-left">
          <div className="mb-8 flex justify-center lg:justify-start">
            <div className="flex h-28 w-28 items-center justify-center rounded-full bg-white shadow-xl">
              <Truck className="h-14 w-14 text-blue-600" strokeWidth={1.5} />
            </div>
          </div>

          <h1 className="text-balance text-5xl font-black leading-none tracking-wide text-blue-600 md:text-6xl">
            COOPERVETRA
          </h1>
          <p className="mx-auto mt-6 max-w-lg text-pretty text-lg font-medium leading-relaxed text-slate-600 md:text-xl lg:mx-0">
            Cooperativa de Transportadores Autônomos de Rio Pomba e Região
          </p>

          <div className="mx-auto my-9 h-1 w-14 rounded-full bg-blue-600 lg:mx-0" />

          <div className="flex flex-wrap justify-center gap-4 lg:justify-start">
            <span className="inline-flex min-h-14 items-center gap-3 rounded-xl border border-blue-100 bg-white/80 px-6 text-base font-semibold text-slate-700 shadow-sm backdrop-blur">
              <Truck className="h-6 w-6 text-blue-600" strokeWidth={2} />
              Fretes
            </span>
            <span className="inline-flex min-h-14 items-center gap-3 rounded-xl border border-blue-100 bg-white/80 px-6 text-base font-semibold text-slate-700 shadow-sm backdrop-blur">
              <DollarSign className="h-6 w-6 text-blue-600" strokeWidth={2} />
              Débitos
            </span>
            <span className="inline-flex min-h-14 items-center gap-3 rounded-xl border border-blue-100 bg-white/80 px-6 text-base font-semibold text-slate-700 shadow-sm backdrop-blur">
              <BarChart3 className="h-6 w-6 text-blue-600" strokeWidth={2} />
              Relatórios
            </span>
          </div>
        </div>

        {/* Card de Login */}
        <div className="w-full max-w-md justify-self-center rounded-[38px] bg-white/40 p-3 shadow-xl lg:justify-self-end">
          <div className="rounded-[34px] border border-white/95 bg-white/95 p-8 shadow-2xl backdrop-blur-lg md:p-10">
            <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-white shadow-lg">
              <Truck className="h-8 w-8 text-blue-600" strokeWidth={1.5} />
            </div>

            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">Acessar sistema</h2>
            <p className="mb-8 mt-2 font-medium leading-relaxed text-slate-500">
              Entre com suas credenciais para acessar o painel administrativo.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="usuario" className="mb-2 block text-sm font-bold text-slate-900">
                  E-mail ou usuário
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    id="usuario"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Digite seu e-mail ou usuário"
                    autoComplete="username"
                    disabled={loading}
                    className="min-h-14 w-full rounded-2xl border-2 border-slate-200 bg-white/90 pl-12 pr-4 font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="senha" className="mb-2 block text-sm font-bold text-slate-900">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    id="senha"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite sua senha"
                    autoComplete="current-password"
                    disabled={loading}
                    className="min-h-14 w-full rounded-2xl border-2 border-slate-200 bg-white/90 pl-12 pr-12 font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
                <label className="flex cursor-pointer select-none items-center gap-2">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={loading}
                    className="h-4 w-4 cursor-pointer rounded border-2 border-slate-300 accent-blue-600"
                  />
                  <span className="text-sm font-bold text-slate-600">Lembrar acesso</span>
                </label>
                <a href="#" className="text-sm font-bold text-blue-600 hover:underline">
                  Esqueci minha senha
                </a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-b from-blue-500 to-blue-600 font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Entrando...
                  </>
                ) : (
                  <>
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-blue-600">
                      <ArrowRight className="h-4 w-4" strokeWidth={3} />
                    </span>
                    Entrar no sistema
                  </>
                )}
              </button>

              <div className="flex items-center gap-4 pt-3 text-sm font-bold text-slate-400">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="inline-flex items-center gap-2 whitespace-nowrap">
                  <ShieldCheck className="h-4 w-4" />
                  Acesso seguro e protegido
                </span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>
            </form>
          </div>
        </div>
      </section>

      <footer className="relative z-10 flex min-h-[74px] flex-col items-center justify-center gap-2 bg-gradient-to-r from-blue-900 to-blue-800 px-6 py-4 text-center text-sm font-medium text-blue-100 sm:flex-row sm:gap-6">
        <span className="inline-flex items-center gap-2">
          <ShieldCheck className="h-4 w-4" />
          Desenvolvido por Grupo Modelo
        </span>
        <span className="hidden h-4 w-px bg-blue-300/40 sm:block" />
        <span>© 2026 Todos os direitos reservados</span>
      </footer>
    </div>
  )
}
