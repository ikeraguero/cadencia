--
-- PostgreSQL database dump
--

-- Dumped from database version 17.11
-- Dumped by pg_dump version 17.1 (Ubuntu 17.1-1.pgdg24.04+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.treino_planejado DROP CONSTRAINT IF EXISTS treino_planejado_id_tipo_treino_fkey;
ALTER TABLE IF EXISTS ONLY public.treino_planejado DROP CONSTRAINT IF EXISTS treino_planejado_id_plano_fkey;
ALTER TABLE IF EXISTS ONLY public.treino_planejado DROP CONSTRAINT IF EXISTS treino_planejado_id_percurso_fkey;
ALTER TABLE IF EXISTS ONLY public.treino DROP CONSTRAINT IF EXISTS treino_id_treino_planejado_fkey;
ALTER TABLE IF EXISTS ONLY public.treino DROP CONSTRAINT IF EXISTS treino_id_tipo_treino_fkey;
ALTER TABLE IF EXISTS ONLY public.treino DROP CONSTRAINT IF EXISTS treino_id_plano_fkey;
ALTER TABLE IF EXISTS ONLY public.treino DROP CONSTRAINT IF EXISTS treino_id_percurso_fkey;
ALTER TABLE IF EXISTS ONLY public.treino DROP CONSTRAINT IF EXISTS treino_id_corredor_fkey;
ALTER TABLE IF EXISTS ONLY public.treino_equipamento DROP CONSTRAINT IF EXISTS treino_equipamento_id_treino_fkey;
ALTER TABLE IF EXISTS ONLY public.treino_equipamento DROP CONSTRAINT IF EXISTS treino_equipamento_id_equipamento_fkey;
ALTER TABLE IF EXISTS ONLY public.recorde DROP CONSTRAINT IF EXISTS recorde_id_prova_fkey;
ALTER TABLE IF EXISTS ONLY public.recorde DROP CONSTRAINT IF EXISTS recorde_id_corredor_fkey;
ALTER TABLE IF EXISTS ONLY public.plano DROP CONSTRAINT IF EXISTS plano_id_treinador_fkey;
ALTER TABLE IF EXISTS ONLY public.plano DROP CONSTRAINT IF EXISTS plano_id_corredor_fkey;
ALTER TABLE IF EXISTS ONLY public.percurso DROP CONSTRAINT IF EXISTS percurso_id_corredor_fkey;
ALTER TABLE IF EXISTS ONLY public.inscricao DROP CONSTRAINT IF EXISTS inscricao_id_prova_fkey;
ALTER TABLE IF EXISTS ONLY public.inscricao DROP CONSTRAINT IF EXISTS inscricao_id_plano_fkey;
ALTER TABLE IF EXISTS ONLY public.inscricao DROP CONSTRAINT IF EXISTS inscricao_id_corredor_fkey;
ALTER TABLE IF EXISTS ONLY public.equipamento DROP CONSTRAINT IF EXISTS equipamento_id_corredor_fkey;
DROP INDEX IF EXISTS public.uq_inscricao_ativa;
DROP INDEX IF EXISTS public.idx_treino_plano;
DROP INDEX IF EXISTS public.idx_treino_percurso;
DROP INDEX IF EXISTS public.idx_treino_corredor_data;
DROP INDEX IF EXISTS public.idx_planejado_status;
DROP INDEX IF EXISTS public.idx_planejado_plano_data;
DROP INDEX IF EXISTS public.idx_inscricao_corredor;
DROP INDEX IF EXISTS public.idx_equipamento_corredor;
ALTER TABLE IF EXISTS ONLY public.treino DROP CONSTRAINT IF EXISTS uq_treino_planejado;
ALTER TABLE IF EXISTS ONLY public.recorde DROP CONSTRAINT IF EXISTS uq_recorde;
ALTER TABLE IF EXISTS ONLY public.prova DROP CONSTRAINT IF EXISTS uq_prova;
ALTER TABLE IF EXISTS ONLY public.plano DROP CONSTRAINT IF EXISTS uq_plano_nome;
ALTER TABLE IF EXISTS ONLY public.percurso DROP CONSTRAINT IF EXISTS uq_percurso_nome;
ALTER TABLE IF EXISTS ONLY public.treino_planejado DROP CONSTRAINT IF EXISTS treino_planejado_pkey;
ALTER TABLE IF EXISTS ONLY public.treino DROP CONSTRAINT IF EXISTS treino_pkey;
ALTER TABLE IF EXISTS ONLY public.treino_equipamento DROP CONSTRAINT IF EXISTS treino_equipamento_pkey;
ALTER TABLE IF EXISTS ONLY public.treinador DROP CONSTRAINT IF EXISTS treinador_pkey;
ALTER TABLE IF EXISTS ONLY public.treinador DROP CONSTRAINT IF EXISTS treinador_cref_key;
ALTER TABLE IF EXISTS ONLY public.tipo_treino DROP CONSTRAINT IF EXISTS tipo_treino_pkey;
ALTER TABLE IF EXISTS ONLY public.tipo_treino DROP CONSTRAINT IF EXISTS tipo_treino_nome_key;
ALTER TABLE IF EXISTS ONLY public.recorde DROP CONSTRAINT IF EXISTS recorde_pkey;
ALTER TABLE IF EXISTS ONLY public.prova DROP CONSTRAINT IF EXISTS prova_pkey;
ALTER TABLE IF EXISTS ONLY public.plano DROP CONSTRAINT IF EXISTS plano_pkey;
ALTER TABLE IF EXISTS ONLY public.percurso DROP CONSTRAINT IF EXISTS percurso_pkey;
ALTER TABLE IF EXISTS ONLY public.inscricao DROP CONSTRAINT IF EXISTS inscricao_pkey;
ALTER TABLE IF EXISTS ONLY public.equipamento DROP CONSTRAINT IF EXISTS equipamento_pkey;
ALTER TABLE IF EXISTS ONLY public.corredor DROP CONSTRAINT IF EXISTS corredor_pkey;
ALTER TABLE IF EXISTS ONLY public.corredor DROP CONSTRAINT IF EXISTS corredor_email_key;
ALTER TABLE IF EXISTS public.treino_planejado ALTER COLUMN id_treino_planejado DROP DEFAULT;
ALTER TABLE IF EXISTS public.treino ALTER COLUMN id_treino DROP DEFAULT;
ALTER TABLE IF EXISTS public.treinador ALTER COLUMN id_treinador DROP DEFAULT;
ALTER TABLE IF EXISTS public.tipo_treino ALTER COLUMN id_tipo_treino DROP DEFAULT;
ALTER TABLE IF EXISTS public.recorde ALTER COLUMN id_recorde DROP DEFAULT;
ALTER TABLE IF EXISTS public.prova ALTER COLUMN id_prova DROP DEFAULT;
ALTER TABLE IF EXISTS public.plano ALTER COLUMN id_plano DROP DEFAULT;
ALTER TABLE IF EXISTS public.percurso ALTER COLUMN id_percurso DROP DEFAULT;
ALTER TABLE IF EXISTS public.inscricao ALTER COLUMN id_inscricao DROP DEFAULT;
ALTER TABLE IF EXISTS public.equipamento ALTER COLUMN id_equipamento DROP DEFAULT;
ALTER TABLE IF EXISTS public.corredor ALTER COLUMN id_corredor DROP DEFAULT;
DROP VIEW IF EXISTS public.vw_treino_completo;
DROP VIEW IF EXISTS public.vw_equipamento_uso;
DROP SEQUENCE IF EXISTS public.treino_planejado_id_treino_planejado_seq;
DROP TABLE IF EXISTS public.treino_planejado;
DROP SEQUENCE IF EXISTS public.treino_id_treino_seq;
DROP TABLE IF EXISTS public.treino_equipamento;
DROP TABLE IF EXISTS public.treino;
DROP SEQUENCE IF EXISTS public.treinador_id_treinador_seq;
DROP TABLE IF EXISTS public.treinador;
DROP SEQUENCE IF EXISTS public.tipo_treino_id_tipo_treino_seq;
DROP TABLE IF EXISTS public.tipo_treino;
DROP SEQUENCE IF EXISTS public.recorde_id_recorde_seq;
DROP TABLE IF EXISTS public.recorde;
DROP SEQUENCE IF EXISTS public.prova_id_prova_seq;
DROP TABLE IF EXISTS public.prova;
DROP SEQUENCE IF EXISTS public.plano_id_plano_seq;
DROP TABLE IF EXISTS public.plano;
DROP SEQUENCE IF EXISTS public.percurso_id_percurso_seq;
DROP TABLE IF EXISTS public.percurso;
DROP SEQUENCE IF EXISTS public.inscricao_id_inscricao_seq;
DROP TABLE IF EXISTS public.inscricao;
DROP SEQUENCE IF EXISTS public.equipamento_id_equipamento_seq;
DROP TABLE IF EXISTS public.equipamento;
DROP SEQUENCE IF EXISTS public.corredor_id_corredor_seq;
DROP TABLE IF EXISTS public.corredor;
-- *not* dropping schema, since initdb creates it
--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS '';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: corredor; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.corredor (
    id_corredor integer NOT NULL,
    nome character varying(120) NOT NULL,
    email character varying(160) NOT NULL,
    senha_hash character varying(120) NOT NULL,
    sexo character(1),
    data_nascimento date,
    meta_distancia_km numeric(6,4),
    meta_tempo_seg integer,
    CONSTRAINT ck_corredor_meta_completa CHECK (((meta_distancia_km IS NULL) = (meta_tempo_seg IS NULL))),
    CONSTRAINT corredor_meta_distancia_km_check CHECK ((meta_distancia_km > (0)::numeric)),
    CONSTRAINT corredor_meta_tempo_seg_check CHECK ((meta_tempo_seg > 0)),
    CONSTRAINT corredor_sexo_check CHECK ((sexo = ANY (ARRAY['M'::bpchar, 'F'::bpchar, 'O'::bpchar])))
);


--
-- Name: TABLE corredor; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.corredor IS 'Corredor cadastrado no sistema.';


--
-- Name: COLUMN corredor.meta_tempo_seg; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.corredor.meta_tempo_seg IS 'Tempo-alvo da meta atual, em segundos.';


--
-- Name: corredor_id_corredor_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.corredor_id_corredor_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: corredor_id_corredor_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.corredor_id_corredor_seq OWNED BY public.corredor.id_corredor;


--
-- Name: equipamento; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.equipamento (
    id_equipamento integer NOT NULL,
    id_corredor integer NOT NULL,
    marca character varying(60) NOT NULL,
    modelo character varying(80) NOT NULL,
    tipo character varying(20) NOT NULL,
    data_aquisicao date,
    vida_util_km numeric(8,2) NOT NULL,
    aposentado boolean DEFAULT false NOT NULL,
    observacao character varying(200),
    CONSTRAINT equipamento_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['Tênis'::character varying, 'Relógio'::character varying, 'Cinta cardíaca'::character varying, 'Vestuário'::character varying, 'Outro'::character varying])::text[]))),
    CONSTRAINT equipamento_vida_util_km_check CHECK ((vida_util_km > (0)::numeric))
);


