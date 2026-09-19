import { consultar, consultarUm, emTransacao, executar } from './db.mjs';
import { normalizarData, traduzirErro, OPCOES } from './crud.mjs';
import * as ui from './ui.mjs';

const DIAS_SEMANA = [
  { valor: 1, nome: 'Segunda' },
  { valor: 2, nome: 'Terça' },
  { valor: 3, nome: 'Quarta' },
  { valor: 4, nome: 'Quinta' },
  { valor: 5, nome: 'Sexta' },
  { valor: 6, nome: 'Sábado' },
  { valor: 0, nome: 'Domingo' },
];

const hoje = () => new Date().toISOString().slice(0, 10);
const mesesAtras = (n) => {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d.toISOString().slice(0, 10);
};

/** Pede um período ao usuário, com padrão de 12 meses. */
async function lerPeriodo() {
  const de = normalizarData(await ui.perguntar('De', mesesAtras(12))) ?? mesesAtras(12);
  const ate = normalizarData(await ui.perguntar('Até', hoje())) ?? hoje();
  return [de, ate];
}

// =====================================================================
// PROCESSO 1 — Registrar treino
//
// Escreve em quatro tabelas na mesma transação:
//   treino  ·  treino_equipamento  ·  treino_planejado  ·  recorde
// =====================================================================

const PLANEJADOS_EM_ABERTO = `
  SELECT s.id_treino_planejado AS id,
         TO_CHAR(s.data_planejada, 'DD/MM') || ' · ' || tt.nome || ' · '
           || REPLACE(ROUND(s.distancia_alvo_km, 1)::TEXT, '.', ',') || ' km'
           || ' — ' || p.nome AS rotulo
    FROM treino_planejado s
    JOIN plano       p  ON p.id_plano        = s.id_plano
    JOIN tipo_treino tt ON tt.id_tipo_treino = s.id_tipo_treino
   WHERE p.id_corredor = $1
     AND s.status = 'Prescrita'
     AND s.data_planejada <= CURRENT_DATE
   ORDER BY s.data_planejada`;

const BUSCAR_PLANEJADO = `
  SELECT s.id_treino_planejado, s.id_plano, s.id_percurso, s.id_tipo_treino,
         s.data_planejada, s.distancia_alvo_km, s.pace_alvo_seg, s.status
    FROM treino_planejado s
    JOIN plano p ON p.id_plano = s.id_plano
   WHERE s.id_treino_planejado = $1
     AND p.id_corredor = $2`;

const INSERIR_TREINO = `
  INSERT INTO treino (id_corredor, id_plano, id_percurso, id_treino_planejado, id_tipo_treino,
                      data_treino, distancia_km, duracao_seg, percepcao_esforco, observacao)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
  RETURNING id_treino,
            ROUND(duracao_seg / distancia_km) AS pace_medio_seg`;

const VINCULAR_EQUIPAMENTO = `
  INSERT INTO treino_equipamento (id_treino, id_equipamento, km_atribuidos)
  VALUES ($1, $2, $3)`;

const CUMPRIR_PLANEJADO = `
  UPDATE treino_planejado
     SET status = 'Cumprida'
   WHERE id_treino_planejado = $1`;

const DISTANCIA_OFICIAL = `
  SELECT d.distancia_km
    FROM (VALUES (5.0000), (10.0000), (21.0975), (42.1950)) AS d (distancia_km)
   WHERE ABS(d.distancia_km - $1) / d.distancia_km <= 0.02
   ORDER BY ABS(d.distancia_km - $1)
   LIMIT 1`;

const RECORDE_DA_DISTANCIA = `
  SELECT id_recorde, distancia_km, melhor_tempo_seg
    FROM recorde
   WHERE id_corredor = $1
     AND distancia_km = $2`;

/** Só sobrescreve o recorde se a marca nova for melhor que a vigente. */
const PROMOVER_RECORDE_DE_TREINO = `
  INSERT INTO recorde (id_corredor, id_prova, distancia_km, melhor_tempo_seg, data_registro)
  VALUES ($1, NULL, $2, $3, $4)
  ON CONFLICT (id_corredor, distancia_km) DO UPDATE
     SET melhor_tempo_seg = EXCLUDED.melhor_tempo_seg,
         data_registro    = EXCLUDED.data_registro,
         id_prova         = NULL
   WHERE recorde.melhor_tempo_seg > EXCLUDED.melhor_tempo_seg
  RETURNING id_recorde`;

