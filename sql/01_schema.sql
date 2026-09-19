-- =====================================================================
-- Cadência — Fase 1 · Esquema relacional (DDL)
-- Domínio: diário de treinos de corrida de rua
-- SGBD: PostgreSQL 14+
--
-- 8 tabelas de entidade + 4 tabelas associativas, em 3FN.
--
-- Atributos derivados NÃO são armazenados (3FN):
--   · pace médio      = duracao_seg / distancia_km       -> calculado nas consultas
--   · km acumulados   = SUM(treino_equipamento.km_atribuidos) -> idem
-- =====================================================================

DROP TABLE IF EXISTS treino_equipamento CASCADE;
DROP TABLE IF EXISTS inscricao          CASCADE;
DROP TABLE IF EXISTS treino             CASCADE;
DROP TABLE IF EXISTS treino_planejado             CASCADE;
DROP TABLE IF EXISTS recorde            CASCADE;
DROP TABLE IF EXISTS plano              CASCADE;
DROP TABLE IF EXISTS equipamento        CASCADE;
DROP TABLE IF EXISTS percurso           CASCADE;
DROP TABLE IF EXISTS prova              CASCADE;
DROP TABLE IF EXISTS tipo_treino        CASCADE;
DROP TABLE IF EXISTS treinador          CASCADE;
DROP TABLE IF EXISTS corredor           CASCADE;


-- ---------------------------------------------------------------------
-- ENTIDADES
-- ---------------------------------------------------------------------

-- Corredor: o usuário do sistema.
CREATE TABLE corredor (
    id_corredor        SERIAL       PRIMARY KEY,
    nome               VARCHAR(120) NOT NULL,
    email              VARCHAR(160) NOT NULL UNIQUE,
    senha_hash         VARCHAR(120) NOT NULL,
    sexo               CHAR(1)      CHECK (sexo IN ('M', 'F', 'O')),
    data_nascimento    DATE,
    meta_distancia_km  NUMERIC(6, 4) CHECK (meta_distancia_km > 0),
    meta_tempo_seg     INTEGER       CHECK (meta_tempo_seg > 0),
    CONSTRAINT ck_corredor_meta_completa
        CHECK ((meta_distancia_km IS NULL) = (meta_tempo_seg IS NULL))
);

COMMENT ON TABLE  corredor IS 'Corredor cadastrado no sistema.';
COMMENT ON COLUMN corredor.meta_tempo_seg IS 'Tempo-alvo da meta atual, em segundos.';

-- Treinador ou assessoria que prescreve planos.
CREATE TABLE treinador (
    id_treinador   SERIAL       PRIMARY KEY,
    nome           VARCHAR(120) NOT NULL,
    cref           VARCHAR(20)  UNIQUE,
    email          VARCHAR(160),
    telefone       VARCHAR(20),
    assessoria     VARCHAR(120),
    especialidade  VARCHAR(160),
    ativo          BOOLEAN      NOT NULL DEFAULT TRUE
);

COMMENT ON TABLE treinador IS 'Treinador ou assessoria esportiva.';

-- Catálogo de tipos de treino. Normalizado para fora de treino_planejado/treino,
-- eliminando a repetição do texto do tipo em milhares de linhas.
CREATE TABLE tipo_treino (
    id_tipo_treino  SERIAL      PRIMARY KEY,
    nome            VARCHAR(40) NOT NULL UNIQUE,
    descricao       VARCHAR(200),
    intensidade     SMALLINT    NOT NULL CHECK (intensidade BETWEEN 1 AND 5)
);

COMMENT ON TABLE  tipo_treino IS 'Catálogo de tipos de treino (regenerativo, longo, intervalado...).';
COMMENT ON COLUMN tipo_treino.intensidade IS 'Escala de 1 (muito leve) a 5 (máxima).';

-- Percurso/rota habitual do corredor.
CREATE TABLE percurso (
    id_percurso        SERIAL       PRIMARY KEY,
    id_corredor        INTEGER      NOT NULL REFERENCES corredor (id_corredor) ON DELETE CASCADE,
    nome               VARCHAR(120) NOT NULL,
    distancia_km       NUMERIC(6, 2) NOT NULL CHECK (distancia_km > 0),
    terreno            VARCHAR(20)  NOT NULL
        CHECK (terreno IN ('Asfalto', 'Trilha', 'Esteira', 'Pista', 'Areia', 'Misto')),
    ganho_elevacao_m   INTEGER      CHECK (ganho_elevacao_m >= 0),
    cidade             VARCHAR(80),
    referencia         VARCHAR(160),
    ativo              BOOLEAN      NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_percurso_nome UNIQUE (id_corredor, nome)
);

COMMENT ON TABLE percurso IS 'Rota habitual de treino.';

