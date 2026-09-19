/**
 * Relatórios do sistema.
 *
 * Cada relatório é UMA consulta, escrita aqui por extenso: nenhuma agregação
 * acontece em JavaScript. Os três parâmetros são sempre os mesmos —
 * $1 corredor, $2 data inicial, $3 data final.
 */
import { consultar } from './db.mjs';
import { normalizarData, traduzirErro } from './crud.mjs';
import * as ui from './ui.mjs';

// =====================================================================
// R1 — Estou seguindo meu plano?
// Compara o prescrito (treino_planejado) com o realizado (treino), por plano.
// Tabelas: plano × treinador × treino_planejado × treino × corredor
// =====================================================================
const R1_ADERENCIA = `
  WITH prescrito AS (
      SELECT
          s.id_plano,
          COUNT(*)                                                  AS treinos_planejados_prescritas,
          COUNT(*) FILTER (WHERE s.status = 'Cumprida')             AS treinos_planejados_cumpridas,
          COUNT(*) FILTER (WHERE s.status = 'Perdida')              AS treinos_planejados_perdidas,
          SUM(s.distancia_alvo_km)                                  AS km_previsto
      FROM treino_planejado s
      WHERE s.data_planejada BETWEEN $2 AND $3
      GROUP BY s.id_plano
  ),
  realizado AS (
      SELECT
          t.id_plano,
          COUNT(*)                                                  AS treinos_realizados,
          SUM(t.distancia_km)                                       AS km_realizado,
          SUM(t.duracao_seg)                                        AS duracao_total_seg
      FROM treino t
      WHERE t.id_corredor = $1
        AND t.data_treino BETWEEN $2 AND $3
        AND t.id_plano IS NOT NULL
      GROUP BY t.id_plano
  )
  SELECT
      p.nome                                                        AS plano,
      COALESCE(tr.nome, '—')                                        AS treinador,
      COALESCE(pr.treinos_planejados_prescritas, 0)                            AS prescritas,
      COALESCE(pr.treinos_planejados_cumpridas, 0)                             AS cumpridas,
      COALESCE(pr.treinos_planejados_perdidas, 0)                              AS perdidas,
      -- Plano sem cronograma (caso do ciclo antigo) não tem aderência a apurar.
      CASE
          WHEN COALESCE(pr.treinos_planejados_prescritas, 0) = 0 THEN NULL
          ELSE ROUND(pr.treinos_planejados_cumpridas * 100.0 / pr.treinos_planejados_prescritas)
      END                                                           AS aderencia_pct,
      COALESCE(pr.km_previsto, 0)                                   AS km_previsto,
      COALESCE(re.km_realizado, 0)                                  AS km_realizado,
      CASE
          WHEN COALESCE(pr.km_previsto, 0) = 0 THEN NULL
          ELSE ROUND(COALESCE(re.km_realizado, 0) * 100.0 / pr.km_previsto)
      END                                                           AS volume_pct,
      CASE
          WHEN COALESCE(re.km_realizado, 0) = 0 THEN NULL
          ELSE ROUND(re.duracao_total_seg / re.km_realizado)
      END                                                           AS pace_medio_seg
  FROM plano p
  JOIN corredor c        ON c.id_corredor  = p.id_corredor
  LEFT JOIN treinador tr ON tr.id_treinador = p.id_treinador
  LEFT JOIN prescrito pr ON pr.id_plano    = p.id_plano
  LEFT JOIN realizado re ON re.id_plano    = p.id_plano
  WHERE p.id_corredor = $1
    AND (pr.treinos_planejados_prescritas > 0 OR re.km_realizado > 0)
  ORDER BY aderencia_pct DESC NULLS LAST, p.nome`;

