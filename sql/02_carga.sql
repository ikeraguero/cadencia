-- =====================================================================
-- Cadência — Fase 1 · Carga de dados
--
-- Popula o banco com um conjunto coerente: um corredor com dois planos,
-- doze semanas de cronograma, treinos executados com equipamentos, provas
-- disputadas e os recordes correspondentes.
--
-- As datas são relativas a CURRENT_DATE, para que os relatórios por período
-- sempre tenham dados, independentemente de quando a carga for executada.
-- =====================================================================

TRUNCATE treino_equipamento, inscricao, treino, treino_planejado, recorde,
         plano, equipamento, percurso, prova, tipo_treino, treinador, corredor
    RESTART IDENTITY CASCADE;


-- ---------------------------------------------------------------------
-- Catálogo de tipos de treino
-- ---------------------------------------------------------------------
INSERT INTO tipo_treino (nome, descricao, intensidade) VALUES
    ('Regenerativo',   'Rodagem leve para recuperação ativa',            1),
    ('Longo',          'Volume prolongado em intensidade moderada',      3),
    ('Intervalado',    'Tiros com recuperação entre as repetições',      5),
    ('Tempo run',      'Esforço contínuo próximo ao limiar anaeróbio',   4),
    ('Fartlek',        'Variações livres de ritmo ao longo do percurso', 3),
    ('Ritmo de prova', 'Simulação do pace-alvo da prova',                4),
    ('Tiros',          'Repetições curtas em velocidade máxima',         5);


-- ---------------------------------------------------------------------
-- Corredor
-- ---------------------------------------------------------------------
INSERT INTO corredor (nome, email, senha_hash, sexo, data_nascimento,
                      meta_distancia_km, meta_tempo_seg) VALUES
    ('Iker Aguero',   'iker@exemplo.com',
     'scrypt:8d4bf2d7f6c47ed2e443e7f753681923:d7e297cea66729bfd84ad62f0597c735269f993c1ddd4a0f3a72212a550dee45',
     'M', '1998-04-22', 21.0975, 6300),
    ('Marina Fontes', 'marina@exemplo.com',
     'scrypt:91e0f5c21844fd4cb4d4dbe4b4ecb837:935d88582e2696daa400caa8be9d0cc2128b6faa5605eddb2c8ede16edcca7f5',
     'F', '1995-11-08', 10.0000, 2700);

-- Senha de ambos: "cadencia". O hash é scrypt, no formato scrypt:<sal>:<hash>.


-- ---------------------------------------------------------------------
-- Treinadores
-- ---------------------------------------------------------------------
INSERT INTO treinador (nome, cref, email, telefone, assessoria, especialidade, ativo) VALUES
    ('Ana Ribeiro',    '012345-G/SC', 'ana.ribeiro@ritmolivre.com.br', '(48) 99811-4420',
     'Equipe Ritmo Livre',      'Provas de rua de 10 km a maratona', TRUE),
    ('Marcos Dalpiaz', '087654-G/SC', 'marcos@passocerto.com.br',     '(48) 99702-1188',
     'Assessoria Passo Certo',  'Velocidade e provas de pista',      TRUE),
    ('Helena Vasques', '033221-G/PR', 'helena@corridacerta.com.br',   '(41) 99655-3390',
     'Corrida Certa',           'Iniciantes e retomada pós-lesão',   FALSE);


-- ---------------------------------------------------------------------
-- Percursos do corredor 1
-- ---------------------------------------------------------------------
INSERT INTO percurso (id_corredor, nome, distancia_km, terreno,
                      ganho_elevacao_m, cidade, referencia, ativo) VALUES
    (1, 'Volta da Lagoa',             14.00, 'Asfalto', 180, 'Florianópolis', 'Praça da Lagoa da Conceição', TRUE),
    (1, 'Beira-Mar Norte',             6.00, 'Asfalto',  15, 'Florianópolis', 'Ponte Hercílio Luz',          TRUE),
    (1, 'Trilha da Costa da Lagoa',   10.00, 'Trilha',  430, 'Florianópolis', 'Canto dos Araçás',            TRUE),
    (1, 'Pista do CDS/UFSC',           8.00, 'Pista',     0, 'Florianópolis', 'Portaria do CDS',             TRUE),
    (1, 'Esteira — academia',          6.00, 'Esteira',   0, 'Florianópolis', 'Academia do bairro',          FALSE),
    (2, 'Parque de Coqueiros',         5.00, 'Asfalto',  25, 'Florianópolis', 'Entrada principal',           TRUE);


