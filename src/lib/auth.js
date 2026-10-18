// lib/auth.js
// Contas e sessões.
// - A senha vira um hash bcrypt; o banco nunca vê a senha.
// - Ao entrar, o navegador recebe um token aleatório num cookie httpOnly
//   (o JavaScript da página não consegue ler). No banco fica só o hash do token.
import crypto from "node:crypto";
import { cache } from "react";
import bcrypt from "bcryptjs";
import { cookies, headers } from "next/headers";
import { query } from "./db";

const COOKIE = "slabbit_sessao";
const DIAS_DE_SESSAO = 30;
const CUSTO_BCRYPT = 12;

export const hashSenha = (senha) => bcrypt.hash(senha, CUSTO_BCRYPT);

// Hash de uma senha qualquer. Quando o e-mail não existe, comparamos com ele
// pra resposta demorar o mesmo tempo e ninguém descobrir quais e-mails têm conta.
let hashFalso;
export async function verificarSenha(senha, hash) {
  if (!hash) {
    hashFalso ??= await bcrypt.hash("senha-que-nao-existe", CUSTO_BCRYPT);
    await bcrypt.compare(senha, hashFalso);
    return false;
  }
  return bcrypt.compare(senha, hash);
}

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

/** Cria a sessão no banco e grava o cookie. Chamar só em Server Actions. */
export async function criarSessao(usuarioId) {
  const token = crypto.randomBytes(32).toString("base64url");
  const userAgent = (await headers()).get("user-agent")?.slice(0, 300) ?? null;

  await query("insert into sessoes (usuario_id, token_hash, user_agent) values ($1, $2, $3)", [
    usuarioId,
    hashToken(token),
    userAgent,
  ]);

  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DIAS_DE_SESSAO * 24 * 60 * 60,
  });
}

/**
 * Quem tá logado agora: { id, nome, email, plano } ou null.
 * O cache faz o banco ser consultado uma vez só por carregamento de página.
 * Se o banco estiver fora do ar, devolve null e o site continua funcionando.
 */
export const usuarioAtual = cache(async () => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { rows } = await query(
      `select u.id, u.nome, u.email, u.plano
         from sessoes s
         join usuarios u on u.id = s.usuario_id
        where s.token_hash = $1 and s.expira_em > now()`,
      [hashToken(token)]
    );
    return rows[0] ?? null;
  } catch (erro) {
    console.error("[slabbit] erro ao ler a sessão:", erro.message);
    return null;
  }
});

/** Apaga a sessão do banco e o cookie. Chamar só em Server Actions. */
export async function encerrarSessao() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) {
    await query("delete from sessoes where token_hash = $1", [hashToken(token)]).catch(() => {});
  }
  jar.delete(COOKIE);
}
