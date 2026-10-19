// lib/tcgdex.js
// Dados das cartas e preços em real.
//
// Fontes:
// - TCGdex (https://tcgdex.dev): dados, imagens e preços da TCGplayer (USD) e
//   da Cardmarket (EUR). Grátis e sem chave.
// - AwesomeAPI (https://docs.awesomeapi.com.br): cotação do dólar e do euro.
//   Funciona sem chave; com a chave (variável AWESOMEAPI_KEY no .env.local)
//   você tem 100 mil consultas grátis por mês.
//
// Tudo fica em cache no servidor do Next, então a página não chama as APIs
// a cada visita.

import dns from "node:dns";
import { respostaOffline } from "./cartasOffline";

// Muitas redes no Brasil anunciam IPv6 mas não completam a conexão.
// Isso faz o servidor tentar IPv4 primeiro (o navegador já faz isso sozinho).
dns.setDefaultResultOrder("ipv4first");

const TCGDEX = "https://api.tcgdex.net/v2/en";
// CARTAS_OFFLINE=1 no .env.local: usa as cartas de mentira de cartasOffline.js em vez da TCGdex
// (pra desenvolver em rede que bloqueia sites de Pokémon). O câmbio continua real.
const OFFLINE = process.env.CARTAS_OFFLINE === "1";
const TEMPO_LIMITE = 6000; // ms: se a API não responder, a página não fica travada
const CACHE_CARTAS = 60 * 60 * 6; // 6 horas
const CACHE_COTACAO = 60 * 60; // 1 hora
const AMOSTRA_POR_NOME = 10; // quantas versões de cada Pokémon comparar

// Se quiser fixar uma carta específica para um nome, coloque o id da TCGdex aqui.
// Ex.: { Charizard: "base1-4" }  (Charizard do Base Set)
const CARTAS_FIXAS = {};

async function getJSON(url, revalidate, headers) {
  if (OFFLINE && url.startsWith(TCGDEX)) return respostaOffline(url);
  try {
    const res = await fetch(url, {
      headers,
      next: { revalidate },
      signal: AbortSignal.timeout(TEMPO_LIMITE),
    });
    if (!res.ok) {
      console.warn(`[slabbit] ${res.status} ao buscar ${url}`);
      return null;
    }
    return await res.json();
  } catch (erro) {
    console.warn(`[slabbit] falha ao buscar ${url}:`, erro.message);
    return null;
  }
}

/** Monta a URL da imagem. qualidade: "high" (600x825) ou "low" (245x337). */
export function imagemDaCarta(base, qualidade = "high") {
  return base ? `${base}/${qualidade}.webp` : null;
}

// Último recurso se as duas APIs de câmbio falharem. Atualize de vez em quando.
const COTACAO_RESERVA = { usd: 5.4, eur: 6.3 };

/**
 * Cotação de hoje em reais: { usd, eur, fonte }.
 * Tenta a AwesomeAPI, depois a ExchangeRate-API (grátis, sem chave)
 * e, se as duas falharem, usa a cotação de reserva.
 */
export async function cotacaoDoDia() {
  const chave = process.env.AWESOMEAPI_KEY;
  const awesome = await getJSON(
    "https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL",
    CACHE_COTACAO,
    chave ? { "x-api-key": chave } : undefined
  );
  const usd1 = Number(awesome?.USDBRL?.bid);
  const eur1 = Number(awesome?.EURBRL?.bid);
  if (usd1 && eur1) return { usd: usd1, eur: eur1, fonte: "AwesomeAPI" };

  const er = await getJSON("https://open.er-api.com/v6/latest/BRL", CACHE_COTACAO);
  const porUsd = er?.rates?.USD; // quantos dólares vale 1 real
  const porEur = er?.rates?.EUR;
  if (porUsd && porEur) return { usd: 1 / porUsd, eur: 1 / porEur, fonte: "ExchangeRate-API" };

  console.warn("[slabbit] câmbio indisponível, usando cotação de reserva");
  return { ...COTACAO_RESERVA, fonte: "reserva" };
}

// Ordem de preferência das versões da carta na TCGplayer.
const VARIANTES = ["holofoil", "holo", "normal", "1stEditionHolofoil", "unlimitedHolofoil", "reverse-holofoil", "reverse"];