-- ---------------------------------------------------------------------
-- Equipamentos
-- ---------------------------------------------------------------------
INSERT INTO equipamento (id_corredor, marca, modelo, tipo, data_aquisicao,
                         vida_util_km, aposentado, observacao) VALUES
    (1, 'Asics',  'Gel-Nimbus 26',    'Tênis',          CURRENT_DATE - 200,   800.00, FALSE, 'Rodagem e treinos longos'),
    (1, 'Nike',   'Zoom Pegasus 41',  'Tênis',          CURRENT_DATE - 120,   700.00, FALSE, 'Ritmo e intervalados'),
    (1, 'Mizuno', 'Wave Rider 26',    'Tênis',          CURRENT_DATE - 520,   320.00, TRUE,  'Aposentado por desgaste do mediopé'),
    (1, 'Garmin', 'Forerunner 265',   'Relógio',        CURRENT_DATE - 300, 20000.00, FALSE, NULL),
    (1, 'Polar',  'H10',              'Cinta cardíaca', CURRENT_DATE - 300, 20000.00, FALSE, 'Usada nos testes de limiar'),
    (2, 'Adidas', 'Adizero SL',       'Tênis',          CURRENT_DATE - 90,    650.00, FALSE, NULL);


-- ---------------------------------------------------------------------
-- Planos
-- ---------------------------------------------------------------------
INSERT INTO plano (id_corredor, id_treinador, nome, objetivo, data_inicio, data_fim, descricao) VALUES
    (1, 1, 'Base aeróbica 2026',
        'Construir volume antes do ciclo específico',
        CURRENT_DATE - 140, CURRENT_DATE - 85,
        'Oito semanas de rodagem em intensidade baixa, com um longo semanal.'),
    (1, 1, 'Meia de Florianópolis — 12 semanas',
        'Meia maratona abaixo de 1h45',
        CURRENT_DATE - 56, CURRENT_DATE + 28,
        'Ciclo específico com intervalados na pista, ritmo de prova e longos progressivos.'),
    (2, 2, 'Sub-45 nos 10 km',
        'Quebrar 45 minutos nos 10 km',
        CURRENT_DATE - 30, CURRENT_DATE + 60,
        'Ênfase em limiar e tiros curtos.');


-- ---------------------------------------------------------------------
-- Provas
-- ---------------------------------------------------------------------
INSERT INTO prova (nome, data_prova, distancia_km, cidade, uf, organizador) VALUES
    ('Volta à Ilha 5K',                 CURRENT_DATE - 112,   5.0000, 'Florianópolis', 'SC', 'Ilha Running'),
    ('Circuito das Estações 10K',       CURRENT_DATE - 42,   10.0000, 'São José',      'SC', 'Yescom'),
    ('Meia Maratona de Florianópolis',  CURRENT_DATE + 28,   21.0975, 'Florianópolis', 'SC', 'Prefeitura de Florianópolis'),
    ('Maratona de Porto Alegre',        CURRENT_DATE + 120,  42.1950, 'Porto Alegre',  'RS', 'Unimed POA');


-- ---------------------------------------------------------------------
-- Cronograma (treinos planejados) do plano 2 — 12 semanas × 3 treinos por semana
--
-- Gerado por CROSS JOIN entre a série de semanas e a semana-tipo, aplicando
-- 4% de progressão de volume por semana. É o mesmo efeito do processo
-- "montar cronograma" da aplicação.
-- ---------------------------------------------------------------------
INSERT INTO treino_planejado (id_plano, id_percurso, id_tipo_treino, data_planejada,
                    distancia_alvo_km, pace_alvo_seg, status)
SELECT
    2,
    modelo.id_percurso,
    modelo.id_tipo_treino,
    (CURRENT_DATE - 56) + (semana.n * 7) + modelo.dia_offset,
    ROUND((modelo.km * (1 + 0.04 * semana.n))::NUMERIC, 2),
    modelo.pace_alvo,
    'Prescrita'
