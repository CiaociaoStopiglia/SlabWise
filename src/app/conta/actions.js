// src/app/conta/actions.js
// Dados da conta: nome, senha e excluir conta.
"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { query } from "../../lib/db";
import { encerrarSessao, hashSenha, usuarioAtual, verificarSenha } from "../../lib/auth";

function voltar(aviso, tipo = "ok") {
  redirect(`/conta?${tipo}=${encodeURIComponent(aviso)}`);
}

async function exigirLogin() {
  const usuario = await usuarioAtual();
  if (!usuario) redirect("/entrar?voltar=/conta");
  return usuario;
}

async function senhaConfere(usuarioId, senha) {
  const { rows } = await query("select senha_hash from usuarios where id = $1", [usuarioId]);
  return verificarSenha(senha, rows[0]?.senha_hash);
}

export async function atualizarNome(formData) {
  const usuario = await exigirLogin();
  const nome = String(formData.get("nome") ?? "").trim();
  if (!nome || nome.length > 80) voltar("O nome precisa ter de 1 a 80 letras.", "erro");
  try {
    await query("update usuarios set nome = $2 where id = $1", [usuario.id, nome]);
  } catch (erro) {
    console.error("[slabbit] erro ao mudar o nome:", erro.message);
    voltar("Não conseguimos salvar agora. Tente de novo.", "erro");
  }
  revalidatePath("/", "layout");
  voltar("Dados salvos.");
}

export async function alterarSenha(formData) {
  const usuario = await exigirLogin();
  const atual = String(formData.get("senha_atual") ?? "");
  const nova = String(formData.get("senha_nova") ?? "");
  const repetida = String(formData.get("senha_repetida") ?? "");

  if (nova.length < 8) voltar("A senha nova precisa ter pelo menos 8 caracteres.", "erro");
  if (Buffer.byteLength(nova) > 72) voltar("A senha nova pode ter no máximo 72 caracteres.", "erro");
  if (nova !== repetida) voltar("As duas senhas novas não são iguais.", "erro");

  try {
    if (!(await senhaConfere(usuario.id, atual))) voltar("A senha atual não confere.", "erro");
    await query("update usuarios set senha_hash = $2 where id = $1", [usuario.id, await hashSenha(nova)]);
  } catch (erro) {
    if (erro?.digest?.startsWith?.("NEXT_REDIRECT")) throw erro;
    console.error("[slabbit] erro ao trocar a senha:", erro.message);
    voltar("Não conseguimos trocar a senha agora. Tente de novo.", "erro");
  }
  voltar("Senha alterada.");
}

export async function excluirConta(formData) {
  const usuario = await exigirLogin();
  const senha = String(formData.get("senha") ?? "");
  try {
    if (!(await senhaConfere(usuario.id, senha))) voltar("Senha incorreta. A conta não foi excluída.", "erro");
    // "on delete cascade" no banco apaga junto sessões, coleção, alertas e simulações.
    await query("delete from usuarios where id = $1", [usuario.id]);
  } catch (erro) {
    if (erro?.digest?.startsWith?.("NEXT_REDIRECT")) throw erro;
    console.error("[slabbit] erro ao excluir conta:", erro.message);
    voltar("Não conseguimos excluir a conta agora. Tente de novo.", "erro");
  }
  await encerrarSessao();
  redirect("/");
}

// ---------------------------------------------------------------------
// MODO DESENVOLVIMENTO (só no "npm run dev")
// Atalhos pra testar o site sem pagamento: virar Pro, voltar pro Grátis e
// criar histórico de mentira pros gráficos. Em produção essas ações não fazem nada.
// ---------------------------------------------------------------------
const emDesenvolvimento = () => process.env.NODE_ENV === "development";

export async function mudarPlanoDev(formData) {
  if (!emDesenvolvimento()) redirect("/conta");
  const usuario = await exigirLogin();
  const plano = formData.get("plano") === "pro" ? "pro" : "gratis";
  await query(
    `update usuarios
        set plano = $2, pro_ate = case when $2 = 'pro' then now() + interval '30 days' end
      where id = $1`,
    [usuario.id, plano],
  );
  revalidatePath("/", "layout");
  voltar(plano === "pro" ? "Pronto: sua conta virou Pro por 30 dias." : "Pronto: sua conta voltou pro Grátis.");
}

export async function gerarHistoricoDev() {
  if (!emDesenvolvimento()) redirect("/conta");
  const usuario = await exigirLogin();
  // 90 dias do valor da coleção, subindo devagar
  await query(
    `insert into valor_colecao (usuario_id, dia, valor, investido)
     select $1, current_date - n, 18000 - n * 40 + random() * 900, 15000
       from generate_series(1, 90) n
     on conflict do nothing`,
    [usuario.id],
  );
  // 90 dias de preço de cada carta da sua coleção (variando até 15% pra cima ou pra baixo)
  await query(
    `insert into historico_precos (carta_id, dia, valor)
     select c.carta_id, current_date - n, greatest(1, coalesce(h.valor, 500) * (0.85 + random() * 0.3))
       from (select distinct carta_id from colecao where usuario_id = $1) c
       left join lateral (
         select valor from historico_precos where carta_id = c.carta_id order by dia desc limit 1
       ) h on true
       cross join generate_series(1, 90) n
     on conflict do nothing`,
    [usuario.id],
  );
  revalidatePath("/", "layout");
  voltar("Histórico de teste criado: veja na coleção e na página das suas cartas.");
}