/** Equipamentos que, com este treino, passaram de 80% da vida útil. */
const ALERTAS_VIDA_UTIL = `
  SELECT vu.equipamento, vu.km_acumulados, vu.vida_util_km, vu.desgaste_pct
    FROM vw_equipamento_uso vu
    JOIN treino_equipamento te ON te.id_equipamento = vu.id_equipamento
   WHERE te.id_treino = $1
     AND vu.desgaste_pct >= 80
     AND NOT vu.aposentado`;

async function registrarTreino(ctx) {
  ui.titulo('Registrar um treino');

  // --- 1. O treino estava no cronograma? -------------------------------
  const planejados = await consultar(PLANEJADOS_EM_ABERTO, [ctx.corredorId]);
  let planejado = null;
  if (planejados.length > 0) {
    const idPlanejado = await ui.escolher('Este treino estava no seu cronograma?', planejados, {
      permitirVazio: true,
    });
    if (idPlanejado) {
      planejado = await consultarUm(BUSCAR_PLANEJADO, [idPlanejado, ctx.corredorId]);
      if (!planejado || planejado.status !== 'Prescrita') {
        ui.erro('Esse treino do cronograma não está mais em aberto.');
        return;
      }
      ui.info(
        `O plano pedia ${ui.numeroBr(planejado.distancia_alvo_km, 1)} km no ritmo de ` +
          `${ui.paceParaTexto(planejado.pace_alvo_seg)}/km.`,
      );
    }
  } else {
    ui.info(ui.cor.fraco('Você não tem treinos pendentes no cronograma — este será um treino livre.'));
  }

  // --- 2. Dados do treino ----------------------------------------------
  const sugestaoData = planejado?.data_planejada ?? hoje();
  const data =
    normalizarData(await ui.perguntar('Quando você correu?', ui.dataBr(sugestaoData))) ??
    sugestaoData;

  // Com um treino planejado escolhido, tipo/percurso/plano vêm dele: não se pergunta de novo.
  const idTipo = planejado
    ? planejado.id_tipo_treino
    : await ui.escolher('Que tipo de treino foi?', await consultar(OPCOES.tipo_treino));
  if (!idTipo) {
    return;
  }

  const idPercurso =
    planejado?.id_percurso ??
    (await ui.escolher('Onde você correu?', await consultar(OPCOES.percurso, [ctx.corredorId]), {
      permitirVazio: true,
    }));

  const idPlano =
    planejado?.id_plano ??
    (await ui.escolher(
      'Faz parte de algum plano? (opcional)',
      await consultar(OPCOES.plano, [ctx.corredorId]),
      { permitirVazio: true },
    ));

  const distancia = Number(
    (
      await ui.perguntar(
        'Quantos quilômetros você correu?',
        planejado ? ui.numeroBr(planejado.distancia_alvo_km, 2) : '',
      )
    ).replace(',', '.'),
  );
  if (!distancia || distancia <= 0) {
    ui.erro('Distância inválida. Use algo como 8 ou 10,5.');
    return;
  }

  const duracao = ui.relogioParaSeg(
    await ui.perguntar('Em quanto tempo? (ex.: 46:20 para 46 min, 1:12:30 para 1h12)'),
  );
  if (!duracao) {
    ui.erro('Tempo inválido. Use minutos:segundos, como 46:20.');
    return;
  }
  ui.info(ui.cor.verde(`Seu ritmo nesse treino: ${ui.paceParaTexto(duracao / distancia)}/km`));

  const esforcoBruto = await ui.perguntar(
    'Como foi o esforço? 1 = bem leve, 10 = no limite (Enter pula)',
    '',
  );
  const esforco = esforcoBruto === '' ? null : Number(esforcoBruto);
  const observacao = (await ui.perguntar('Quer anotar alguma coisa? (Enter pula)', '')) || null;

  // --- 3. Equipamentos usados ------------------------------------------
  const equipamentos = await consultar(OPCOES.equipamento, [ctx.corredorId]);
  const usados = [];
  if (equipamentos.length > 0) {
    ui.subtitulo('Com o que você correu? (escolha um por vez)');
    for (;;) {
      const restantes = equipamentos.filter((e) => !usados.includes(e.id));
      if (restantes.length === 0) {
        break;
      }
      const escolhido = await ui.escolher(
        usados.length === 0 ? 'Tênis, relógio, cinta...' : 'Mais alguma coisa?',
        restantes,
        { permitirVazio: true },
      );
      if (!escolhido) {
        break;
      }
      usados.push(escolhido);
    }
  }

  // --- 4. Grava tudo, ou nada ------------------------------------------
  try {
    const resumo = await emTransacao(async (cliente) => {
      const treino = await consultarUm(
        INSERIR_TREINO,
        [ctx.corredorId, idPlano, idPercurso, planejado?.id_treino_planejado ?? null, idTipo,
         data, distancia, duracao, esforco, observacao],
        cliente,
      );

      for (const idEquipamento of usados) {
        await executar(VINCULAR_EQUIPAMENTO, [treino.id_treino, idEquipamento, distancia], cliente);
      }

      if (planejado) {
        await executar(CUMPRIR_PLANEJADO, [planejado.id_treino_planejado], cliente);
      }

      // Recorde: só em distância oficial, e só se a marca for melhor.
      let recorde = null;
      const oficial = await consultarUm(DISTANCIA_OFICIAL, [distancia], cliente);
      if (oficial) {
        const anterior = await consultarUm(
          RECORDE_DA_DISTANCIA,
          [ctx.corredorId, oficial.distancia_km],
          cliente,
        );
        const promovido = await consultarUm(
          PROMOVER_RECORDE_DE_TREINO,
          [ctx.corredorId, oficial.distancia_km, duracao, data],
          cliente,
        );
        if (promovido) {
          recorde = { distancia: oficial.distancia_km, anterior: anterior?.melhor_tempo_seg ?? null };
        }
      }

      const alertas = await consultar(ALERTAS_VIDA_UTIL, [treino.id_treino], cliente);
      return { treino, recorde, alertas };
    });

    ui.sucesso(
      `Treino registrado! ${ui.numeroBr(distancia, 2)} km em ${ui.segParaRelogio(duracao)} ` +
        `(${ui.paceParaTexto(resumo.treino.pace_medio_seg)}/km)` +
        (planejado ? ' — e o treino do cronograma ficou marcado como feito.' : '.'),
    );
    if (resumo.recorde) {
      const antes = resumo.recorde.anterior
        ? ` (antes era ${ui.segParaRelogio(resumo.recorde.anterior)})`
        : '';
      ui.sucesso(
        `Parabéns, é seu melhor tempo em ${ui.numeroBr(resumo.recorde.distancia, 2)} km: ` +
          `${ui.segParaRelogio(duracao)}${antes}`,
      );
    }
    for (const a of resumo.alertas) {
      ui.aviso(
        `${a.equipamento} já rodou ${ui.numeroBr(a.km_acumulados, 0)} dos ` +
          `${ui.numeroBr(a.vida_util_km, 0)} km de vida útil. Vá pensando na troca.`,
      );
    }
  } catch (e) {
    ui.erro(traduzirErro(e));
  }
}