FROM generate_series(0, 11) AS semana (n)
CROSS JOIN (VALUES
        (2, 2, 1, 6.0,  375),   -- terça  · Beira-Mar Norte  · Regenerativo
        (4, 4, 3, 8.0,  286),   -- quinta · Pista do CDS     · Intervalado
        (6, 1, 2, 14.0, 348)    -- sábado · Volta da Lagoa   · Longo
    ) AS modelo (dia_offset, id_percurso, id_tipo_treino, km, pace_alvo);


-- ---------------------------------------------------------------------
-- Treinos executados
--
-- Cumpre os treinos planejados passadas, deixando uma a cada quatro como "Perdida" —
-- para que o relatório de aderência tenha do que falar.
-- ---------------------------------------------------------------------
INSERT INTO treino (id_corredor, id_plano, id_percurso, id_treino_planejado, id_tipo_treino,
                    data_treino, distancia_km, duracao_seg, percepcao_esforco, observacao)
SELECT
    1,
    s.id_plano,
    s.id_percurso,
    s.id_treino_planejado,
    s.id_tipo_treino,
    s.data_planejada,
    -- Execução varia levemente em torno do alvo prescrito.
    ROUND(s.distancia_alvo_km * (1 + ((s.id_treino_planejado % 5) - 2) * 0.015), 2),
    ROUND(s.distancia_alvo_km * (1 + ((s.id_treino_planejado % 5) - 2) * 0.015)
          * (s.pace_alvo_seg + ((s.id_treino_planejado % 7) - 3) * 4)),
    CASE t.nome WHEN 'Regenerativo' THEN 4 WHEN 'Longo' THEN 7 ELSE 8 END,
    CASE t.nome
        WHEN 'Intervalado' THEN '8 × 800 m com 400 m de trote'
        WHEN 'Longo'       THEN 'Ritmo confortável, últimos 3 km progressivos'
        ELSE NULL
    END
FROM treino_planejado s
JOIN tipo_treino t ON t.id_tipo_treino = s.id_tipo_treino
-- Os últimos 5 dias ficam sem treino de propósito: são os treinos planejados que o
-- corredor ainda não lançou, e é sobre elas que o processo "registrar
-- treino" é demonstrado.
WHERE s.data_planejada < CURRENT_DATE - 5
  AND s.id_treino_planejado % 4 <> 0;

-- Fecha o cronograma: cumpridas as que têm treino, perdidas as demais já vencidas.
UPDATE treino_planejado s
   SET status = 'Cumprida'
 WHERE EXISTS (SELECT 1 FROM treino t WHERE t.id_treino_planejado = s.id_treino_planejado);

UPDATE treino_planejado
   SET status = 'Perdida'
 WHERE data_planejada < CURRENT_DATE - 5
   AND status = 'Prescrita';

-- Histórico do plano 1 ("Base aeróbica 2026"), oito semanas já encerradas.
-- Este ciclo é anterior à adoção do cronograma, por isso os treinos não têm
-- treino planejado prescrita — é o caso de treino ligado a plano, mas sem treino planejado.
INSERT INTO treino (id_corredor, id_plano, id_percurso, id_treino_planejado, id_tipo_treino,
                    data_treino, distancia_km, duracao_seg, percepcao_esforco, observacao)
SELECT
    1,
    1,
    modelo.id_percurso,
    NULL,
    modelo.id_tipo_treino,
    (CURRENT_DATE - 140) + (semana.n * 7) + modelo.dia_offset,
    ROUND((modelo.km * (1 + 0.03 * semana.n))::NUMERIC, 2),
    ROUND(modelo.km * (1 + 0.03 * semana.n) * modelo.pace),
    modelo.esforco,
    NULL
FROM generate_series(0, 7) AS semana (n)
CROSS JOIN (VALUES
        (1, 2, 1,  6.0, 380, 3),   -- segunda · Beira-Mar      · Regenerativo
        (3, 4, 4,  8.0, 300, 7),   -- quarta  · Pista do CDS   · Tempo run
        (5, 2, 1,  6.0, 378, 3),   -- sexta   · Beira-Mar      · Regenerativo
        (0, 1, 2, 12.0, 355, 6)    -- domingo · Volta da Lagoa · Longo
    ) AS modelo (dia_offset, id_percurso, id_tipo_treino, km, pace, esforco);


