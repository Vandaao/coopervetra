# Importação de Fretes

## Visão Geral

O módulo de importação de fretes permite que você carregue múltiplos fretes em uma única planilha, economizando tempo em relação à entrada manual individual.

## Como Usar

### 1. Preparar a Planilha

Crie uma planilha (CSV ou Excel) com as seguintes colunas:

| Coluna | Tipo | Descrição | Exemplo |
|--------|------|-----------|---------|
| **Cooperado** | Texto | Nome do cooperado (deve existir no sistema) | João Silva |
| **Carga** | Texto | Descrição da carga | Soja, Milho, Feijão |
| **KM** | Número | Quilometragem percorrida | 150 |
| **Data** | Data | Data do frete (DD/MM/YYYY ou YYYY-MM-DD) | 15/07/2024 |
| **Valor** | Número | Valor do frete em reais | 1500.50 |

### 2. Exemplo de Planilha

**CSV:**
```
Cooperado,Carga,KM,Data,Valor
João Silva,Soja,150,15/07/2024,1500.50
Maria Santos,Milho,200,15/07/2024,2000.00
Pedro Costa,Feijão,100,15/07/2024,1200.00
```

**Excel/XLSX:**
| Cooperado | Carga | KM | Data | Valor |
|-----------|-------|----|----|-------|
| João Silva | Soja | 150 | 15/07/2024 | 1500.50 |
| Maria Santos | Milho | 200 | 15/07/2024 | 2000.00 |
| Pedro Costa | Feijão | 100 | 15/07/2024 | 1200.00 |

### 3. Importar no Sistema

1. Clique no botão **"Importar Fretes"** na página de fretes
2. Selecione a **empresa** para a qual os fretes serão lançados
3. Clique no campo de upload e selecione seu arquivo (CSV ou Excel)
4. Clique em **"Importar"**
5. Aguarde o processamento

### 4. Validações Automáticas

O sistema verifica:
- ✅ Se o cooperado existe no sistema
- ✅ Se o KM é um número válido
- ✅ Se o valor é um número válido
- ✅ Se a data está em formato correto
- ✅ Se todos os campos obrigatórios estão preenchidos

## Possíveis Erros e Soluções

| Erro | Causa | Solução |
|------|-------|---------|
| "Cooperado não encontrado" | Nome do cooperado não existe | Verifique o nome exato do cooperado no sistema |
| "KM inválido" | Campo não é número | Remova letras, use apenas números |
| "Valor inválido" | Campo não é número | Use ponto (.) como separador decimal |
| "Data em formato inválido" | Formato incorreto | Use DD/MM/YYYY ou YYYY-MM-DD |
| "Nenhum frete importado" | Todas as linhas tiveram erro | Corrija todos os erros e tente novamente |

## Limitações

- Máximo de 10.000 linhas por importação
- A empresa é aplicada a todos os fretes da planilha
- Não é possível atualizar fretes existentes (apenas criar novos)
- Nomes de cooperados devem corresponder exatamente

## Dicas Importantes

1. **Nomes de Cooperados**: Os nomes devem ser exatos. Se no sistema está "João Pedro Silva", não use apenas "João Silva"
2. **Datas**: Use consistentemente o mesmo formato em toda a planilha
3. **Valores Decimais**: Use ponto (.) como separador, não vírgula
4. **Valores Zerados**: Se um valor for 0, deixe em branco ou use 0
5. **Backup**: Mantenha uma cópia da planilha antes de importar

## Exemplo de Uso Completo

### Cenário
Você tem 50 fretes da empresa "Transportes ABC" para lançar.

### Passo a Passo
1. Receba a planilha de um supervisor com os dados dos fretes
2. Abra a página de Fretes
3. Clique em "Importar Fretes"
4. Selecione "Transportes ABC" como empresa
5. Selecione o arquivo com os 50 fretes
6. Clique em "Importar"
7. Após alguns segundos, verá a mensagem de sucesso
8. Os 50 fretes aparecem na tabela

### Tempo Economizado
- Manual: ~50 cliques + preenchimento = ~15-20 minutos
- Importação: 3 cliques = ~10 segundos
- **Economia: ~99.9% do tempo!**