// --- Consultar e apagar treinos ---------------------------------------

/** Lê a view, que já resolve plano/percurso/treino planejado e calcula o pace. */
const LISTAR_TREINOS = `
  SELECT v.id_treino,
         v.data_treino,
         v.tipo_treino,
         v.distancia_km,
         v.duracao_seg,
         v.pace_medio_seg,
         COALESCE(v.percurso, '—') AS percurso,
         COALESCE(v.plano, '—')    AS plano,
         CASE WHEN v.id_treino_planejado IS NULL THEN 'Avulso' ELSE 'Cronograma' END AS origem,
         (SELECT STRING_AGG(e.marca || ' ' || e.modelo, ', ' ORDER BY e.marca)
            FROM treino_equipamento te
            JOIN equipamento e ON e.id_equipamento = te.id_equipamento
           WHERE te.id_treino = v.id_treino) AS equipamentos
    FROM vw_treino_completo v
   WHERE v.id_corredor = $1
     AND v.data_treino BETWEEN $2 AND $3
   ORDER BY v.data_treino DESC, v.id_treino DESC`;

/** Reabre o planejamento ANTES do DELETE, que apagaria o vínculo. */
const REABRIR_PLANEJADO = `
  UPDATE treino_planejado
     SET status = 'Prescrita'
   WHERE id_treino_planejado = (SELECT id_treino_planejado FROM treino WHERE id_treino = $1)
     AND id_treino_planejado IS NOT NULL`;

/** As linhas de treino_equipamento caem por ON DELETE CASCADE. */
const EXCLUIR_TREINO = `DELETE FROM treino WHERE id_treino = $1`;

async function listarTreinos(ctx) {
  ui.titulo('Meus treinos');
  const [de, ate] = await lerPeriodo();
  ui.tabela(await consultar(LISTAR_TREINOS, [ctx.corredorId, de, ate]), {
    vazio: 'Nenhum treino registrado nesse período.',
  });
}