--
-- Name: TABLE equipamento; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.equipamento IS 'Equipamento usado nos treinos.';


--
-- Name: COLUMN equipamento.vida_util_km; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.equipamento.vida_util_km IS 'Quilometragem máxima recomendada pelo fabricante.';


--
-- Name: equipamento_id_equipamento_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.equipamento_id_equipamento_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: equipamento_id_equipamento_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.equipamento_id_equipamento_seq OWNED BY public.equipamento.id_equipamento;


--
-- Name: inscricao; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inscricao (
    id_inscricao integer NOT NULL,
    id_corredor integer NOT NULL,
    id_prova integer NOT NULL,
    id_plano integer,
    data_inscricao date NOT NULL,
    valor_pago numeric(8,2) NOT NULL,
    numero_peito character varying(10),
    categoria character varying(30),
    status character varying(12) DEFAULT 'Inscrito'::character varying NOT NULL,
    tempo_liquido_seg integer,
    colocacao_geral integer,
    colocacao_categoria integer,
    CONSTRAINT ck_inscricao_resultado CHECK ((((status)::text = 'Concluído'::text) = (tempo_liquido_seg IS NOT NULL))),
    CONSTRAINT inscricao_colocacao_categoria_check CHECK ((colocacao_categoria > 0)),
    CONSTRAINT inscricao_colocacao_geral_check CHECK ((colocacao_geral > 0)),
    CONSTRAINT inscricao_status_check CHECK (((status)::text = ANY ((ARRAY['Inscrito'::character varying, 'Confirmado'::character varying, 'Concluído'::character varying, 'Cancelado'::character varying])::text[]))),
    CONSTRAINT inscricao_tempo_liquido_seg_check CHECK ((tempo_liquido_seg > 0)),
    CONSTRAINT inscricao_valor_pago_check CHECK ((valor_pago >= (0)::numeric))
);


--
-- Name: TABLE inscricao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.inscricao IS 'ASSOCIATIVA corredor × prova × plano: inscrição e resultado.';


