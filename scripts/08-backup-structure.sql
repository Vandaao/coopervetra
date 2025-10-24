-- Documentação da estrutura do backup
-- Este arquivo documenta como é estruturado o backup do sistema

/*
ESTRUTURA DO BACKUP JSON:

{
  "metadata": {
    "backup_date": "2024-01-15T10:30:00.000Z",
    "version": "1.0",
    "system": "Coopervetra - Sistema de Fretes"
  },
  
  "statistics": {
    "total_cooperados": 10,
    "total_empresas": 5,
    "total_fretes": 150,
    "total_debitos": 45,
    "total_usuarios": 3
  },
  
  "data": {
    "cooperados": [
      {
        "id": 1,
        "nome": "Nome do Cooperado",
        "cpf": "000.000.000-00",
        "placa": "ABC-1234",
        "conta_bancaria": "Dados bancários",
        "created_at": "2024-01-01T00:00:00.000Z"
      }
    ],
    
    "empresas": [
      {
        "id": 1,
        "nome": "Nome da Empresa",
        "cnpj": "00.000.000/0000-00",
        "created_at": "2024-01-01T00:00:00.000Z"
      }
    ],
    
    "fretes": [
      {
        "id": 1,
        "cooperado_id": 1,
        "empresa_id": 1,
        "carga": "Tipo de Carga",
        "km": 500,
        "valor": 2500.00,
        "chapada": 300.00,
        "data": "2024-01-15",
        "created_at": "2024-01-15T00:00:00.000Z"
      }
    ],
    
    "debitos": [
      {
        "id": 1,
        "cooperado_id": 1,
        "empresa_id": 1,
        "descricao": "Descrição do débito",
        "data": "2024-01-15",
        "valor": 100.00,
        "created_at": "2024-01-15T00:00:00.000Z"
      }
    ],
    
    "usuarios": [
      {
        "id": 1,
        "username": "usuario",
        "nome": "Nome do Usuário",
        "tipo": "admin",
        "ativo": true,
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}

OBSERVAÇÕES:
- Senhas de usuários NÃO são incluídas no backup por segurança
- Todas as datas são convertidas para formato ISO 8601
- Valores numéricos são convertidos para números (não strings)
- O arquivo é gerado em formato JSON legível (indentado)
- Nome do arquivo: backup-coopervetra-YYYY-MM-DD-HH-MM-SS.json
*/
