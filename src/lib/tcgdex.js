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

const TCGDEX = 'https://api.tcgdex.net/v2/en';
const CACHE_CARTAS = 60 * 60 * 6; // 6 horas
const CACHE_COTACAO = 60 * 60; // 1 hora
const AMOSTRA_POR_NOME = 10; // quantas versões de cada Pokémon comparar

// Se quiser fixar uma carta específica para um nome, coloque o id da TCGdex aqui.
// Ex.: { Charizard: "base1-4" }  (Charizard do Base Set)
const CARTAS_FIXAS = {};

async function getJSON(url, revalidate, headers) {
    try {
        const res = await fetch(url, { headers, next: { revalidate } });
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

/** Monta a URL da imagem. qualidade: "high" (600x825) ou "low" (245x337). */
export function imagemDaCarta(base, qualidade = 'high') {
    return base ? `${base}/${qualidade}.webp` : null;
}

/** Cotação de hoje em reais. Retorna { usd, eur } ou nulls se a API falhar. */
export async function cotacaoDoDia() {
    const chave = process.env.AWESOMEAPI_KEY;
    const data = await getJSON(
        'https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL',
        CACHE_COTACAO,
        chave ? { 'x-api-key': chave } : undefined,
    );
    return {
        usd: Number(data?.USDBRL?.bid) || null,
        eur: Number(data?.EURBRL?.bid) || null,
    };
}

// Ordem de preferência das versões da carta na TCGplayer.
const VARIANTES = [
    'holofoil',
    'holo',
    'normal',
    '1stEditionHolofoil',
    'unlimitedHolofoil',
    'reverse-holofoil',
    'reverse',
];

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
            if (typeof mercado === 'number' && mercado > 0) {
                valor = mercado * cotacao.usd;
                fonte = 'TCGplayer';
                break;
            }
        }
    }

    if (valor === null && cm && cotacao.eur) {
        const tendencia = cm.trend ?? cm['trend-holo'] ?? cm.avg;
        if (typeof tendencia === 'number' && tendencia > 0) {
            valor = tendencia * cotacao.eur;
            fonte = 'Cardmarket';
        }
    }

    if (valor === null) return null;

    let variacao30 = null;
    if (cm?.trend && cm?.avg30) {
        variacao30 = (cm.trend / cm.avg30 - 1) * 100;
    }

    return { valor, fonte, variacao30 };
}

export function formatarReais(valor) {
    const casas = valor >= 100 ? 0 : 2; // R$ 1.240 / R$ 5,43
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: casas,
        maximumFractionDigits: casas,
    }).format(valor);
}

function normalizarCarta(c, cotacao) {
    const total = c.set?.cardCount?.official;
    return {
        id: c.id,
        name: c.name,
        set: c.set?.name ?? '',
        number: total ? `${c.localId}/${total}` : c.localId,
        rarity: c.rarity ?? null,
        images: {
            small: imagemDaCarta(c.image, 'low'),
            large: imagemDaCarta(c.image, 'high'),
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

// Pega itens espalhados pela lista, para comparar versões de várias épocas.
function amostrar(lista, n) {
    if (lista.length <= n) return lista;
    const passo = lista.length / n;
    return Array.from({ length: n }, (_, i) => lista[Math.floor(i * passo)]);
}

/** A versão mais valiosa de um Pokémon (ex.: "Umbreon" acha "Umbreon ex", "Umbreon VMAX"...). */
async function cartaMaisValiosa(nome, cotacao) {
    if (CARTAS_FIXAS[nome]) return buscarCartaPorId(CARTAS_FIXAS[nome], cotacao);

    const resumos = await getJSON(
        `${TCGDEX}/cards?name=${encodeURIComponent(nome)}*`,
        CACHE_CARTAS,
    );
    if (!Array.isArray(resumos) || resumos.length === 0) return null;

    const candidatas = amostrar(
        resumos.filter((r) => r.image),
        AMOSTRA_POR_NOME,
    );
    const cartas = await Promise.all(candidatas.map((r) => buscarCartaPorId(r.id, cotacao)));

    return cartas.filter((c) => c?.preco).sort((a, b) => b.preco.valor - a.preco.valor)[0] ?? null;
}

/**
 * Para cada nome, devolve a versão mais valiosa encontrada, já com preço em reais.
 * As cartas voltam ordenadas da mais cara para a mais barata.
 * Se a TCGdex estiver fora do ar, devolve [] e a página usa o conteúdo de exemplo.
 */
export async function buscarCartas(nomes) {
    try {
        const cotacao = await cotacaoDoDia();
        if (!cotacao.usd && !cotacao.eur) return [];
        const cartas = await Promise.all(nomes.map((n) => cartaMaisValiosa(n, cotacao)));
        return cartas.filter(Boolean).sort((a, b) => b.preco.valor - a.preco.valor);
    } catch {
        return [];
    }
}