--
-- Name: inscricao_id_inscricao_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.inscricao_id_inscricao_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: inscricao_id_inscricao_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.inscricao_id_inscricao_seq OWNED BY public.inscricao.id_inscricao;


--
-- Name: percurso; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.percurso (
    id_percurso integer NOT NULL,
    id_corredor integer NOT NULL,
    nome character varying(120) NOT NULL,
    distancia_km numeric(6,2) NOT NULL,
    terreno character varying(20) NOT NULL,
    ganho_elevacao_m integer,
    cidade character varying(80),
    referencia character varying(160),
    ativo boolean DEFAULT true NOT NULL,
    CONSTRAINT percurso_distancia_km_check CHECK ((distancia_km > (0)::numeric)),
    CONSTRAINT percurso_ganho_elevacao_m_check CHECK ((ganho_elevacao_m >= 0)),
    CONSTRAINT percurso_terreno_check CHECK (((terreno)::text = ANY ((ARRAY['Asfalto'::character varying, 'Trilha'::character varying, 'Esteira'::character varying, 'Pista'::character varying, 'Areia'::character varying, 'Misto'::character varying])::text[])))
);


--
-- Name: TABLE percurso; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.percurso IS 'Rota habitual de treino.';


--
-- Name: percurso_id_percurso_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.percurso_id_percurso_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: percurso_id_percurso_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.percurso_id_percurso_seq OWNED BY public.percurso.id_percurso;


--
-- Name: plano; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.plano (
    id_plano integer NOT NULL,
    id_corredor integer NOT NULL,
    id_treinador integer,
    nome character varying(120) NOT NULL,
    objetivo character varying(200),
    data_inicio date NOT NULL,
    data_fim date,
    descricao text,
    CONSTRAINT ck_plano_periodo CHECK (((data_fim IS NULL) OR (data_fim >= data_inicio)))
);


--
-- Name: TABLE plano; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.plano IS 'Ciclo de treinamento com objetivo e período definidos.';


--
-- Name: plano_id_plano_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.plano_id_plano_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: plano_id_plano_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.plano_id_plano_seq OWNED BY public.plano.id_plano;


--
-- Name: prova; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.prova (
    id_prova integer NOT NULL,
    nome character varying(140) NOT NULL,
    data_prova date NOT NULL,
    distancia_km numeric(7,4) NOT NULL,
    cidade character varying(80),
    uf character(2),
    organizador character varying(120),
    CONSTRAINT prova_distancia_km_check CHECK ((distancia_km > (0)::numeric))
);


--
-- Name: TABLE prova; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.prova IS 'Evento de corrida de rua.';


--
-- Name: prova_id_prova_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.prova_id_prova_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: prova_id_prova_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.prova_id_prova_seq OWNED BY public.prova.id_prova;


--
-- Name: recorde; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recorde (
    id_recorde integer NOT NULL,
    id_corredor integer NOT NULL,
    id_prova integer,
    distancia_km numeric(7,4) NOT NULL,
    melhor_tempo_seg integer NOT NULL,
    data_registro date NOT NULL,
    CONSTRAINT recorde_distancia_km_check CHECK ((distancia_km > (0)::numeric)),
    CONSTRAINT recorde_melhor_tempo_seg_check CHECK ((melhor_tempo_seg > 0))
);


--
-- Name: TABLE recorde; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.recorde IS 'Melhor marca do corredor em cada distância oficial.';


--
-- Name: recorde_id_recorde_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.recorde_id_recorde_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: recorde_id_recorde_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.recorde_id_recorde_seq OWNED BY public.recorde.id_recorde;


--
-- Name: tipo_treino; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tipo_treino (
    id_tipo_treino integer NOT NULL,
    nome character varying(40) NOT NULL,
    descricao character varying(200),
    intensidade smallint NOT NULL,
    CONSTRAINT tipo_treino_intensidade_check CHECK (((intensidade >= 1) AND (intensidade <= 5)))
);


--
-- Name: TABLE tipo_treino; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tipo_treino IS 'Catálogo de tipos de treino (regenerativo, longo, intervalado...).';


--
-- Name: COLUMN tipo_treino.intensidade; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tipo_treino.intensidade IS 'Escala de 1 (muito leve) a 5 (máxima).';


--
-- Name: tipo_treino_id_tipo_treino_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tipo_treino_id_tipo_treino_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tipo_treino_id_tipo_treino_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tipo_treino_id_tipo_treino_seq OWNED BY public.tipo_treino.id_tipo_treino;


--
-- Name: treinador; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.treinador (
    id_treinador integer NOT NULL,
    nome character varying(120) NOT NULL,
    cref character varying(20),
    email character varying(160),
    telefone character varying(20),
    assessoria character varying(120),
    especialidade character varying(160),
    ativo boolean DEFAULT true NOT NULL
);


--
-- Name: TABLE treinador; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.treinador IS 'Treinador ou assessoria esportiva.';


--
-- Name: treinador_id_treinador_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.treinador_id_treinador_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: treinador_id_treinador_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.treinador_id_treinador_seq OWNED BY public.treinador.id_treinador;


--
-- Name: treino; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.treino (
    id_treino integer NOT NULL,
    id_corredor integer NOT NULL,
    id_plano integer,
    id_percurso integer,
    id_treino_planejado integer,
    id_tipo_treino integer NOT NULL,
    data_treino date NOT NULL,
    distancia_km numeric(6,2) NOT NULL,
    duracao_seg integer NOT NULL,
    percepcao_esforco smallint,
    observacao character varying(300),
    CONSTRAINT treino_distancia_km_check CHECK ((distancia_km > (0)::numeric)),
    CONSTRAINT treino_duracao_seg_check CHECK ((duracao_seg > 0)),
    CONSTRAINT treino_percepcao_esforco_check CHECK (((percepcao_esforco >= 1) AND (percepcao_esforco <= 10)))
);


--
-- Name: TABLE treino; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.treino IS 'ASSOCIATIVA corredor × plano × percurso × treino planejado: o treino executado.';


--
-- Name: treino_equipamento; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.treino_equipamento (
    id_treino integer NOT NULL,
    id_equipamento integer NOT NULL,
    km_atribuidos numeric(6,2) NOT NULL,
    CONSTRAINT treino_equipamento_km_atribuidos_check CHECK ((km_atribuidos > (0)::numeric))
);


--
-- Name: TABLE treino_equipamento; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.treino_equipamento IS 'ASSOCIATIVA treino × equipamento: quilometragem lançada em cada item.';


