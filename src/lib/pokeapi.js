// lib/pokeapi.js
// Lista de Pokémon e fotos pro "Pokémon favorito" do perfil.
//
// Fonte: PokeAPI (https://pokeapi.co), grátis e sem chave. A lista (nome + número)
// vem de lá; as fotos são as "official artwork" do repositório de sprites dela.
// A lista quase nunca muda, então fica em cache por 7 dias. Se a API cair,
// devolve null e a página segue funcionando.

export const TOTAL_POKEMONS = 1025; // até a Geração 9: todos têm foto oficial
const TEMPO_LIMITE = 6000; // ms
const CACHE_LISTA = 60 * 60 * 24 * 7; // 7 dias

/** Foto oficial do Pokémon pelo número da Pokédex. */
export function fotoPokemon(id) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}

/** "mr-mime" → "Mr Mime" */
export function nomeBonito(slug = "") {
  return slug
    .split("-")
    .map((parte) => parte.charAt(0).toUpperCase() + parte.slice(1))
    .join(" ");
}

/** [{ id, nome }] de todos os Pokémon, ou null se a PokeAPI não responder. */
export async function listarPokemons() {
  try {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${TOTAL_POKEMONS}`, {
      next: { revalidate: CACHE_LISTA },
      signal: AbortSignal.timeout(TEMPO_LIMITE),
    });
    if (!res.ok) {
      console.warn(`[slabbit] ${res.status} ao buscar a lista de Pokémon`);
      return null;
    }
    const { results } = await res.json();
    // O número vem no fim do endereço: .../pokemon/25/
    return results.map((p, i) => ({
      id: Number(p.url.split("/").filter(Boolean).pop()) || i + 1,
      nome: nomeBonito(p.name),
    }));
  } catch (erro) {
    console.warn("[slabbit] falha ao buscar a lista de Pokémon:", erro.message);
    return null;
  }
}
