-- Dados de exemplo para o sistema

-- Inserir cooperados de exemplo
INSERT INTO cooperados (nome, cpf, placa) VALUES
('João Silva', '123.456.789-01', 'ABC-1234'),
('Maria Santos', '987.654.321-02', 'XYZ-5678'),
('Pedro Oliveira', '456.789.123-03', 'DEF-9012')
ON CONFLICT (cpf) DO NOTHING;

-- Inserir empresas de exemplo
INSERT INTO empresas (nome, cnpj) VALUES
('Transportadora ABC Ltda', '12.345.678/0001-90'),
('Logística XYZ S.A.', '98.765.432/0001-10'),
('Cargas Brasil Ltda', '45.678.912/0001-34')
ON CONFLICT (cnpj) DO NOTHING;

-- Inserir alguns fretes de exemplo
INSERT INTO fretes (cooperado_id, empresa_id, carga, km, valor, chapada, data) VALUES
(1, 1, 'Soja', 500, 2500.00, 300.00, '2024-01-15'),
(2, 2, 'Milho', 300, 1800.00, 200.00, '2024-01-16'),
(1, 3, 'Fertilizante', 400, 2200.00, 250.00, '2024-01-17'),
(3, 1, 'Ração', 600, 3000.00, 400.00, '2024-01-18');

-- Inserir alguns débitos de exemplo
INSERT INTO debitos (cooperado_id, descricao, data, valor) VALUES
(1, 'Combustível', '2024-01-15', 150.00),
(2, 'Manutenção', '2024-01-16', 200.00),
(1, 'Pedágio', '2024-01-17', 80.00);
