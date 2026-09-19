# Cadência — Fase 1

Aplicação em **modo texto** sobre banco de dados **relacional (PostgreSQL)** para
o domínio *diário de treinos de corrida de rua*.

Todo o SQL do sistema é escrito à mão e fica visível: os três scripts de banco
em [`sql/`](sql/), e as consultas do dia a dia dentro dos módulos de
[`src/`](src/), escritas por extenso logo acima da chamada que as executa.
Nenhuma instrução é montada por concatenação — os valores entram sempre como
parâmetros posicionais (`$1`, `$2`, …).

- Modelo de dados e dicionário de dados: [`docs/dicionario-de-dados.md`](docs/dicionario-de-dados.md)
- Índice de todas as consultas: [`docs/consultas.md`](docs/consultas.md)
- Instalação em máquina zerada e roteiro de testes: [`docs/roteiro-de-demonstracao.md`](docs/roteiro-de-demonstracao.md)
- Esquema conceitual (imagem): [`docs/esquema-conceitual.png`](docs/esquema-conceitual.png) · [versão em notação MER, com losango em cada relacionamento](docs/esquema-conceitual-v2.png)
- Entidades, atributos e relacionamentos em texto: [`docs/entidades-e-relacionamentos.md`](docs/entidades-e-relacionamentos.md)
- Esquema lógico (imagem): [`docs/esquema-logico.png`](docs/esquema-logico.png)

---

## Início rápido

Com **Node.js** e **Docker** instalados, um comando faz tudo — sobe o banco,
instala as dependências, cria o esquema, carrega os dados e abre a aplicação:

```bash
./iniciar.sh
```

| Comando | O que faz |
|---------|-----------|
| `./iniciar.sh` | Prepara o que faltar e abre a aplicação |
| `./iniciar.sh --recriar` | Apaga e recria o banco (combina com as demais) |
| `./iniciar.sh --preparar` | Só prepara o ambiente, não abre a aplicação |
| `./iniciar.sh --psql` | Abre um `psql` já conectado ao banco |
| `./iniciar.sh --parar` | Encerra o contêiner do banco |
| `./iniciar.sh --ajuda` | Mostra a ajuda |

O script é idempotente: rodar de novo não refaz o que já está pronto. Ele
detecta se a porta 5432 está ocupada e, nesse caso, sobe o contêiner na 55432,
ajustando o `.env` sozinho. Sem Docker, ele usa o PostgreSQL instalado na
máquina e informa quais comandos rodar para criar o usuário e o banco.

As seções abaixo descrevem o mesmo processo passo a passo, para quem preferir
fazer à mão ou precisar diagnosticar algum problema.

---

## 1. Pré-requisitos

- **PostgreSQL 14 ou superior** (testado no 17)
- **Node.js 18 ou superior**

Confira com:

```bash
psql --version
node --version
```

---

## 2. Criar o banco e o usuário

Como superusuário do PostgreSQL (`postgres`):

```bash
sudo -u postgres psql
```

E dentro do `psql`:

```sql
CREATE USER cadencia WITH PASSWORD 'cadencia';
CREATE DATABASE cadencia OWNER cadencia;
\q
```

> **Alternativa com Docker**, se preferir não instalar o PostgreSQL — há um
> [`docker-compose.yml`](docker-compose.yml) pronto (`docker compose up -d`), ou:
> ```bash
> docker run -d --name cadencia-pg \
>   -e POSTGRES_USER=cadencia -e POSTGRES_PASSWORD=cadencia -e POSTGRES_DB=cadencia \
>   -p 5432:5432 postgres:17-alpine
> ```

---

## 3. Configurar a conexão

```bash
cp .env.example .env
```

Ajuste `.env` se a sua instalação usar outra porta, usuário ou senha:

```
PGHOST=localhost
PGPORT=5432
PGUSER=cadencia
PGPASSWORD=cadencia
PGDATABASE=cadencia
```

---

## 4. Instalar as dependências

```bash
npm install
```

A única dependência é o driver `pg`.

---

## 5. Criar o esquema e carregar os dados

```bash
npm run banco:criar
```

Isso executa, em ordem:

| Arquivo | O que faz |
|---------|-----------|
| [`sql/01_schema.sql`](sql/01_schema.sql) | Cria as 12 tabelas, chaves, restrições e índices |
| [`sql/02_carga.sql`](sql/02_carga.sql) | Insere os dados de exemplo |
| [`sql/03_views.sql`](sql/03_views.sql) | Cria as duas views de apoio |

O mesmo pode ser feito sem a aplicação:

```bash
psql -h localhost -U cadencia -d cadencia -f sql/01_schema.sql
psql -h localhost -U cadencia -d cadencia -f sql/02_carga.sql
psql -h localhost -U cadencia -d cadencia -f sql/03_views.sql
```

### Restaurar a partir do backup

O arquivo [`backup/cadencia_fase1.sql`](backup/cadencia_fase1.sql) é um dump
completo gerado por `pg_dump` (esquema + dados). Para restaurar:

```bash
npm run banco:restaurar
```

ou, diretamente:

```bash
psql -h localhost -U cadencia -d cadencia -f backup/cadencia_fase1.sql
```

Para gerar um backup novo a partir do estado atual do banco:

```bash
npm run banco:backup
```

---

## 6. Executar a aplicação

```bash
npm start
```

A aplicação abre pedindo com qual corredor entrar e mostra o menu principal:

```
══════════════════════════════════════════════════════════════════════════════
  MENU PRINCIPAL — IKER AGUERO
══════════════════════════════════════════════════════════════════════════════

── O que deseja fazer? ───────────────────────────────────────────────────────
    1. Cadastros (CRUD das entidades)
    2. Treinos — registrar, listar, remover
    3. Cronograma — montar e acompanhar treinos planejados
    4. Provas — inscrever e registrar resultado
    5. Relatórios
    6. Ver o SQL do projeto
    7. Trocar de corredor
    8. Recarregar banco (schema + carga)
    0. Sair
```

