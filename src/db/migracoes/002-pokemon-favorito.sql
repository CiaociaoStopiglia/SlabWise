-- db/migracoes/002-pokemon-favorito.sql
-- Pra quem já criou o banco: rode só este arquivo no pgAdmin.
-- Guarda o Pokémon favorito de cada usuário (número na Pokédex, de 1 a 1025).
alter table usuarios
  add column if not exists pokemon_favorito smallint
  check (pokemon_favorito between 1 and 1025);
