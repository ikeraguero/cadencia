import { consultar, consultarUm } from './db.mjs';
import * as ui from './ui.mjs';

/** Volume dos últimos 7 dias, comparado aos 7 anteriores. */
const RESUMO_DA_SEMANA = `
  SELECT COUNT(*) FILTER (WHERE t.data_treino > CURRENT_DATE - 7) AS treinos_semana,
         COALESCE(SUM(t.distancia_km) FILTER (WHERE t.data_treino > CURRENT_DATE - 7), 0) AS km_semana,
         COALESCE(SUM(t.duracao_seg)  FILTER (WHERE t.data_treino > CURRENT_DATE - 7), 0) AS seg_semana,
         COALESCE(SUM(t.distancia_km) FILTER (WHERE t.data_treino > CURRENT_DATE - 14
                                                AND t.data_treino <= CURRENT_DATE - 7), 0) AS km_semana_anterior
    FROM treino t
   WHERE t.id_corredor = $1
     AND t.data_treino > CURRENT_DATE - 14`;

/** O que o cronograma manda fazer a seguir (inclui o que ficou para trás). */
const PROXIMOS_TREINOS = `
  SELECT s.data_planejada, tt.nome AS tipo, s.distancia_alvo_km, s.pace_alvo_seg,
         COALESCE(pc.nome, 'a definir') AS percurso,
         s.data_planejada - CURRENT_DATE   AS em_dias
    FROM treino_planejado s
    JOIN plano       p  ON p.id_plano        = s.id_plano
    JOIN tipo_treino tt ON tt.id_tipo_treino = s.id_tipo_treino
    LEFT JOIN percurso pc ON pc.id_percurso  = s.id_percurso
   WHERE p.id_corredor = $1
     AND s.status = 'Prescrita'
     AND s.data_planejada >= CURRENT_DATE - 7
   ORDER BY s.data_planejada
   LIMIT 4`;

/** Desgaste dos pares em uso, para avisar a hora de trocar. */
const DESGASTE_DOS_TENIS = `
  SELECT vu.equipamento, vu.km_acumulados, vu.vida_util_km,
         vu.desgaste_pct, vu.km_restantes
    FROM vw_equipamento_uso vu
   WHERE vu.id_corredor = $1
     AND NOT vu.aposentado
     AND vu.tipo = 'Tênis'
   ORDER BY vu.desgaste_pct DESC`;

const PROXIMA_PROVA = `
  SELECT pv.nome, pv.data_prova, pv.distancia_km,
         pv.cidade || '/' || pv.uf    AS local,
         pv.data_prova - CURRENT_DATE AS em_dias,
         i.status
    FROM inscricao i
    JOIN prova pv ON pv.id_prova = i.id_prova
   WHERE i.id_corredor = $1
     AND i.status IN ('Inscrito', 'Confirmado')
     AND pv.data_prova >= CURRENT_DATE
   ORDER BY pv.data_prova
   LIMIT 1`;

const MEUS_RECORDES = `
  SELECT distancia_km, melhor_tempo_seg,
         ROUND(melhor_tempo_seg / distancia_km) AS pace_seg
    FROM recorde
   WHERE id_corredor = $1
   ORDER BY distancia_km`;

const DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

/** "hoje", "amanhã", "quinta" ou a data, conforme a proximidade. */
function quando(dataIso, emDias) {
  const d = Number(emDias);
  if (d === 0) return 'hoje';
  if (d === 1) return 'amanhã';
  if (d === -1) return 'ontem';
  if (d > 1 && d < 7) return DIAS[new Date(dataIso + 'T00:00:00').getDay()];
  if (d < 0) return `há ${Math.abs(d)} dias`;
  return ui.dataBr(dataIso);
}