-- Treinos avulsos, fora de qualquer plano.
INSERT INTO treino (id_corredor, id_plano, id_percurso, id_treino_planejado, id_tipo_treino,
                    data_treino, distancia_km, duracao_seg, percepcao_esforco, observacao) VALUES
    (1, NULL, 3, NULL, 5, CURRENT_DATE -  5, 10.20, 4100, 6, 'Trilha em ritmo livre'),
    (1, NULL, 2, NULL, 1, CURRENT_DATE - 12,  6.00, 2328, 3, NULL),
    (1, NULL, 4, NULL, 7, CURRENT_DATE - 26,  5.00, 1340, 9, '10 × 400 m'),
    (1, NULL, 1, NULL, 2, CURRENT_DATE - 40, 14.10, 4963, 7, NULL),
    (2, 3,    6, NULL, 4, CURRENT_DATE -  3,  8.00, 2520, 8, 'Limiar de 3 × 2 km');


-- ---------------------------------------------------------------------
-- Equipamentos usados em cada treino (associativa)
--
-- O ciclo antigo (plano 1) rodou inteiro no Mizuno, o que explica sua
-- aposentadoria. Os treinos recentes alternam Asics e Nike conforme o tipo.
-- O relógio entra em todos; a cinta, só nos treinos de alta intensidade.
-- ---------------------------------------------------------------------
INSERT INTO treino_equipamento (id_treino, id_equipamento, km_atribuidos)
SELECT t.id_treino, 3, t.distancia_km
  FROM treino t
 WHERE t.id_corredor = 1
   AND t.id_plano = 1;

INSERT INTO treino_equipamento (id_treino, id_equipamento, km_atribuidos)
SELECT t.id_treino,
       CASE WHEN tt.nome IN ('Regenerativo', 'Longo') THEN 1 ELSE 2 END,
       t.distancia_km
  FROM treino t
  JOIN tipo_treino tt ON tt.id_tipo_treino = t.id_tipo_treino
 WHERE t.id_corredor = 1
   AND t.id_plano IS DISTINCT FROM 1;

INSERT INTO treino_equipamento (id_treino, id_equipamento, km_atribuidos)
SELECT t.id_treino, 4, t.distancia_km
  FROM treino t
 WHERE t.id_corredor = 1;

-- A cinta cardíaca só entra nos treinos de alta intensidade.
INSERT INTO treino_equipamento (id_treino, id_equipamento, km_atribuidos)
SELECT t.id_treino, 5, t.distancia_km
  FROM treino t
  JOIN tipo_treino tt ON tt.id_tipo_treino = t.id_tipo_treino
 WHERE t.id_corredor = 1
   AND tt.intensidade = 5;

-- Corredora 2, com o próprio tênis.
INSERT INTO treino_equipamento (id_treino, id_equipamento, km_atribuidos)
SELECT t.id_treino, 6, t.distancia_km
  FROM treino t
 WHERE t.id_corredor = 2;


-- ---------------------------------------------------------------------
-- Inscrições em provas
-- ---------------------------------------------------------------------
INSERT INTO inscricao (id_corredor, id_prova, id_plano, data_inscricao, valor_pago,
                       numero_peito, categoria, status,
                       tempo_liquido_seg, colocacao_geral, colocacao_categoria) VALUES
    (1, 1, 1, CURRENT_DATE - 133,  75.00, '1184', 'Geral',   'Concluído', 1385,  96, 14),
    (1, 2, 2, CURRENT_DATE -  70, 119.90, '2841', 'M 25-29', 'Concluído', 2874, 184, 21),
    (1, 3, 2, CURRENT_DATE -  63, 189.00, NULL,   'M 25-29', 'Confirmado', NULL, NULL, NULL),
    (1, 4, NULL, CURRENT_DATE - 10, 260.00, NULL, 'M 25-29', 'Inscrito',   NULL, NULL, NULL),
    (2, 2, 3, CURRENT_DATE -  70, 119.90, '3092', 'F 30-34', 'Concluído', 3190, 412, 38);


-- ---------------------------------------------------------------------
-- Recordes pessoais
-- ---------------------------------------------------------------------
INSERT INTO recorde (id_corredor, id_prova, distancia_km, melhor_tempo_seg, data_registro) VALUES
    (1, 1,    5.0000, 1385, CURRENT_DATE - 112),
    (1, 2,   10.0000, 2874, CURRENT_DATE -  42),
    (1, NULL, 21.0975, 6712, CURRENT_DATE -  98),
    (2, 2,   10.0000, 3190, CURRENT_DATE -  42);
