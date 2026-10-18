// lib/db.js
// Conexão com o PostgreSQL.
// Lê o endereço do DATABASE_URL no .env.local, ex.:
// DATABASE_URL=postgres://slabwise_app:SENHA@localhost:5432/slabwise
import { Pool } from "pg";

// Em desenvolvimento o Next recarrega os arquivos a cada mudança.
// Guardar o pool no globalThis evita abrir conexões novas toda vez.
const global = globalThis;

function criarPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error("[slabbit] Falta o DATABASE_URL no .env.local");
  }
  return new Pool({ connectionString: process.env.DATABASE_URL, max: 10 });
}

function pool() {
  if (!global._slabbitPool) global._slabbitPool = criarPool();
  return global._slabbitPool;
}

/** Roda uma consulta. Sempre passe os valores separados ($1, $2...), nunca dentro do texto. */
export function query(texto, valores = []) {
  return pool().query(texto, valores);
}