// A Cardmarket separa os números da versão normal e da holo. Cartas holo têm o preço real
// nos campos "-holo" (os normais ficam baixos ou zerados), então usamos o conjunto mais alto.
function camposCardmarket(cm) {
  const holo = (cm?.["trend-holo"] ?? 0) > (cm?.trend ?? 0);
  const k = (nome) => cm?.[holo ? `${nome}-holo` : nome] ?? null;
  return { trend: k("trend"), avg7: k("avg7"), avg30: k("avg30"), low: k("low") ?? cm?.low ?? null };
}

/**
 * Converte o preço da carta para reais.
 * Usa o preço de mercado da TCGplayer; se não houver, usa a tendência da Cardmarket.
 * A variação compara o preço atual com a média de 30 dias da Cardmarket.
 */
export function precoEmReais(pricing, cotacao) {
  if (!pricing) return null;
  const tcg = pricing.tcgplayer;
  const cm = pricing.cardmarket;

  let valor = null;
  let fonte = null;

  if (tcg && cotacao.usd) {
    const chaves = [...VARIANTES, ...Object.keys(tcg)];
    for (const k of chaves) {
      const mercado = tcg[k]?.marketPrice;
      if (typeof mercado === "number" && mercado > 0) {
        valor = mercado * cotacao.usd;
        fonte = "TCGplayer";
        break;
      }
    }
  }

  if (valor === null && cm && cotacao.eur) {
    const tendencia = camposCardmarket(cm).trend || cm.avg;
    if (typeof tendencia === "number" && tendencia > 0) {
      valor = tendencia * cotacao.eur;
      fonte = "Cardmarket";
    }
  }

  if (valor === null) return null;

  let variacao30 = null;
  const campos = camposCardmarket(cm);
  if (campos.trend && campos.avg30) {
    variacao30 = (campos.trend / campos.avg30 - 1) * 100;
  }

  return { valor, fonte, variacao30 };
}

export function formatarReais(valor) {
  const casas = valor >= 100 ? 0 : 2; // R$ 1.240 / R$ 5,43
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  }).format(valor);
}

function normalizarCarta(c, cotacao) {
  const total = c.set?.cardCount?.official;
  return {
    id: c.id,
    name: c.name,
    set: c.set?.name ?? "",
    number: total ? `${c.localId}/${total}` : c.localId,
    rarity: c.rarity ?? null,
    images: {
      small: imagemDaCarta(c.image, "low"),
      large: imagemDaCarta(c.image, "high"),
    },
    preco: precoEmReais(c.pricing, cotacao),
  };
}

/** Uma carta completa pelo id da TCGdex (ex.: "base1-4"). */
export async function buscarCartaPorId(id, cotacao) {
  const c = await getJSON(`${TCGDEX}/cards/${encodeURIComponent(id)}`, CACHE_CARTAS);
  if (!c?.image) return null;
  return normalizarCarta(c, cotacao ?? (await cotacaoDoDia()));
}

const TIPOS_PT = {
  Grass: "Planta",
  Fire: "Fogo",
  Water: "Água",
  Lightning: "Elétrico",
  Psychic: "Psíquico",
  Fighting: "Lutador",
  Darkness: "Sombrio",
  Metal: "Metal",
  Dragon: "Dragão",
  Fairy: "Fada",
  Colorless: "Incolor",
};
const CATEGORIAS_PT = { Pokemon: "Pokémon", Trainer: "Treinador", Energy: "Energia" };
const ESTAGIOS_PT = { Basic: "Básico", Stage1: "Estágio 1", Stage2: "Estágio 2", VMAX: "VMAX", VSTAR: "VSTAR", MEGA: "Mega" };

export const tipoEmPortugues = (t) => TIPOS_PT[t] ?? t;

/**
 * Tudo sobre uma carta, pra página dela (/carta/ID).
 * Devolve a carta normalizada (como na busca) mais os detalhes, ou null se não achar.
 */
