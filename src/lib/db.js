// lib/db.js
// Conexão com o PostgreSQL.
//
// Dois jeitos de rodar:
// 1. Com DATABASE_URL no .env.local, usa esse Postgres. Ex.:
//    DATABASE_URL=postgres://slabwise_app:SENHA@localhost:5432/slabwise
// 2. Sem DATABASE_URL, em desenvolvimento (npm run dev): sobe um Postgres embutido
//    (PGlite), sem instalar nada. Os dados ficam na pasta .banco-local, na raiz do
//    projeto, e as tabelas são criadas sozinhas na primeira vez a partir do schema.sql.
//    Pra começar do zero, é só apagar a pasta .banco-local.
import fs from "node:fs/promises";
import path from "node:path";
import { Pool as PoolNeon } from "@neondatabase/serverless";
import { Pool } from "pg";

// Em desenvolvimento o Next recarrega os arquivos a cada mudança.
// Guardar a conexão no globalThis evita abrir conexões novas toda vez.
const global = globalThis;

function criarPool() {
  // Sem limite, se a rede bloquear o banco a conexão espera pra sempre e a página fica carregando.
  // Com 8 s, a consulta falha e o site mostra uma mensagem de erro.
  const opcoes = { connectionString: process.env.DATABASE_URL, max: 10, connectionTimeoutMillis: 8000 };

  // Algumas redes (escola, empresa) bloqueiam a porta do Postgres (5432).
  // Com DB_VIA_HTTPS=1 no .env.local, usamos o driver do Neon, que conversa
  // com o banco por WebSocket na porta 443, a mesma dos sites. Só funciona com banco no Neon.
  if (process.env.DB_VIA_HTTPS === "1") return new PoolNeon(opcoes);
  return new Pool(opcoes);
}

// Banco embutido pra desenvolvimento. Só é carregado quando não tem DATABASE_URL.
async function criarBancoLocal() {
  const { PGlite } = await import("@electric-sql/pglite");
  const { citext } = await import("@electric-sql/pglite/contrib/citext");

  const banco = new PGlite(path.join(process.cwd(), ".banco-local"), { extensions: { citext } });

  // Primeira vez? Cria as tabelas com o schema.sql. A parte do usuário "slabwise_app"
  // fica de fora: no banco embutido não existe login de outros usuários.
  const { rows } = await banco.query("select to_regclass('public.usuarios') as existe");
  if (!rows[0].existe) {
    let sql = await fs.readFile(path.join(process.cwd(), "src", "db", "schema.sql"), "utf8");
    const corte = sql.indexOf("-- USUÁRIO DO BANCO PARA O SITE");
    if (corte !== -1) sql = sql.slice(0, corte);
    await banco.exec(sql);
    console.info("[slabbit] banco local criado na pasta .banco-local");
  }

  // Bancos locais criados antes do Pokémon favorito ganham a coluna (mesma coisa da migração 002).
  await banco.exec(
    "alter table usuarios add column if not exists pokemon_favorito smallint check (pokemon_favorito between 1 and 1025)",
  );
  // E as fotos do perfil (migração 003).
  await banco.exec("alter table usuarios add column if not exists foto_url text, add column if not exists banner_url text");

  // Mesmo formato de resposta do "pg" ({ rows, rowCount }), pro resto do site nem perceber a diferença.
  return {
    async query(texto, valores) {
      const r = await banco.query(texto, valores);
      return { rows: r.rows, rowCount: r.affectedRows ?? r.rows.length };
    },
  };
}

function conexao() {
  if (!global._slabbitPool) {
    if (process.env.DATABASE_URL) {
      global._slabbitPool = criarPool();
    } else if (process.env.NODE_ENV !== "production") {
      global._slabbitPool = criarBancoLocal().catch((erro) => {
        global._slabbitPool = null; // tenta de novo na próxima consulta
        throw erro;
      });
    } else {
      throw new Error("[slabbit] Falta o DATABASE_URL nas variáveis de ambiente");
    }
  }
  return global._slabbitPool;
}

/** Roda uma consulta. Sempre passe os valores separados ($1, $2...), nunca dentro do texto. */
export async function query(texto, valores = []) {
  const banco = await conexao();
  return banco.query(texto, valores);
}
