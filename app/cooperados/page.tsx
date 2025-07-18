"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Plus, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { AuthGuard } from "@/components/auth-guard"

interface Cooperado {
  id: number
  nome: string
  cpf: string
  placa: string
}

export default function CooperadosPage() {
  const [cooperados, setCooperados] = useState<Cooperado[]>([])
  const [nome, setNome] = useState("")
  const [cpf, setCpf] = useState("")
  const [placa, setPlaca] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchCooperados()
  }, [])

  const fetchCooperados = async () => {
    try {
      const response = await fetch("/api/cooperados")
      const data = await response.json()
      setCooperados(data)
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar cooperados",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/cooperados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, cpf, placa }),
      })

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Cooperado cadastrado com sucesso",
        })
        setNome("")
        setCpf("")
        setPlaca("")
        fetchCooperados()
      } else {
        throw new Error("Erro ao cadastrar")
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao cadastrar cooperado",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/cooperados/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Cooperado excluído com sucesso",
        })
        fetchCooperados()
      } else {
        throw new Error("Erro ao excluir")
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir cooperado",
        variant: "destructive",
      })
    }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center py-6">
              <Link href="/">
                <Button variant="ghost" size="sm" className="mr-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Gerenciar Cooperados</h1>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Plus className="h-5 w-5 mr-2" />
                  Cadastrar Cooperado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="nome">Nome</Label>
                    <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
                  </div>
                  <div>
                    <Label htmlFor="cpf">CPF</Label>
                    <Input
                      id="cpf"
                      value={cpf}
                      onChange={(e) => setCpf(e.target.value)}
                      placeholder="000.000.000-00"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="placa">Placa</Label>
                    <Input
                      id="placa"
                      value={placa}
                      onChange={(e) => setPlaca(e.target.value)}
                      placeholder="ABC-1234"
                      required
                    />
                  </div>
                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? "Cadastrando..." : "Cadastrar Cooperado"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cooperados Cadastrados</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>Placa</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cooperados.map((cooperado) => (
                      <TableRow key={cooperado.id}>
                        <TableCell>{cooperado.nome}</TableCell>
                        <TableCell>{cooperado.cpf}</TableCell>
                        <TableCell>{cooperado.placa}</TableCell>
                        <TableCell>
                          <Button variant="destructive" size="sm" onClick={() => handleDelete(cooperado.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}