-- Equipamento: tênis, relógio, cinta cardíaca.
CREATE TABLE equipamento (
    id_equipamento   SERIAL       PRIMARY KEY,
    id_corredor      INTEGER      NOT NULL REFERENCES corredor (id_corredor) ON DELETE CASCADE,
    marca            VARCHAR(60)  NOT NULL,
    modelo           VARCHAR(80)  NOT NULL,
    tipo             VARCHAR(20)  NOT NULL
        CHECK (tipo IN ('Tênis', 'Relógio', 'Cinta cardíaca', 'Vestuário', 'Outro')),
    data_aquisicao   DATE,
    vida_util_km     NUMERIC(8, 2) NOT NULL CHECK (vida_util_km > 0),
    aposentado       BOOLEAN      NOT NULL DEFAULT FALSE,
    observacao       VARCHAR(200)
);

COMMENT ON TABLE  equipamento IS 'Equipamento usado nos treinos.';
COMMENT ON COLUMN equipamento.vida_util_km IS 'Quilometragem máxima recomendada pelo fabricante.';

-- Plano de treino, opcionalmente conduzido por um treinador.
CREATE TABLE plano (
    id_plano      SERIAL       PRIMARY KEY,
    id_corredor   INTEGER      NOT NULL REFERENCES corredor  (id_corredor)  ON DELETE CASCADE,
    id_treinador  INTEGER      REFERENCES treinador (id_treinador) ON DELETE SET NULL,
    nome          VARCHAR(120) NOT NULL,
    objetivo      VARCHAR(200),
    data_inicio   DATE         NOT NULL,
    data_fim      DATE,
    descricao     TEXT,
    CONSTRAINT ck_plano_periodo CHECK (data_fim IS NULL OR data_fim >= data_inicio),
    CONSTRAINT uq_plano_nome UNIQUE (id_corredor, nome)
);

COMMENT ON TABLE plano IS 'Ciclo de treinamento com objetivo e período definidos.';

-- Prova: evento de corrida. É compartilhada entre corredores (não pertence a um).
CREATE TABLE prova (
    id_prova      SERIAL       PRIMARY KEY,
    nome          VARCHAR(140) NOT NULL,
    data_prova    DATE         NOT NULL,
    distancia_km  NUMERIC(7, 4) NOT NULL CHECK (distancia_km > 0),
    cidade        VARCHAR(80),
    uf            CHAR(2),
    organizador   VARCHAR(120),
    CONSTRAINT uq_prova UNIQUE (nome, data_prova)
);

COMMENT ON TABLE prova IS 'Evento de corrida de rua.';

-- Recorde pessoal do corredor por distância oficial.
CREATE TABLE recorde (
    id_recorde        SERIAL        PRIMARY KEY,
    id_corredor       INTEGER       NOT NULL REFERENCES corredor (id_corredor) ON DELETE CASCADE,
    id_prova          INTEGER       REFERENCES prova (id_prova) ON DELETE SET NULL,
    distancia_km      NUMERIC(7, 4) NOT NULL CHECK (distancia_km > 0),
    melhor_tempo_seg  INTEGER       NOT NULL CHECK (melhor_tempo_seg > 0),
    data_registro     DATE          NOT NULL,
    -- Um corredor tem no máximo um recorde vigente por distância.
    CONSTRAINT uq_recorde UNIQUE (id_corredor, distancia_km)
);

COMMENT ON TABLE recorde IS 'Melhor marca do corredor em cada distância oficial.';


-- ---------------------------------------------------------------------
-- TABELAS ASSOCIATIVAS
-- ---------------------------------------------------------------------

-- TREINO_PLANEJADO — associa plano × percurso × tipo de treino.
-- É a prescrição: o que o treinador mandou fazer em determinado dia.
CREATE TABLE treino_planejado (
    id_treino_planejado          SERIAL       PRIMARY KEY,
    id_plano           INTEGER      NOT NULL REFERENCES plano       (id_plano)       ON DELETE CASCADE,
    id_percurso        INTEGER      REFERENCES percurso    (id_percurso)    ON DELETE SET NULL,
    id_tipo_treino     INTEGER      NOT NULL REFERENCES tipo_treino (id_tipo_treino) ON DELETE RESTRICT,
    data_planejada        DATE         NOT NULL,
    distancia_alvo_km  NUMERIC(6, 2) NOT NULL CHECK (distancia_alvo_km > 0),
    pace_alvo_seg      INTEGER      CHECK (pace_alvo_seg > 0),
    status             VARCHAR(12)  NOT NULL DEFAULT 'Prescrita'
        CHECK (status IN ('Prescrita', 'Cumprida', 'Perdida')),
    orientacao         VARCHAR(300)
);

COMMENT ON TABLE  treino_planejado IS 'ASSOCIATIVA plano × percurso × tipo_treino: o treino planejado.';
COMMENT ON COLUMN treino_planejado.pace_alvo_seg IS 'Pace-alvo em segundos por quilômetro.';