--
-- Name: treino_id_treino_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.treino_id_treino_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: treino_id_treino_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.treino_id_treino_seq OWNED BY public.treino.id_treino;


--
-- Name: treino_planejado; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.treino_planejado (
    id_treino_planejado integer NOT NULL,
    id_plano integer NOT NULL,
    id_percurso integer,
    id_tipo_treino integer NOT NULL,
    data_planejada date NOT NULL,
    distancia_alvo_km numeric(6,2) NOT NULL,
    pace_alvo_seg integer,
    status character varying(12) DEFAULT 'Prescrita'::character varying NOT NULL,
    orientacao character varying(300),
    CONSTRAINT treino_planejado_distancia_alvo_km_check CHECK ((distancia_alvo_km > (0)::numeric)),
    CONSTRAINT treino_planejado_pace_alvo_seg_check CHECK ((pace_alvo_seg > 0)),
    CONSTRAINT treino_planejado_status_check CHECK (((status)::text = ANY ((ARRAY['Prescrita'::character varying, 'Cumprida'::character varying, 'Perdida'::character varying])::text[])))
);


--
-- Name: TABLE treino_planejado; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.treino_planejado IS 'ASSOCIATIVA plano × percurso × tipo_treino: o treino planejado.';


--
-- Name: COLUMN treino_planejado.pace_alvo_seg; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.treino_planejado.pace_alvo_seg IS 'Pace-alvo em segundos por quilômetro.';


--
-- Name: treino_planejado_id_treino_planejado_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.treino_planejado_id_treino_planejado_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: treino_planejado_id_treino_planejado_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.treino_planejado_id_treino_planejado_seq OWNED BY public.treino_planejado.id_treino_planejado;


--
-- Name: vw_equipamento_uso; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.vw_equipamento_uso AS
 SELECT e.id_equipamento,
    e.id_corredor,
    (((e.marca)::text || ' '::text) || (e.modelo)::text) AS equipamento,
    e.tipo,
    e.vida_util_km,
    e.aposentado,
    COALESCE(sum(te.km_atribuidos), (0)::numeric) AS km_acumulados,
    count(te.id_treino) AS treinos_realizados,
    round(((COALESCE(sum(te.km_atribuidos), (0)::numeric) / e.vida_util_km) * (100)::numeric), 1) AS desgaste_pct,
    GREATEST((e.vida_util_km - COALESCE(sum(te.km_atribuidos), (0)::numeric)), (0)::numeric) AS km_restantes,
    max(t.data_treino) AS ultimo_uso
   FROM ((public.equipamento e
     LEFT JOIN public.treino_equipamento te ON ((te.id_equipamento = e.id_equipamento)))
     LEFT JOIN public.treino t ON ((t.id_treino = te.id_treino)))
  GROUP BY e.id_equipamento, e.id_corredor, e.marca, e.modelo, e.tipo, e.vida_util_km, e.aposentado;


--
-- Name: VIEW vw_equipamento_uso; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.vw_equipamento_uso IS 'Quilometragem e desgaste por equipamento, derivados de treino_equipamento.';


--
-- Name: vw_treino_completo; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.vw_treino_completo AS
 SELECT t.id_treino,
    t.id_corredor,
    c.nome AS corredor,
    t.data_treino,
    tt.nome AS tipo_treino,
    tt.intensidade,
    t.distancia_km,
    t.duracao_seg,
    round(((t.duracao_seg)::numeric / t.distancia_km)) AS pace_medio_seg,
    t.percepcao_esforco,
    p.id_plano,
    p.nome AS plano,
    tr.nome AS treinador,
    pc.id_percurso,
    pc.nome AS percurso,
    pc.terreno,
    pc.ganho_elevacao_m,
    s.id_treino_planejado,
    s.distancia_alvo_km,
    s.pace_alvo_seg,
    t.observacao
   FROM ((((((public.treino t
     JOIN public.corredor c ON ((c.id_corredor = t.id_corredor)))
     JOIN public.tipo_treino tt ON ((tt.id_tipo_treino = t.id_tipo_treino)))
     LEFT JOIN public.plano p ON ((p.id_plano = t.id_plano)))
     LEFT JOIN public.treinador tr ON ((tr.id_treinador = p.id_treinador)))
     LEFT JOIN public.percurso pc ON ((pc.id_percurso = t.id_percurso)))
     LEFT JOIN public.treino_planejado s ON ((s.id_treino_planejado = t.id_treino_planejado)));


--
-- Name: VIEW vw_treino_completo; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.vw_treino_completo IS 'Treino com plano, treinador, percurso e planejamento resolvidos, e o pace derivado.';


--
-- Name: corredor id_corredor; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.corredor ALTER COLUMN id_corredor SET DEFAULT nextval('public.corredor_id_corredor_seq'::regclass);


--
-- Name: equipamento id_equipamento; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipamento ALTER COLUMN id_equipamento SET DEFAULT nextval('public.equipamento_id_equipamento_seq'::regclass);


--
-- Name: inscricao id_inscricao; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inscricao ALTER COLUMN id_inscricao SET DEFAULT nextval('public.inscricao_id_inscricao_seq'::regclass);


--
-- Name: percurso id_percurso; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.percurso ALTER COLUMN id_percurso SET DEFAULT nextval('public.percurso_id_percurso_seq'::regclass);


--
-- Name: plano id_plano; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plano ALTER COLUMN id_plano SET DEFAULT nextval('public.plano_id_plano_seq'::regclass);


--
-- Name: prova id_prova; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prova ALTER COLUMN id_prova SET DEFAULT nextval('public.prova_id_prova_seq'::regclass);


--
-- Name: recorde id_recorde; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recorde ALTER COLUMN id_recorde SET DEFAULT nextval('public.recorde_id_recorde_seq'::regclass);


--
-- Name: tipo_treino id_tipo_treino; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipo_treino ALTER COLUMN id_tipo_treino SET DEFAULT nextval('public.tipo_treino_id_tipo_treino_seq'::regclass);


--
-- Name: treinador id_treinador; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.treinador ALTER COLUMN id_treinador SET DEFAULT nextval('public.treinador_id_treinador_seq'::regclass);


--
-- Name: treino id_treino; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.treino ALTER COLUMN id_treino SET DEFAULT nextval('public.treino_id_treino_seq'::regclass);


--
-- Name: treino_planejado id_treino_planejado; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.treino_planejado ALTER COLUMN id_treino_planejado SET DEFAULT nextval('public.treino_planejado_id_treino_planejado_seq'::regclass);


