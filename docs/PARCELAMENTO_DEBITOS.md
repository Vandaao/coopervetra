# Débitos com Parcelamento

## Visão Geral

O sistema agora suporta criação de débitos parcelados com rastreamento individual de cada parcela.

## Como Usar

### 1. Ativar Parcelamento

Na página `/debitos`, clique no botão **"Ativar Parcelamento"** para criar a tabela de parcelas no banco de dados.

### 2. Criar Débito Parcelado

1. Clique em "Novo Débito"
2. Preencha os campos obrigatórios (Cooperado, Empresa, Descrição, Data, Valor)
3. Marque a opção **"Criar como débito parcelado"**
4. Informe:
   - **Quantidade de Parcelas**: número de parcelas (mínimo 2)
   - **Vencimento 1ª Parcela**: data de vencimento da primeira parcela
5. O sistema calcula automaticamente:
   - Valor de cada parcela (valor total ÷ quantidade)
   - Datas das próximas parcelas (incremento mensal automático)
6. Clique em "Cadastrar"

### 3. Visualizar e Pagar Parcelas

1. Na tabela de débitos, procure pela coluna "Parcelas"
2. Débitos parcelados mostram o status: **"X/Y"** (parcelas pagas / total de parcelas)
3. Clique no número para abrir um dialog com todas as parcelas
4. Cada parcela mostra:
   - Número da parcela
   - Data de vencimento
   - Valor
   - Status (Pendente, Pago, Vencida)
5. Clique em "Pagar" para marcar uma parcela como paga
6. Quando TODAS as parcelas forem pagas, o débito é automaticamente marcado como pago

## Estrutura de Dados

### Tabela `debitos_parcelamento`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | INTEGER PK | Identificador único |
| `debito_id` | INTEGER FK | Referência ao débito original |
| `numero_parcela` | INTEGER | Número da parcela (1, 2, 3...) |
| `total_parcelas` | INTEGER | Total de parcelas do débito |
| `data_vencimento` | DATE | Data de vencimento |
| `valor_parcela` | DECIMAL | Valor da parcela |
| `status` | VARCHAR | pendente \| pago \| vencida |
| `data_pagamento` | DATE | Data do pagamento (NULL se não pago) |

### Campos Adicionados em `debitos`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `eh_parcelado` | BOOLEAN | Indica se é parcelado |
| `quantidade_parcelas` | INTEGER | Total de parcelas |

## APIs

### POST `/api/debitos/parcelamento`

Criar um novo débito parcelado.

**Request:**
```json
{
  "cooperado_id": 1,
  "empresa_id": 2,
  "descricao": "Aluguel de caminhão",
  "data": "2024-07-22",
  "valor_total": 1200.00,
  "quantidade_parcelas": 3,
  "data_vencimento_primeira": "2024-08-22",
  "observacao": "Débito referente a..."
}
```

**Response:**
```json
{
  "success": true,
  "debito_id": 123,
  "valor_total": 1200.00,
  "quantidade_parcelas": 3,
  "valor_parcela": 400.00,
  "parcelas": [
    {
      "id": 1,
      "numero_parcela": 1,
      "total_parcelas": 3,
      "data_vencimento": "2024-08-22",
      "valor_parcela": 400.00,
      "status": "pendente"
    }
    // ...
  ]
}
```

### GET `/api/debitos/parcelamento?debito_id=123`

Listar parcelas de um débito.

### PUT `/api/debitos/parcelas/[parcelaId]/pagar`

Marcar uma parcela como paga.

**Request:**
```json
{
  "data_pagamento": "2024-08-22"
}
```

**Response:**
```json
{
  "success": true,
  "parcela_id": 1,
  "status": "pago",
  "data_pagamento": "2024-08-22",
  "todas_pagas": false,
  "message": "Parcela paga! 1/3 parcelas pagas."
}
```

## Integração com Relatórios

Os relatórios de débitos pendentes consideram apenas parcelas não pagas:

- **Débitos Simples**: aparecem como pendentes até serem marcados como pago
- **Débitos Parcelados**: aparecem com status de parcelamento (ex: "2/5 pago")
- **Cálculo de Total Pendente**: soma apenas parcelas com status "pendente" ou "vencida"

## Notas Importantes

- Débitos parcelados **não podem ser editados** (crie um novo se necessário)
- Ao excluir um débito parcelado, **todas as parcelas são deletadas** (cascata ON DELETE)
- Parcelas vencidas aparecem com ícone de alerta ⚠️
- Cálculo automático de datas assume **intervalo mensal** entre parcelas
- Cada parcela tem o mesmo valor (divisão igual do valor total)
