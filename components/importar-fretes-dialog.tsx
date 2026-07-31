"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Upload, CheckCircle, Loader } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Empresa {
  id: number
  nome: string
}

interface ImportarFretesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  empresas: Empresa[]
  onImportSuccess: () => void
}

export function ImportarFretesDialog({ open, onOpenChange, empresas, onImportSuccess }: ImportarFretesDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [empresaId, setEmpresaId] = useState("")
  const [loading, setLoading] = useState(false)
  const [importStatus, setImportStatus] = useState<{
    status: "idle" | "processing" | "success" | "error"
    message?: string
    imported?: number
    errors?: string[]
    matchesAproximados?: Array<{
      linha: number
      informado: string
      cadastrado: string
      similaridade: number
    }>
  }>({ status: "idle" })
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const selectedFile = e.target.files[0]
      // Validar tipo de arquivo
      const validTypes = ["text/csv", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]
      const validExtensions = [".csv", ".xls", ".xlsx"]

      const isValidType = validTypes.includes(selectedFile.type) || validExtensions.some((ext) => selectedFile.name.toLowerCase().endsWith(ext))

      if (!isValidType) {
        toast({
          title: "Arquivo inválido",
          description: "Por favor, envie um arquivo CSV ou Excel (.xlsx, .xls)",
          variant: "destructive",
        })
        return
      }

      setFile(selectedFile)
      setImportStatus({ status: "idle" })
    }
  }

  const handleImport = async () => {
    if (!file || !empresaId) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione um arquivo e uma empresa",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    setImportStatus({ status: "processing", message: "Processando arquivo..." })

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("empresa_id", empresaId)

      const response = await fetch("/api/fretes/importar", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        const quantidadeAproximados = data.matchesAproximados?.length || 0

        setImportStatus({
          status: "success",
          message: data.message || `${data.imported} fretes importados com sucesso!`,
          imported: data.imported,
          errors: data.errors || [],
          matchesAproximados: data.matchesAproximados || [],
        })

        toast({
          title: "Importação concluída",
          description: `${data.imported} fretes importados${
            quantidadeAproximados > 0 ? ` e ${quantidadeAproximados} nomes associados por aproximação` : ""
          }.`,
        })

        onImportSuccess()
      } else {
        setImportStatus({
          status: "error",
          message: data.error || "Erro ao importar fretes",
          errors: data.errors || [],
        })

        toast({
          title: "Erro na importação",
          description: data.error || "Verifique o arquivo e tente novamente",
          variant: "destructive",
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
      setImportStatus({
        status: "error",
        message: errorMessage,
      })

      toast({
        title: "Erro ao importar",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFile(null)
    setEmpresaId("")
    setImportStatus({ status: "idle" })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Importar Fretes</DialogTitle>
          <DialogDescription>Carregue uma planilha com os fretes para importar automaticamente</DialogDescription>
        </DialogHeader>

        {importStatus.status === "idle" && (
          <div className="space-y-4">
            {/* Seleção de Empresa */}
            <div className="space-y-2">
              <Label htmlFor="empresa">Empresa*</Label>
              <Select value={empresaId} onValueChange={setEmpresaId}>
                <SelectTrigger id="empresa">
                  <SelectValue placeholder="Selecione a empresa" />
                </SelectTrigger>
                <SelectContent>
                  {empresas.map((empresa) => (
                    <SelectItem key={empresa.id} value={empresa.id.toString()}>
                      {empresa.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Upload de Arquivo */}
            <div className="space-y-2">
              <Label htmlFor="file">Planilha*</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <input
                  id="file"
                  type="file"
                  accept=".csv,.xls,.xlsx"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={loading}
                />
                <label htmlFor="file" className="cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm font-medium text-gray-700">
                    {file ? file.name : "Clique ou arraste um arquivo"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">CSV ou Excel (.xlsx, .xls)</p>
                </label>
              </div>
            </div>

            {/* Instruções */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                A planilha deve conter as colunas: <strong>Cooperado</strong>, <strong>Carga</strong>, <strong>KM</strong>, <strong>Data</strong> e <strong>Valor</strong>
              </AlertDescription>
            </Alert>

            {/* Botões */}
            <div className="flex gap-2">
              <Button onClick={handleImport} disabled={!file || !empresaId || loading} className="flex-1">
                {loading ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Importando...
                  </>
                ) : (
                  "Importar"
                )}
              </Button>
              <Button variant="outline" onClick={handleClose} disabled={loading}>
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {importStatus.status === "processing" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader className="h-8 w-8 animate-spin text-blue-500" />
            <p className="text-sm text-gray-600">{importStatus.message}</p>
          </div>
        )}

        {importStatus.status === "success" && (
          <div className="space-y-4 py-4">
            <div className="flex flex-col items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <p className="text-sm text-center text-gray-700">{importStatus.message}</p>
            </div>

            {importStatus.matchesAproximados && importStatus.matchesAproximados.length > 0 && (
              <div className="rounded-md border border-blue-200 bg-blue-50 p-3">
                <p className="mb-2 text-xs font-semibold text-blue-900">Nomes associados automaticamente:</p>
                <ul className="max-h-36 space-y-1 overflow-y-auto text-xs text-blue-800">
                  {importStatus.matchesAproximados.map((match, idx) => (
                    <li key={`${match.linha}-${idx}`}>
                      • Linha {match.linha}: “{match.informado}” → <strong>{match.cadastrado}</strong> ({match.similaridade}%)
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {importStatus.errors && importStatus.errors.length > 0 && (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
                <p className="mb-2 text-xs font-semibold text-amber-900">Linhas não importadas:</p>
                <ul className="max-h-32 space-y-1 overflow-y-auto text-xs text-amber-800">
                  {importStatus.errors.map((error, idx) => (
                    <li key={idx}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            <Button onClick={handleClose} className="w-full">
              Concluir
            </Button>
          </div>
        )}

        {importStatus.status === "error" && (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{importStatus.message}</AlertDescription>
            </Alert>

            {importStatus.errors && importStatus.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <p className="text-xs font-semibold text-red-900 mb-2">Erros encontrados:</p>
                <ul className="text-xs text-red-700 space-y-1 max-h-32 overflow-y-auto">
                  {importStatus.errors.map((error, idx) => (
                    <li key={idx}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            <Button onClick={() => setImportStatus({ status: "idle" })} className="w-full">
              Tentar novamente
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
