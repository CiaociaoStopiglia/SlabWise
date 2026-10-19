// lib/db.js
// Conexão com o PostgreSQL.
// Lê o endereço do DATABASE_URL no .env.local, ex.:
// DATABASE_URL=postgres://slabwise_app:SENHA@localhost:5432/slabwise
import { Pool as PoolNeon } from "@neondatabase/serverless";
import { Pool } from "pg";

// Em desenvolvimento o Next recarrega os arquivos a cada mudança.
// Guardar o pool no globalThis evita abrir conexões novas toda vez.
const global = globalThis;

function criarPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error("[slabbit] Falta o DATABASE_URL no .env.local");
  }
  // Sem limite, se a rede bloquear o banco a conexão espera pra sempre e a página fica carregando.
  // Com 8 s, a consulta falha e o site mostra uma mensagem de erro.
  const opcoes = { connectionString: process.env.DATABASE_URL, max: 10, connectionTimeoutMillis: 8000 };

  // Algumas redes (escola, empresa) bloqueiam a porta do Postgres (5432).
  // Com DB_VIA_HTTPS=1 no .env.local, usamos o driver do Neon, que conversa
  // com o banco por WebSocket na porta 443, a mesma dos sites. Só funciona com banco no Neon.
  if (process.env.DB_VIA_HTTPS === "1") return new PoolNeon(opcoes);
  return new Pool(opcoes);
}

function pool() {
  if (!global._slabbitPool) global._slabbitPool = criarPool();
  return global._slabbitPool;
}

/** Roda uma consulta. Sempre passe os valores separados ($1, $2...), nunca dentro do texto. */
export function query(texto, valores = []) {
  return pool().query(texto, valores);
}
