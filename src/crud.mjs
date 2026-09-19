/**
 * CRUD das tabelas de entidade.
 *
 * Cada entidade traz o seu próprio SQL: as cinco instruções ficam no descritor,
 * logo abaixo dos campos do formulário. A ordem dos campos é a ordem dos
 * parâmetros $n do INSERT/UPDATE — é o que liga o formulário à instrução.
 */
import { consultar, consultarUm, executar } from './db.mjs';
import * as ui from './ui.mjs';

const TERRENOS = ['Asfalto', 'Trilha', 'Esteira', 'Pista', 'Areia', 'Misto'];
const TIPOS_EQUIPAMENTO = ['Tênis', 'Relógio', 'Cinta cardíaca', 'Vestuário', 'Outro'];

/**
 * Consultas que alimentam os menus de escolha (devolvem sempre id + rotulo).
 * Ficam aqui porque são "listas da entidade"; os processos de negócio as
 * importam para montar seus próprios menus.
 */
export const OPCOES = {
  treinador: `
    SELECT id_treinador AS id, nome AS rotulo
      FROM treinador WHERE ativo ORDER BY nome`,

  tipo_treino: `
    SELECT id_tipo_treino AS id, nome AS rotulo
      FROM tipo_treino ORDER BY intensidade, nome`,

  percurso: `
    SELECT id_percurso AS id,
           nome || ' — ' || REPLACE(distancia_km::TEXT, '.', ',') || ' km' AS rotulo
      FROM percurso
     WHERE id_corredor = $1 AND ativo
     ORDER BY nome`,

  equipamento: `
    SELECT id_equipamento AS id, marca || ' ' || modelo AS rotulo
      FROM equipamento
     WHERE id_corredor = $1 AND NOT aposentado
     ORDER BY marca, modelo`,

  plano: `
    SELECT id_plano AS id, nome AS rotulo
      FROM plano WHERE id_corredor = $1 ORDER BY data_inicio DESC`,

  prova: `
    SELECT id_prova AS id,
           nome || ' — ' || REPLACE(distancia_km::TEXT, '.', ',') || ' km' AS rotulo
      FROM prova ORDER BY data_prova DESC`,
};