async function excluirTreino(ctx) {
  ui.titulo('Apagar um treino');
  const [de, ate] = await lerPeriodo();
  const linhas = await consultar(LISTAR_TREINOS, [ctx.corredorId, de, ate]);
  const escolhido = await ui.escolherDaLista(linhas, 'Qual treino você quer apagar?', {
    vazio: 'Nenhum treino registrado nesse período.',
  });
  if (!escolhido || !(await ui.confirmar('Tem certeza? Isso não pode ser desfeito.'))) {
    return;
  }

  await emTransacao(async (cliente) => {
    await executar(REABRIR_PLANEJADO, [escolhido.id_treino], cliente);
    await executar(EXCLUIR_TREINO, [escolhido.id_treino], cliente);
  });
  ui.sucesso('Treino apagado. Se ele vinha do cronograma, o dia voltou a ficar pendente.');
}

// =====================================================================
// PROCESSO 2 — Montar cronograma
//
// Uma única instrução cria os treinos planejados de N semanas: o CROSS JOIN entre a
// série de semanas (generate_series) e a semana-tipo (UNNEST dos vetores).
// =====================================================================

const GERAR_CRONOGRAMA = `
  INSERT INTO treino_planejado (id_plano, id_percurso, id_tipo_treino, data_planejada,
                      distancia_alvo_km, pace_alvo_seg, status)
  SELECT $1,
         modelo.id_percurso,
         modelo.id_tipo_treino,
         -- avança até o primeiro dia-da-semana pedido, depois soma as semanas
         $2::DATE
           + ((modelo.dia_semana - EXTRACT(DOW FROM $2::DATE)::INT + 7) % 7)
           + (semana.n * 7),
         ROUND((modelo.km * (1 + ($4::NUMERIC / 100) * semana.n))::NUMERIC, 2),
         modelo.pace_alvo,
         'Prescrita'
    FROM generate_series(0, $3::INT - 1) AS semana (n)
    CROSS JOIN UNNEST($5::INT[], $6::INT[], $7::INT[], $8::NUMERIC[], $9::INT[])
               AS modelo (dia_semana, id_percurso, id_tipo_treino, km, pace_alvo)
   WHERE NOT EXISTS (
           SELECT 1 FROM plano p
            WHERE p.id_plano = $1
              AND p.data_fim IS NOT NULL
              AND p.data_fim < $2::DATE
                               + ((modelo.dia_semana - EXTRACT(DOW FROM $2::DATE)::INT + 7) % 7)
                               + (semana.n * 7)
         )
  RETURNING id_treino_planejado`;

const BUSCAR_PLANO = `SELECT * FROM plano WHERE id_plano = $1`;

async function montarCronograma(ctx) {
  ui.titulo('Montar meu cronograma');

  const idPlano = await ui.escolher(
    'Para qual plano?',
    await consultar(OPCOES.plano, [ctx.corredorId]),
  );
  if (!idPlano) {
    return;
  }

  const plano = await consultarUm(BUSCAR_PLANO, [idPlano]);
  const inicio =
    normalizarData(await ui.perguntar('A partir de quando?', ui.dataBr(plano.data_inicio))) ??
    plano.data_inicio;
  const semanas = Number(await ui.perguntar('Por quantas semanas?', '4'));
  if (!semanas || semanas < 1) {
    ui.erro('Número de semanas inválido.');
    return;
  }
  ui.info('A cada semana o volume pode subir um pouco. 0 mantém tudo igual.');
  const progressao = Number(await ui.perguntar('Aumento por semana (%)', '5'));

  // --- Semana-tipo ------------------------------------------------------
  const tipos = await consultar(OPCOES.tipo_treino);
  const percursos = await consultar(OPCOES.percurso, [ctx.corredorId]);
  const modelo = [];

  ui.subtitulo('Como é a sua semana? (adicione um treino por vez)');
  for (;;) {
    const dia = await ui.escolher(
      modelo.length === 0 ? 'Em que dia você treina?' : 'Mais algum dia?',
      DIAS_SEMANA.map((d) => ({ id: d.valor, rotulo: d.nome })),
      { permitirVazio: true },
    );
    if (dia === null) {
      break;
    }
    const idTipo = await ui.escolher('Que tipo de treino?', tipos);
    if (!idTipo) {
      break;
    }
    const idPercurso = await ui.escolher('Em que percurso?', percursos, { permitirVazio: true });
    const km = Number((await ui.perguntar('Quantos km?', '8')).replace(',', '.'));
    const pace = ui.relogioParaSeg(await ui.perguntar('Em que ritmo? (ex.: 5:30, Enter pula)', ''));

    modelo.push({ dia, idTipo, idPercurso, km, pace });
    ui.info(ui.cor.fraco(`${modelo.length} treino(s) por semana até agora.`));
  }

  if (modelo.length === 0) {
    ui.aviso('Nenhum treino informado — nada a gerar.');
    return;
  }

  const totalKm = modelo.reduce((acc, m) => acc + m.km, 0);
  const previsto = Array.from(
    { length: semanas },
    (_, n) => totalKm * (1 + (progressao / 100) * n),
  ).reduce((a, b) => a + b, 0);
  ui.info(
    `Vou criar ${modelo.length * semanas} treinos no seu cronograma, ` +
      `somando cerca de ${ui.numeroBr(previsto, 1)} km.`,
  );
  if (!(await ui.confirmar('Pode gerar?'))) {
    return;
  }

  try {
    const criadas = await consultar(GERAR_CRONOGRAMA, [
      idPlano,
      inicio,
      semanas,
      progressao,
      modelo.map((m) => m.dia),
      modelo.map((m) => m.idPercurso),
      modelo.map((m) => m.idTipo),
      modelo.map((m) => m.km),
      modelo.map((m) => m.pace),
    ]);
    ui.sucesso(`Pronto! ${criadas.length} treinos agendados.`);
  } catch (e) {
    ui.erro(traduzirErro(e));
  }
}