--
-- Data for Name: corredor; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.corredor (id_corredor, nome, email, senha_hash, sexo, data_nascimento, meta_distancia_km, meta_tempo_seg) FROM stdin;
1	Iker Aguero	iker@exemplo.com	scrypt:8d4bf2d7f6c47ed2e443e7f753681923:d7e297cea66729bfd84ad62f0597c735269f993c1ddd4a0f3a72212a550dee45	M	1998-04-22	21.0975	6300
2	Marina Fontes	marina@exemplo.com	scrypt:91e0f5c21844fd4cb4d4dbe4b4ecb837:935d88582e2696daa400caa8be9d0cc2128b6faa5605eddb2c8ede16edcca7f5	F	1995-11-08	10.0000	2700
\.


--
-- Data for Name: equipamento; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.equipamento (id_equipamento, id_corredor, marca, modelo, tipo, data_aquisicao, vida_util_km, aposentado, observacao) FROM stdin;
1	1	Asics	Gel-Nimbus 26	Tênis	2026-02-28	800.00	f	Rodagem e treinos longos
2	1	Nike	Zoom Pegasus 41	Tênis	2026-05-19	700.00	f	Ritmo e intervalados
3	1	Mizuno	Wave Rider 26	Tênis	2025-04-14	320.00	t	Aposentado por desgaste do mediopé
4	1	Garmin	Forerunner 265	Relógio	2025-11-20	20000.00	f	\N
5	1	Polar	H10	Cinta cardíaca	2025-11-20	20000.00	f	Usada nos testes de limiar
6	2	Adidas	Adizero SL	Tênis	2026-06-18	650.00	f	\N
\.


--
-- Data for Name: inscricao; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.inscricao (id_inscricao, id_corredor, id_prova, id_plano, data_inscricao, valor_pago, numero_peito, categoria, status, tempo_liquido_seg, colocacao_geral, colocacao_categoria) FROM stdin;
1	1	1	1	2026-05-06	75.00	1184	Geral	Concluído	1385	96	14
2	1	2	2	2026-07-08	119.90	2841	M 25-29	Concluído	2874	184	21
3	1	3	2	2026-07-15	189.00	\N	M 25-29	Confirmado	\N	\N	\N
4	1	4	\N	2026-09-06	260.00	\N	M 25-29	Inscrito	\N	\N	\N
5	2	2	3	2026-07-08	119.90	3092	F 30-34	Concluído	3190	412	38
\.


--
-- Data for Name: percurso; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.percurso (id_percurso, id_corredor, nome, distancia_km, terreno, ganho_elevacao_m, cidade, referencia, ativo) FROM stdin;
1	1	Volta da Lagoa	14.00	Asfalto	180	Florianópolis	Praça da Lagoa da Conceição	t
2	1	Beira-Mar Norte	6.00	Asfalto	15	Florianópolis	Ponte Hercílio Luz	t
3	1	Trilha da Costa da Lagoa	10.00	Trilha	430	Florianópolis	Canto dos Araçás	t
4	1	Pista do CDS/UFSC	8.00	Pista	0	Florianópolis	Portaria do CDS	t
5	1	Esteira — academia	6.00	Esteira	0	Florianópolis	Academia do bairro	f
6	2	Parque de Coqueiros	5.00	Asfalto	25	Florianópolis	Entrada principal	t
\.


--
-- Data for Name: plano; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.plano (id_plano, id_corredor, id_treinador, nome, objetivo, data_inicio, data_fim, descricao) FROM stdin;
1	1	1	Base aeróbica 2026	Construir volume antes do ciclo específico	2026-04-29	2026-06-23	Oito semanas de rodagem em intensidade baixa, com um longo semanal.
2	1	1	Meia de Florianópolis — 12 semanas	Meia maratona abaixo de 1h45	2026-07-22	2026-10-14	Ciclo específico com intervalados na pista, ritmo de prova e longos progressivos.
3	2	2	Sub-45 nos 10 km	Quebrar 45 minutos nos 10 km	2026-08-17	2026-11-15	Ênfase em limiar e tiros curtos.
\.


--
-- Data for Name: prova; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.prova (id_prova, nome, data_prova, distancia_km, cidade, uf, organizador) FROM stdin;
1	Volta à Ilha 5K	2026-05-27	5.0000	Florianópolis	SC	Ilha Running
2	Circuito das Estações 10K	2026-08-05	10.0000	São José	SC	Yescom
3	Meia Maratona de Florianópolis	2026-10-14	21.0975	Florianópolis	SC	Prefeitura de Florianópolis
4	Maratona de Porto Alegre	2027-01-14	42.1950	Porto Alegre	RS	Unimed POA
\.


--
-- Data for Name: recorde; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.recorde (id_recorde, id_corredor, id_prova, distancia_km, melhor_tempo_seg, data_registro) FROM stdin;
1	1	1	5.0000	1385	2026-05-27
2	1	2	10.0000	2874	2026-08-05
3	1	\N	21.0975	6712	2026-06-10
4	2	2	10.0000	3190	2026-08-05
\.


--
-- Data for Name: tipo_treino; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tipo_treino (id_tipo_treino, nome, descricao, intensidade) FROM stdin;
1	Regenerativo	Rodagem leve para recuperação ativa	1
2	Longo	Volume prolongado em intensidade moderada	3
3	Intervalado	Tiros com recuperação entre as repetições	5
4	Tempo run	Esforço contínuo próximo ao limiar anaeróbio	4
5	Fartlek	Variações livres de ritmo ao longo do percurso	3
6	Ritmo de prova	Simulação do pace-alvo da prova	4
7	Tiros	Repetições curtas em velocidade máxima	5
\.


--
-- Data for Name: treinador; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.treinador (id_treinador, nome, cref, email, telefone, assessoria, especialidade, ativo) FROM stdin;
1	Ana Ribeiro	012345-G/SC	ana.ribeiro@ritmolivre.com.br	(48) 99811-4420	Equipe Ritmo Livre	Provas de rua de 10 km a maratona	t
2	Marcos Dalpiaz	087654-G/SC	marcos@passocerto.com.br	(48) 99702-1188	Assessoria Passo Certo	Velocidade e provas de pista	t
3	Helena Vasques	033221-G/PR	helena@corridacerta.com.br	(41) 99655-3390	Corrida Certa	Iniciantes e retomada pós-lesão	f
\.