export async function buscarDetalhesDaCarta(id, cotacao) {
  const c = await getJSON(`${TCGDEX}/cards/${encodeURIComponent(id)}`, CACHE_CARTAS);
  if (!c?.image) return null;
  cotacao ??= await cotacaoDoDia();
  const base = normalizarCarta(c, cotacao);

  // Preço por versão da carta (normal, holo, reverse...) na TCGplayer, em reais.
  const versoes = [];
  const tcg = c.pricing?.tcgplayer;
  if (tcg && cotacao.usd) {
    for (const [nome, v] of Object.entries(tcg)) {
      if (v && typeof v === "object" && typeof v.marketPrice === "number") {
        versoes.push({
          nome,
          mercado: v.marketPrice * cotacao.usd,
          minimo: typeof v.lowPrice === "number" ? v.lowPrice * cotacao.usd : null,
          maximo: typeof v.highPrice === "number" ? v.highPrice * cotacao.usd : null,
        });
      }
    }
  }
  const cm = c.pricing?.cardmarket;
  const cmc = camposCardmarket(cm);
  const cardmarket =
    cm && cotacao.eur && cmc.trend
      ? {
          tendencia: cmc.trend * cotacao.eur,
          media7: cmc.avg7 ? cmc.avg7 * cotacao.eur : null,
          media30: cmc.avg30 ? cmc.avg30 * cotacao.eur : null,
          minimo: cmc.low ? cmc.low * cotacao.eur : null,
        }
      : null;

  return {
    ...base,
    categoria: CATEGORIAS_PT[c.category] ?? c.category ?? null,
    ilustrador: c.illustrator ?? null,
    hp: c.hp ?? null,
    tipos: (c.types ?? []).map(tipoEmPortugues),
    estagio: ESTAGIOS_PT[c.stage] ?? c.stage ?? null,
    evoluiDe: c.evolveFrom ?? null,
    descricao: c.description ?? null,
    efeito: c.effect ?? null, // cartas de Treinador e Energia
    recuo: c.retreat ?? null,
    marca: c.regulationMark ?? null,
    ataques: (c.attacks ?? []).map((a) => ({
      nome: a.name,
      custo: (a.cost ?? []).map(tipoEmPortugues),
      dano: a.damage ?? null,
      efeito: a.effect ?? null,
    })),
    habilidades: (c.abilities ?? []).map((a) => ({ tipo: a.type ?? null, nome: a.name, efeito: a.effect })),
    fraquezas: (c.weaknesses ?? []).map((w) => ({ tipo: tipoEmPortugues(w.type), valor: w.value ?? null })),
    resistencias: (c.resistances ?? []).map((w) => ({ tipo: tipoEmPortugues(w.type), valor: w.value ?? null })),
    legal: c.legal ?? null,
    versoes,
    cardmarket,
    logoDoSet: c.set?.logo ? `${c.set.logo}.webp` : null,
  };
}

// Pega itens espalhados pela lista, para comparar versões de várias épocas.
function amostrar(lista, n) {
  if (lista.length <= n) return lista;
  const passo = lista.length / n;
  return Array.from({ length: n }, (_, i) => lista[Math.floor(i * passo)]);
}

/** A versão mais valiosa de um Pokémon (ex.: "Umbreon" acha "Umbreon ex", "Umbreon VMAX"...). */
async function cartaMaisValiosa(nome, cotacao) {
  if (CARTAS_FIXAS[nome]) return buscarCartaPorId(CARTAS_FIXAS[nome], cotacao);

  // "Umbreon*" = nomes que começam com Umbreon. Se não vier nada, tenta "contém".
  let resumos = await getJSON(`${TCGDEX}/cards?name=${encodeURIComponent(nome)}*`, CACHE_CARTAS);
  if (!Array.isArray(resumos) || resumos.length === 0) {
    resumos = await getJSON(`${TCGDEX}/cards?name=${encodeURIComponent(nome)}`, CACHE_CARTAS);
  }
  if (!Array.isArray(resumos) || resumos.length === 0) {
    console.warn(`[slabbit] nenhuma carta encontrada para "${nome}"`);
    return null;
  }

  const candidatas = amostrar(
    resumos.filter((r) => r.image),
    AMOSTRA_POR_NOME
  );
  const cartas = await Promise.all(candidatas.map((r) => buscarCartaPorId(r.id, cotacao)));

  return (
    cartas
      .filter((c) => c?.preco)
      .sort((a, b) => b.preco.valor - a.preco.valor)[0] ?? null
  );
}

// ---------- BUSCA ----------

const LIMITE_BUSCA = 24; // quantas cartas mostrar por busca

/**
 * Separa nome e número do que a pessoa digitou.
 * "Charizard ex 199/165" → { nome: "Charizard ex", numero: "199" }
 */