// --- Acompanhar o cronograma ------------------------------------------

const LISTAR_CRONOGRAMA = `
  SELECT s.id_treino_planejado,
         s.data_planejada,
         p.nome                 AS plano,
         tt.nome                AS tipo_treino,
         s.distancia_alvo_km,
         s.pace_alvo_seg,
         COALESCE(pc.nome, '—') AS percurso,
         COALESCE(tr.nome, '—') AS treinador,
         s.status,
         (SELECT t.distancia_km FROM treino t WHERE t.id_treino_planejado = s.id_treino_planejado) AS km_realizado
    FROM treino_planejado s
    JOIN plano       p  ON p.id_plano        = s.id_plano
    JOIN tipo_treino tt ON tt.id_tipo_treino = s.id_tipo_treino
    LEFT JOIN percurso  pc ON pc.id_percurso  = s.id_percurso
    LEFT JOIN treinador tr ON tr.id_treinador = p.id_treinador
   WHERE p.id_corredor = $1
     AND s.data_planejada BETWEEN $2 AND $3
   ORDER BY s.data_planejada, s.id_treino_planejado`;

/** Fecha de uma vez todo dia vencido que não virou treino. */
const FECHAR_VENCIDAS = `
  UPDATE treino_planejado s
     SET status = 'Perdida'
    FROM plano p
   WHERE p.id_plano = s.id_plano
     AND p.id_corredor = $1
     AND s.status = 'Prescrita'
     AND s.data_planejada < CURRENT_DATE
     AND NOT EXISTS (SELECT 1 FROM treino t WHERE t.id_treino_planejado = s.id_treino_planejado)
  RETURNING s.id_treino_planejado`;

const ALTERAR_STATUS_PLANEJADO = `UPDATE treino_planejado SET status = $2 WHERE id_treino_planejado = $1`;

async function verCronograma(ctx) {
  ui.titulo('O que tenho para fazer');
  const [de, ate] = await lerPeriodo();
  ui.tabela(await consultar(LISTAR_CRONOGRAMA, [ctx.corredorId, de, ate]), {
    vazio: 'Nada no cronograma para esse período.',
  });
}

async function fecharVencidas(ctx) {
  ui.titulo('Treinos que não foram feitos');
  const fechadas = await consultar(FECHAR_VENCIDAS, [ctx.corredorId]);
  if (fechadas.length === 0) {
    ui.info(ui.cor.fraco('Nada pendente para trás. Em dia!'));
  } else {
    ui.sucesso(`${fechadas.length} treino(s) do passado marcados como perdidos.`);
  }
}

async function alterarStatusPlanejado(ctx) {
  ui.titulo('Corrigir a situação de um treino');
  const [de, ate] = await lerPeriodo();
  const linhas = await consultar(LISTAR_CRONOGRAMA, [ctx.corredorId, de, ate]);
  const escolhida = await ui.escolherDaLista(linhas, 'Qual treino do cronograma?', {
    vazio: 'Nada no cronograma para esse período.',
  });
  if (!escolhida) {
    return;
  }
  const status = await ui.escolher('Passar para qual situação?', [
    { id: 'Prescrita', rotulo: 'A fazer' },
    { id: 'Cumprida', rotulo: 'Já fiz' },
    { id: 'Perdida', rotulo: 'Perdi este treino' },
  ]);
  if (!status) {
    return;
  }
  await executar(ALTERAR_STATUS_PLANEJADO, [escolhida.id_treino_planejado, status]);
  ui.sucesso(`Pronto, o treino de ${ui.dataBr(escolhida.data_planejada)} agora está como "${status}".`);
}