--
-- Data for Name: treino; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.treino (id_treino, id_corredor, id_plano, id_percurso, id_treino_planejado, id_tipo_treino, data_treino, distancia_km, duracao_seg, percepcao_esforco, observacao) FROM stdin;
1	1	2	2	19	1	2026-09-04	7.66	2935	4	\N
2	1	2	2	13	1	2026-08-21	7.06	2734	4	\N
3	1	2	2	10	1	2026-08-14	6.52	2444	4	\N
4	1	2	2	7	1	2026-08-07	6.48	2352	4	\N
5	1	2	2	1	1	2026-07-24	5.91	2169	4	\N
6	1	2	1	21	2	2026-09-08	17.10	5745	7	Ritmo confortável, últimos 3 km progressivos
7	1	2	1	18	2	2026-09-01	17.05	6002	7	Ritmo confortável, últimos 3 km progressivos
8	1	2	1	15	2	2026-08-25	15.75	5356	7	Ritmo confortável, últimos 3 km progressivos
9	1	2	1	9	2	2026-08-11	15.57	5357	7	Ritmo confortável, últimos 3 km progressivos
10	1	2	1	6	2	2026-08-04	14.34	5163	7	Ritmo confortável, últimos 3 km progressivos
11	1	2	1	3	2	2026-07-28	14.21	4945	7	Ritmo confortável, últimos 3 km progressivos
12	1	2	4	17	3	2026-08-30	9.60	2746	8	8 × 800 m com 400 m de trote
13	1	2	4	14	3	2026-08-23	9.56	2619	8	8 × 800 m com 400 m de trote
14	1	2	4	11	3	2026-08-16	8.83	2559	8	8 × 800 m com 400 m de trote
15	1	2	4	5	3	2026-08-02	8.07	2373	8	8 × 800 m com 400 m de trote
16	1	2	4	2	3	2026-07-26	8.00	2256	8	8 × 800 m com 400 m de trote
17	1	1	2	\N	1	2026-04-30	6.00	2280	3	\N
18	1	1	4	\N	4	2026-05-02	8.00	2400	7	\N
19	1	1	2	\N	1	2026-05-04	6.00	2268	3	\N
20	1	1	1	\N	2	2026-04-29	12.00	4260	6	\N
21	1	1	2	\N	1	2026-05-07	6.18	2348	3	\N
22	1	1	4	\N	4	2026-05-09	8.24	2472	7	\N
23	1	1	2	\N	1	2026-05-11	6.18	2336	3	\N
24	1	1	1	\N	2	2026-05-06	12.36	4388	6	\N
25	1	1	2	\N	1	2026-05-14	6.36	2417	3	\N
26	1	1	4	\N	4	2026-05-16	8.48	2544	7	\N
27	1	1	2	\N	1	2026-05-18	6.36	2404	3	\N
28	1	1	1	\N	2	2026-05-13	12.72	4516	6	\N
29	1	1	2	\N	1	2026-05-21	6.54	2485	3	\N
30	1	1	4	\N	4	2026-05-23	8.72	2616	7	\N
31	1	1	2	\N	1	2026-05-25	6.54	2472	3	\N
32	1	1	1	\N	2	2026-05-20	13.08	4643	6	\N
33	1	1	2	\N	1	2026-05-28	6.72	2554	3	\N
34	1	1	4	\N	4	2026-05-30	8.96	2688	7	\N
35	1	1	2	\N	1	2026-06-01	6.72	2540	3	\N
36	1	1	1	\N	2	2026-05-27	13.44	4771	6	\N
37	1	1	2	\N	1	2026-06-04	6.90	2622	3	\N
38	1	1	4	\N	4	2026-06-06	9.20	2760	7	\N
39	1	1	2	\N	1	2026-06-08	6.90	2608	3	\N
40	1	1	1	\N	2	2026-06-03	13.80	4899	6	\N
41	1	1	2	\N	1	2026-06-11	7.08	2690	3	\N
42	1	1	4	\N	4	2026-06-13	9.44	2832	7	\N
43	1	1	2	\N	1	2026-06-15	7.08	2676	3	\N
44	1	1	1	\N	2	2026-06-10	14.16	5027	6	\N
45	1	1	2	\N	1	2026-06-18	7.26	2759	3	\N
46	1	1	4	\N	4	2026-06-20	9.68	2904	7	\N
47	1	1	2	\N	1	2026-06-22	7.26	2744	3	\N
48	1	1	1	\N	2	2026-06-17	14.52	5155	6	\N
49	1	\N	3	\N	5	2026-09-11	10.20	4100	6	Trilha em ritmo livre
50	1	\N	2	\N	1	2026-09-04	6.00	2328	3	\N
51	1	\N	4	\N	7	2026-08-21	5.00	1340	9	10 × 400 m
52	1	\N	1	\N	2	2026-08-07	14.10	4963	7	\N
53	2	3	6	\N	4	2026-09-13	8.00	2520	8	Limiar de 3 × 2 km
\.


--
-- Data for Name: treino_equipamento; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.treino_equipamento (id_treino, id_equipamento, km_atribuidos) FROM stdin;
17	3	6.00
18	3	8.00
19	3	6.00
20	3	12.00
21	3	6.18
22	3	8.24
23	3	6.18
24	3	12.36
25	3	6.36
26	3	8.48
27	3	6.36
28	3	12.72
29	3	6.54
30	3	8.72
31	3	6.54
32	3	13.08
33	3	6.72
34	3	8.96
35	3	6.72
36	3	13.44
37	3	6.90
38	3	9.20
39	3	6.90
40	3	13.80
41	3	7.08
42	3	9.44
43	3	7.08
44	3	14.16
45	3	7.26
46	3	9.68
47	3	7.26
48	3	14.52
49	2	10.20
6	1	17.10
1	1	7.66
50	1	6.00
7	1	17.05
12	2	9.60
8	1	15.75
13	2	9.56
2	1	7.06
51	2	5.00
14	2	8.83
3	1	6.52
9	1	15.57
4	1	6.48
52	1	14.10
10	1	14.34
15	2	8.07
11	1	14.21
16	2	8.00
5	1	5.91
49	4	10.20
6	4	17.10
1	4	7.66
50	4	6.00
7	4	17.05
12	4	9.60
8	4	15.75
13	4	9.56
2	4	7.06
51	4	5.00
14	4	8.83
3	4	6.52
9	4	15.57
4	4	6.48
52	4	14.10
10	4	14.34
15	4	8.07
11	4	14.21
16	4	8.00
5	4	5.91
47	4	7.26
46	4	9.68
45	4	7.26
48	4	14.52
43	4	7.08
42	4	9.44
41	4	7.08
44	4	14.16
39	4	6.90
38	4	9.20
37	4	6.90
40	4	13.80
35	4	6.72
34	4	8.96
33	4	6.72
36	4	13.44
31	4	6.54
30	4	8.72
29	4	6.54
32	4	13.08
27	4	6.36
26	4	8.48
25	4	6.36
28	4	12.72
23	4	6.18
22	4	8.24
21	4	6.18
24	4	12.36
19	4	6.00
18	4	8.00
17	4	6.00
20	4	12.00
12	5	9.60
13	5	9.56
51	5	5.00
14	5	8.83
15	5	8.07
16	5	8.00
53	6	8.00
\.


