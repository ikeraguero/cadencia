#!/usr/bin/env node
/**
 * Utilitário de banco: cria o esquema, carrega os dados, gera e restaura
 * o backup.
 *
 *   node scripts/banco.mjs status      -> pronto | vazio | sem-esquema | sem-conexao
 *   node scripts/banco.mjs criar       -> executa schema + carga + views
 *   node scripts/banco.mjs carregar    -> só recarrega os dados (02_carga.sql)
 *   node scripts/banco.mjs backup      -> gera backup/cadencia_fase1.sql (pg_dump)
 *   node scripts/banco.mjs restaurar   -> aplica o backup no banco atual (psql)
 *
 * backup e restaurar dependem do pg_dump/psql instalados; criar e carregar
 * usam apenas a biblioteca pg.
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { executarArquivo, pool } from '../src/db.mjs';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const DESTINO = join(RAIZ, 'backup', 'cadencia_fase1.sql');

const conexao = {
  host: process.env['PGHOST'] ?? 'localhost',
  port: process.env['PGPORT'] ?? '5432',
  user: process.env['PGUSER'] ?? 'cadencia',
  password: process.env['PGPASSWORD'] ?? 'cadencia',
  database: process.env['PGDATABASE'] ?? 'cadencia',
};

function rodarFerramenta(comando, argumentos) {
  const resultado = spawnSync(comando, argumentos, {
    stdio: 'inherit',
    env: { ...process.env, PGPASSWORD: conexao.password },
  });
  if (resultado.error) {
    throw new Error(`${comando} não encontrado. Instale o cliente do PostgreSQL.`);
  }
  if (resultado.status !== 0) {
    throw new Error(`${comando} terminou com código ${resultado.status}.`);
  }
}

const argumentosConexao = [
  '-h', conexao.host,
  '-p', String(conexao.port),
  '-U', conexao.user,
  '-d', conexao.database,
];

const acao = process.argv[2] ?? 'criar';

try {
  if (acao === 'criar') {
    for (const arquivo of ['01_schema.sql', '02_carga.sql', '03_views.sql']) {
      await executarArquivo(arquivo);
      console.log(`  ✔ sql/${arquivo}`);
    }
    console.log('\nBanco criado e carregado.');
  } else if (acao === 'status') {
    // Usado pelo iniciar.sh para decidir o que ainda falta fazer.
    // Imprime uma única palavra-chave; nunca falha.
    try {
      const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM corredor');
      console.log(rows[0].n > 0 ? 'pronto' : 'vazio');
    } catch (e) {
      console.log(e.code === '42P01' ? 'sem-esquema' : 'sem-conexao');
    }
  } else if (acao === 'carregar') {
    await executarArquivo('02_carga.sql');
    console.log('  ✔ sql/02_carga.sql\n\nDados recarregados.');
  } else if (acao === 'backup') {
    mkdirSync(dirname(DESTINO), { recursive: true });
    rodarFerramenta('pg_dump', [
      ...argumentosConexao,
      '--clean',
      '--if-exists',
      '--no-owner',
      '--no-privileges',
      '--file', DESTINO,
    ]);
    console.log(`\nBackup gravado em ${DESTINO}`);
  } else if (acao === 'restaurar') {
    rodarFerramenta('psql', [...argumentosConexao, '-v', 'ON_ERROR_STOP=1', '-f', DESTINO]);
    console.log('\nBackup restaurado.');
  } else {
    console.error(`Ação desconhecida: ${acao}`);
    console.error('Use: criar | carregar | backup | restaurar | status');
    process.exitCode = 1;
  }
} catch (e) {
  console.error(`\n  ✖ ${e.message}`);
  process.exitCode = 1;
} finally {
  await pool.end();
}