-- TREINO — associa corredor × plano × percurso × treino planejado × tipo de treino.
-- É a execução: o que de fato foi corrido.
CREATE TABLE treino (
    id_treino          SERIAL       PRIMARY KEY,
    id_corredor        INTEGER      NOT NULL REFERENCES corredor    (id_corredor)    ON DELETE CASCADE,
    id_plano           INTEGER      REFERENCES plano       (id_plano)       ON DELETE SET NULL,
    id_percurso        INTEGER      REFERENCES percurso    (id_percurso)    ON DELETE SET NULL,
    id_treino_planejado          INTEGER      REFERENCES treino_planejado      (id_treino_planejado)      ON DELETE SET NULL,
    id_tipo_treino     INTEGER      NOT NULL REFERENCES tipo_treino (id_tipo_treino) ON DELETE RESTRICT,
    data_treino        DATE         NOT NULL,
    distancia_km       NUMERIC(6, 2) NOT NULL CHECK (distancia_km > 0),
    duracao_seg        INTEGER      NOT NULL CHECK (duracao_seg > 0),
    percepcao_esforco  SMALLINT     CHECK (percepcao_esforco BETWEEN 1 AND 10),
    observacao         VARCHAR(300),
    -- Umo treino planejado é cumprida por no máximo um treino.
    CONSTRAINT uq_treino_planejado UNIQUE (id_treino_planejado)
);

COMMENT ON TABLE treino IS 'ASSOCIATIVA corredor × plano × percurso × treino planejado: o treino executado.';

-- TREINO_EQUIPAMENTO — associativa pura treino × equipamento.
-- Chave primária composta: um equipamento entra uma única vez em cada treino.
CREATE TABLE treino_equipamento (
    id_treino       INTEGER       NOT NULL REFERENCES treino      (id_treino)      ON DELETE CASCADE,
    id_equipamento  INTEGER       NOT NULL REFERENCES equipamento (id_equipamento) ON DELETE CASCADE,
    km_atribuidos   NUMERIC(6, 2) NOT NULL CHECK (km_atribuidos > 0),
    PRIMARY KEY (id_treino, id_equipamento)
);

COMMENT ON TABLE treino_equipamento IS 'ASSOCIATIVA treino × equipamento: quilometragem lançada em cada item.';

-- INSCRICAO — associa corredor × prova × plano de preparação.
CREATE TABLE inscricao (
    id_inscricao          SERIAL       PRIMARY KEY,
    id_corredor           INTEGER      NOT NULL REFERENCES corredor (id_corredor) ON DELETE CASCADE,
    id_prova              INTEGER      NOT NULL REFERENCES prova    (id_prova)    ON DELETE CASCADE,
    id_plano              INTEGER      REFERENCES plano    (id_plano)    ON DELETE SET NULL,
    data_inscricao        DATE         NOT NULL,
    valor_pago            NUMERIC(8, 2) NOT NULL CHECK (valor_pago >= 0),
    numero_peito          VARCHAR(10),
    categoria             VARCHAR(30),
    status                VARCHAR(12)  NOT NULL DEFAULT 'Inscrito'
        CHECK (status IN ('Inscrito', 'Confirmado', 'Concluído', 'Cancelado')),
    tempo_liquido_seg     INTEGER      CHECK (tempo_liquido_seg > 0),
    colocacao_geral       INTEGER      CHECK (colocacao_geral > 0),
    colocacao_categoria   INTEGER      CHECK (colocacao_categoria > 0),
    -- Só inscrição concluída pode ter resultado, e concluída obriga o tempo.
    CONSTRAINT ck_inscricao_resultado
        CHECK ((status = 'Concluído') = (tempo_liquido_seg IS NOT NULL))
);

COMMENT ON TABLE inscricao IS 'ASSOCIATIVA corredor × prova × plano: inscrição e resultado.';

-- Um corredor só pode ter UMA inscrição ativa (não cancelada) por prova.
-- Índice único parcial: permite reinscrever depois de um cancelamento.
CREATE UNIQUE INDEX uq_inscricao_ativa
    ON inscricao (id_corredor, id_prova)
    WHERE status <> 'Cancelado';


-- ---------------------------------------------------------------------
-- ÍNDICES DE APOIO ÀS CONSULTAS DOS RELATÓRIOS
-- ---------------------------------------------------------------------

CREATE INDEX idx_treino_corredor_data  ON treino     (id_corredor, data_treino DESC);
CREATE INDEX idx_treino_plano          ON treino     (id_plano);
CREATE INDEX idx_treino_percurso       ON treino     (id_percurso);
CREATE INDEX idx_planejado_plano_data     ON treino_planejado     (id_plano, data_planejada);
CREATE INDEX idx_planejado_status         ON treino_planejado     (status);
CREATE INDEX idx_inscricao_corredor    ON inscricao  (id_corredor, status);
CREATE INDEX idx_equipamento_corredor  ON equipamento (id_corredor) WHERE NOT aposentado;
