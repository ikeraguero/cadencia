#!/usr/bin/env bash
#
# Cadência — Fase 1 · inicialização completa em um comando.
#
#   ./iniciar.sh
#
# O script cuida de tudo: sobe o banco, instala as dependências, cria o
# esquema, carrega os dados e abre a aplicação.
#
# Opções:
#   ./iniciar.sh              prepara o que faltar e abre a aplicação
#   ./iniciar.sh --recriar    apaga e recria o banco (combina com as demais)
#   ./iniciar.sh --preparar   só prepara o ambiente, não abre a aplicação
#   ./iniciar.sh --parar      encerra o contêiner do banco
#   ./iniciar.sh --psql       abre um psql conectado ao banco
#   ./iniciar.sh --ajuda      mostra esta ajuda

set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

# ---------------------------------------------------------------------
# Saída
# ---------------------------------------------------------------------
if [ -t 1 ]; then
  NEGRITO=$'\033[1m'; VERDE=$'\033[32m'; AMARELO=$'\033[33m'
  VERMELHO=$'\033[31m'; CINZA=$'\033[90m'; FIM=$'\033[0m'
else
  NEGRITO=''; VERDE=''; AMARELO=''; VERMELHO=''; CINZA=''; FIM=''
fi

etapa()   { printf '\n%s▸ %s%s\n' "$NEGRITO" "$1" "$FIM"; }
ok()      { printf '  %s✔%s %s\n' "$VERDE" "$FIM" "$1"; }
aviso()   { printf '  %s!%s %s\n' "$AMARELO" "$FIM" "$1"; }
detalhe() { printf '  %s%s%s\n' "$CINZA" "$1" "$FIM"; }
falhar()  { printf '\n  %s✖ %s%s\n\n' "$VERMELHO" "$1" "$FIM" >&2; exit 1; }

# ---------------------------------------------------------------------
# Parâmetros
# ---------------------------------------------------------------------
USUARIO=cadencia
SENHA=cadencia
BANCO=cadencia
CONTEINER=cadencia-pg

ACAO=abrir       # abrir | preparar | parar | psql
RECRIAR=nao      # --recriar combina com qualquer uma das ações acima

while [ $# -gt 0 ]; do
  case "$1" in
    --recriar)  RECRIAR=sim ;;
    --preparar) ACAO=preparar ;;
    --parar)    ACAO=parar ;;
    --psql)     ACAO=psql ;;
    --ajuda|-h|--help)
      awk 'NR>1 && /^#/ { sub(/^# ?/, ""); print; next } NR>1 { exit }' "${BASH_SOURCE[0]}"
      exit 0 ;;
    *) falhar "Opção desconhecida: $1 — use --ajuda" ;;
  esac
  shift
done

tem() { command -v "$1" >/dev/null 2>&1; }

# Docker utilizável? (instalado, no PATH, com permissão e daemon no ar)
docker_disponivel() {
  tem docker && docker info >/dev/null 2>&1
}

# "docker compose" (v2) ou "docker-compose" (v1)
compose() {
  if docker compose version >/dev/null 2>&1; then
    CADENCIA_PORT="$PORTA" docker compose "$@"
  else
    CADENCIA_PORT="$PORTA" docker-compose "$@"
  fi
}

porta_ocupada() {
  (exec 3<>"/dev/tcp/127.0.0.1/$1") >/dev/null 2>&1 && { exec 3<&-; return 0; }
  return 1
}

# ---------------------------------------------------------------------
# --parar
# ---------------------------------------------------------------------
if [ "$ACAO" = parar ]; then
  # Usa a porta do .env, para o compose encerrar exatamente o que subiu.
  PORTA="$( [ -f .env ] && grep -E '^PGPORT=' .env | cut -d= -f2 | tr -d '[:space:]' || true )"
  PORTA="${PORTA:-5432}"
  if docker_disponivel && docker ps -a --format '{{.Names}}' | grep -qx "$CONTEINER"; then
    compose down
    ok "Contêiner do banco encerrado."
  else
    aviso "Nenhum contêiner do Cadência em execução."
  fi
  exit 0
fi

printf '\n%s╔══════════════════════════════════════════════════════════════╗%s\n' "$NEGRITO" "$FIM"
printf '%s║  Cadência — Fase 1 · preparando o ambiente                    ║%s\n' "$NEGRITO" "$FIM"
printf '%s╚══════════════════════════════════════════════════════════════╝%s\n' "$NEGRITO" "$FIM"

# ---------------------------------------------------------------------
# 1. Node.js
# ---------------------------------------------------------------------
etapa "1/6  Node.js"
tem node || falhar "Node.js não encontrado. Instale a versão 18 ou superior: https://nodejs.org
     Passo a passo por sistema no README.md, seção \"Como executar\"."

VERSAO_NODE="$(node --version)"
MAIOR="${VERSAO_NODE#v}"; MAIOR="${MAIOR%%.*}"
[ "$MAIOR" -ge 18 ] || falhar "Node.js $VERSAO_NODE é antigo demais. É preciso a versão 18 ou superior."
ok "Node.js $VERSAO_NODE"

# ---------------------------------------------------------------------
# 2. Banco de dados: reaproveita o .env, ou sobe um contêiner, ou usa o local
# ---------------------------------------------------------------------
etapa "2/6  Banco de dados"

PORTA=5432
MODO=''

if [ -f .env ]; then
  PORTA="$(grep -E '^PGPORT=' .env | cut -d= -f2 | tr -d '[:space:]' || true)"
  PORTA="${PORTA:-5432}"
  HOSPEDEIRO="$(grep -E '^PGHOST=' .env | cut -d= -f2 | tr -d '[:space:]' || true)"
  if porta_ocupada "$PORTA"; then
    MODO=existente
    ok "Usando a configuração de .env (${HOSPEDEIRO:-localhost}:$PORTA)"
  else
    aviso "O .env aponta para ${HOSPEDEIRO:-localhost}:$PORTA, mas nada responde nessa porta."
  fi
