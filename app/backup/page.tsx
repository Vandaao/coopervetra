"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Download, Database, Shield, AlertTriangle, CheckCircle, Info } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { AuthGuard } from "@/components/auth-guard"

interface BackupStats {
  total_cooperados: number
  total_empresas: number
  total_fretes: number
  total_debitos: number
  total_usuarios: number
}

export default function BackupPage() {
  const [loading, setLoading] = useState(false)
  const [backupInfo, setBackupInfo] = useState<BackupStats | null>(null)
  const { toast } = useToast()

  const handleBackup = async () => {
    setLoading(true)

    try {
      const response = await fetch("/api/backup")
      const data = await response.json()

      if (response.ok) {
        // Armazenar estatísticas
        setBackupInfo(data.statistics)

        // Criar arquivo JSON
        const jsonString = JSON.stringify(data, null, 2)
        const blob = new Blob([jsonString], { type: "application/json" })

        // Criar nome do arquivo com data e hora
        const now = new Date()
        const dateStr = now.toISOString().slice(0, 10)
        const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, "-")
        const fileName = `backup-coopervetra-${dateStr}-${timeStr}.json`

        // Criar link de download
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)

        toast({
          title: "Sucesso",
          description: `Backup realizado com sucesso! Arquivo: ${fileName}`,
        })
      } else {
        throw new Error(data.error || "Erro ao gerar backup")
      }
    } catch (error) {
      console.error("Erro ao realizar backup:", error)
      toast({
        title: "Erro",
        description: "Erro ao realizar backup. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
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
              <h1 className="text-2xl font-bold text-gray-900">Backup de Dados</h1>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Card Principal de Backup */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="h-5 w-5 mr-2" />
                  Realizar Backup
                </CardTitle>
                <CardDescription>Faça o download de todos os dados do sistema em formato JSON</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <Info className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-blue-900 mb-2">O que será incluído no backup?</h3>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Todos os cooperados cadastrados</li>
                        <li>• Todas as empresas cadastradas</li>
                        <li>• Todos os fretes registrados</li>
                        <li>• Todos os débitos registrados</li>
                        <li>• Informações dos usuários (sem senhas)</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button onClick={handleBackup} disabled={loading} size="lg" className="flex-1">
                    <Download className="h-5 w-5 mr-2" />
                    {loading ? "Gerando Backup..." : "Baixar Backup"}
                  </Button>
                </div>

                {backupInfo && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
                    <div className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-green-900 mb-2">Último Backup Realizado</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm text-green-800">
                          <div>
                            <p className="font-medium">Cooperados</p>
                            <p className="text-lg font-bold">{backupInfo.total_cooperados}</p>
                          </div>
                          <div>
                            <p className="font-medium">Empresas</p>
                            <p className="text-lg font-bold">{backupInfo.total_empresas}</p>
                          </div>
                          <div>
                            <p className="font-medium">Fretes</p>
                            <p className="text-lg font-bold">{backupInfo.total_fretes}</p>
                          </div>
                          <div>
                            <p className="font-medium">Débitos</p>
                            <p className="text-lg font-bold">{backupInfo.total_debitos}</p>
                          </div>
                          <div>
                            <p className="font-medium">Usuários</p>
                            <p className="text-lg font-bold">{backupInfo.total_usuarios}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Cards Laterais */}
            <div className="space-y-6">
              {/* Card de Segurança */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-base">
                    <Shield className="h-4 w-4 mr-2" />
                    Segurança
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                    <p className="text-gray-700">Senhas de usuários não são incluídas no backup</p>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                    <p className="text-gray-700">Dados são exportados em formato JSON criptografável</p>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                    <p className="text-gray-700">Backup pode ser armazenado em local seguro</p>
                  </div>
                </CardContent>
              </Card>

              {/* Card de Recomendações */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-base">
                    <AlertTriangle className="h-4 w-4 mr-2 text-yellow-600" />
                    Recomendações
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-gray-700">
                  <p>• Realize backups regularmente (diário ou semanal)</p>
                  <p>• Armazene os backups em local seguro</p>
                  <p>• Mantenha múltiplas cópias em locais diferentes</p>
                  <p>• Teste a restauração periodicamente</p>
                  <p>• Não compartilhe arquivos de backup publicamente</p>
                </CardContent>
              </Card>

              {/* Card de Informações */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-base">
                    <Info className="h-4 w-4 mr-2" />
                    Formato do Arquivo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-gray-700">
                  <p>
                    <strong>Formato:</strong> JSON
                  </p>
                  <p>
                    <strong>Nome:</strong> backup-coopervetra-YYYY-MM-DD-HH-MM-SS.json
                  </p>
                  <p>
                    <strong>Estrutura:</strong>
                  </p>
                  <ul className="ml-4 space-y-1">
                    <li>• Metadados do backup</li>
                    <li>• Estatísticas dos dados</li>
                    <li>• Dados completos das tabelas</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Seção de Instruções */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Como Usar o Backup</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="flex items-center mb-3">
                    <div className="bg-blue-100 rounded-full w-8 h-8 flex items-center justify-center mr-3">
                      <span className="text-blue-600 font-bold">1</span>
                    </div>
                    <h3 className="font-semibold">Realizar Backup</h3>
                  </div>
                  <p className="text-sm text-gray-600 ml-11">
                    Clique no botão "Baixar Backup" para gerar e baixar o arquivo JSON com todos os dados do sistema.
                  </p>
                </div>

                <div>
                  <div className="flex items-center mb-3">
                    <div className="bg-blue-100 rounded-full w-8 h-8 flex items-center justify-center mr-3">
                      <span className="text-blue-600 font-bold">2</span>
                    </div>
                    <h3 className="font-semibold">Armazenar com Segurança</h3>
                  </div>
                  <p className="text-sm text-gray-600 ml-11">
                    Salve o arquivo em um local seguro, como um HD externo, serviço de nuvem criptografado ou servidor
                    de backup.
                  </p>
                </div>

                <div>
                  <div className="flex items-center mb-3">
                    <div className="bg-blue-100 rounded-full w-8 h-8 flex items-center justify-center mr-3">
                      <span className="text-blue-600 font-bold">3</span>
                    </div>
                    <h3 className="font-semibold">Restaurar se Necessário</h3>
                  </div>
                  <p className="text-sm text-gray-600 ml-11">
                    Em caso de perda de dados, o arquivo pode ser usado para restaurar as informações do sistema.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </AuthGuard>
  )
}