A opção **6 — Ver o SQL do projeto** percorre todos os arquivos `.sql` e mostra
qualquer consulta na tela, numerada. Cada submenu de processo também tem a sua
própria opção *"Ver o SQL deste processo"*.

### Executar com um roteiro pronto

A entrada pode vir de um arquivo, o que é útil para demonstrar o sistema sem
digitar. Por exemplo, para abrir os quatro relatórios:

```bash
printf '1\n5\n5\n\n\n\n0\n0\n' | npm start
```

---

## 7. O que a aplicação faz

### CRUD das tabelas de entidade (menu 1)

Cadastro, consulta, atualização e remoção de: **corredor, treinador, tipo de
treino, percurso, equipamento, plano, prova** e **recorde**.

### Processos de negócio sobre as tabelas associativas

| Processo | Menu | Tabelas envolvidas | O que faz em uma transação |
|----------|------|--------------------|-----------------------------|
| Registrar treino | 2 → 1 | `treino`, `treino_equipamento`, `treino_planejado`, `recorde` | Grava o treino ligando corredor, plano, percurso e treino planejado; cria os vínculos de equipamento; marca o treino planejado como cumprida; promove a marca a recorde pessoal quando for melhor; avisa sobre equipamentos acima de 80% da vida útil |
| Remover treino | 2 → 3 | `treino`, `treino_equipamento`, `treino_planejado` | Reabre o treino planejado e apaga o treino; os vínculos caem por `ON DELETE CASCADE` |
| Montar cronograma | 3 → 1 | `treino_planejado`, `plano`, `percurso`, `tipo_treino` | Gera N semanas de treinos planejados a partir de uma semana-tipo, com progressão de volume, em um único `INSERT ... SELECT` |
| Fechar treinos planejados vencidos | 3 → 3 | `treino_planejado`, `plano`, `treino` | Marca como *Perdida* todo treino planejado vencida sem treino vinculado |
| Inscrever em prova | 4 → 1 | `inscricao`, `prova`, `plano` | Cria a inscrição; recusa uma segunda inscrição ativa na mesma prova |
| Registrar resultado | 4 → 2 | `inscricao`, `prova`, `recorde` | Grava tempo e colocações, muda o status para *Concluído* e promove a recorde pessoal quando for melhor |

### Relatórios (menu 5)

| # | Relatório | Tabelas associadas |
|---|-----------|--------------------|
| R1 | Aderência ao plano de treino | `plano` × `treinador` × `treino_planejado` × `treino` × `corredor` |
| R2 | Desgaste dos equipamentos | `equipamento` × `treino_equipamento` × `treino` |
| R3 | Desempenho em provas | `inscricao` × `prova` × `plano` × `recorde` × `treino` |
| R4 | Uso e rendimento por percurso | `percurso` × `treino` × `tipo_treino` |

Todos aceitam um período e são **uma única consulta SQL** — nenhuma agregação é
feita em JavaScript.

---

## 8. Estrutura do projeto

```
sql/
  01_schema.sql              DDL: 12 tabelas, restrições e índices
  02_carga.sql               dados previamente inseridos
  03_views.sql               views de apoio (ritmo e quilometragem derivados)
src/
  index.mjs                  menu principal
  db.mjs                     conexão, execução e transações — não conhece consulta alguma
  ui.mjs                     menus, tabelas, cores e leitura de entrada
  conta.mjs                  entrar, criar conta, editar perfil  + o SQL dessas telas
  inicio.mjs                 tela de resumo                      + o SQL dela
  crud.mjs                   CRUD das 8 entidades                + o SQL de cada uma
  processos.mjs              os processos de negócio             + as 25 instruções deles
  relatorios.mjs             os 4 relatórios                     + as 4 consultas
scripts/
  banco.mjs                  criar, carregar, backup e restaurar
backup/
  cadencia_fase1.sql         dump completo (pg_dump)
docs/
  dicionario-de-dados.md     domínio, esquema conceitual e dicionário
  consultas.md               onde está cada instrução SQL
```

### Onde está o SQL

Cada consulta é uma constante nomeada, declarada imediatamente antes da função
que a usa. Registrar um treino, por exemplo, lê assim:

```js
const INSERIR_TREINO = `
  INSERT INTO treino (id_corredor, id_plano, id_percurso, id_treino_planejado, id_tipo_treino,
                      data_treino, distancia_km, duracao_seg, percepcao_esforco, observacao)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
  RETURNING id_treino, ROUND(duracao_seg / distancia_km) AS pace_medio_seg`;

// … e alguns passos adiante, dentro da transação:
const treino = await consultarUm(INSERIR_TREINO, [ctx.corredorId, idPlano, …], cliente);
```

`src/db.mjs` não conhece consulta alguma: ele só abre a conexão, executa o texto
que recebe e cuida de `BEGIN`/`COMMIT`/`ROLLBACK`.

O mapa completo está em [`docs/consultas.md`](docs/consultas.md).

---

## 9. Solução de problemas

| Sintoma | Causa provável |
|---------|----------------|
| `Não foi possível conectar ao PostgreSQL` | Servidor fora do ar, ou `.env` com host/porta/senha errados |
| `role "cadencia" does not exist` | O usuário do passo 2 não foi criado |
| `database "cadencia" does not exist` | O banco do passo 2 não foi criado |
| `relation "corredor" does not exist` | Falta rodar `npm run banco:criar` |
| `Nenhum corredor cadastrado` | O esquema existe mas a carga não rodou: `npm run banco:carregar` |