export const ENTIDADES = {
  corredor: {
    titulo: 'Corredores',
    tabela: 'corredor',
    id: 'id_corredor',
    campos: [
      { chave: 'nome', rotulo: 'Nome', tipo: 'texto', req: true },
      { chave: 'email', rotulo: 'E-mail', tipo: 'texto', req: true },
      { chave: 'senha_hash', rotulo: 'Senha (hash)', tipo: 'texto', req: true, soInsercao: true },
      { chave: 'sexo', rotulo: 'Sexo', tipo: 'opcao', opcoes: ['M', 'F', 'O'] },
      { chave: 'data_nascimento', rotulo: 'Nascimento', tipo: 'data' },
      { chave: 'meta_distancia_km', rotulo: 'Meta — distância (km)', tipo: 'numero' },
      { chave: 'meta_tempo_seg', rotulo: 'Meta — tempo (hh:mm:ss)', tipo: 'tempo' },
    ],
    sql: {
      listar: `
        SELECT c.id_corredor, c.nome, c.email, c.sexo,
               DATE_PART('year', AGE(c.data_nascimento)) AS idade,
               c.meta_distancia_km, c.meta_tempo_seg,
               (SELECT COUNT(*) FROM treino t WHERE t.id_corredor = c.id_corredor) AS treinos
          FROM corredor c
         ORDER BY c.nome`,
      buscar: `SELECT * FROM corredor WHERE id_corredor = $1`,
      inserir: `
        INSERT INTO corredor (nome, email, senha_hash, sexo, data_nascimento,
                              meta_distancia_km, meta_tempo_seg)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id_corredor`,
      atualizar: `
        UPDATE corredor
           SET nome = $2, email = $3, sexo = $4, data_nascimento = $5,
               meta_distancia_km = $6, meta_tempo_seg = $7
         WHERE id_corredor = $1`,
      excluir: `DELETE FROM corredor WHERE id_corredor = $1`,
    },
  },

  treinador: {
    titulo: 'Meus treinadores',
    tabela: 'treinador',
    id: 'id_treinador',
    campos: [
      { chave: 'nome', rotulo: 'Nome', tipo: 'texto', req: true },
      { chave: 'cref', rotulo: 'CREF', tipo: 'texto' },
      { chave: 'email', rotulo: 'E-mail', tipo: 'texto' },
      { chave: 'telefone', rotulo: 'Telefone', tipo: 'texto' },
      { chave: 'assessoria', rotulo: 'Assessoria', tipo: 'texto' },
      { chave: 'especialidade', rotulo: 'Especialidade', tipo: 'texto' },
      { chave: 'ativo', rotulo: 'Ativo', tipo: 'bool', padrao: true },
    ],
    sql: {
      listar: `
        SELECT t.id_treinador, t.nome, t.cref, t.assessoria, t.especialidade,
               COALESCE(t.email, t.telefone) AS contato, t.ativo,
               (SELECT COUNT(*) FROM plano p WHERE p.id_treinador = t.id_treinador) AS planos
          FROM treinador t
         ORDER BY t.nome`,
      buscar: `SELECT * FROM treinador WHERE id_treinador = $1`,
      inserir: `
        INSERT INTO treinador (nome, cref, email, telefone, assessoria, especialidade, ativo)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id_treinador`,
      atualizar: `
        UPDATE treinador
           SET nome = $2, cref = $3, email = $4, telefone = $5,
               assessoria = $6, especialidade = $7, ativo = $8
         WHERE id_treinador = $1`,
      excluir: `DELETE FROM treinador WHERE id_treinador = $1`,
    },
  },

  tipo_treino: {
    titulo: 'Tipos de treino',
    tabela: 'tipo_treino',
    id: 'id_tipo_treino',
    campos: [
      { chave: 'nome', rotulo: 'Nome', tipo: 'texto', req: true },
      { chave: 'descricao', rotulo: 'Descrição', tipo: 'texto' },
      { chave: 'intensidade', rotulo: 'Intensidade (1–5)', tipo: 'inteiro', req: true },
    ],
    sql: {
      listar: `
        SELECT tt.id_tipo_treino, tt.nome, tt.intensidade, tt.descricao,
               (SELECT COUNT(*) FROM treino t WHERE t.id_tipo_treino = tt.id_tipo_treino) AS treinos,
               (SELECT COUNT(*) FROM treino_planejado s WHERE s.id_tipo_treino = tt.id_tipo_treino) AS treinos_planejados
          FROM tipo_treino tt
         ORDER BY tt.intensidade, tt.nome`,
      buscar: `SELECT * FROM tipo_treino WHERE id_tipo_treino = $1`,
      inserir: `
        INSERT INTO tipo_treino (nome, descricao, intensidade)
        VALUES ($1, $2, $3)
        RETURNING id_tipo_treino`,
      atualizar: `
        UPDATE tipo_treino
           SET nome = $2, descricao = $3, intensidade = $4
         WHERE id_tipo_treino = $1`,
      excluir: `DELETE FROM tipo_treino WHERE id_tipo_treino = $1`,
    },
  },

  percurso: {
    titulo: 'Meus percursos',
    tabela: 'percurso',
    id: 'id_percurso',
    escopoCorredor: true,
    campos: [
      { chave: 'nome', rotulo: 'Nome', tipo: 'texto', req: true },
      { chave: 'distancia_km', rotulo: 'Distância (km)', tipo: 'numero', req: true },
      { chave: 'terreno', rotulo: 'Terreno', tipo: 'opcao', opcoes: TERRENOS, req: true },
      { chave: 'ganho_elevacao_m', rotulo: 'Ganho de elevação (m)', tipo: 'inteiro' },
      { chave: 'cidade', rotulo: 'Cidade', tipo: 'texto' },
      { chave: 'referencia', rotulo: 'Ponto de partida', tipo: 'texto' },
      { chave: 'ativo', rotulo: 'Ativo', tipo: 'bool', padrao: true },
    ],
    sql: {
      listar: `
        SELECT pc.id_percurso, pc.nome, pc.distancia_km, pc.terreno,
               pc.ganho_elevacao_m, pc.cidade, pc.ativo,
               (SELECT COUNT(*) FROM treino t WHERE t.id_percurso = pc.id_percurso) AS treinos
          FROM percurso pc
         WHERE pc.id_corredor = $1
         ORDER BY pc.nome`,
      buscar: `SELECT * FROM percurso WHERE id_percurso = $1`,
      inserir: `
        INSERT INTO percurso (id_corredor, nome, distancia_km, terreno,
                              ganho_elevacao_m, cidade, referencia, ativo)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id_percurso`,
      atualizar: `
        UPDATE percurso
           SET nome = $2, distancia_km = $3, terreno = $4, ganho_elevacao_m = $5,
               cidade = $6, referencia = $7, ativo = $8
         WHERE id_percurso = $1`,
      excluir: `DELETE FROM percurso WHERE id_percurso = $1`,
    },
  },

  equipamento: {
    titulo: 'Meus tênis e equipamentos',
    tabela: 'equipamento',
    id: 'id_equipamento',
    escopoCorredor: true,
    campos: [
      { chave: 'marca', rotulo: 'Marca', tipo: 'texto', req: true },
      { chave: 'modelo', rotulo: 'Modelo', tipo: 'texto', req: true },
      { chave: 'tipo', rotulo: 'Tipo', tipo: 'opcao', opcoes: TIPOS_EQUIPAMENTO, req: true },
      { chave: 'data_aquisicao', rotulo: 'Data de aquisição', tipo: 'data' },
      { chave: 'vida_util_km', rotulo: 'Vida útil (km)', tipo: 'numero', req: true, padrao: 800 },
      { chave: 'aposentado', rotulo: 'Aposentado', tipo: 'bool', padrao: false },
      { chave: 'observacao', rotulo: 'Observação', tipo: 'texto' },
    ],
    sql: {
      // A quilometragem não é coluna da tabela: vem da view, que a soma da
      // associativa treino_equipamento.
      listar: `
        SELECT vu.id_equipamento, vu.equipamento, vu.tipo, vu.km_acumulados,
               vu.vida_util_km, vu.desgaste_pct, vu.treinos_realizados, vu.ultimo_uso,
               CASE WHEN vu.aposentado THEN 'Aposentado' ELSE 'Em uso' END AS situacao
          FROM vw_equipamento_uso vu
         WHERE vu.id_corredor = $1
         ORDER BY vu.desgaste_pct DESC`,
      buscar: `SELECT * FROM equipamento WHERE id_equipamento = $1`,
      inserir: `
        INSERT INTO equipamento (id_corredor, marca, modelo, tipo,
                                 data_aquisicao, vida_util_km, aposentado, observacao)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id_equipamento`,
      atualizar: `
        UPDATE equipamento
           SET marca = $2, modelo = $3, tipo = $4, data_aquisicao = $5,
               vida_util_km = $6, aposentado = $7, observacao = $8
         WHERE id_equipamento = $1`,
      excluir: `DELETE FROM equipamento WHERE id_equipamento = $1`,
      historico: `
        SELECT t.data_treino, tt.nome AS tipo_treino, te.km_atribuidos,
               pc.nome AS percurso
          FROM treino_equipamento te
          JOIN treino      t  ON t.id_treino       = te.id_treino
          JOIN tipo_treino tt ON tt.id_tipo_treino = t.id_tipo_treino
          LEFT JOIN percurso pc ON pc.id_percurso  = t.id_percurso
         WHERE te.id_equipamento = $1
         ORDER BY t.data_treino DESC`,
    },
    extras: [
      {
        rotulo: 'Ver onde este equipamento já rodou',
        async executar(ctx, entidade) {
          const id = await selecionarRegistro(ctx, entidade, 'Qual equipamento?');
          if (id === null) {
            return;
          }
          ui.tabela(await consultar(entidade.sql.historico, [id]), {
            vazio: 'Este equipamento ainda não foi usado em nenhum treino.',
          });
        },
      },
    ],
  },

  plano: {
    titulo: 'Meus planos de treino',
    tabela: 'plano',
    id: 'id_plano',
    escopoCorredor: true,
    campos: [
      {
        chave: 'id_treinador',
        rotulo: 'Treinador',
        tipo: 'fk',
        opcoes: OPCOES.treinador,
        opcional: true,
      },
      { chave: 'nome', rotulo: 'Nome', tipo: 'texto', req: true },
      { chave: 'objetivo', rotulo: 'Objetivo', tipo: 'texto' },
      { chave: 'data_inicio', rotulo: 'Início', tipo: 'data', req: true },
      { chave: 'data_fim', rotulo: 'Fim', tipo: 'data' },
      { chave: 'descricao', rotulo: 'Descrição', tipo: 'texto' },
    ],
    sql: {
      listar: `
        SELECT p.id_plano, p.nome, COALESCE(tr.nome, '—') AS treinador,
               p.objetivo, p.data_inicio, p.data_fim,
               (SELECT COUNT(*) FROM treino_planejado s WHERE s.id_plano = p.id_plano) AS treinos_planejados,
               (SELECT COUNT(*) FROM treino t WHERE t.id_plano = p.id_plano) AS treinos
          FROM plano p
          LEFT JOIN treinador tr ON tr.id_treinador = p.id_treinador
         WHERE p.id_corredor = $1
         ORDER BY p.data_inicio DESC`,
      buscar: `SELECT * FROM plano WHERE id_plano = $1`,
      inserir: `
        INSERT INTO plano (id_corredor, id_treinador, nome, objetivo,
                           data_inicio, data_fim, descricao)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id_plano`,
      atualizar: `
        UPDATE plano
           SET id_treinador = $2, nome = $3, objetivo = $4,
               data_inicio = $5, data_fim = $6, descricao = $7
         WHERE id_plano = $1`,
      excluir: `DELETE FROM plano WHERE id_plano = $1`,
    },
  },

  prova: {
    titulo: 'Provas',
    tabela: 'prova',
    id: 'id_prova',
    campos: [
      { chave: 'nome', rotulo: 'Nome', tipo: 'texto', req: true },
      { chave: 'data_prova', rotulo: 'Data', tipo: 'data', req: true },
      { chave: 'distancia_km', rotulo: 'Distância (km)', tipo: 'numero', req: true },
      { chave: 'cidade', rotulo: 'Cidade', tipo: 'texto' },
      { chave: 'uf', rotulo: 'UF', tipo: 'texto' },
      { chave: 'organizador', rotulo: 'Organizador', tipo: 'texto' },
    ],
    sql: {
      listar: `
        SELECT p.id_prova, p.nome, p.data_prova, p.distancia_km,
               p.cidade || '/' || p.uf AS local, p.organizador,
               (SELECT COUNT(*) FROM inscricao i
                 WHERE i.id_prova = p.id_prova AND i.status <> 'Cancelado') AS inscritos
          FROM prova p
         ORDER BY p.data_prova DESC`,
      buscar: `SELECT * FROM prova WHERE id_prova = $1`,
      inserir: `
        INSERT INTO prova (nome, data_prova, distancia_km, cidade, uf, organizador)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id_prova`,
      atualizar: `
        UPDATE prova
           SET nome = $2, data_prova = $3, distancia_km = $4,
               cidade = $5, uf = $6, organizador = $7
         WHERE id_prova = $1`,
      excluir: `DELETE FROM prova WHERE id_prova = $1`,
    },
  },

  recorde: {
    titulo: 'Meus recordes',
    tabela: 'recorde',
    id: 'id_recorde',
    escopoCorredor: true,
    campos: [
      {
        chave: 'id_prova',
        rotulo: 'Prova de origem',
        tipo: 'fk',
        opcoes: OPCOES.prova,
        opcional: true,
      },
      { chave: 'distancia_km', rotulo: 'Distância (km)', tipo: 'numero', req: true },
      { chave: 'melhor_tempo_seg', rotulo: 'Melhor tempo (hh:mm:ss)', tipo: 'tempo', req: true },
      { chave: 'data_registro', rotulo: 'Data do registro', tipo: 'data', req: true },
    ],
    sql: {
      listar: `
        SELECT r.id_recorde, r.distancia_km, r.melhor_tempo_seg,
               ROUND(r.melhor_tempo_seg / r.distancia_km) AS pace_seg,
               r.data_registro, COALESCE(pv.nome, 'Treino') AS origem
          FROM recorde r
          LEFT JOIN prova pv ON pv.id_prova = r.id_prova
         WHERE r.id_corredor = $1
         ORDER BY r.distancia_km`,
      buscar: `SELECT * FROM recorde WHERE id_recorde = $1`,
      inserir: `
        INSERT INTO recorde (id_corredor, id_prova, distancia_km, melhor_tempo_seg, data_registro)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id_recorde`,
      atualizar: `
        UPDATE recorde
           SET id_prova = $2, distancia_km = $3, melhor_tempo_seg = $4, data_registro = $5
         WHERE id_recorde = $1`,
      excluir: `DELETE FROM recorde WHERE id_recorde = $1`,
    },
  },
};

