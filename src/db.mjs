/**
 * Conexão com o PostgreSQL.
 *
 * Este módulo não conhece nenhuma consulta: ele só abre a conexão e executa o
 * SQL que recebe. As instruções ficam escritas por extenso nos módulos que as
 * usam, ao lado do código que as chama.
 *
 * Os únicos arquivos .sql que sobraram são os três scripts de banco
 * (esquema, carga e views), que rodam inteiros de uma vez.
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
export const DIR_SQL = join(RAIZ, 'sql');

// Lê o .env, quando existe, sem depender de biblioteca externa.
const arquivoEnv = join(RAIZ, '.env');
if (existsSync(arquivoEnv)) {
  for (const linha of readFileSync(arquivoEnv, 'utf8').split('\n')) {
    const achado = linha.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (achado && !process.env[achado[1]]) {
      process.env[achado[1]] = achado[2].replace(/^["']|["']$/g, '');
    }
  }
}

pg.types.setTypeParser(1082, (valor) => valor);

export const pool = new pg.Pool({
  host: process.env['PGHOST'] ?? 'localhost',
  port: Number(process.env['PGPORT'] ?? 5432),
  user: process.env['PGUSER'] ?? 'cadencia',
  password: process.env['PGPASSWORD'] ?? 'cadencia',
  database: process.env['PGDATABASE'] ?? 'cadencia',
});

/** Executa o SQL e devolve as linhas. */
export async function consultar(sql, parametros = [], cliente = pool) {
  const { rows } = await cliente.query(sql, parametros);
  return rows;
}

/** Executa o SQL e devolve só a primeira linha (ou null). */
export async function consultarUm(sql, parametros = [], cliente = pool) {
  const { rows } = await cliente.query(sql, parametros);
  return rows[0] ?? null;
}

/** Executa o SQL e devolve quantas linhas foram afetadas. */
export async function executar(sql, parametros = [], cliente = pool) {
  const { rowCount } = await cliente.query(sql, parametros);
  return rowCount;
}

/**
 * Roda `corpo` dentro de uma transação, passando a conexão dedicada.
 * Qualquer exceção desfaz tudo — é o que garante a atomicidade dos
 * processos de negócio.
 */
export async function emTransacao(corpo) {
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');
    const retorno = await corpo(cliente);
    await cliente.query('COMMIT');
    return retorno;
  } catch (erro) {
    await cliente.query('ROLLBACK');
    throw erro;
  } finally {
    cliente.release();
  }
}

/** Executa um arquivo .sql inteiro (esquema, carga e views). */
export async function executarArquivo(nomeArquivo) {
  await pool.query(readFileSync(join(DIR_SQL, nomeArquivo), 'utf8'));
}
