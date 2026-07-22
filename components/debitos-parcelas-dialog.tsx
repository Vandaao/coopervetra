"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format, isPast, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CheckCircle, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Parcela {
  id: number
  numero_parcela: number
  total_parcelas: number
  data_vencimento: string
  valor_parcela: number
  status: "pendente" | "pago" | "vencida"
  data_pagamento?: string
}

interface DebitosParcellasDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  debitoId: number
  descricao: string
  parcelas: Parcela[]
  onParcelaPaga?: () => void
}

export function DebitosParcellasDialog({
  open,
  onOpenChange,
  debitoId,
  descricao,
  parcelas: initialParcelas,
  onParcelaPaga,
}: DebitosParcellasDialogProps) {
  const [parcelas, setParcelas] = useState<Parcela[]>(initialParcelas)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setParcelas(initialParcelas)
  }, [initialParcelas])

  const handlePagarParcela = async (parcelaId: number) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/debitos/parcelas/${parcelaId}/pagar`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data_pagamento: new Date() }),
      })

      if (!response.ok) {
        throw new Error("Erro ao pagar parcela")
      }

      const data = await response.json()

      // Atualizar a parcela no estado
      setParcelas(
        parcelas.map((p) =>
          p.id === parcelaId
            ? {
                ...p,
                status: "pago",
                data_pagamento: format(new Date(), "yyyy-MM-dd"),
              }
            : p,
        ),
      )

      toast({
        title: "Sucesso",
        description: data.message,
      })

      onParcelaPaga?.()
    } catch (error) {
      console.error("Erro ao pagar parcela:", error)
      toast({
        title: "Erro",
        description: "Não foi possível pagar a parcela",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const totalPago = parcelas.filter((p) => p.status === "pago").length
  const statusResume = `${totalPago}/${parcelas.length} pago${totalPago !== 1 ? "s" : ""}`

  const getStatusColor = (status: string) => {
    if (status === "pago") return "bg-green-100 text-green-800"
    if (status === "vencida") return "bg-red-100 text-red-800"
    return "bg-yellow-100 text-yellow-800"
  }

  const getStatusLabel = (status: string) => {
    if (status === "pago") return "Pago"
    if (status === "vencida") return "Vencida"
    return "Pendente"
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Parcelas do Débito</DialogTitle>
          <DialogDescription>
            {descricao} • {statusResume}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">Parcela</TableHead>
                <TableHead className="text-center">Vencimento</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parcelas.map((parcela) => {
                const isVencida =
                  parcela.status === "pendente" &&
                  isPast(parseISO(parcela.data_vencimento))

                const statusFinal = isVencida ? "vencida" : parcela.status

                return (
                  <TableRow key={parcela.id}>
                    <TableCell className="text-center font-medium">
                      {parcela.numero_parcela}/{parcela.total_parcelas}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        {format(parseISO(parcela.data_vencimento), "dd/MM/yyyy", {
                          locale: ptBR,
                        })}
                        {isVencida && (
                          <AlertCircle className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      R$ {Number(parcela.valor_parcela).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={getStatusColor(statusFinal)}>
                        {getStatusLabel(statusFinal)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {statusFinal === "pago" ? (
                        <div className="flex items-center justify-center gap-1 text-sm text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          {parcela.data_pagamento
                            ? format(parseISO(parcela.data_pagamento), "dd/MM/yyyy", {
                                locale: ptBR,
                              })
                            : "Pago"}
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePagarParcela(parcela.id)}
                          disabled={loading}
                        >
                          Pagar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
            <p className="text-blue-900">
              <strong>Total das parcelas:</strong> R${" "}
              {parcelas
                .reduce((sum, p) => sum + Number(p.valor_parcela), 0)
                .toFixed(2)}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