--
-- Data for Name: treino_planejado; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.treino_planejado (id_treino_planejado, id_plano, id_percurso, id_tipo_treino, data_planejada, distancia_alvo_km, pace_alvo_seg, status, orientacao) FROM stdin;
22	2	2	1	2026-09-11	7.68	375	Prescrita	\N
23	2	4	3	2026-09-13	10.24	286	Prescrita	\N
24	2	1	2	2026-09-15	17.92	348	Prescrita	\N
25	2	2	1	2026-09-18	7.92	375	Prescrita	\N
26	2	4	3	2026-09-20	10.56	286	Prescrita	\N
27	2	1	2	2026-09-22	18.48	348	Prescrita	\N
28	2	2	1	2026-09-25	8.16	375	Prescrita	\N
29	2	4	3	2026-09-27	10.88	286	Prescrita	\N
30	2	1	2	2026-09-29	19.04	348	Prescrita	\N
31	2	2	1	2026-10-02	8.40	375	Prescrita	\N
32	2	4	3	2026-10-04	11.20	286	Prescrita	\N
33	2	1	2	2026-10-06	19.60	348	Prescrita	\N
34	2	2	1	2026-10-09	8.64	375	Prescrita	\N
35	2	4	3	2026-10-11	11.52	286	Prescrita	\N
36	2	1	2	2026-10-13	20.16	348	Prescrita	\N
1	2	2	1	2026-07-24	6.00	375	Cumprida	\N
2	2	4	3	2026-07-26	8.00	286	Cumprida	\N
3	2	1	2	2026-07-28	14.00	348	Cumprida	\N
5	2	4	3	2026-08-02	8.32	286	Cumprida	\N
6	2	1	2	2026-08-04	14.56	348	Cumprida	\N
7	2	2	1	2026-08-07	6.48	375	Cumprida	\N
9	2	1	2	2026-08-11	15.12	348	Cumprida	\N
10	2	2	1	2026-08-14	6.72	375	Cumprida	\N
11	2	4	3	2026-08-16	8.96	286	Cumprida	\N
13	2	2	1	2026-08-21	6.96	375	Cumprida	\N
14	2	4	3	2026-08-23	9.28	286	Cumprida	\N
15	2	1	2	2026-08-25	16.24	348	Cumprida	\N
17	2	4	3	2026-08-30	9.60	286	Cumprida	\N
18	2	1	2	2026-09-01	16.80	348	Cumprida	\N
19	2	2	1	2026-09-04	7.44	375	Cumprida	\N
21	2	1	2	2026-09-08	17.36	348	Cumprida	\N
4	2	2	1	2026-07-31	6.24	375	Perdida	\N
8	2	4	3	2026-08-09	8.64	286	Perdida	\N
12	2	1	2	2026-08-18	15.68	348	Perdida	\N
16	2	2	1	2026-08-28	7.20	375	Perdida	\N
20	2	4	3	2026-09-06	9.92	286	Perdida	\N
\.


--
-- Name: corredor_id_corredor_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.corredor_id_corredor_seq', 2, true);


--
-- Name: equipamento_id_equipamento_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.equipamento_id_equipamento_seq', 6, true);


--
-- Name: inscricao_id_inscricao_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.inscricao_id_inscricao_seq', 5, true);


--
-- Name: percurso_id_percurso_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.percurso_id_percurso_seq', 6, true);


--
-- Name: plano_id_plano_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.plano_id_plano_seq', 3, true);


--
-- Name: prova_id_prova_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.prova_id_prova_seq', 4, true);


--
-- Name: recorde_id_recorde_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.recorde_id_recorde_seq', 4, true);


--
-- Name: tipo_treino_id_tipo_treino_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tipo_treino_id_tipo_treino_seq', 7, true);


--
-- Name: treinador_id_treinador_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.treinador_id_treinador_seq', 3, true);


--
-- Name: treino_id_treino_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.treino_id_treino_seq', 53, true);


--
-- Name: treino_planejado_id_treino_planejado_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.treino_planejado_id_treino_planejado_seq', 36, true);


--
-- Name: corredor corredor_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.corredor
    ADD CONSTRAINT corredor_email_key UNIQUE (email);


--
-- Name: corredor corredor_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.corredor
    ADD CONSTRAINT corredor_pkey PRIMARY KEY (id_corredor);


--
-- Name: equipamento equipamento_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipamento
    ADD CONSTRAINT equipamento_pkey PRIMARY KEY (id_equipamento);


--
-- Name: inscricao inscricao_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inscricao
    ADD CONSTRAINT inscricao_pkey PRIMARY KEY (id_inscricao);


--
-- Name: percurso percurso_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.percurso
    ADD CONSTRAINT percurso_pkey PRIMARY KEY (id_percurso);


--
-- Name: plano plano_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plano
    ADD CONSTRAINT plano_pkey PRIMARY KEY (id_plano);


--
-- Name: prova prova_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prova
    ADD CONSTRAINT prova_pkey PRIMARY KEY (id_prova);


--
-- Name: recorde recorde_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recorde
    ADD CONSTRAINT recorde_pkey PRIMARY KEY (id_recorde);


--
-- Name: tipo_treino tipo_treino_nome_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipo_treino
    ADD CONSTRAINT tipo_treino_nome_key UNIQUE (nome);


--
-- Name: tipo_treino tipo_treino_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipo_treino
    ADD CONSTRAINT tipo_treino_pkey PRIMARY KEY (id_tipo_treino);


--
-- Name: treinador treinador_cref_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.treinador
    ADD CONSTRAINT treinador_cref_key UNIQUE (cref);


--
-- Name: treinador treinador_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.treinador
    ADD CONSTRAINT treinador_pkey PRIMARY KEY (id_treinador);


--
-- Name: treino_equipamento treino_equipamento_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.treino_equipamento
    ADD CONSTRAINT treino_equipamento_pkey PRIMARY KEY (id_treino, id_equipamento);


--
-- Name: treino treino_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.treino
    ADD CONSTRAINT treino_pkey PRIMARY KEY (id_treino);


--
-- Name: treino_planejado treino_planejado_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.treino_planejado
    ADD CONSTRAINT treino_planejado_pkey PRIMARY KEY (id_treino_planejado);


