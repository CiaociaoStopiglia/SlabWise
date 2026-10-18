// src/app/entrar/actions.js
"use server";

import { redirect } from "next/navigation";
import { query } from "../../lib/db";
import { criarSessao, encerrarSessao, hashSenha, verificarSenha } from "../../lib/auth";

const EMAIL_VALIDO = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function lerCampos(formData) {
  return {
    nome: String(formData.get("nome") ?? "").trim(),
    email: String(formData.get("email") ?? "")
      .trim()
      .toLowerCase(),
    senha: String(formData.get("senha") ?? ""),
  };
}

// Só aceita voltar pra páginas do próprio site (evita redirecionar pra sites de fora).
function destinoSeguro(formData) {
  const para = String(formData.get("voltar") ?? "/");
  return para.startsWith("/") && !para.startsWith("//") ? para : "/";
}

export async function cadastrar(_estadoAnterior, formData) {
  const { nome, email, senha } = lerCampos(formData);
  const valores = { nome, email };

  if (!nome) return { erro: "Conta pra gente como podemos te chamar.", valores };
  if (nome.length > 80) return { erro: "O nome pode ter no máximo 80 letras.", valores };
  if (!EMAIL_VALIDO.test(email)) return { erro: "Esse e-mail não parece válido. Confira se digitou certo.", valores };
  if (senha.length < 8) return { erro: "A senha precisa ter pelo menos 8 caracteres.", valores };
  if (Buffer.byteLength(senha) > 72) return { erro: "A senha pode ter no máximo 72 caracteres.", valores };

  let usuarioId;
  try {
    const { rows } = await query(
      "insert into usuarios (email, senha_hash, nome) values ($1, $2, $3) returning id",
      [email, await hashSenha(senha), nome]
    );
    usuarioId = rows[0].id;
  } catch (erro) {
    if (erro.code === "23505") {
      return { erro: "Já existe uma conta com esse e-mail. Use a aba Entrar.", valores };
    }
    console.error("[slabbit] erro no cadastro:", erro.message);
    return { erro: "Não conseguimos criar sua conta agora. Tente de novo em alguns segundos.", valores };
  }

  await criarSessao(usuarioId);
  redirect(destinoSeguro(formData));
}

export async function entrar(_estadoAnterior, formData) {
  const { email, senha } = lerCampos(formData);
  const valores = { email };

  if (!email || !senha) return { erro: "Preencha o e-mail e a senha.", valores };

  let usuario;
  try {
    const { rows } = await query("select id, senha_hash from usuarios where email = $1", [email]);
    usuario = rows[0];
  } catch (erro) {
    console.error("[slabbit] erro no login:", erro.message);
    return { erro: "Não conseguimos entrar agora. Tente de novo em alguns segundos.", valores };
  }

  const ok = await verificarSenha(senha, usuario?.senha_hash);
  // Mesma mensagem pros dois casos, pra não revelar quais e-mails têm conta.
  if (!usuario || !ok) return { erro: "E-mail ou senha incorretos.", valores };

  await criarSessao(usuario.id);
  redirect(destinoSeguro(formData));
}

export async function sair() {
  await encerrarSessao();
  redirect("/");
}
