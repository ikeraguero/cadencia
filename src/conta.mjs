import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { consultar, consultarUm, executar } from './db.mjs';
import { ENTIDADES, normalizarData, traduzirErro } from './crud.mjs';
import * as ui from './ui.mjs';

const SQL = ENTIDADES.corredor.sql;

const POR_EMAIL = `
  SELECT id_corredor, nome, email, senha_hash
    FROM corredor
   WHERE LOWER(email) = LOWER($1)`;

const CRIAR_CONTA = `
  INSERT INTO corredor (nome, email, senha_hash)
  VALUES ($1, $2, $3)
  RETURNING id_corredor, nome`;

const TROCAR_SENHA = `UPDATE corredor SET senha_hash = $2 WHERE id_corredor = $1`;

export function gerarHash(senha) {
  const sal = randomBytes(16).toString('hex');
  return `scrypt:${sal}:${scryptSync(senha, sal, 32).toString('hex')}`;
}

export function conferirSenha(senha, guardado) {
  const [algoritmo, sal, esperado] = String(guardado ?? '').split(':');
  if (algoritmo !== 'scrypt' || !sal || !esperado) {
    return false;
  }
  const calculado = scryptSync(senha, sal, 32);
  const alvo = Buffer.from(esperado, 'hex');
  return calculado.length === alvo.length && timingSafeEqual(calculado, alvo);
}

/** Tela de abertura. Devolve { corredorId, corredorNome } ou null se sair. */
export async function entrar() {
  for (;;) {
    console.log();
    console.log('   ' + ui.cor.negrito('Bem-vindo ao Cadência'));
    console.log('   ' + ui.cor.fraco('Seu diário de treinos de corrida'));

    const escolha = await ui.menu(
      'Como deseja continuar?',
      [
        { valor: 'entrar', rotulo: 'Já tenho conta — entrar' },
        { valor: 'criar', rotulo: 'Criar uma conta' },
      ],
      'Sair',
    );
    if (escolha === null) {
      return null;
    }

    const acesso = escolha === 'entrar' ? await autenticar() : await criarConta();
    if (acesso) {
      return acesso;
    }
  }
}

async function autenticar() {
  ui.subtitulo('Entrar');
  const email = await ui.perguntar('E-mail');
  if (!email) {
    return null;
  }
  const senha = await ui.perguntarSenha('Senha');

  const corredor = await consultarUm(POR_EMAIL, [email]);
  if (!corredor || !conferirSenha(senha, corredor.senha_hash)) {
    ui.erro('E-mail ou senha incorretos.');
    return null;
  }
  ui.sucesso(`Olá, ${corredor.nome.split(' ')[0]}!`);
  return { corredorId: corredor.id_corredor, corredorNome: corredor.nome };
}

async function criarConta() {
  ui.subtitulo('Criar conta');
  const nome = await ui.perguntar('Seu nome');
  if (!nome) {
    return null;
  }
  const email = await ui.perguntar('Seu e-mail');
  if (!email.includes('@')) {
    ui.erro('E-mail inválido.');
    return null;
  }
  const senha = await ui.perguntarSenha('Escolha uma senha');
  if (senha.length < 4) {
    ui.erro('A senha precisa de ao menos 4 caracteres.');
    return null;
  }
  const repetida = await ui.perguntarSenha('Repita a senha');
  if (senha !== repetida) {
    ui.erro('As senhas não coincidem.');
    return null;
  }

  try {
    const criado = await consultarUm(CRIAR_CONTA, [nome, email, gerarHash(senha)]);
    ui.sucesso(`Conta criada. Boas corridas, ${criado.nome.split(' ')[0]}!`);
    ui.info('Comece cadastrando seus percursos e seu tênis em "Meus cadastros".');
    return { corredorId: criado.id_corredor, corredorNome: criado.nome };
  } catch (e) {
    ui.erro(e.code === '23505' ? 'Já existe uma conta com esse e-mail.' : traduzirErro(e));
    return null;
  }
}