// ---------------------------------------------------------------------
// Leitura de um campo do formulário
// ---------------------------------------------------------------------

async function lerCampo(campo, ctx, valorAtual) {
  const padrao = valorAtual !== undefined && valorAtual !== null ? valorAtual : campo.padrao;

  if (campo.tipo === 'fk') {
    const parametros = campo.escopoCorredor ? [ctx.corredorId] : [];
    return ui.escolher(campo.rotulo, await consultar(campo.opcoes, parametros), {
      permitirVazio: campo.opcional,
    });
  }

  for (;;) {
    let bruto;
    if (campo.tipo === 'bool') {
      bruto = await ui.perguntar(`${campo.rotulo} (s/n)`, padrao ? 's' : 'n');
      return bruto.toLowerCase().startsWith('s');
    }
    if (campo.tipo === 'opcao') {
      bruto = await ui.perguntar(`${campo.rotulo} [${campo.opcoes.join('/')}]`, padrao ?? '');
      if (bruto === '' && !campo.req) {
        return null;
      }
      const achado = campo.opcoes.find((o) => o.toLowerCase() === bruto.toLowerCase());
      if (achado) {
        return achado;
      }
      ui.aviso('Valor fora da lista.');
      continue;
    }

    const padraoExibido =
      campo.tipo === 'tempo' && typeof padrao === 'number' ? ui.segParaRelogio(padrao) : padrao;
    bruto = await ui.perguntar(campo.rotulo, padraoExibido ?? '');

    if (bruto === '') {
      if (campo.req) {
        ui.aviso('Campo obrigatório.');
        continue;
      }
      return null;
    }
    if (campo.tipo === 'numero' || campo.tipo === 'inteiro') {
      const n = Number(bruto.replace(',', '.'));
      if (Number.isNaN(n)) {
        ui.aviso('Informe um número.');
        continue;
      }
      return campo.tipo === 'inteiro' ? Math.round(n) : n;
    }
    if (campo.tipo === 'tempo') {
      const seg = ui.relogioParaSeg(bruto);
      if (seg === null || seg <= 0) {
        ui.aviso('Use mm:ss ou hh:mm:ss.');
        continue;
      }
      return seg;
    }
    if (campo.tipo === 'data') {
      const iso = normalizarData(bruto);
      if (!iso) {
        ui.aviso('Use DD/MM/AAAA ou AAAA-MM-DD.');
        continue;
      }
      return iso;
    }
    return bruto;
  }
}

