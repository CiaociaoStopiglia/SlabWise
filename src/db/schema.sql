-- db/schema.sql
-- =====================================================================
-- SLABBIT · banco de dados (PostgreSQL)
-- Rode no pgAdmin: clique no banco "slabwise" > Query Tool > cole tudo > Execute (F5)
-- =====================================================================

-- E-mail sem diferenciar maiúsculas (Joao@x.com = joao@x.com)
create extension if not exists citext;

-- ---------------------------------------------------------------------
-- USUÁRIOS
-- A senha NUNCA é salva como texto. O site gera um hash (bcrypt) e salva só ele.
-- ---------------------------------------------------------------------
create table usuarios (
  id            bigint generated always as identity primary key,
  email         citext not null unique,
  senha_hash    text   not null,
  nome          text   not null check (length(trim(nome)) between 1 and 80),
  plano         text   not null default 'gratis' check (plano in ('gratis', 'pro')),
  pro_ate       timestamptz,                       -- até quando o Pro tá pago
  email_confirmado boolean not null default false,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint email_valido check (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);

-- ---------------------------------------------------------------------
-- SESSÕES (quem tá logado)
-- O navegador guarda um token num cookie; aqui fica só o hash dele.
-- Se o banco vazar, ninguém consegue usar os tokens.
-- ---------------------------------------------------------------------
create table sessoes (
  id          bigint generated always as identity primary key,
  usuario_id  bigint not null references usuarios(id) on delete cascade,
  token_hash  text   not null unique,
  expira_em   timestamptz not null default now() + interval '30 days',
  criado_em   timestamptz not null default now(),
  user_agent  text
);

create index sessoes_usuario_idx on sessoes (usuario_id);

-- ---------------------------------------------------------------------
-- RECUPERAÇÃO DE SENHA ("esqueci minha senha")
-- ---------------------------------------------------------------------
create table recuperacoes_senha (
  id          bigint generated always as identity primary key,
  usuario_id  bigint not null references usuarios(id) on delete cascade,
  token_hash  text   not null unique,
  expira_em   timestamptz not null default now() + interval '1 hour',
  usado_em    timestamptz
);

-- ---------------------------------------------------------------------
-- COLEÇÃO
-- ---------------------------------------------------------------------
create table colecao (
  id            bigint generated always as identity primary key,
  usuario_id    bigint not null references usuarios(id) on delete cascade,
  carta_id      text   not null,                    -- id da TCGdex, ex.: 'swsh7-215'
  quantidade    int    not null default 1 check (quantidade > 0),
  estado        text   not null default 'NM' check (estado in ('NM', 'LP', 'MP', 'HP', 'DMG')),
  graduacao     text,                               -- ex.: 'PSA 10' (vazio = sem graduar)
  preco_pago    numeric(10, 2) check (preco_pago >= 0),
  adicionada_em timestamptz not null default now(),
  -- "nulls not distinct": duas linhas da mesma carta sem graduação contam como repetidas (PostgreSQL 15+)
  unique nulls not distinct (usuario_id, carta_id, estado, graduacao)
);

create index colecao_usuario_idx on colecao (usuario_id);

-- ---------------------------------------------------------------------
-- SIMULAÇÕES SALVAS do "Vale graduar?" (recurso do Pro)
-- ---------------------------------------------------------------------
create table simulacoes (
  id          bigint generated always as identity primary key,
  usuario_id  bigint not null references usuarios(id) on delete cascade,
  carta_id    text,
  dados       jsonb  not null,                      -- valores, estado e custos usados
  veredito    text   check (veredito in ('vale', 'so10', 'nao')),
  criada_em   timestamptz not null default now()
);

create index simulacoes_usuario_idx on simulacoes (usuario_id);

-- ---------------------------------------------------------------------
-- REGRAS AUTOMÁTICAS
-- ---------------------------------------------------------------------

-- Atualiza "atualizado_em" sozinho
create function marcar_atualizacao() returns trigger language plpgsql as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;

create trigger usuarios_atualizado
  before update on usuarios
  for each row execute function marcar_atualizacao();

-- Plano grátis: no máximo 100 cartas diferentes na coleção
create function limitar_colecao_gratis() returns trigger language plpgsql as $$
declare
  v_plano text;
  v_total int;
begin
  select plano into v_plano from usuarios where id = new.usuario_id;
  if v_plano = 'gratis' then
    select count(*) into v_total from colecao where usuario_id = new.usuario_id;
    if v_total >= 100 then
      raise exception 'LIMITE_GRATIS: o plano grátis guarda até 100 cartas'
        using errcode = 'check_violation';
    end if;
  end if;
  return new;
end;
$$;

create trigger colecao_limite
  before insert on colecao
  for each row execute function limitar_colecao_gratis();

-- ---------------------------------------------------------------------
-- USUÁRIO DO BANCO PARA O SITE
-- O site não deve conectar como "postgres" (superusuário).
-- Troque a senha abaixo antes de rodar.
-- ---------------------------------------------------------------------
create role slabwise_app login password 'TROQUE_ESTA_SENHA';
grant usage on schema public to slabwise_app;
grant select, insert, update, delete on usuarios, sessoes, recuperacoes_senha, colecao, simulacoes to slabwise_app;
grant usage on all sequences in schema public to slabwise_app;