// =====================================================================
// R2 — Quando trocar meu tênis?
// Quilometragem lançada em cada item e consumo da vida útil.
// Tabelas: equipamento × treino_equipamento × treino
// =====================================================================
const R2_DESGASTE = `
  WITH uso_periodo AS (
      SELECT
          te.id_equipamento,
          SUM(te.km_atribuidos)                     AS km_periodo,
          COUNT(DISTINCT te.id_treino)              AS treinos_periodo,
          MAX(t.data_treino)                        AS ultimo_uso
      FROM treino_equipamento te
      JOIN treino t ON t.id_treino = te.id_treino
      WHERE t.id_corredor = $1
        AND t.data_treino BETWEEN $2 AND $3
      GROUP BY te.id_equipamento
  ),
  uso_total AS (
      SELECT
          te.id_equipamento,
          SUM(te.km_atribuidos)                     AS km_acumulados
      FROM treino_equipamento te
      JOIN treino t ON t.id_treino = te.id_treino
      WHERE t.id_corredor = $1
      GROUP BY te.id_equipamento
  )
  SELECT
      e.marca || ' ' || e.modelo                    AS equipamento,
      e.tipo,
      COALESCE(up.km_periodo, 0)                    AS km_periodo,
      COALESCE(up.treinos_periodo, 0)               AS treinos_periodo,
      COALESCE(ut.km_acumulados, 0)                 AS km_acumulados,
      e.vida_util_km,
      ROUND(COALESCE(ut.km_acumulados, 0) * 100.0 / e.vida_util_km, 1) AS desgaste_pct,
      GREATEST(e.vida_util_km - COALESCE(ut.km_acumulados, 0), 0)      AS km_restantes,
      up.ultimo_uso,
      CASE
          WHEN e.aposentado                                                  THEN 'Aposentado'
          WHEN COALESCE(ut.km_acumulados, 0) >= e.vida_util_km               THEN 'Trocar'
          WHEN COALESCE(ut.km_acumulados, 0) >= e.vida_util_km * 0.8         THEN 'Atenção'
          ELSE 'OK'
      END                                           AS alerta
  FROM equipamento e
  LEFT JOIN uso_periodo up ON up.id_equipamento = e.id_equipamento
  LEFT JOIN uso_total   ut ON ut.id_equipamento = e.id_equipamento
  WHERE e.id_corredor = $1
  ORDER BY desgaste_pct DESC, equipamento`;

// =====================================================================
// R3 — Como fui nas minhas provas?
// Resultados, plano de preparação e diferença para o recorde pessoal.
// Tabelas: inscricao × prova × plano × recorde × treino
// =====================================================================
const R3_PROVAS = `
  SELECT
      pv.nome                                       AS prova,
      pv.data_prova,
      pv.cidade || '/' || pv.uf                     AS local,
      pv.distancia_km,
      COALESCE(pl.nome, '—')                        AS plano_preparacao,
      -- Volume treinado dentro do plano até o dia da prova.
      (SELECT COALESCE(SUM(t.distancia_km), 0)
         FROM treino t
        WHERE t.id_plano = i.id_plano
          AND t.data_treino <= pv.data_prova)       AS km_preparacao,
      i.numero_peito,
      i.categoria,
      i.status,
      i.tempo_liquido_seg,
      CASE
          WHEN i.tempo_liquido_seg IS NULL THEN NULL
          ELSE ROUND(i.tempo_liquido_seg / pv.distancia_km)
      END                                           AS pace_seg,
      i.colocacao_geral,
      i.colocacao_categoria,
      r.melhor_tempo_seg                            AS recorde_distancia_seg,
      CASE
          WHEN i.tempo_liquido_seg IS NULL OR r.melhor_tempo_seg IS NULL THEN NULL
          ELSE i.tempo_liquido_seg - r.melhor_tempo_seg
      END                                           AS diferenca_recorde_seg,
      -- Marca o resultado que é o próprio recorde vigente da distância.
      (i.tempo_liquido_seg IS NOT NULL
       AND i.tempo_liquido_seg = r.melhor_tempo_seg) AS e_recorde,
      i.valor_pago
  FROM inscricao i
  JOIN prova pv      ON pv.id_prova    = i.id_prova
  LEFT JOIN plano pl ON pl.id_plano    = i.id_plano
  LEFT JOIN recorde r ON r.id_corredor = i.id_corredor
                     AND r.distancia_km = pv.distancia_km
  WHERE i.id_corredor = $1
    AND i.status <> 'Cancelado'
    AND pv.data_prova BETWEEN $2 AND $3
  ORDER BY pv.data_prova DESC`;