fi

if [ -z "$MODO" ] && docker_disponivel; then
  # Escolhe uma porta livre: 5432 se estiver desocupada, senão 55432.
  if porta_ocupada 5432; then
    PORTA=55432
    detalhe "A porta 5432 já está em uso; o contêiner usará a 55432."
  else
    PORTA=5432
  fi
  MODO=docker
  detalhe "Subindo o PostgreSQL em um contêiner..."
  compose up -d >/dev/null 2>&1 || falhar "Não foi possível subir o contêiner. Veja: docker compose logs"
  ok "Contêiner '$CONTEINER' no ar (porta $PORTA)"
fi

if [ -z "$MODO" ]; then
  # Sem Docker: tenta o PostgreSQL instalado na máquina.
  if porta_ocupada 5432; then
    PORTA=5432
    MODO=local
    ok "PostgreSQL local respondendo na porta 5432"
    aviso "O usuário '$USUARIO' e o banco '$BANCO' precisam existir. Se ainda não existirem:"
    detalhe "sudo -u postgres psql -c \"CREATE USER $USUARIO WITH PASSWORD '$SENHA';\""
    detalhe "sudo -u postgres psql -c \"CREATE DATABASE $BANCO OWNER $USUARIO;\""
  else
    falhar "Nenhum banco disponível.
     Instale o Docker (mais simples) ou o PostgreSQL.
     Passo a passo por sistema no README.md, seção \"Como executar\"."
  fi
fi

# ---------------------------------------------------------------------
# 3. Arquivo .env
# ---------------------------------------------------------------------
etapa "3/6  Configuração"

if [ ! -f .env ] || [ "$MODO" = docker ]; then
  cat > .env <<ENV
# Gerado por ./iniciar.sh
PGHOST=localhost
PGPORT=$PORTA
PGUSER=$USUARIO
PGPASSWORD=$SENHA
PGDATABASE=$BANCO
ENV
  ok ".env escrito (porta $PORTA)"
else
  ok ".env preservado"
fi

# ---------------------------------------------------------------------
# 4. Dependências
# ---------------------------------------------------------------------
etapa "4/6  Dependências"

if [ -d node_modules ] && [ node_modules -nt package.json ]; then
  ok "node_modules já instalado"
else
  detalhe "Rodando npm install..."
  npm install --silent --no-audit --no-fund || falhar "npm install falhou."
  touch node_modules
  ok "Dependências instaladas"
fi

# ---------------------------------------------------------------------
# 5. Espera o banco aceitar conexões
# ---------------------------------------------------------------------
etapa "5/6  Conexão"

ESTADO=''
for _ in $(seq 1 40); do
  ESTADO="$(node scripts/banco.mjs status 2>/dev/null | tail -n1 || true)"
  [ "$ESTADO" != 'sem-conexao' ] && [ -n "$ESTADO" ] && break
  sleep 1
done

case "$ESTADO" in
  pronto|vazio|sem-esquema) ok "Conectado a localhost:$PORTA/$BANCO" ;;
  *)
    if [ "$MODO" = local ]; then
      falhar "O PostgreSQL responde, mas a conexão falhou.
     Crie o usuário e o banco (comandos mostrados acima) e rode de novo."
    fi
    falhar "O banco não respondeu a tempo. Veja os registros com: docker compose logs" ;;
esac

# ---------------------------------------------------------------------
# 6. Esquema e dados
# ---------------------------------------------------------------------
etapa "6/6  Esquema e dados"

if [ "$RECRIAR" = sim ]; then
  detalhe "Recriando o banco do zero..."
  node scripts/banco.mjs criar >/dev/null || falhar "Falha ao executar os scripts de sql/."
  ok "Esquema recriado e dados carregados"
elif [ "$ESTADO" = pronto ]; then
  ok "Esquema e dados já presentes"
  detalhe "Para recomeçar do zero: ./iniciar.sh --recriar"
else
  detalhe "Criando o esquema e carregando os dados..."
  node scripts/banco.mjs criar >/dev/null || falhar "Falha ao executar os scripts de sql/."
  ok "12 tabelas criadas e dados carregados"
fi

# ---------------------------------------------------------------------
# Encerramento
# ---------------------------------------------------------------------
if [ "$ACAO" = psql ]; then
  tem psql || falhar "psql não encontrado. Instale o cliente do PostgreSQL."
  exec env PGPASSWORD="$SENHA" psql -h localhost -p "$PORTA" -U "$USUARIO" -d "$BANCO"
fi

printf '\n%s╔══════════════════════════════════════════════════════════════╗%s\n' "$VERDE" "$FIM"
printf '%s║  Ambiente pronto                                              ║%s\n' "$VERDE" "$FIM"
printf '%s╚══════════════════════════════════════════════════════════════╝%s\n' "$VERDE" "$FIM"

if [ "$ACAO" = preparar ]; then
  printf '\n  Para abrir a aplicação:   %s./iniciar.sh%s\n' "$NEGRITO" "$FIM"
  printf '  Para abrir um psql:       %s./iniciar.sh --psql%s\n' "$NEGRITO" "$FIM"
  [ "$MODO" = docker ] && printf '  Para encerrar o banco:    %s./iniciar.sh --parar%s\n' "$NEGRITO" "$FIM"
  printf '\n'
  exit 0
fi

[ "$MODO" = docker ] && detalhe "O banco segue no ar depois que você sair. Para encerrá-lo: ./iniciar.sh --parar"

exec npm start