// =====================================================================
// PROCESSO 3 — Inscrever em prova
// =====================================================================

/** Regra: uma inscrição ativa (não cancelada) por prova. */
const INSCRICAO_ATIVA_NA_PROVA = `
  SELECT id_inscricao, status
    FROM inscricao
   WHERE id_corredor = $1
     AND id_prova    = $2
     AND status <> 'Cancelado'`;

const INSERIR_INSCRICAO = `
  INSERT INTO inscricao (id_corredor, id_prova, id_plano, data_inscricao,
                         valor_pago, numero_peito, categoria, status)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  RETURNING id_inscricao`;

async function inscreverProva(ctx) {
  ui.titulo('Me inscrever em uma prova');

  const idProva = await ui.escolher(
    'Em qual prova você quer correr?',
    await consultar(OPCOES.prova),
  );
  if (!idProva) {
    return;
  }

  const existente = await consultarUm(INSCRICAO_ATIVA_NA_PROVA, [ctx.corredorId, idProva]);
  if (existente) {
    ui.erro(
      `Você já está inscrito nessa prova (situação: ${existente.status.toLowerCase()}). ` +
        'Cancele a inscrição atual antes de se inscrever de novo.',
    );
    return;
  }

  const idPlano = await ui.escolher(
    'Vai se preparar com algum plano? (opcional)',
    await consultar(OPCOES.plano, [ctx.corredorId]),
    { permitirVazio: true },
  );
  const data =
    normalizarData(await ui.perguntar('Quando você se inscreveu?', ui.dataBr(hoje()))) ?? hoje();
  const valor = Number((await ui.perguntar('Quanto custou? (R$)', '0')).replace(',', '.'));
  const peito = (await ui.perguntar('Seu número de peito, se já souber (Enter pula)', '')) || null;
  const categoria = (await ui.perguntar('Sua categoria (Enter pula)', '')) || null;
  const status = await ui.escolher('Como está a inscrição?', [
    { id: 'Inscrito', rotulo: 'Inscrito — ainda não confirmada' },
    { id: 'Confirmado', rotulo: 'Confirmado — pagamento em dia' },
  ]);
  if (!status) {
    return;
  }

  try {
    await executar(INSERIR_INSCRICAO, [
      ctx.corredorId, idProva, idPlano, data, valor, peito, categoria, status,
    ]);
    ui.sucesso('Inscrição registrada. Boa prova!');
  } catch (e) {
    ui.erro(traduzirErro(e));
  }
}

// =====================================================================
// PROCESSO 4 — Registrar o resultado da prova
//
// Fecha a inscrição e, se a marca for melhor, promove a recorde pessoal —
// as duas escritas na mesma transação.
// =====================================================================

const PROVAS_AGUARDANDO_RESULTADO = `
  SELECT i.id_inscricao AS id,
         pv.nome || ' — ' || TO_CHAR(pv.data_prova, 'DD/MM/YYYY') AS rotulo
    FROM inscricao i
    JOIN prova pv ON pv.id_prova = i.id_prova
   WHERE i.id_corredor = $1
     AND i.status IN ('Inscrito', 'Confirmado')
     AND pv.data_prova <= CURRENT_DATE
   ORDER BY pv.data_prova`;

const BUSCAR_INSCRICAO = `
  SELECT i.*, pv.nome AS prova, pv.data_prova, pv.distancia_km
    FROM inscricao i
    JOIN prova pv ON pv.id_prova = i.id_prova
   WHERE i.id_inscricao = $1
     AND i.id_corredor  = $2`;

const REGISTRAR_RESULTADO = `
  UPDATE inscricao
     SET tempo_liquido_seg   = $2,
         colocacao_geral     = $3,
         colocacao_categoria = $4,
         status              = 'Concluído'
   WHERE id_inscricao = $1
  RETURNING (SELECT ROUND($2::NUMERIC / pv.distancia_km)
               FROM prova pv WHERE pv.id_prova = inscricao.id_prova) AS pace_seg`;

