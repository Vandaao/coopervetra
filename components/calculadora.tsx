"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Calculator } from "lucide-react"

interface CalculadoraProps {
  onAplicar: (valor: string) => void
}

export function Calculadora({ onAplicar }: CalculadoraProps) {
  const [open, setOpen] = useState(false)
  const [display, setDisplay] = useState("0")
  const [valorAnterior, setValorAnterior] = useState<number | null>(null)
  const [operador, setOperador] = useState<string | null>(null)
  const [aguardandoNovoValor, setAguardandoNovoValor] = useState(false)

  const limpar = useCallback(() => {
    setDisplay("0")
    setValorAnterior(null)
    setOperador(null)
    setAguardandoNovoValor(false)
  }, [])

  const inserirDigito = useCallback(
    (digito: string) => {
      if (aguardandoNovoValor) {
        setDisplay(digito)
        setAguardandoNovoValor(false)
      } else {
        setDisplay(display === "0" ? digito : display + digito)
      }
    },
    [display, aguardandoNovoValor],
  )

  const inserirDecimal = useCallback(() => {
    if (aguardandoNovoValor) {
      setDisplay("0.")
      setAguardandoNovoValor(false)
      return
    }
    if (!display.includes(".")) {
      setDisplay(display + ".")
    }
  }, [display, aguardandoNovoValor])

  const calcular = useCallback(
    (anterior: number, atual: number, op: string) => {
      switch (op) {
        case "+":
          return anterior + atual
        case "-":
          return anterior - atual
        case "*":
          return anterior * atual
        case "/":
          return atual !== 0 ? anterior / atual : 0
        default:
          return atual
      }
    },
    [],
  )

  const aplicarOperador = useCallback(
    (proximoOperador: string) => {
      const valorAtual = Number.parseFloat(display)

      if (valorAnterior === null) {
        setValorAnterior(valorAtual)
      } else if (operador) {
        const resultado = calcular(valorAnterior, valorAtual, operador)
        setDisplay(String(resultado))
        setValorAnterior(resultado)
      }

      setAguardandoNovoValor(true)
      setOperador(proximoOperador)
    },
    [display, valorAnterior, operador, calcular],
  )

  const calcularResultado = useCallback(() => {
    const valorAtual = Number.parseFloat(display)
    if (valorAnterior !== null && operador) {
      const resultado = calcular(valorAnterior, valorAtual, operador)
      setDisplay(String(resultado))
      setValorAnterior(null)
      setOperador(null)
      setAguardandoNovoValor(true)
    }
  }, [display, valorAnterior, operador, calcular])

  const handleAplicar = useCallback(() => {
    const valorFinal = Number.parseFloat(display)
    onAplicar(valorFinal.toFixed(2))
    setOpen(false)
    limpar()
  }, [display, onAplicar, limpar])

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") {
        inserirDigito(e.key)
      } else if (e.key === ".") {
        inserirDecimal()
      } else if (["+", "-", "*", "/"].includes(e.key)) {
        aplicarOperador(e.key)
      } else if (e.key === "Enter" || e.key === "=") {
        e.preventDefault()
        calcularResultado()
      } else if (e.key === "Escape") {
        limpar()
      } else if (e.key === "Backspace") {
        setDisplay((d) => (d.length > 1 ? d.slice(0, -1) : "0"))
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open, inserirDigito, inserirDecimal, aplicarOperador, calcularResultado, limpar])

  const botoes = [
    { label: "C", action: limpar, variant: "destructive" as const, span: 2 },
    { label: "÷", action: () => aplicarOperador("/"), variant: "secondary" as const },
    { label: "×", action: () => aplicarOperador("*"), variant: "secondary" as const },
    { label: "7", action: () => inserirDigito("7"), variant: "outline" as const },
    { label: "8", action: () => inserirDigito("8"), variant: "outline" as const },
    { label: "9", action: () => inserirDigito("9"), variant: "outline" as const },
    { label: "-", action: () => aplicarOperador("-"), variant: "secondary" as const },
    { label: "4", action: () => inserirDigito("4"), variant: "outline" as const },
    { label: "5", action: () => inserirDigito("5"), variant: "outline" as const },
    { label: "6", action: () => inserirDigito("6"), variant: "outline" as const },
    { label: "+", action: () => aplicarOperador("+"), variant: "secondary" as const },
    { label: "1", action: () => inserirDigito("1"), variant: "outline" as const },
    { label: "2", action: () => inserirDigito("2"), variant: "outline" as const },
    { label: "3", action: () => inserirDigito("3"), variant: "outline" as const },
    { label: "=", action: calcularResultado, variant: "default" as const, rowSpan: true },
    { label: "0", action: () => inserirDigito("0"), variant: "outline" as const, span: 2 },
    { label: ".", action: inserirDecimal, variant: "outline" as const },
  ]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="shrink-0"
          aria-label="Abrir calculadora"
        >
          <Calculator className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>Calculadora</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-md border bg-muted px-4 py-3 text-right text-2xl font-mono font-semibold overflow-x-auto">
            {display}
          </div>
          <div className="grid grid-cols-4 gap-2">
            <Button
              type="button"
              variant="destructive"
              onClick={limpar}
              className="col-span-2"
            >
              C
            </Button>
            <Button type="button" variant="secondary" onClick={() => aplicarOperador("/")}>
              ÷
            </Button>
            <Button type="button" variant="secondary" onClick={() => aplicarOperador("*")}>
              ×
            </Button>

            <Button type="button" variant="outline" onClick={() => inserirDigito("7")}>
              7
            </Button>
            <Button type="button" variant="outline" onClick={() => inserirDigito("8")}>
              8
            </Button>
            <Button type="button" variant="outline" onClick={() => inserirDigito("9")}>
              9
            </Button>
            <Button type="button" variant="secondary" onClick={() => aplicarOperador("-")}>
              −
            </Button>

            <Button type="button" variant="outline" onClick={() => inserirDigito("4")}>
              4
            </Button>
            <Button type="button" variant="outline" onClick={() => inserirDigito("5")}>
              5
            </Button>
            <Button type="button" variant="outline" onClick={() => inserirDigito("6")}>
              6
            </Button>
            <Button type="button" variant="secondary" onClick={() => aplicarOperador("+")}>
              +
            </Button>

            <Button type="button" variant="outline" onClick={() => inserirDigito("1")}>
              1
            </Button>
            <Button type="button" variant="outline" onClick={() => inserirDigito("2")}>
              2
            </Button>
            <Button type="button" variant="outline" onClick={() => inserirDigito("3")}>
              3
            </Button>
            <Button
              type="button"
              variant="default"
              onClick={calcularResultado}
              className="row-span-2 h-auto"
            >
              =
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => inserirDigito("0")}
              className="col-span-2"
            >
              0
            </Button>
            <Button type="button" variant="outline" onClick={inserirDecimal}>
              .
            </Button>
          </div>
          <Button type="button" onClick={handleAplicar} className="w-full">
            Usar valor (R$ {Number.parseFloat(display).toFixed(2)})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