/** Menu "Minha conta" — cobre o CRUD da tabela corredor em linguagem de usuário. */
export async function menuConta(ctx) {
  const entidade = ENTIDADES['corredor'];
  for (;;) {
    ui.titulo('Minha conta');
    const escolha = await ui.menu('O que você quer fazer?', [
      { valor: 'ver', rotulo: 'Ver meus dados' },
      { valor: 'editar', rotulo: 'Editar meus dados e minha meta' },
      { valor: 'senha', rotulo: 'Trocar minha senha' },
      { valor: 'outros', rotulo: 'Ver outros corredores' },
      { valor: 'apagar', rotulo: 'Apagar minha conta' },
    ]);
    if (escolha === null) {
      return 'voltar';
    }

    try {
      if (escolha === 'ver') {
        // O hash só serve para conferir a senha; não é dado para exibir.
        const { senha_hash, ...eu } = await consultarUm(SQL.buscar, [ctx.corredorId]);
        ui.tabela([eu]);
      } else if (escolha === 'editar') {
        await editarPerfil(ctx, entidade);
      } else if (escolha === 'senha') {
        await trocarSenha(ctx);
      } else if (escolha === 'outros') {
        ui.tabela(await consultar(SQL.listar));
      } else if (escolha === 'apagar') {
        if (await apagarConta(ctx)) {
          return 'sair';
        }
      }
    } catch (e) {
      ui.erro(traduzirErro(e));
    }
    await ui.pausar();
  }
}

async function editarPerfil(ctx, entidade) {
  const atual = await consultarUm(SQL.buscar, [ctx.corredorId]);
  ui.subtitulo('Deixe em branco (Enter) para manter o valor atual');
  
  const nome = await ui.perguntar('Nome', atual.nome);
  const email = await ui.perguntar('E-mail', atual.email);
  const sexo = await ui.perguntar('Sexo (M/F/O)', atual.sexo ?? '');
  const nascimento = await ui.perguntar('Nascimento (DD/MM/AAAA)', atual.data_nascimento ?? '');
  ui.info('Sua meta: a distância que você quer correr e em quanto tempo.');
  const metaKm = await ui.perguntar('Meta — distância em km', atual.meta_distancia_km ?? '');
  const metaTempo = await ui.perguntar(
    'Meta — tempo (hh:mm:ss)',
    atual.meta_tempo_seg ? ui.segParaRelogio(atual.meta_tempo_seg) : '',
  );

  await executar(SQL.atualizar, [
    ctx.corredorId,
    nome,
    email,
    sexo ? sexo.toUpperCase() : null,
    nascimento ? normalizarData(nascimento) : null,
    metaKm ? Number(String(metaKm).replace(',', '.')) : null,
    metaTempo ? ui.relogioParaSeg(metaTempo) : null,
  ]);
  ctx.corredorNome = nome;
  ui.sucesso('Dados atualizados.');
}

async function trocarSenha(ctx) {
  const eu = await consultarUm(SQL.buscar, [ctx.corredorId]);
  const atual = await ui.perguntarSenha('Senha atual');
  if (!conferirSenha(atual, eu.senha_hash)) {
    ui.erro('Senha atual incorreta.');
    return;
  }
  const nova = await ui.perguntarSenha('Nova senha');
  if (nova.length < 4) {
    ui.erro('A senha precisa de ao menos 4 caracteres.');
    return;
  }
  if (nova !== (await ui.perguntarSenha('Repita a nova senha'))) {
    ui.erro('As senhas não coincidem.');
    return;
  }
  await executar(TROCAR_SENHA, [ctx.corredorId, gerarHash(nova)]);
  ui.sucesso('Senha alterada.');
}

async function apagarConta(ctx) {
  ui.aviso('Isso apaga também seus treinos, planos, percursos, equipamentos e inscrições.');
  if (!(await ui.confirmar('Apagar a conta definitivamente?'))) {
    return false;
  }
  const confirmacao = await ui.perguntar('Digite APAGAR para confirmar');
  if (confirmacao !== 'APAGAR') {
    ui.info('Cancelado.');
    return false;
  }
  await executar(SQL.excluir, [ctx.corredorId]);
  ui.sucesso('Conta apagada.');
  return true;
}