const PROMOVER_RECORDE_DE_PROVA = `
  INSERT INTO recorde (id_corredor, id_prova, distancia_km, melhor_tempo_seg, data_registro)
  VALUES ($1, $2, $3, $4, $5)
  ON CONFLICT (id_corredor, distancia_km) DO UPDATE
     SET melhor_tempo_seg = EXCLUDED.melhor_tempo_seg,
         data_registro    = EXCLUDED.data_registro,
         id_prova         = EXCLUDED.id_prova
   WHERE recorde.melhor_tempo_seg > EXCLUDED.melhor_tempo_seg
  RETURNING id_recorde`;

async function registrarResultado(ctx) {
  ui.titulo('Como foi a prova?');

  const pendentes = await consultar(PROVAS_AGUARDANDO_RESULTADO, [ctx.corredorId]);
  if (pendentes.length === 0) {
    ui.info(ui.cor.fraco('Você não tem provas aguardando resultado.'));
    return;
  }
  const idInscricao = await ui.escolher('De qual prova?', pendentes);
  if (!idInscricao) {
    return;
  }

  const inscricao = await consultarUm(BUSCAR_INSCRICAO, [idInscricao, ctx.corredorId]);
  ui.info(
    `${ui.cor.negrito(inscricao.prova)} · ${ui.numeroBr(inscricao.distancia_km, 1)} km · ` +
      ui.dataBr(inscricao.data_prova),
  );

  const tempo = ui.relogioParaSeg(await ui.perguntar('Qual foi o seu tempo? (ex.: 1:44:00)'));
  if (!tempo) {
    ui.erro('Tempo inválido. Use horas:minutos:segundos, como 1:44:00.');
    return;
  }
  const geralBruto = await ui.perguntar('Em que lugar você chegou na geral? (Enter pula)', '');
  const catBruto = await ui.perguntar('E na sua categoria? (Enter pula)', '');

  try {
    const resumo = await emTransacao(async (cliente) => {
      const anterior = await consultarUm(
        RECORDE_DA_DISTANCIA,
        [ctx.corredorId, inscricao.distancia_km],
        cliente,
      );

      const atualizada = await consultarUm(
        REGISTRAR_RESULTADO,
        [idInscricao, tempo,
         geralBruto === '' ? null : Number(geralBruto),
         catBruto === '' ? null : Number(catBruto)],
        cliente,
      );

      const promovido = await consultarUm(
        PROMOVER_RECORDE_DE_PROVA,
        [ctx.corredorId, inscricao.id_prova, inscricao.distancia_km, tempo, inscricao.data_prova],
        cliente,
      );

      return {
        pace: atualizada.pace_seg,
        recorde: Boolean(promovido),
        anterior: anterior?.melhor_tempo_seg ?? null,
      };
    });

    ui.sucesso(
      `Resultado guardado! Você fez ${ui.segParaRelogio(tempo)} ` +
        `(${ui.paceParaTexto(resumo.pace)}/km) em ${ui.numeroBr(inscricao.distancia_km, 1)} km.`,
    );
    if (resumo.recorde) {
      const antes = resumo.anterior ? ` Antes era ${ui.segParaRelogio(resumo.anterior)}.` : '';
      ui.sucesso(`É seu melhor tempo em ${ui.numeroBr(inscricao.distancia_km, 1)} km!${antes}`);
    } else if (resumo.anterior) {
      ui.info(
        `Seu melhor tempo nessa distância segue sendo ${ui.segParaRelogio(resumo.anterior)} ` +
          `— ficou ${ui.segParaRelogio(tempo - resumo.anterior)} atrás dele.`,
      );
    }
  } catch (e) {
    ui.erro(traduzirErro(e));
  }
}

// --- Consultar e cancelar inscrições ----------------------------------

const LISTAR_INSCRICOES = `
  SELECT i.id_inscricao,
         pv.nome                AS prova,
         pv.data_prova,
         pv.distancia_km,
         COALESCE(pl.nome, '—') AS plano,
         i.numero_peito,
         i.categoria,
         i.valor_pago,
         i.status,
         i.tempo_liquido_seg,
         CASE WHEN i.tempo_liquido_seg IS NULL THEN NULL
              ELSE ROUND(i.tempo_liquido_seg / pv.distancia_km)
         END                    AS pace_seg,
         i.colocacao_geral
    FROM inscricao i
    JOIN prova pv      ON pv.id_prova = i.id_prova
    LEFT JOIN plano pl ON pl.id_plano = i.id_plano
   WHERE i.id_corredor = $1
   ORDER BY pv.data_prova DESC`;