/** Aceita DD/MM/AAAA e AAAA-MM-DD, devolvendo sempre AAAA-MM-DD. */
export function normalizarData(texto) {
  const limpo = texto.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(limpo)) {
    return limpo;
  }
  const achado = limpo.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (achado) {
    return `${achado[3]}-${achado[2].padStart(2, '0')}-${achado[1].padStart(2, '0')}`;
  }
  return null;
}

// ---------------------------------------------------------------------
// Operações
// ---------------------------------------------------------------------

async function listar(ctx, entidade) {
  const parametros = entidade.escopoCorredor ? [ctx.corredorId] : [];
  ui.tabela(await consultar(entidade.sql.listar, parametros), {
    vazio: 'Nada cadastrado ainda.',
  });
}

/**
 * Mostra a lista numerada e devolve o id do item escolhido — quem usa o
 * sistema escolhe pela posição ("o 3"), não digitando uma chave primária.
 */
async function selecionarRegistro(ctx, entidade, rotulo = 'Qual deles?') {
  const parametros = entidade.escopoCorredor ? [ctx.corredorId] : [];
  const linhas = await consultar(entidade.sql.listar, parametros);
  if (linhas.length === 0) {
    ui.info('Nada cadastrado ainda.');
    return null;
  }
  const escolhida = await ui.escolherDaLista(linhas, rotulo);
  return escolhida ? Number(escolhida[entidade.id]) : null;
}

