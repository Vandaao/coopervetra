"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Edit, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Taxa {
  id: number
  nome: string
  percentual: number
  descricao: string
  ativo: boolean
  created_at: string
}

export default function ConfiguracoesPage() {
  const [taxas, setTaxas] = useState<Taxa[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    nome: "",
    percentual: "",
    descricao: "",
  })
  const { toast } = useToast()

  useEffect(() => {
    carregarTaxas()
  }, [])

  const carregarTaxas = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/taxas")
      const data = await response.json()
      if (Array.isArray(data)) {
        setTaxas(data)
      }
    } catch (error) {
      console.error("Erro ao carregar taxas:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar taxas",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nome || !formData.percentual) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      })
      return
    }

    try {
      const url = editingId ? `/api/taxas/${editingId}` : "/api/taxas"
      const method = editingId ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: formData.nome,
          percentual: parseFloat(formData.percentual),
          descricao: formData.descricao,
        }),
      })

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: editingId ? "Taxa atualizada com sucesso" : "Taxa criada com sucesso",
        })
        setIsDialogOpen(false)
        setEditingId(null)
        setFormData({ nome: "", percentual: "", descricao: "" })
        carregarTaxas()
      } else {
        throw new Error("Erro ao salvar taxa")
      }
    } catch (error) {
      console.error("Erro ao salvar taxa:", error)
      toast({
        title: "Erro",
        description: "Erro ao salvar taxa",
        variant: "destructive",
      })
    }
  }

  const handleEditar = (taxa: Taxa) => {
    setEditingId(taxa.id)
    setFormData({
      nome: taxa.nome,
      percentual: (typeof taxa.percentual === "string" ? taxa.percentual : taxa.percentual.toString()),
      descricao: taxa.descricao || "",
    })
    setIsDialogOpen(true)
  }

  const handleDeletar = async (id: number) => {
    if (!confirm("Tem certeza que deseja deletar esta taxa?")) return

    try {
      const response = await fetch(`/api/taxas/${id}`, { method: "DELETE" })

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Taxa deletada com sucesso",
        })
        carregarTaxas()
      } else {
        throw new Error("Erro ao deletar taxa")
      }
    } catch (error) {
      console.error("Erro ao deletar taxa:", error)
      toast({
        title: "Erro",
        description: "Erro ao deletar taxa",
        variant: "destructive",
      })
    }
  }

  return (
    
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Configurações</h1>
            <p className="text-gray-600 mt-1">Gerenciar taxas e descontos</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingId(null)
                  setFormData({ nome: "", percentual: "", descricao: "" })
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Nova Taxa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? "Editar Taxa" : "Nova Taxa"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSalvar} className="space-y-4">
                <div>
                  <Label htmlFor="nome">Nome da Taxa</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: INSS, Administrativo"
                  />
                </div>
                <div>
                  <Label htmlFor="percentual">Percentual (%)</Label>
                  <Input
                    id="percentual"
                    type="number"
                    step="0.01"
                    value={formData.percentual}
                    onChange={(e) => setFormData({ ...formData, percentual: e.target.value })}
                    placeholder="Ex: 4.50"
                  />
                </div>
                <div>
                  <Label htmlFor="descricao">Descrição (opcional)</Label>
                  <Input
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    placeholder="Descrição da taxa"
                  />
                </div>
                <Button type="submit" className="w-full">
                  {editingId ? "Atualizar Taxa" : "Criar Taxa"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Taxas e Descontos Cadastrados</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-gray-500">Carregando taxas...</p>
            ) : taxas.length === 0 ? (
              <p className="text-gray-500">Nenhuma taxa cadastrada</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Percentual</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {taxas.map((taxa) => (
                      <TableRow key={taxa.id}>
                        <TableCell className="font-medium">{taxa.nome}</TableCell>
                        <TableCell>{Number(taxa.percentual).toFixed(2)}%</TableCell>
                        <TableCell>{taxa.descricao || "-"}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditar(taxa)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeletar(taxa.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
   
}