/** Cancelar não apaga: tira a linha do índice único e preserva o histórico. */
const CANCELAR_INSCRICAO = `UPDATE inscricao SET status = 'Cancelado' WHERE id_inscricao = $1`;

/** Só entra aqui quem ainda pode ser cancelado: inscrição ativa numa prova futura. */
const LISTAR_INSCRICOES_CANCELAVEIS = `
  SELECT i.id_inscricao,
         pv.nome                AS prova,
         pv.data_prova,
         pv.distancia_km,
         COALESCE(pl.nome, '—') AS plano,
         i.numero_peito,
         i.categoria,
         i.valor_pago,
         i.status
    FROM inscricao i
    JOIN prova pv      ON pv.id_prova = i.id_prova
    LEFT JOIN plano pl ON pl.id_plano = i.id_plano
   WHERE i.id_corredor = $1
     AND i.status IN ('Inscrito', 'Confirmado')
     AND pv.data_prova > CURRENT_DATE
   ORDER BY pv.data_prova`;

async function listarInscricoes(ctx) {
  ui.titulo('Minhas inscrições');
  ui.tabela(await consultar(LISTAR_INSCRICOES, [ctx.corredorId]), {
    vazio: 'Você ainda não se inscreveu em nenhuma prova.',
  });
}

async function cancelarInscricao(ctx) {
  ui.titulo('Cancelar uma inscrição');
  const linhas = await consultar(LISTAR_INSCRICOES_CANCELAVEIS, [ctx.corredorId]);
  const escolhida = await ui.escolherDaLista(linhas, 'Qual inscrição você quer cancelar?', {
    vazio: 'Você não tem inscrições em provas futuras para cancelar.',
  });
  if (!escolhida) {
    return;
  }
  await executar(CANCELAR_INSCRICAO, [escolhida.id_inscricao]);
  ui.sucesso('Inscrição cancelada. Você pode se inscrever nessa prova de novo quando quiser.');
}

// =====================================================================
// Menus
// =====================================================================

export async function menuTreinos(ctx) {
  for (;;) {
    ui.titulo('Meus treinos');
    const escolha = await ui.menu('O que você quer fazer?', [
      { valor: 'registrar', rotulo: 'Registrar um treino que fiz' },
      { valor: 'listar', rotulo: 'Ver meus treinos' },
      { valor: 'excluir', rotulo: 'Apagar um treino' },
    ]);
    if (escolha === null) {
      return;
    }
    try {
      if (escolha === 'registrar') await registrarTreino(ctx);
      else if (escolha === 'listar') await listarTreinos(ctx);
      else await excluirTreino(ctx);
    } catch (e) {
      ui.erro(traduzirErro(e));
    }
    await ui.pausar();
  }
}

export async function menuCronograma(ctx) {
  for (;;) {
    ui.titulo('Meu cronograma');
    const escolha = await ui.menu('O que você quer fazer?', [
      { valor: 'montar', rotulo: 'Montar meu cronograma de treinos' },
      { valor: 'ver', rotulo: 'Ver o que tenho para fazer' },
      { valor: 'fechar', rotulo: 'Marcar como perdidos os treinos que não fiz' },
      { valor: 'status', rotulo: 'Corrigir a situação de um treino do cronograma' },
    ]);
    if (escolha === null) {
      return;
    }
    try {
      if (escolha === 'montar') await montarCronograma(ctx);
      else if (escolha === 'ver') await verCronograma(ctx);
      else if (escolha === 'fechar') await fecharVencidas(ctx);
      else await alterarStatusPlanejado(ctx);
    } catch (e) {
      ui.erro(traduzirErro(e));
    }
    await ui.pausar();
  }
}

export async function menuInscricoes(ctx) {
  for (;;) {
    ui.titulo('Minhas provas');
    const escolha = await ui.menu('O que você quer fazer?', [
      { valor: 'inscrever', rotulo: 'Me inscrever em uma prova' },
      { valor: 'resultado', rotulo: 'Registrar como fui em uma prova' },
      { valor: 'listar', rotulo: 'Ver minhas inscrições' },
      { valor: 'cancelar', rotulo: 'Cancelar uma inscrição' },
    ]);
    if (escolha === null) {
      return;
    }
    try {
      if (escolha === 'inscrever') await inscreverProva(ctx);
      else if (escolha === 'resultado') await registrarResultado(ctx);
      else if (escolha === 'listar') await listarInscricoes(ctx);
      else await cancelarInscricao(ctx);
    } catch (e) {
      ui.erro(traduzirErro(e));
    }
    await ui.pausar();
  }
}
