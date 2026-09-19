import { executarArquivo, pool } from './db.mjs';
import { menuCadastros, traduzirErro } from './crud.mjs';
import { entrar, menuConta } from './conta.mjs';
import { mostrarInicio } from './inicio.mjs';
import { menuCronograma, menuInscricoes, menuTreinos } from './processos.mjs';
import { menuRelatorios } from './relatorios.mjs';
import * as ui from './ui.mjs';

const ctx = { corredorId: null, corredorNome: null };

/** Recria o banco do zero: schema, carga e views. */
async function recarregarBanco() {
  ui.titulo('Recarregar banco');
  ui.aviso('Isto APAGA todos os dados e recria o esquema a partir de sql/.');
  if (!(await ui.confirmar('Continuar?'))) {
    return false;
  }
  for (const arquivo of ['01_schema.sql', '02_carga.sql', '03_views.sql']) {
    await executarArquivo(arquivo);
    ui.info(`${arquivo} executado.`);
  }
  ui.sucesso('Banco recarregado. É preciso entrar de novo.');
  return true;
}

async function principal() {
  ui.titulo('Cadência · diário de treinos de corrida');

  try {
    await pool.query('SELECT 1');
  } catch (e) {
    ui.erro(`Não foi possível conectar ao banco: ${e.message}`);
    ui.info('Rode ./iniciar.sh, que prepara tudo, ou confira o arquivo .env.');
    ui.fecharLeitor();
    await pool.end();
    return;
  }

  const acesso = await entrar();
  if (!acesso) {
    await despedir();
    return;
  }
  Object.assign(ctx, acesso);

  await mostrarInicio(ctx);

  for (;;) {
    const escolha = await ui.menu(
      'O que você quer fazer?',
      [
        { valor: 'inicio', rotulo: 'Início — como estou esta semana' },
        { valor: 'treinos', rotulo: 'Meus treinos — registrar e consultar' },
        { valor: 'cronograma', rotulo: 'Meu cronograma — o que tenho para fazer' },
        { valor: 'provas', rotulo: 'Minhas provas — inscrições e resultados' },
        { valor: 'desempenho', rotulo: 'Meu desempenho — relatórios' },
        { valor: 'cadastros', rotulo: 'Meus cadastros — percursos, tênis, planos' },
        { valor: 'conta', rotulo: 'Minha conta' },
        { valor: 'recarregar', rotulo: 'Recomeçar com os dados de exemplo' },
      ],
      'Sair',
    );

    if (escolha === null) {
      break;
    }

    try {
      if (escolha === 'inicio') {
        await mostrarInicio(ctx);
      } else if (escolha === 'treinos') {
        await menuTreinos(ctx);
      } else if (escolha === 'cronograma') {
        await menuCronograma(ctx);
      } else if (escolha === 'provas') {
        await menuInscricoes(ctx);
      } else if (escolha === 'desempenho') {
        await menuRelatorios(ctx);
      } else if (escolha === 'cadastros') {
        await menuCadastros(ctx);
      } else if (escolha === 'conta') {
        if ((await menuConta(ctx)) === 'sair') {
          break;
        }
      } else if (escolha === 'recarregar') {
        if (await recarregarBanco()) {
          break;
        }
      }
    } catch (e) {
      ui.erro(traduzirErro(e));
      await ui.pausar();
    }
  }

  await despedir();
}

async function despedir() {
  console.log('\n   ' + ui.cor.azul('Até a próxima corrida.') + '\n');
  ui.fecharLeitor();
  await pool.end();
}

principal().catch(async (e) => {
  ui.erro(e.stack ?? e.message);
  ui.fecharLeitor();
  await pool.end();
  process.exit(1);
});
