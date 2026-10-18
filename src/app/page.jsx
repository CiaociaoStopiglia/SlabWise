// app/page.jsx
// Home do Slabbit (endereço: /)

import Link from 'next/link';
import Image from 'next/image';
import { buscarCartas, cotacaoDoDia, formatarReais } from '../lib/tcgdex';
import { Archivo, IBM_Plex_Mono } from 'next/font/google';
import styles from './page.module.css';
import Cabecalho from '../components/Cabecalho';
import HeroEntrance from '../components/home/HeroEntrance';
import TiltStage from '../components/home/TiltStage';
import Reveal from '../components/home/Reveal';
import CardCarousel from '../components/home/CardCarousel';
import CountUp from '../components/home/CountUp';

// Os preços ficam em cache por 6 horas (dentro do lib/tcgdex.js).
// A página em si é gerada a cada visita, porque o topo muda se a pessoa tá logada.

function Variacao({ valor }) {
    if (valor === null || Number.isNaN(valor)) return null;
    const subiu = valor >= 0;
    return (
        <span className={subiu ? styles.up : styles.down}>
            {subiu ? '▲' : '▼'} {Math.abs(valor).toFixed(0)}% vs. média de 30 dias
        </span>
    );
}

// Archivo: fonte com eixo de largura. Usamos ela "esticada" nos títulos
// (cara de etiqueta de slab) e normal no texto corrido.
const archivo = Archivo({
    subsets: ['latin'],
    axes: ['wdth'],
    variable: '--font-archivo',
    display: 'swap',
});

// Mono para números: preços, notas, número de certificado.
const plexMono = IBM_Plex_Mono({
    subsets: ['latin'],
    weight: ['400', '600'],
    variable: '--font-mono',
    display: 'swap',
});

const populares = ['Charizard', 'Umbreon', 'Pikachu', 'Gengar', 'Mewtwo', 'Rayquaza'];

const passos = [
    {
        titulo: 'Busque a carta',
        texto: 'Digite o nome ou o número da carta. Funciona com cartas em português, inglês e japonês.',
    },
    {
        titulo: 'Veja o preço em real',
        texto: 'Juntamos vendas do Brasil e de fora e mostramos quanto a carta vale aqui, já em reais.',
    },
    {
        titulo: 'Decida o que fazer',
        texto: 'Vender, trocar, guardar ou mandar graduar. Você vê o número antes de decidir.',
    },
];

// Valores de exemplo. Troque pelos dados reais quando o simulador existir.
const simulacao = [
    { item: 'Carta sem graduar', valor: 'R$ 310' },
    { item: 'Valor estimado em PSA 10', valor: 'R$ 1.450' },
    { item: 'Taxa de graduação', valor: '− R$ 160' },
    { item: 'Frete e seguro (ida e volta)', valor: '− R$ 120' },
    { item: 'Imposto de importação', valor: '− R$ 95' },
];

const planos = [
    {
        nome: 'Grátis',
        preco: 'R$ 0',
        nota: 'pra sempre',
        itens: [
            'Busca de preço sem limite',
            'Preço em real',
            'Histórico de 30 dias',
            'Coleção com até 100 cartas',
        ],
        cta: 'Começar grátis',
        destaque: false,
    },
    {
        nome: 'Pro',
        preco: 'R$ 9,90',
        nota: 'por mês',
        itens: [
            'Tudo do Grátis',
            'Alertas quando o preço mudar',
            'Coleção sem limite',
            'Simulador de graduação',
            'Histórico completo',
        ],
        cta: 'Assinar o Pro',
        destaque: true,
    },
];