export async function mostrarInicio(ctx) {
  ui.titulo(`Olá, ${ctx.corredorNome.split(' ')[0]}`);
  const [semana, proximos, tenis, prova, recordes] = await Promise.all([
    consultarUm(RESUMO_DA_SEMANA, [ctx.corredorId]),
    consultar(PROXIMOS_TREINOS, [ctx.corredorId]),
    consultar(DESGASTE_DOS_TENIS, [ctx.corredorId]),
    consultarUm(PROXIMA_PROVA, [ctx.corredorId]),
    consultar(MEUS_RECORDES, [ctx.corredorId]),
  ]);

  // ----- Semana -----
  ui.subtitulo('Sua semana');
  const km = Number(semana?.km_semana ?? 0);
  const anterior = Number(semana?.km_semana_anterior ?? 0);
  const treinos = Number(semana?.treinos_semana ?? 0);
  const seg = Number(semana?.seg_semana ?? 0);

  if (treinos === 0) {
    ui.info(ui.cor.fraco('Nenhum treino nos últimos 7 dias. Bora?'));
  } else {
    const pace = km > 0 ? ui.paceParaTexto(seg / km) : '—';
    ui.info(
      `${ui.cor.negrito(treinos + (treinos === 1 ? ' treino' : ' treinos'))}  ·  ` +
        `${ui.cor.negrito(km.toFixed(1).replace('.', ',') + ' km')}  ·  ritmo médio ${ui.cor.negrito(pace + '/km')}`,
    );
    if (anterior > 0) {
      const variacao = Math.round(((km - anterior) / anterior) * 100);
      const seta = variacao > 0 ? '▲' : variacao < 0 ? '▼' : '=';
      const pinta = variacao > 0 ? ui.cor.verde : variacao < 0 ? ui.cor.laranja : ui.cor.fraco;
      ui.info(
        pinta(`${seta} ${variacao > 0 ? '+' : ''}${variacao}%`) +
          ui.cor.fraco(` em relação à semana anterior (${anterior.toFixed(1).replace('.', ',')} km)`),
      );
    }
  }

  // ----- Próximos treinos -----
  ui.subtitulo('Seu cronograma');
  if (proximos.length === 0) {
    ui.info(ui.cor.fraco('Nada prescrito. Monte um cronograma em "Meu cronograma".'));
  } else {
    for (const s of proximos) {
      const atrasado = Number(s.em_dias) < 0;
      const etiqueta = quando(s.data_planejada, s.em_dias).padEnd(10);
      const linha =
        `  ${etiqueta}${String(s.tipo).padEnd(15)}` +
        `${(Number(s.distancia_alvo_km).toFixed(1).replace('.', ',') + ' km').padStart(8)}   ` +
        ui.cor.fraco(s.percurso);
      console.log('  ' + (atrasado ? ui.cor.laranja(linha) : linha));
    }
  }

  // ----- Tênis -----
  if (tenis.length > 0) {
    ui.subtitulo('Seus tênis');
    for (const e of tenis) {
      const pct = Number(e.desgaste_pct);
      const restam = Number(e.km_restantes).toFixed(0);
      const recado =
        pct >= 100
          ? ui.cor.vermelho('hora de trocar')
          : pct >= 80
            ? ui.cor.laranja(`só mais ${restam} km`)
            : ui.cor.fraco(`ainda dá para ${restam} km`);
      console.log(
        `   ${String(e.equipamento).padEnd(24)} ${ui.barra(pct)} ${String(pct.toFixed(0) + '%').padStart(5)}  ${recado}`,
      );
    }
  }

  // ----- Próxima prova -----
  if (prova) {
    ui.subtitulo('Sua próxima prova');
    const faltam = Number(prova.em_dias);
    ui.info(
      `${ui.cor.negrito(prova.nome)}  ·  ${Number(prova.distancia_km).toFixed(1).replace('.', ',')} km  ·  ${prova.local}`,
    );
    ui.info(
      ui.cor.azul(faltam === 0 ? 'É hoje!' : `Faltam ${faltam} dias`) +
        ui.cor.fraco(`  (${ui.dataBr(prova.data_prova)} · inscrição ${prova.status.toLowerCase()})`),
    );
  }

  // ----- Recordes -----
  if (recordes.length > 0) {
    ui.subtitulo('Seus recordes');
    const partes = recordes.map(
      (r) =>
        `${Number(r.distancia_km).toFixed(r.distancia_km % 1 === 0 ? 0 : 1).replace('.', ',')} km ` +
        ui.cor.negrito(ui.segParaRelogio(r.melhor_tempo_seg)),
    );
    ui.info(partes.join(ui.cor.fraco('   ·   ')));
  }

  console.log();
}