--
-- Name: percurso uq_percurso_nome; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.percurso
    ADD CONSTRAINT uq_percurso_nome UNIQUE (id_corredor, nome);


--
-- Name: plano uq_plano_nome; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plano
    ADD CONSTRAINT uq_plano_nome UNIQUE (id_corredor, nome);


--
-- Name: prova uq_prova; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prova
    ADD CONSTRAINT uq_prova UNIQUE (nome, data_prova);


--
-- Name: recorde uq_recorde; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recorde
    ADD CONSTRAINT uq_recorde UNIQUE (id_corredor, distancia_km);


--
-- Name: treino uq_treino_planejado; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.treino
    ADD CONSTRAINT uq_treino_planejado UNIQUE (id_treino_planejado);


--
-- Name: idx_equipamento_corredor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_equipamento_corredor ON public.equipamento USING btree (id_corredor) WHERE (NOT aposentado);


--
-- Name: idx_inscricao_corredor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inscricao_corredor ON public.inscricao USING btree (id_corredor, status);


--
-- Name: idx_planejado_plano_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planejado_plano_data ON public.treino_planejado USING btree (id_plano, data_planejada);


--
-- Name: idx_planejado_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planejado_status ON public.treino_planejado USING btree (status);


--
-- Name: idx_treino_corredor_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_treino_corredor_data ON public.treino USING btree (id_corredor, data_treino DESC);


--
-- Name: idx_treino_percurso; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_treino_percurso ON public.treino USING btree (id_percurso);


--
-- Name: idx_treino_plano; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_treino_plano ON public.treino USING btree (id_plano);


--
-- Name: uq_inscricao_ativa; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_inscricao_ativa ON public.inscricao USING btree (id_corredor, id_prova) WHERE ((status)::text <> 'Cancelado'::text);


--
-- Name: equipamento equipamento_id_corredor_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipamento
    ADD CONSTRAINT equipamento_id_corredor_fkey FOREIGN KEY (id_corredor) REFERENCES public.corredor(id_corredor) ON DELETE CASCADE;


--
-- Name: inscricao inscricao_id_corredor_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inscricao
    ADD CONSTRAINT inscricao_id_corredor_fkey FOREIGN KEY (id_corredor) REFERENCES public.corredor(id_corredor) ON DELETE CASCADE;


--
-- Name: inscricao inscricao_id_plano_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inscricao
    ADD CONSTRAINT inscricao_id_plano_fkey FOREIGN KEY (id_plano) REFERENCES public.plano(id_plano) ON DELETE SET NULL;


--
-- Name: inscricao inscricao_id_prova_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inscricao
    ADD CONSTRAINT inscricao_id_prova_fkey FOREIGN KEY (id_prova) REFERENCES public.prova(id_prova) ON DELETE CASCADE;


--
-- Name: percurso percurso_id_corredor_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.percurso
    ADD CONSTRAINT percurso_id_corredor_fkey FOREIGN KEY (id_corredor) REFERENCES public.corredor(id_corredor) ON DELETE CASCADE;


--
-- Name: plano plano_id_corredor_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plano
    ADD CONSTRAINT plano_id_corredor_fkey FOREIGN KEY (id_corredor) REFERENCES public.corredor(id_corredor) ON DELETE CASCADE;


--
-- Name: plano plano_id_treinador_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plano
    ADD CONSTRAINT plano_id_treinador_fkey FOREIGN KEY (id_treinador) REFERENCES public.treinador(id_treinador) ON DELETE SET NULL;


--
-- Name: recorde recorde_id_corredor_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recorde
    ADD CONSTRAINT recorde_id_corredor_fkey FOREIGN KEY (id_corredor) REFERENCES public.corredor(id_corredor) ON DELETE CASCADE;


--
-- Name: recorde recorde_id_prova_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recorde
    ADD CONSTRAINT recorde_id_prova_fkey FOREIGN KEY (id_prova) REFERENCES public.prova(id_prova) ON DELETE SET NULL;


--
-- Name: treino_equipamento treino_equipamento_id_equipamento_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.treino_equipamento
    ADD CONSTRAINT treino_equipamento_id_equipamento_fkey FOREIGN KEY (id_equipamento) REFERENCES public.equipamento(id_equipamento) ON DELETE CASCADE;


--
-- Name: treino_equipamento treino_equipamento_id_treino_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.treino_equipamento
    ADD CONSTRAINT treino_equipamento_id_treino_fkey FOREIGN KEY (id_treino) REFERENCES public.treino(id_treino) ON DELETE CASCADE;


--
-- Name: treino treino_id_corredor_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.treino
    ADD CONSTRAINT treino_id_corredor_fkey FOREIGN KEY (id_corredor) REFERENCES public.corredor(id_corredor) ON DELETE CASCADE;


--
-- Name: treino treino_id_percurso_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.treino
    ADD CONSTRAINT treino_id_percurso_fkey FOREIGN KEY (id_percurso) REFERENCES public.percurso(id_percurso) ON DELETE SET NULL;


--
-- Name: treino treino_id_plano_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.treino
    ADD CONSTRAINT treino_id_plano_fkey FOREIGN KEY (id_plano) REFERENCES public.plano(id_plano) ON DELETE SET NULL;


--
-- Name: treino treino_id_tipo_treino_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.treino
    ADD CONSTRAINT treino_id_tipo_treino_fkey FOREIGN KEY (id_tipo_treino) REFERENCES public.tipo_treino(id_tipo_treino) ON DELETE RESTRICT;


--
-- Name: treino treino_id_treino_planejado_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.treino
    ADD CONSTRAINT treino_id_treino_planejado_fkey FOREIGN KEY (id_treino_planejado) REFERENCES public.treino_planejado(id_treino_planejado) ON DELETE SET NULL;


--
-- Name: treino_planejado treino_planejado_id_percurso_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.treino_planejado
    ADD CONSTRAINT treino_planejado_id_percurso_fkey FOREIGN KEY (id_percurso) REFERENCES public.percurso(id_percurso) ON DELETE SET NULL;


--
-- Name: treino_planejado treino_planejado_id_plano_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.treino_planejado
    ADD CONSTRAINT treino_planejado_id_plano_fkey FOREIGN KEY (id_plano) REFERENCES public.plano(id_plano) ON DELETE CASCADE;


--
-- Name: treino_planejado treino_planejado_id_tipo_treino_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.treino_planejado
    ADD CONSTRAINT treino_planejado_id_tipo_treino_fkey FOREIGN KEY (id_tipo_treino) REFERENCES public.tipo_treino(id_tipo_treino) ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

