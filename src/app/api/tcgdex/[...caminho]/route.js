// app/api/tcgdex/[...caminho]/route.js
// Ponte pro app do Slabbit: repassa pedidos pra TCGdex.
//
// Algumas redes (escola, empresa) bloqueiam sites de Pokémon. Quando isso acontece,
// o app pede por aqui e quem conversa com a TCGdex é o servidor da Vercel.
//   /api/tcgdex/api/v2/en/cards?name=umbreon  →  https://api.tcgdex.net/v2/en/cards?name=umbreon
//   /api/tcgdex/img/en/swsh/swsh7/215/low.webp →  https://assets.tcgdex.net/en/swsh/swsh7/215/low.webp
// Só repassa pra esses dois endereços, pra ninguém usar a ponte pra acessar outros sites.

import dns from "node:dns";

// Mesmo motivo do lib/tcgdex.js: redes que anunciam IPv6 sem completar a conexão.
dns.setDefaultResultOrder("ipv4first");

const DESTINOS = {
  api: "https://api.tcgdex.net",
  img: "https://assets.tcgdex.net",
};

// Quanto tempo a Vercel guarda a resposta: dados 6 h (igual ao site), fotos 7 dias.
const CACHE = { api: 60 * 60 * 6, img: 60 * 60 * 24 * 7 };

export async function GET(request, { params }) {
  const { caminho } = await params;
  const [tipo, ...resto] = caminho;
  const base = DESTINOS[tipo];
  if (!base || resto.length === 0 || resto.some((p) => p === ".." || p === ".")) {
    return new Response("Não encontrado", { status: 404 });
  }

  const { search } = new URL(request.url);
  const destino = `${base}/${resto.map(encodeURIComponent).join("/")}${search}`;

  try {
    const res = await fetch(destino, {
      signal: AbortSignal.timeout(8000),
      next: { revalidate: CACHE[tipo] },
    });
    const corpo = await res.arrayBuffer();
    return new Response(corpo, {
      status: res.status,
      headers: {
        "content-type": res.headers.get("content-type") ?? "application/octet-stream",
        "cache-control": `public, s-maxage=${CACHE[tipo]}, stale-while-revalidate=86400`,
        "access-control-allow-origin": "*",
      },
    });
  } catch (erro) {
    console.warn(`[slabbit] ponte falhou em ${destino}:`, erro.message);
    return new Response("A TCGdex não respondeu", { status: 502 });
  }
}