// =====================================================================
// R4 — Onde eu corro melhor?
// Frequência, volume, ritmo médio e melhor ritmo de cada rota.
// Tabelas: percurso × treino × tipo_treino
// =====================================================================
const R4_PERCURSOS = `
  SELECT
      pc.nome                                        AS percurso,
      pc.terreno,
      pc.ganho_elevacao_m,
      COUNT(t.id_treino)                             AS vezes_utilizado,
      SUM(t.distancia_km)                            AS km_total,
      ROUND(SUM(t.duracao_seg) / SUM(t.distancia_km)) AS pace_medio_seg,
      MIN(ROUND(t.duracao_seg / t.distancia_km))     AS melhor_pace_seg,
      ROUND(AVG(t.percepcao_esforco), 1)             AS esforco_medio,
      MAX(t.data_treino)                             AS ultimo_uso,
      -- Tipos de treino praticados na rota, em uma coluna só.
      STRING_AGG(DISTINCT tt.nome, ', ' ORDER BY tt.nome) AS tipos_praticados
  FROM percurso pc
  JOIN treino t       ON t.id_percurso    = pc.id_percurso
                     AND t.id_corredor    = $1
                     AND t.data_treino BETWEEN $2 AND $3
  JOIN tipo_treino tt ON tt.id_tipo_treino = t.id_tipo_treino
  WHERE pc.id_corredor = $1
  GROUP BY pc.id_percurso, pc.nome, pc.terreno, pc.ganho_elevacao_m
  ORDER BY km_total DESC`;

const RELATORIOS = [
  { chave: 'r1', titulo: 'Estou seguindo meu plano?', sql: R1_ADERENCIA,
    descricao: 'O que o plano pedia, e o que você de fato fez.' },
  { chave: 'r2', titulo: 'Quando trocar meu tênis?', sql: R2_DESGASTE,
    descricao: 'Quanto cada equipamento já rodou e quanto ainda dá para usar.' },
  { chave: 'r3', titulo: 'Como fui nas minhas provas?', sql: R3_PROVAS,
    descricao: 'Seus resultados, com a preparação e a distância para o seu recorde.' },
  { chave: 'r4', titulo: 'Onde eu corro melhor?', sql: R4_PERCURSOS,
    descricao: 'Quais rotas você mais usa e em qual o seu ritmo é melhor.' },
];

const hoje = () => new Date().toISOString().slice(0, 10);
const mesesAtras = (n) => {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d.toISOString().slice(0, 10);
};

export async function menuRelatorios(ctx) {
  for (;;) {
    ui.titulo('Meu desempenho');
    const escolha = await ui.menu(
      'O que você quer saber?',
      RELATORIOS.map((r) => ({ valor: r.chave, rotulo: r.titulo })),
    );
    if (escolha === null) {
      return;
    }

    ui.info('Escolha o período (Enter aceita o sugerido).');
    const de = normalizarData(await ui.perguntar('De', mesesAtras(12))) ?? mesesAtras(12);
    const ate = normalizarData(await ui.perguntar('Até', hoje())) ?? hoje();

    try {
      const relatorio = RELATORIOS.find((r) => r.chave === escolha);
      ui.titulo(relatorio.titulo);
      ui.info(relatorio.descricao);
      ui.info(ui.cor.fraco(`${ctx.corredorNome} · de ${ui.dataBr(de)} a ${ui.dataBr(ate)}`));
      ui.tabela(await consultar(relatorio.sql, [ctx.corredorId, de, ate]), {
        vazio: 'Sem dados nesse período.',
      });
    } catch (e) {
      ui.erro(traduzirErro(e));
    }
    await ui.pausar();
  }
}