async function inserir(ctx, entidade) {
  ui.subtitulo(`Novo registro — ${entidade.titulo}`);
  const valores = [];
  for (const campo of entidade.campos) {
    valores.push(await lerCampo(campo, ctx, undefined));
  }
  const parametros = entidade.escopoCorredor ? [ctx.corredorId, ...valores] : valores;
  await consultarUm(entidade.sql.inserir, parametros);
  ui.sucesso('Pronto, adicionado.');
}

async function atualizar(ctx, entidade) {
  const id = await selecionarRegistro(ctx, entidade, 'Qual você quer editar?');
  if (id === null) {
    return;
  }
  const atual = await consultarUm(entidade.sql.buscar, [id]);
  ui.subtitulo('Deixe em branco (Enter) para manter o valor atual');

  const valores = [];
  for (const campo of entidade.campos) {
    if (campo.soInsercao) {
      continue;
    }
    valores.push(await lerCampo(campo, ctx, atual[campo.chave]));
  }
  await executar(entidade.sql.atualizar, [id, ...valores]);
  ui.sucesso('Alterações salvas.');
}

async function excluir(ctx, entidade) {
  const id = await selecionarRegistro(ctx, entidade, 'Qual você quer excluir?');
  if (id === null) {
    return;
  }
  if (!(await ui.confirmar('Tem certeza? Isso não pode ser desfeito.'))) {
    return;
  }
  try {
    await executar(entidade.sql.excluir, [id]);
    ui.sucesso('Excluído.');
  } catch (e) {
    // Violação de chave estrangeira com ON DELETE RESTRICT chega aqui.
    ui.erro(traduzirErro(e));
  }
}

