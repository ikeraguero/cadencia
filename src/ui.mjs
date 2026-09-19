import { createInterface } from 'node:readline';
import { stdin, stdout } from 'node:process';

const leitor = createInterface({ input: stdin, output: stdout, terminal: stdin.isTTY });

const linhasPendentes = [];
const leitoresEmEspera = [];
let entradaEncerrada = false;

leitor.on('line', (linha) => {
  const proximo = leitoresEmEspera.shift();
  if (proximo) {
    proximo(linha);
  } else {
    linhasPendentes.push(linha);
  }
});

leitor.on('close', () => {
  entradaEncerrada = true;
  while (leitoresEmEspera.length > 0) {
    leitoresEmEspera.shift()(null);
  }
});

function lerLinha() {
  if (linhasPendentes.length > 0) {
    return Promise.resolve(linhasPendentes.shift());
  }
  if (entradaEncerrada) {
    return Promise.resolve(null);
  }
  return new Promise((resolver) => leitoresEmEspera.push(resolver));
}

async function pedir(prompt) {
  stdout.write(prompt);
  const linha = await lerLinha();
  if (linha === null) {
    stdout.write('\n');
    return null;
  }
  if (!stdin.isTTY) {
    stdout.write(linha + '\n');
  }
  return linha;
}

export function fecharLeitor() {
  leitor.close();
}

// ---------------------------------------------------------------------
// Cores
// ---------------------------------------------------------------------

const COR_ATIVA = process.stdout.isTTY && process.env['NO_COLOR'] === undefined;
const c = (codigo) => (texto) => (COR_ATIVA ? `\u001b[${codigo}m${texto}\u001b[0m` : String(texto));

export const cor = {
  negrito: c('1'),
  fraco: c('2'),
  verde: c('32'),
  laranja: c('33'),
  vermelho: c('31'),
  azul: c('36'),
  inverso: c('7'),
};

const ROTULOS = {
  // pessoas
  nome: 'Nome', email: 'E-mail', sexo: 'Sexo', idade: 'Idade',
  data_nascimento: 'Nascimento', contato: 'Contato', cref: 'CREF',
  assessoria: 'Assessoria', especialidade: 'Especialidade',
  meta_distancia_km: 'Meta', meta_tempo_seg: 'Tempo-alvo',
  // percursos
  percurso: 'Percurso', terreno: 'Piso', ganho_elevacao_m: 'Subida',
  cidade: 'Cidade', referencia: 'Partida',
  // equipamentos
  equipamento: 'Equipamento', tipo: 'Tipo', marca: 'Marca', modelo: 'Modelo',
  vida_util_km: 'Dura até', km_acumulados: 'Já rodou', desgaste_pct: 'Uso',
  km_restantes: 'Restam', treinos_realizados: 'Treinos', ultimo_uso: 'Último uso',
  situacao: 'Situação', data_aquisicao: 'Comprado em', km_atribuidos: 'Distância',
  // treinos e planos
  plano: 'Plano', treinador: 'Treinador', objetivo: 'Objetivo',
  data_inicio: 'Começa', data_fim: 'Termina', treinos: 'Treinos',
  treinos_planejados: 'Planejados', tipo_treino: 'Treino', intensidade: 'Intensidade',
  descricao: 'Descrição', observacao: 'Anotação', origem: 'Origem',
  data_treino: 'Data', data_planejada: 'Data', distancia_km: 'Distância',
  duracao_seg: 'Tempo', pace_medio_seg: 'Ritmo', pace_seg: 'Ritmo',
  pace_alvo_seg: 'Ritmo-alvo', distancia_alvo_km: 'Meta do dia',
  km_realizado: 'Feito', km_previsto: 'Previsto', percepcao_esforco: 'Esforço',
  esforco_medio: 'Esforço', equipamentos: 'Equipamentos', status: 'Situação',
  // provas
  prova: 'Prova', data_prova: 'Data', local: 'Local', organizador: 'Organizador',
  inscritos: 'Inscritos', numero_peito: 'Peito', categoria: 'Categoria',
  valor_pago: 'Valor', tempo_liquido_seg: 'Tempo', colocacao_geral: 'Lugar',
  colocacao_categoria: 'Lugar na categoria', plano_preparacao: 'Preparação',
  km_preparacao: 'Treinado', recorde_distancia_seg: 'Recorde',
  diferenca_recorde_seg: 'Diferença', e_recorde: 'É recorde',
  melhor_tempo_seg: 'Melhor tempo', data_registro: 'Quando', ativo: 'Ativo',
  // relatórios
  prescritas: 'Previstas', cumpridas: 'Feitas', perdidas: 'Perdidas',
  aderencia_pct: 'Cumprimento', volume_pct: 'Volume', alerta: 'Aviso',
  km_periodo: 'No período', treinos_periodo: 'Treinos', km_total: 'Total',
  vezes_utilizado: 'Vezes', melhor_pace_seg: 'Melhor ritmo',
  tipos_praticados: 'Tipos de treino',
};

