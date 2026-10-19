-- db/migracoes/001-area-logada.sql
-- Pra quem já criou o banco com o schema.sql antigo: rode só este arquivo no pgAdmin.
-- Cria as tabelas do histórico de preços, do valor da coleção e dos alertas.

-- ---------------------------------------------------------------------
-- HISTÓRICO DE PREÇOS
-- A TCGdex só dá o preço de hoje e médias. Pra ter gráfico, guardamos
-- uma "foto" do preço por dia, toda vez que alguém abre a carta.
-- ---------------------------------------------------------------------
create table historico_precos (
  carta_id  text not null,
  dia       date not null default current_date,
  valor     numeric(12, 2) not null check (valor >= 0),
  primary key (carta_id, dia)
);

-- ---------------------------------------------------------------------
-- VALOR DA COLEÇÃO AO LONGO DO TEMPO
-- Uma linha por usuário por dia, gravada quando a pessoa abre a coleção.
-- ---------------------------------------------------------------------
create table valor_colecao (
  usuario_id  bigint not null references usuarios(id) on delete cascade,
  dia         date   not null default current_date,
  valor       numeric(12, 2) not null check (valor >= 0),
  investido   numeric(12, 2) not null default 0 check (investido >= 0),
  primary key (usuario_id, dia)
);

-- ---------------------------------------------------------------------
-- ALERTAS DE PREÇO (recurso do Pro)
-- "Me avise quando a carta X cair abaixo de / subir acima de R$ Y"
-- ---------------------------------------------------------------------
create table alertas (
  id            bigint generated always as identity primary key,
  usuario_id    bigint not null references usuarios(id) on delete cascade,
  carta_id      text   not null,
  direcao       text   not null check (direcao in ('abaixo', 'acima')),
  preco_alvo    numeric(10, 2) not null check (preco_alvo > 0),
  ativo         boolean not null default true,
  disparado_em  timestamptz,                       -- quando o aviso foi mandado
  criado_em     timestamptz not null default now()
);

create index alertas_usuario_idx on alertas (usuario_id);

grant select, insert, update, delete on historico_precos, valor_colecao, alertas to slabwise_app;
grant usage on all sequences in schema public to slabwise_app;
