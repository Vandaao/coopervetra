"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ArrowLeft, Plus, Trash2, Edit } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { AuthGuard } from "@/components/auth-guard"

interface Cooperado {
  id: number
  nome: string
  cpf: string
  placa: string
  conta_bancaria: string
}

export default function CooperadosPage() {
  const [cooperados, setCooperados] = useState<Cooperado[]>([])
  const [nome, setNome] = useState("")
  const [cpf, setCpf] = useState("")
  const [placa, setPlaca] = useState("")
  const [contaBancaria, setContaBancaria] = useState("")
  const [loading, setLoading] = useState(false)
  const [editingCooperado, setEditingCooperado] = useState<Cooperado | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
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

  const resetForm = () => {
    setNome("")
    setCpf("")
    setPlaca("")
    setContaBancaria("")
    setEditingCooperado(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = editingCooperado ? `/api/cooperados/${editingCooperado.id}` : "/api/cooperados"
      const method = editingCooperado ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, cpf, placa, conta_bancaria: contaBancaria }),
      })

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: editingCooperado ? "Cooperado atualizado com sucesso" : "Cooperado cadastrado com sucesso",
        })
        resetForm()
        setIsDialogOpen(false)
        fetchCooperados()
      } else {
        const data = await response.json()
        throw new Error(data.error || "Erro ao salvar cooperado")
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao salvar cooperado",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (cooperado: Cooperado) => {
    setEditingCooperado(cooperado)
    setNome(cooperado.nome)
    setCpf(cooperado.cpf)
    setPlaca(cooperado.placa)
    setContaBancaria(cooperado.conta_bancaria || "")
    setIsDialogOpen(true)
  }

  const handleNewCooperado = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este cooperado?")) {
      return
    }

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
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Cooperados Cadastrados</CardTitle>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={handleNewCooperado}>
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Cooperado
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>{editingCooperado ? "Editar Cooperado" : "Novo Cooperado"}</DialogTitle>
                    </DialogHeader>
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
                      <div>
                        <Label htmlFor="contaBancaria">Dados Bancários (Opcional)</Label>
                        <Textarea
                          id="contaBancaria"
                          value={contaBancaria}
                          onChange={(e) => setContaBancaria(e.target.value)}
                          placeholder="PIX: (32) 99999-9999 | Banco do Brasil - Ag: 1234 - CC: 12345-6"
                          rows={3}
                        />
                        <p className="text-xs text-muted-foreground mt-1">Inclua PIX, banco, agência, conta, etc.</p>
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" disabled={loading} className="flex-1">
                          {loading ? "Salvando..." : editingCooperado ? "Atualizar" : "Cadastrar"}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                          Cancelar
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>Placa</TableHead>
                      <TableHead>Dados Bancários</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cooperados.map((cooperado) => (
                      <TableRow key={cooperado.id}>
                        <TableCell className="font-medium">{cooperado.nome}</TableCell>
                        <TableCell>{cooperado.cpf}</TableCell>
                        <TableCell>{cooperado.placa}</TableCell>
                        <TableCell className="max-w-xs">
                          <div className="text-sm">
                            {cooperado.conta_bancaria ? (
                              <span className="whitespace-pre-wrap">{cooperado.conta_bancaria}</span>
                            ) : (
                              <span className="text-muted-foreground italic">Não informado</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleEdit(cooperado)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDelete(cooperado.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </AuthGuard>
  )
}