/** Mensagens de erro do PostgreSQL em português. */
export function traduzirErro(e) {
  switch (e.code) {
    case '23505':
      return 'Já existe um registro com esse valor — ele precisa ser único.';
    case '23503':
      return 'Existem registros dependentes — remova-os antes ou ajuste o vínculo.';
    case '23514':
      return 'Algum valor está fora do permitido.';
    case '23502':
      return `O campo "${e.column}" é obrigatório.`;
    default:
      return e.message;
  }
}

// ---------------------------------------------------------------------
// Menus
// ---------------------------------------------------------------------

export async function menuEntidade(ctx, chave) {
  const entidade = ENTIDADES[chave];
  for (;;) {
    ui.titulo(entidade.titulo);
    const opcoes = [
      { valor: 'listar', rotulo: 'Ver todos' },
      { valor: 'inserir', rotulo: 'Adicionar' },
      { valor: 'atualizar', rotulo: 'Editar' },
      { valor: 'excluir', rotulo: 'Excluir' },
      ...(entidade.extras ?? []).map((e, i) => ({ valor: `extra:${i}`, rotulo: e.rotulo })),
    ];
    const escolha = await ui.menu('O que você quer fazer?', opcoes);
    if (escolha === null) {
      return;
    }

    try {
      if (escolha === 'listar') {
        await listar(ctx, entidade);
      } else if (escolha === 'inserir') {
        await inserir(ctx, entidade);
      } else if (escolha === 'atualizar') {
        await atualizar(ctx, entidade);
      } else if (escolha === 'excluir') {
        await excluir(ctx, entidade);
      } else if (escolha.startsWith('extra:')) {
        await entidade.extras[Number(escolha.split(':')[1])].executar(ctx, entidade);
      }
    } catch (e) {
      ui.erro(traduzirErro(e));
    }
    await ui.pausar();
  }
}

export async function menuCadastros(ctx) {
  for (;;) {
    ui.titulo('Meus cadastros');
    const escolha = await ui.menu(
      'O que você quer gerenciar?',
      Object.entries(ENTIDADES)
        .filter(([chave]) => chave !== 'corredor') // o perfil fica em "Minha conta"
        .map(([chave, e]) => ({ valor: chave, rotulo: e.titulo })),
    );
    if (escolha === null) {
      return;
    }
    await menuEntidade(ctx, escolha);
  }
}

export { selecionarRegistro };
