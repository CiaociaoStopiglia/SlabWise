// app/api/cartas/route.js
// Busca de cartas pro modal "Adicionar carta" (endereço: /api/cartas?q=charizard).
// Devolve só o que o modal mostra: id, nome, coleção, número, foto e preço em real.
import { pesquisarCartas } from "../../../lib/tcgdex";

export async function GET(request) {
  const q = (new URL(request.url).searchParams.get("q") ?? "").trim().slice(0, 60);
  if (q.length < 2) return Response.json({ cartas: [], total: 0, erro: false });

  const { cartas, total, erro } = await pesquisarCartas(q, 24);
  return Response.json({
    total,
    erro,
    cartas: cartas.map((c) => ({
      id: c.id,
      name: c.name,
      set: c.set ?? null,
      number: c.number,
      imagem: c.images?.small ?? null,
      preco: c.preco?.valor ?? null,
    })),
  });
}