export function rotuloColuna(coluna) {
  return ROTULOS[coluna] ?? coluna.replace(/_/g, ' ');
}

export function barra(pct, largura = 14) {
  const cheio = Math.max(0, Math.min(largura, Math.round((Number(pct) / 100) * largura)));
  const desenho = '█'.repeat(cheio) + '░'.repeat(largura - cheio);
  if (pct >= 100) return cor.vermelho(desenho);
  if (pct >= 80) return cor.laranja(desenho);
  return cor.verde(desenho);
}

// ---------------------------------------------------------------------
// Saída
// ---------------------------------------------------------------------

const LARGURA = 78;

export function titulo(texto) {
  // Toda troca de tela começa por aqui — limpa o terminal para que a tela
  // anterior não fique empilhada abaixo, como se houvesse só uma interface.
  // Sem terminal (saída redirecionada/roteiro automatizado), console.clear()
  // não faz nada, então isso não afeta scripts nem o texto capturado.
  console.clear();
  console.log('\n' + cor.azul('═'.repeat(LARGURA)));
  console.log('  ' + cor.negrito(texto.toUpperCase()));
  console.log(cor.azul('═'.repeat(LARGURA)));
}

export function subtitulo(texto) {
  console.log('\n── ' + texto + ' ' + '─'.repeat(Math.max(0, LARGURA - texto.length - 4)));
}

export function info(texto) {
  console.log('   ' + texto);
}

export function sucesso(texto) {
  console.log('\n  ' + cor.verde('✔') + ' ' + texto);
}

export function erro(texto) {
  console.log('\n  ' + cor.vermelho('✖') + ' ' + texto);
}

export function aviso(texto) {
  console.log('  ' + cor.laranja('!') + ' ' + texto);
}

// ---------------------------------------------------------------------
// Formatação de valores
// ---------------------------------------------------------------------

