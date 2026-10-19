// src/app/alertas/actions.js
// Criar, pausar e remover alertas de preço. Alerta é recurso do Pro.
"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { query } from "../../lib/db";
import { usuarioAtual } from "../../lib/auth";
import { lerValor } from "../../lib/valores";

const MAXIMO_DE_ALERTAS = 200;

function voltar(destino, aviso, tipo = "ok") {
  const [caminho, ancora] = destino.split("#");
  const sep = caminho.includes("?") ? "&" : "?";
  redirect(`${caminho}${sep}${tipo}=${encodeURIComponent(aviso)}${ancora ? `#${ancora}` : ""}`);
}

// Só volta pra lista de alertas ou pra página de uma carta.
function destinoSeguro(formData) {
  const para = String(formData.get("voltar") ?? "");
  return /^\/(alertas|carta\/[\w.%-]+)$/.test(para) ? para : "/alertas";
}

async function exigirPro(destino) {
  const usuario = await usuarioAtual();
  if (!usuario) redirect(`/entrar?voltar=${encodeURIComponent(destino)}`);
  if (usuario.plano !== "pro") voltar(destino, "Alertas de preço são do plano Pro.", "erro");
  return usuario;
}

export async function criarAlerta(formData) {
  const destino = destinoSeguro(formData);
  const usuario = await exigirPro(destino);

  const cartaId = String(formData.get("carta_id") ?? "").trim();
  const direcao = formData.get("direcao") === "acima" ? "acima" : "abaixo";
  const alvo = lerValor(formData.get("preco_alvo"));

  if (!cartaId || cartaId.length > 40) voltar(destino, "Não achamos essa carta.", "erro");
  if (!alvo) voltar(`${destino}#alerta`, "Digite um preço-alvo, ex.: 1.500", "erro");

  try {
    const { rows } = await query("select count(*)::int as total from alertas where usuario_id = $1", [usuario.id]);
    if (rows[0].total >= MAXIMO_DE_ALERTAS) {
      voltar(`${destino}#alerta`, `Você já tem ${MAXIMO_DE_ALERTAS} alertas. Remova algum antes.`, "erro");
    }
    await query("insert into alertas (usuario_id, carta_id, direcao, preco_alvo) values ($1, $2, $3, $4)", [
      usuario.id,
      cartaId,
      direcao,
      alvo,
    ]);
  } catch (erro) {
    // redirect() funciona lançando um erro especial; esse tem que seguir em frente.
    if (erro?.digest?.startsWith?.("NEXT_REDIRECT")) throw erro;
    console.error("[slabbit] erro ao criar alerta:", erro.message);
    voltar(`${destino}#alerta`, "Não conseguimos salvar o alerta agora. Tente de novo.", "erro");
  }

  revalidatePath("/alertas");
  voltar(`${destino}#alerta`, "Alerta criado. A gente avisa por e-mail.");
}

export async function alternarAlerta(formData) {
  const usuario = await exigirPro("/alertas");
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) redirect("/alertas");
  try {
    await query("update alertas set ativo = not ativo where id = $1 and usuario_id = $2", [id, usuario.id]);
  } catch (erro) {
    console.error("[slabbit] erro ao pausar alerta:", erro.message);
    voltar("/alertas", "Não conseguimos mudar o alerta agora.", "erro");
  }
  revalidatePath("/alertas");
  redirect("/alertas");
}

export async function removerAlerta(formData) {
  const usuario = await usuarioAtual();
  if (!usuario) redirect("/entrar?voltar=/alertas");
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) redirect("/alertas");
  try {
    await query("delete from alertas where id = $1 and usuario_id = $2", [id, usuario.id]);
  } catch (erro) {
    console.error("[slabbit] erro ao remover alerta:", erro.message);
    voltar("/alertas", "Não conseguimos remover o alerta agora.", "erro");
  }
  revalidatePath("/alertas");
  voltar("/alertas", "Alerta removido.");
}
