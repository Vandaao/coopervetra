export interface CooperadoParaComparacao {
  id: number
  nome: string
}

export interface CandidatoCooperado {
  cooperado: CooperadoParaComparacao
  score: number
}

export type ResultadoComparacaoCooperado =
  | {
      status: "matched"
      cooperado: CooperadoParaComparacao
      score: number
      aproximado: boolean
    }
  | {
      status: "ambiguous"
      candidatos: CandidatoCooperado[]
    }
  | {
      status: "not_found"
      candidatos: CandidatoCooperado[]
    }

const CONECTIVOS_NOME = new Set(["da", "das", "de", "do", "dos", "e"])

export function normalizarNome(nome: string): string {
  return String(nome || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function tokensPrincipais(nome: string): string[] {
  const tokens = normalizarNome(nome).split(" ").filter(Boolean)
  const semConectivos = tokens.filter((token) => !CONECTIVOS_NOME.has(token))
  return semConectivos.length > 0 ? semConectivos : tokens
}

function distanciaLevenshtein(a: string, b: string): number {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length

  const anterior = Array.from({ length: b.length + 1 }, (_, index) => index)
  const atual = new Array<number>(b.length + 1)

  for (let i = 1; i <= a.length; i++) {
    atual[0] = i

    for (let j = 1; j <= b.length; j++) {
      const custo = a[i - 1] === b[j - 1] ? 0 : 1
      atual[j] = Math.min(atual[j - 1] + 1, anterior[j] + 1, anterior[j - 1] + custo)
    }

    for (let j = 0; j <= b.length; j++) anterior[j] = atual[j]
  }

  return anterior[b.length]
}

function similaridadeTexto(a: string, b: string): number {
  if (a === b) return 1
  const maiorTamanho = Math.max(a.length, b.length)
  if (maiorTamanho === 0) return 1
  return 1 - distanciaLevenshtein(a, b) / maiorTamanho
}

function similaridadeToken(a: string, b: string): number {
  if (a === b) return 1

  // Permite abreviações como "J" para "José" ou "B" para "Batista".
  if ((a.length === 1 || b.length === 1) && a[0] === b[0]) return 0.9

  return similaridadeTexto(a, b)
}

function similaridadeTokens(tokensA: string[], tokensB: string[]): number {
  if (tokensA.length === 0 || tokensB.length === 0) return 0

  const pares: Array<{ indiceA: number; indiceB: number; score: number }> = []

  for (let indiceA = 0; indiceA < tokensA.length; indiceA++) {
    for (let indiceB = 0; indiceB < tokensB.length; indiceB++) {
      pares.push({
        indiceA,
        indiceB,
        score: similaridadeToken(tokensA[indiceA], tokensB[indiceB]),
      })
    }
  }

  pares.sort((a, b) => b.score - a.score)

  const usadosA = new Set<number>()
  const usadosB = new Set<number>()
  let total = 0

  for (const par of pares) {
    if (usadosA.has(par.indiceA) || usadosB.has(par.indiceB)) continue
    usadosA.add(par.indiceA)
    usadosB.add(par.indiceB)
    total += par.score
  }

  return total / Math.max(tokensA.length, tokensB.length)
}

function proporcaoTokensExatos(tokensA: string[], tokensB: string[]): number {
  if (tokensA.length === 0 || tokensB.length === 0) return 0

  const contagemB = new Map<string, number>()
  for (const token of tokensB) contagemB.set(token, (contagemB.get(token) || 0) + 1)

  let comuns = 0
  for (const token of tokensA) {
    const quantidade = contagemB.get(token) || 0
    if (quantidade > 0) {
      comuns++
      contagemB.set(token, quantidade - 1)
    }
  }

  return comuns / Math.max(tokensA.length, tokensB.length)
}

function calcularSimilaridadeNome(nomeInformado: string, nomeCadastrado: string): number {
  const normalizadoInformado = normalizarNome(nomeInformado)
  const normalizadoCadastrado = normalizarNome(nomeCadastrado)

  if (!normalizadoInformado || !normalizadoCadastrado) return 0
  if (normalizadoInformado === normalizadoCadastrado) return 1

  const tokensInformado = tokensPrincipais(nomeInformado)
  const tokensCadastrado = tokensPrincipais(nomeCadastrado)
  const canonicoInformado = tokensInformado.join(" ")
  const canonicoCadastrado = tokensCadastrado.join(" ")

  // Ignora conectivos: "José da Silva" é equivalente a "José Silva".
  if (canonicoInformado === canonicoCadastrado) return 0.995

  // Aceita a mesma composição de nome em ordem diferente.
  if ([...tokensInformado].sort().join(" ") === [...tokensCadastrado].sort().join(" ")) return 0.985

  const scoreTokens = similaridadeTokens(tokensInformado, tokensCadastrado)
  const scoreTexto = similaridadeTexto(canonicoInformado, canonicoCadastrado)
  const scoreExatos = proporcaoTokensExatos(tokensInformado, tokensCadastrado)

  let score = scoreTokens * 0.65 + scoreTexto * 0.25 + scoreExatos * 0.1

  const primeiroIgual = tokensInformado[0] === tokensCadastrado[0]
  const ultimoIgual = tokensInformado.at(-1) === tokensCadastrado.at(-1)
  if (primeiroIgual && ultimoIgual && tokensInformado.length > 1 && tokensCadastrado.length > 1) {
    score += 0.03
  }

  return Math.min(score, 0.975)
}

function limiteMinimo(nomeInformado: string): number {
  const quantidadeTokens = tokensPrincipais(nomeInformado).length
  if (quantidadeTokens <= 1) return 0.92
  if (quantidadeTokens === 2) return 0.84
  return 0.78
}

export function encontrarCooperadoMaisProximo(
  nomeInformado: string,
  cooperados: CooperadoParaComparacao[],
): ResultadoComparacaoCooperado {
  const candidatos = cooperados
    .map((cooperado) => ({
      cooperado,
      score: calcularSimilaridadeNome(nomeInformado, cooperado.nome),
    }))
    .sort((a, b) => b.score - a.score)

  const melhores = candidatos.slice(0, 3)
  const melhor = candidatos[0]
  const segundo = candidatos[1]

  if (!melhor || melhor.score < limiteMinimo(nomeInformado)) {
    return { status: "not_found", candidatos: melhores }
  }

  // Nomes próximos demais entre si exigem correção manual para evitar associação errada.
  if (melhor.score < 0.985 && segundo && melhor.score - segundo.score < 0.06) {
    return { status: "ambiguous", candidatos: melhores }
  }

  return {
    status: "matched",
    cooperado: melhor.cooperado,
    score: melhor.score,
    aproximado: melhor.score < 0.999,
  }
}