export function segParaRelogio(segundos) {
  const s = Math.max(0, Math.round(Number(segundos)));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const seg = s % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(seg).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function relogioParaSeg(texto) {
  const limpo = (texto ?? '').trim();
  if (limpo === '') {
    return null;
  }
  const partes = limpo.split(':').map(Number);
  if (partes.some((n) => Number.isNaN(n) || n < 0)) {
    return null;
  }
  return partes.reduce((acc, parte) => acc * 60 + parte, 0);
}

export function paceParaTexto(segundos) {
  const s = Math.round(Number(segundos));
  if (!s || s <= 0) {
    return '—';
  }
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function dataBr(valor) {
  if (!valor) {
    return '—';
  }
  const texto = String(valor).slice(0, 10);
  const [a, m, d] = texto.split('-');
  return d ? `${d}/${m}/${a}` : texto;
}

function formatarCelula(coluna, valor) {
  if (valor === null || valor === undefined) {
    return '—';
  }
  if (typeof valor === 'boolean') {
    return valor ? 'Sim' : 'Não';
  }
  if (/pace/.test(coluna) && /_seg$/.test(coluna)) {
    return paceParaTexto(valor);
  }
  if (/_seg$/.test(coluna)) {
    const n = Number(valor);
    // Diferenças podem ser negativas: mostra com sinal.
    return n < 0 ? '-' + segParaRelogio(-n) : segParaRelogio(n);
  }
  if (/^data_|_uso$|_registro$|_aquisicao$|_inicio$|_fim$|^ultimo_/.test(coluna)) {
    return dataBr(valor);
  }
  if (/_pct$/.test(coluna)) {
    return numeroBr(valor, 0) + '%';
  }
  if (/^valor_/.test(coluna)) {
    return 'R$ ' + numeroBr(valor, 2, false);
  }
  if (/^km_|_km$/.test(coluna)) {
    // Quilometragem: até duas casas, sem zeros à toa (14 km, não 14,00 km).
    return numeroBr(valor, 2);
  }
  if (typeof valor === 'number' || /^-?\d+\.\d+$/.test(String(valor))) {
    return numeroBr(valor, 2);
  }
  return String(valor);
}

export function numeroBr(valor, casas = 2, aparar = true) {
  const n = Number(valor);
  if (Number.isNaN(n)) {
    return String(valor);
  }
  let texto = n.toFixed(casas);
  if (aparar && casas > 0 && texto.includes('.')) {
    texto = texto.replace(/\.?0+$/, '');
  }
  return texto.replace('.', ',');
}

const largura = (texto) => [...String(texto)].length;

export function tabela(linhas, { vazio = 'Nenhum registro encontrado.', numerada = false } = {}) {
  if (!linhas || linhas.length === 0) {
    console.log('\n   ' + cor.fraco(vazio));
    return;
  }
  let colunas = Object.keys(linhas[0]);
  const semChaves = colunas.filter((c) => !/^id_/.test(c));
  if (semChaves.length > 0) {
    colunas = semChaves;
  }
  const cabecalhos = colunas.map(rotuloColuna);
  const celulas = linhas.map((linha) => colunas.map((c) => formatarCelula(c, linha[c])));

  if (numerada) {
    cabecalhos.unshift('#');
    celulas.forEach((linha, i) => linha.unshift(String(i + 1)));
    colunas = ['#', ...colunas];
  }

  const larguras = colunas.map((_, i) =>
    Math.max(largura(cabecalhos[i]), ...celulas.map((linha) => largura(linha[i]))),
  );

  const aDireita = colunas.map((_, i) =>
    celulas.every((linha) => /^(R\$ )?[-—\d.,:%]*$/.test(linha[i])),
  );

  const alinhar = (texto, i) => {
    const preencher = ' '.repeat(Math.max(0, larguras[i] - largura(texto)));
    return aDireita[i] ? preencher + texto : texto + preencher;
  };

  console.log();
  console.log('   ' + cor.negrito(cabecalhos.map((h, i) => alinhar(h.toUpperCase(), i)).join('  ')));
  console.log('   ' + cor.fraco(larguras.map((l) => '─'.repeat(l)).join('  ')));
  for (const linha of celulas) {
    console.log('   ' + linha.map(alinhar).join('  '));
  }
  console.log(cor.fraco(`\n   ${linhas.length} ${linhas.length === 1 ? 'item' : 'itens'}.`));
}

export async function escolherDaLista(linhas, rotulo, opcoes = {}) {
  tabela(linhas, { ...opcoes, numerada: true });
  if (!linhas || linhas.length === 0) {
    return null;
  }
  for (;;) {
    const bruto = await perguntar(`${rotulo} (1–${linhas.length}, ou 0 para voltar)`, '0');
    const n = Number(bruto);
    if (n === 0) {
      return null;
    }
    if (Number.isInteger(n) && n >= 1 && n <= linhas.length) {
      return linhas[n - 1];
    }
    aviso('Número fora da lista.');
  }
}

// ---------------------------------------------------------------------
// Entrada
// ---------------------------------------------------------------------

export async function perguntar(rotulo, padrao = '') {
  const sufixo = padrao !== '' && padrao !== null ? ` [${padrao}]` : '';
  const resposta = (await pedir(`   ${rotulo}${sufixo}: `))?.trim() ?? '';
  return resposta === '' ? String(padrao ?? '') : resposta;
}

export async function perguntarSenha(rotulo) {
  stdout.write(`   ${rotulo}: `);
  const ecoOriginal = leitor._writeToOutput;
  if (stdin.isTTY) {
    leitor._writeToOutput = () => {};
  }
  try {
    const linha = await lerLinha();
    return (linha ?? '').trim();
  } finally {
    leitor._writeToOutput = ecoOriginal;
    stdout.write('\n');
  }
}

export async function pausar() {
  await pedir('\n   <Enter> para continuar ');
}

export async function confirmar(rotulo) {
  const resposta = (await pedir(`   ${rotulo} (s/N): `))?.trim().toLowerCase() ?? '';
  return resposta === 's' || resposta === 'sim';
}

export async function menu(cabecalho, opcoes, rotuloSaida = 'Voltar') {
  for (;;) {
    subtitulo(cabecalho);
    opcoes.forEach((o, i) => console.log(`   ${String(i + 1).padStart(2)}. ${o.rotulo}`));
    console.log(`    0. ${rotuloSaida}`);
    const bruto = await pedir('\n   > ');
    if (bruto === null) {
      return null;
    }
    const escolha = bruto.trim();
    if (escolha === '0' || escolha === '') {
      return null;
    }
    const indice = Number(escolha) - 1;
    if (Number.isInteger(indice) && indice >= 0 && indice < opcoes.length) {
      return opcoes[indice].valor;
    }
    aviso('Opção inválida.');
  }
}

export async function escolher(cabecalho, linhas, { permitirVazio = false } = {}) {
  if (linhas.length === 0) {
    aviso('Nenhuma opção disponível.');
    return null;
  }
  const opcoes = linhas.map((l) => ({ valor: l.id, rotulo: l.rotulo }));
  const escolha = await menu(cabecalho, opcoes, permitirVazio ? 'Nenhum' : 'Cancelar');
  return escolha;
}
