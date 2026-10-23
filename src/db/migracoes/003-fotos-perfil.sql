-- db/migracoes/003-fotos-perfil.sql
-- Pra quem já criou o banco: rode só este arquivo no pgAdmin.
-- Endereços (Cloudinary) da foto de perfil e do banner de cada usuário.
alter table usuarios
  add column if not exists foto_url   text,
  add column if not exists banner_url text;
