// lib/cloudinary.js
// Envia a foto de perfil e o banner pro Cloudinary (https://cloudinary.com).
//
// O envio é "assinado": o servidor assina o pedido com o API Secret (que nunca vai pro
// navegador) e manda o arquivo. O banco guarda só o endereço (https://res.cloudinary.com/...).
// Sem as 3 variáveis no .env.local, o envio fica desligado e o resto do site funciona.
import crypto from "node:crypto";

const TEMPO_LIMITE = 20000; // ms (upload é mais lento que uma consulta)
export const TAMANHO_MAXIMO = 5 * 1024 * 1024; // 5 MB
export const TIPOS_ACEITOS = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export const cloudinaryLigado = () =>
  Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );

/**
 * Envia um arquivo (File do formulário) e devolve o endereço da imagem, ou null se falhar.
 * tipo: "avatar" (quadrado, rosto no centro) ou "banner" (largo).
 * Sobrescreve a imagem anterior da mesma pessoa (public_id fixo por usuário).
 */
export async function enviarImagem(arquivo, usuarioId, tipo) {
  const nuvem = process.env.CLOUDINARY_CLOUD_NAME;
  const chave = process.env.CLOUDINARY_API_KEY;
  const segredo = process.env.CLOUDINARY_API_SECRET;

  // Corta e reduz já no envio, pra ninguém guardar uma foto de 20 MB
  const transformacao =
    tipo === "banner"
      ? "c_fill,g_auto,w_1600,h_400"
      : "c_fill,g_face,w_400,h_400";
  const parametros = {
    folder: `slabbit/${tipo}`,
    invalidate: "true",
    overwrite: "true",
    public_id: String(usuarioId),
    timestamp: String(Math.floor(Date.now() / 1000)),
    transformation: transformacao,
  };

  // Assinatura: parâmetros em ordem alfabética (a..z) + segredo, em SHA-1
  const texto = Object.keys(parametros)
    .sort()
    .map((k) => `${k}=${parametros[k]}`)
    .join("&");
  const assinatura = crypto
    .createHash("sha1")
    .update(texto + segredo)
    .digest("hex");

  const corpo = new FormData();
  corpo.set("file", arquivo);
  for (const [k, v] of Object.entries(parametros)) corpo.set(k, v);
  corpo.set("api_key", chave);
  corpo.set("signature", assinatura);

  try {
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${nuvem}/image/upload`,
      {
        method: "POST",
        body: corpo,
        signal: AbortSignal.timeout(TEMPO_LIMITE),
      },
    );
    if (!res.ok) {
      console.warn(`[slabbit] ${res.status} no Cloudinary:`, await res.text());
      return null;
    }
    const { secure_url, version } = await res.json();
    // A versão no endereço faz o navegador buscar a foto nova em vez da antiga em cache
    return (
      secure_url ??
      `https://res.cloudinary.com/${nuvem}/image/upload/v${version}/${parametros.folder}/${usuarioId}`
    );
  } catch (erro) {
    console.warn(
      "[slabbit] falha ao enviar imagem pro Cloudinary:",
      erro.message,
    );
    return null;
  }
}