export function interpretarBusca(texto = "") {
  const t = texto.trim().replace(/\s+/g, " ");
  const m = t.match(/#?\s*([a-z]{0,4}\d{1,3}[a-z]?)\s*\/\s*[a-z]{0,4}\d{1,3}\s*$/i);
  if (m) return { nome: t.slice(0, m.index).trim(), numero: m[1] };
  return { nome: t, numero: null };
}

/**
 * Busca cartas pelo texto digitado.
 * "limite" é quantas cartas trazer (o resto aparece com o botão "Ver mais").
 * Retorna { cartas, total, erro }. erro = true quando a TCGdex não respondeu.
 */
export async function pesquisarCartas(texto, limite = LIMITE_BUSCA) {
  const { nome, numero } = interpretarBusca(texto);
  if (!nome && !numero) return { cartas: [], total: 0, erro: false };

  const params = new URLSearchParams();
  if (nome) params.set("name", nome); // "contém", sem diferenciar maiúsculas
  if (numero) params.set("localId", `eq:${numero}`);

  const resumos = await getJSON(`${TCGDEX}/cards?${params}`, CACHE_CARTAS);
  if (!Array.isArray(resumos)) return { cartas: [], total: 0, erro: true };

  const lista = resumos.filter((r) => r.image);
  const pagina = lista.slice(0, limite);
  const cotacao = await cotacaoDoDia();
  // Em lotes de 20, pra não bombardear a API quando a pessoa pede todas as cartas.
  const detalhes = [];
  for (let i = 0; i < pagina.length; i += 20) {
    detalhes.push(...(await Promise.all(pagina.slice(i, i + 20).map((r) => buscarCartaPorId(r.id, cotacao)))));
  }

  // Se o detalhe de uma carta falhar, mostra pelo menos a foto e o nome.
  const cartas = pagina.map(
    (r, i) =>
      detalhes[i] ?? {
        id: r.id,
        name: r.name,
        set: "",
        number: r.localId,
        rarity: null,
        images: { small: imagemDaCarta(r.image, "low"), large: imagemDaCarta(r.image, "high") },
        preco: null,
      }
  );

  return { cartas, total: lista.length, erro: false };
}

/**
 * Para cada nome, devolve a versão mais valiosa encontrada, já com preço em reais.
 */
export async function buscarPorNomes(nomes) {
  const cotacao = await cotacaoDoDia();
  const cartas = await Promise.all(nomes.map((n) => cartaMaisValiosa(n, cotacao)));
  return cartas.filter(Boolean).sort((a, b) => b.preco.valor - a.preco.valor);
}

// Cartas famosas e caras da home. IDs conferidos no banco da TCGdex.
// A foto aparece sempre (a do detalhe, ou a daqui se a API falhar); o preço entra quando a API responder.
const ASSETS = "https://assets.tcgdex.net/en";
export const CARTAS_EM_DESTAQUE = [
  { id: "swsh7-215", name: "Umbreon VMAX", set: "Evolving Skies", number: "215/203", image: `${ASSETS}/swsh/swsh7/215` },
  { id: "sv08.5-161", name: "Umbreon ex", set: "Prismatic Evolutions", number: "161/131", image: `${ASSETS}/sv/sv08.5/161` },
  { id: "base1-4", name: "Charizard", set: "Base Set", number: "4/102", image: `${ASSETS}/base/base1/4` },
  { id: "swsh7-218", name: "Rayquaza VMAX", set: "Evolving Skies", number: "218/203", image: `${ASSETS}/swsh/swsh7/218` },
  { id: "sv03.5-199", name: "Charizard ex", set: "151", number: "199/165", image: `${ASSETS}/sv/sv03.5/199` },
  { id: "swsh8-271", name: "Gengar VMAX", set: "Fusion Strike", number: "271/264", image: `${ASSETS}/swsh/swsh8/271` },
];

/**
 * Cartas da home, com foto garantida e preço em reais quando disponível.
 * Ordem: mais cara primeiro (as sem preço vão pro fim).
 */
export async function buscarCartas() {
  const cotacao = await cotacaoDoDia();

  const cartas = await Promise.all(
    CARTAS_EM_DESTAQUE.map(async (base) => {
      const detalhe = await buscarCartaPorId(base.id, cotacao);
      return {
        id: base.id,
        name: detalhe?.name ?? base.name,
        set: detalhe?.set || base.set,
        number: detalhe?.number ?? base.number,
        images: detalhe?.images ?? {
          small: imagemDaCarta(base.image, "low"),
          large: imagemDaCarta(base.image, "high"),
        },
        preco: detalhe?.preco ?? null,
      };
    })
  );

  const comPreco = cartas.filter((c) => c.preco).length;
  console.log(`[slabbit] ${cartas.length} cartas, ${comPreco} com preço (câmbio: ${cotacao.fonte})`);

  return cartas.sort((a, b) => (b.preco?.valor ?? -1) - (a.preco?.valor ?? -1));
}