export default async function Home() {
    const [cartas, cotacao] = await Promise.all([buscarCartas(), cotacaoDoDia()]);
    // A carta mais valiosa da lista vai pro slab do topo.
    const destaque = cartas[0];

    return (
        <div className={`${styles.page} ${archivo.variable} ${plexMono.variable}`}>
            <Cabecalho />

            <main>
                {/* HERO */}
                <section className={styles.hero}>
                    <div className={styles.heroInner}>
                        <HeroEntrance className={styles.heroText}>
                            <p className={styles.eyebrow}>Preço de carta Pokémon TCG em real</p>
                            <h1 className={styles.title}>
                                Quanto vale
                                <br />a sua carta?
                            </h1>
                            <p className={styles.lead}>
                                Busque qualquer carta e veja o preço de mercado convertido pro
                                Brasil. Sem assinatura cara pra descobrir o básico.
                            </p>

                            <form
                                action="/precos"
                                method="get"
                                className={styles.search}
                                role="search">
                                <label htmlFor="busca" className={styles.srOnly}>
                                    Nome ou número da carta
                                </label>
                                <input
                                    id="busca"
                                    name="q"
                                    type="search"
                                    placeholder="Ex.: Charizard ex 199/165"
                                    autoComplete="off"
                                    className={styles.searchInput}
                                />
                                <button type="submit" className={styles.searchButton}>
                                    Ver preço
                                </button>
                            </form>

                            <div className={styles.popular}>
                                <span className={styles.popularLabel}>Mais buscadas</span>
                                <ul>
                                    {populares.map((nome) => (
                                        <li key={nome}>
                                            <Link href={`/precos?q=${encodeURIComponent(nome)}`}>
                                                {nome}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </HeroEntrance>

                        {/* Slab ilustrativo: carta graduada de exemplo */}
                        <TiltStage
                            className={styles.slabStage}
                            label="Exemplo de carta graduada com preço">
                            <div className={styles.slab}>
                                {destaque ? (
                                    <div className={styles.slabLabel}>
                                        <div className={styles.labelInfo}>
                                            <span className={styles.labelSet}>
                                                {destaque.set.toUpperCase()}
                                            </span>
                                            <strong>{destaque.name.toUpperCase()}</strong>
                                            <span className={styles.cert}>#{destaque.number}</span>
                                        </div>
                                        {/* Sem nota: o preço é da carta sem graduar, em estado Near Mint */}
                                        <div className={styles.grade}>
                                            <small>COND.</small>
                                            <b className={styles.gradeCond}>NM</b>
                                        </div>
                                    </div>
                                ) : (
                                    <div className={styles.slabLabel}>
                                        <div className={styles.labelInfo}>
                                            <span>2026 · CARTA EXEMPLO</span>
                                            <strong>HOLO RARA #025</strong>
                                            <span className={styles.cert}>CERT 88401192</span>
                                        </div>
                                        <div className={styles.grade}>
                                            <small>GEM MT</small>
                                            <b>10</b>
                                        </div>
                                    </div>
                                )}
                                <div className={styles.slabWindow}>
                                    {destaque ? (
                                        <Image
                                            src={destaque.images.large}
                                            alt={`Carta ${destaque.name} · ${destaque.set} ${destaque.number}`}
                                            width={480}
                                            height={670}
                                            priority
                                            className={styles.cardImage}
                                        />
                                    ) : (
                                        <div className={styles.card}>
                                            <div className={styles.cardTop}>
                                                <span>Carta exemplo</span>
                                                <span>HP 120</span>
                                            </div>
                                            <div className={styles.cardArt} />
                                            <div className={styles.cardLines}>
                                                <i />
                                                <i />
                                                <i />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {destaque ? (
                                <div className={styles.priceTag}>
                                    {destaque.preco ? (
                                        <>
                                            <span className={styles.priceTagLabel}>
                                                Preço hoje · {destaque.preco.fonte}
                                            </span>
                                            <strong>{formatarReais(destaque.preco.valor)}</strong>
                                            <Variacao valor={destaque.preco.variacao30} />
                                        </>
                                    ) : (
                                        <>
                                            <span className={styles.priceTagLabel}>Preço hoje</span>
                                            <strong>Atualizando…</strong>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div className={styles.priceTag}>
                                    <span className={styles.priceTagLabel}>
                                        Preço hoje · exemplo
                                    </span>
                                    <strong>R$ 1.240</strong>
                                    <span className={styles.up}>▲ 12% em 30 dias</span>
                                </div>
                            )}
                        </TiltStage>
                    </div>
                </section>

                {/* CARTAS EM ALTA (Pokémon TCG API) */}
                {cartas.length > 0 && (
                    <section className={styles.section}>
                        <div className={styles.sectionInner}>
                            <h2 className={styles.sectionTitle}>Cartas que todo mundo procura</h2>
                            <p className={styles.sectionLead}>
                                As cartas modernas e clássicas que mais valem hoje.
                            </p>
                            <CardCarousel
                                styles={styles}
                                cartas={cartas.map((c) => ({
                                    id: c.id,
                                    name: c.name,
                                    set: c.set,
                                    number: c.number,
                                    imagem: c.images.small,
                                    preco: c.preco ? formatarReais(c.preco.valor) : 'Ver preço',
                                }))}
                            />
                            <p className={styles.sourceNote}>
                                Preço de carta sem graduar em estado Near Mint, com dados da
                                TCGplayer e da Cardmarket (via TCGdex).
                                {cotacao.usd &&
                                    ` Convertido com o dólar a ${formatarReais(cotacao.usd)}.`}
                            </p>
                        </div>
                    </section>
                )}

                {/* COMO FUNCIONA */}
                <section className={styles.section}>
                    <Reveal className={styles.sectionInner}>
                        <h2 className={styles.sectionTitle}>Como funciona</h2>
                        <ol className={styles.steps}>
                            {passos.map((p, i) => (
                                <li key={p.titulo} className={styles.step} data-reveal>
                                    <span className={styles.stepNum}>
                                        {String(i + 1).padStart(2, '0')}
                                    </span>
                                    <h3>{p.titulo}</h3>
                                    <p>{p.texto}</p>
                                </li>
                            ))}
                        </ol>
                    </Reveal>
                </section>

                {/* VALE GRADUAR */}
                <section className={`${styles.section} ${styles.gradeSection}`}>
                    <div className={`${styles.sectionInner} ${styles.gradeGrid}`}>
                        <div className={styles.gradeText}>
                            <p className={styles.eyebrowDark}>Simulador de graduação</p>
                            <h2 className={styles.sectionTitle}>Vale a pena mandar pra PSA?</h2>
                            <p>
                                Graduar custa caro e demora. O Slabbit faz a conta com taxa, frete
                                e imposto em real, e mostra se a nota que a sua carta pode tirar
                                paga o investimento.
                            </p>
                            <Link href="/graduar" className={styles.buttonDark}>
                                Simular minha carta
                            </Link>
                        </div>

                        <div className={styles.receipt} aria-label="Simulação de exemplo">
                            <div className={styles.receiptHead}>
                                <span>SIMULAÇÃO</span>
                                <span>EXEMPLO</span>
                            </div>
                            <dl className={styles.receiptList}>
                                {simulacao.map((linha) => (
                                    <div key={linha.item} className={styles.receiptRow}>
                                        <dt>{linha.item}</dt>
                                        <dd>{linha.valor}</dd>
                                    </div>
                                ))}
                            </dl>
                            <div className={styles.receiptTotal}>
                                <span>Ganho vs. vender sem graduar</span>
                                <strong>
                                    <CountUp value={765} prefix="+ R$ " />
                                </strong>
                            </div>
                            <p className={styles.receiptNote}>
                                Só compensa se a carta tirar 10. Com nota 9, o ganho cai para R$ 40.
                            </p>
                        </div>
                    </div>
                </section>

                {/* PLANOS */}
                <section className={styles.section}>
                    <Reveal className={styles.sectionInner}>
                        <h2 className={styles.sectionTitle}>Ver preço é de graça</h2>
                        <p className={styles.sectionLead}>
                            Você só paga se quiser as ferramentas de quem coleciona sério.
                        </p>
                        <div className={styles.plans}>
                            {planos.map((plano) => (
                                <article
                                    key={plano.nome}
                                    data-reveal
                                    className={`${styles.plan} ${plano.destaque ? styles.planPro : ''}`}>
                                    <h3>{plano.nome}</h3>
                                    <p className={styles.planPrice}>
                                        <strong>{plano.preco}</strong> <span>{plano.nota}</span>
                                    </p>
                                    <ul>
                                        {plano.itens.map((item) => (
                                            <li key={item}>{item}</li>
                                        ))}
                                    </ul>
                                    <Link
                                        href="/entrar"
                                        className={
                                            plano.destaque
                                                ? styles.buttonDark
                                                : styles.buttonOutline
                                        }>
                                        {plano.cta}
                                    </Link>
                                </article>
                            ))}
                        </div>
                    </Reveal>
                </section>
            </main>

            <footer className={styles.footer}>
                <div className={styles.footerInner}>
                    <span className={styles.logo}>
                        <span className={styles.logoMark} aria-hidden="true" />
                        slabbit
                    </span>
                    <p>
                        Slabbit é um projeto independente e não tem relação com Nintendo,
                        Creatures, GAME FREAK ou The Pokémon Company. Os preços são estimativas de
                        mercado e não são recomendação de investimento.
                    </p>
                </div>
            </footer>
        </div>
    );
}