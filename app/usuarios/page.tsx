"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ArrowLeft, Plus, Trash2, Edit, Users, Eye, EyeOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { AuthGuard } from "@/components/auth-guard"

interface Usuario {
  id: number
  username: string
  nome: string
  tipo: "admin" | "usuario"
  ativo: boolean
  created_at: string
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [nome, setNome] = useState("")
  const [tipo, setTipo] = useState<"admin" | "usuario">("usuario")
  const [ativo, setAtivo] = useState(true)
  const [loading, setLoading] = useState(false)
  const [editingUser, setEditingUser] = useState<Usuario | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchUsuarios()
  }, [])

  const fetchUsuarios = async () => {
    try {
      const response = await fetch("/api/usuarios")
      const data = await response.json()
      setUsuarios(data)
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar usuários",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setUsername("")
    setPassword("")
    setNome("")
    setTipo("usuario")
    setAtivo(true)
    setEditingUser(null)
    setShowPassword(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = editingUser ? `/api/usuarios/${editingUser.id}` : "/api/usuarios"
      const method = editingUser ? "PUT" : "POST"

      const body: any = {
        username,
        nome,
        tipo,
        ativo,
      }

      // Só incluir senha se foi fornecida
      if (password) {
        body.password = password
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: editingUser ? "Usuário atualizado com sucesso" : "Usuário cadastrado com sucesso",
        })
        resetForm()
        setIsDialogOpen(false)
        fetchUsuarios()
      } else {
        throw new Error(data.error || "Erro ao salvar usuário")
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao salvar usuário",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (usuario: Usuario) => {
    setEditingUser(usuario)
    setUsername(usuario.username)
    setPassword("")
    setNome(usuario.nome)
    setTipo(usuario.tipo)
    setAtivo(usuario.ativo)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este usuário?")) {
      return
    }

    try {
      const response = await fetch(`/api/usuarios/${id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Usuário excluído com sucesso",
        })
        fetchUsuarios()
      } else {
        throw new Error(data.error || "Erro ao excluir usuário")
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao excluir usuário",
        variant: "destructive",
      })
    }
  }

  const handleNewUser = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  return (
    <AuthGuard requireAdmin>
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
              <h1 className="text-2xl font-bold text-gray-900">Gerenciar Usuários</h1>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Usuários do Sistema
                </CardTitle>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={handleNewUser}>
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Usuário
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingUser ? "Editar Usuário" : "Novo Usuário"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="username">Nome de Usuário</Label>
                        <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
                      </div>
                      <div>
                        <Label htmlFor="nome">Nome Completo</Label>
                        <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
                      </div>
                      <div>
                        <Label htmlFor="password">Senha {editingUser && "(deixe em branco para manter a atual)"}</Label>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required={!editingUser}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="tipo">Tipo de Usuário</Label>
                        <Select value={tipo} onValueChange={(value: "admin" | "usuario") => setTipo(value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="usuario">Usuário</SelectItem>
                            <SelectItem value="admin">Administrador</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="ativo"
                          checked={ativo}
                          onChange={(e) => setAtivo(e.target.checked)}
                          className="rounded"
                        />
                        <Label htmlFor="ativo">Usuário ativo</Label>
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" disabled={loading} className="flex-1">
                          {loading ? "Salvando..." : editingUser ? "Atualizar" : "Cadastrar"}
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usuarios.map((usuario) => (
                    <TableRow key={usuario.id}>
                      <TableCell className="font-medium">{usuario.nome}</TableCell>
                      <TableCell>{usuario.username}</TableCell>
                      <TableCell>
                        <Badge variant={usuario.tipo === "admin" ? "default" : "secondary"}>
                          {usuario.tipo === "admin" ? "Administrador" : "Usuário"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={usuario.ativo ? "default" : "destructive"}>
                          {usuario.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(usuario.created_at).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(usuario)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDelete(usuario.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </main>
      </div>
    </AuthGuard>
  )
}
