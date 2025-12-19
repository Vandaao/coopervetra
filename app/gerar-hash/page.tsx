"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Copy, Eye, EyeOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function GerarHashPage() {
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleGenerate = async () => {
    if (!password) {
      toast({
        title: "Erro",
        description: "Digite uma senha",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/utils/generate-hash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data)
        toast({
          title: "Hash gerado!",
          description: "Use os valores abaixo para inserir no banco de dados",
        })
      } else {
        toast({
          title: "Erro",
          description: data.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao gerar hash",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copiado!",
      description: `${label} copiado para a área de transferência`,
    })
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Gerador de Hash de Senhas</CardTitle>
          <CardDescription>
            Use esta ferramenta para gerar hashes de senhas ao criar usuários diretamente no banco de dados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite a senha"
                  onKeyPress={(e) => e.key === "Enter" && handleGenerate()}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <Button onClick={handleGenerate} disabled={loading}>
                {loading ? "Gerando..." : "Gerar Hash"}
              </Button>
            </div>
          </div>

          {result && (
            <div className="space-y-4">
              <Alert>
                <AlertDescription>
                  <strong>Recomendado:</strong> Use o hash SHA-256 para novos usuários (mais seguro)
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <div className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">Hash SHA-256 (Recomendado)</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(result.hash_sha256, "Hash SHA-256")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <code className="block text-xs bg-muted p-2 rounded break-all">{result.hash_sha256}</code>
                  <p className="text-xs text-muted-foreground">
                    SQL: <code>INSERT INTO usuarios (username, senha) VALUES ('usuario', '{result.hash_sha256}');</code>
                  </p>
                </div>

                <div className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">Hash Base64 (Legado)</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(result.hash_base64_legado, "Hash Base64")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <code className="block text-xs bg-muted p-2 rounded break-all">{result.hash_base64_legado}</code>
                  <p className="text-xs text-muted-foreground">
                    SQL:{" "}
                    <code>
                      INSERT INTO usuarios (username, senha) VALUES ('usuario', '{result.hash_base64_legado}');
                    </code>
                  </p>
                </div>
              </div>

              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertDescription className="text-sm">
                  <strong>Importante:</strong> Ao inserir usuários no banco de dados, use o hash gerado acima na coluna{" "}
                  <code>senha</code>, não a senha em texto plano.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
