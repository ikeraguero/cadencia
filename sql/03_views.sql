-- =====================================================================
-- Cadência — Fase 1 · Views de apoio
--
-- Concentram os cálculos derivados que, por estarem em 3FN, NÃO são
-- colunas das tabelas: o pace médio e a quilometragem acumulada de cada
-- equipamento. Assim a regra fica escrita em um lugar só.
-- =====================================================================

DROP VIEW IF EXISTS vw_equipamento_uso CASCADE;
DROP VIEW IF EXISTS vw_treino_completo CASCADE;


-- Treino com tudo que ele relaciona já resolvido, e o pace calculado.
CREATE VIEW vw_treino_completo AS
SELECT
    t.id_treino,
    t.id_corredor,
    c.nome                                   AS corredor,
    t.data_treino,
    tt.nome                                  AS tipo_treino,
    tt.intensidade,
    t.distancia_km,
    t.duracao_seg,
    -- Atributo derivado (RN-01): pace médio em segundos por quilômetro.
    ROUND(t.duracao_seg / t.distancia_km)    AS pace_medio_seg,
    t.percepcao_esforco,
    p.id_plano,
    p.nome                                   AS plano,
    tr.nome                                  AS treinador,
    pc.id_percurso,
    pc.nome                                  AS percurso,
    pc.terreno,
    pc.ganho_elevacao_m,
    s.id_treino_planejado,
    s.distancia_alvo_km,
    s.pace_alvo_seg,
    t.observacao
FROM treino t
JOIN corredor    c  ON c.id_corredor      = t.id_corredor
JOIN tipo_treino tt ON tt.id_tipo_treino  = t.id_tipo_treino
LEFT JOIN plano     p  ON p.id_plano      = t.id_plano
LEFT JOIN treinador tr ON tr.id_treinador = p.id_treinador
LEFT JOIN percurso  pc ON pc.id_percurso  = t.id_percurso
LEFT JOIN treino_planejado    s  ON s.id_treino_planejado     = t.id_treino_planejado;

COMMENT ON VIEW vw_treino_completo IS
    'Treino com plano, treinador, percurso e planejamento resolvidos, e o pace derivado.';


-- Quilometragem acumulada e desgaste de cada equipamento.
-- O acumulado é SEMPRE derivado da associativa — nunca uma coluna gravada.
CREATE VIEW vw_equipamento_uso AS
SELECT
    e.id_equipamento,
    e.id_corredor,
    e.marca || ' ' || e.modelo                          AS equipamento,
    e.tipo,
    e.vida_util_km,
    e.aposentado,
    COALESCE(SUM(te.km_atribuidos), 0)                  AS km_acumulados,
    COUNT(te.id_treino)                                 AS treinos_realizados,
    ROUND(COALESCE(SUM(te.km_atribuidos), 0) / e.vida_util_km * 100, 1) AS desgaste_pct,
    GREATEST(e.vida_util_km - COALESCE(SUM(te.km_atribuidos), 0), 0)    AS km_restantes,
    MAX(t.data_treino)                                  AS ultimo_uso
FROM equipamento e
LEFT JOIN treino_equipamento te ON te.id_equipamento = e.id_equipamento
LEFT JOIN treino            t  ON t.id_treino        = te.id_treino
GROUP BY e.id_equipamento, e.id_corredor, e.marca, e.modelo,
         e.tipo, e.vida_util_km, e.aposentado;

COMMENT ON VIEW vw_equipamento_uso IS
    'Quilometragem e desgaste por equipamento, derivados de treino_equipamento.';
