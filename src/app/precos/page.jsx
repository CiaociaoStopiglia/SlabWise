import Link from 'next/link';
import { Archivo, IBM_Plex_Mono } from 'next/font/google';
import base from '../page.module.css'; // cores, header, rodapé, planos e botões da home
import styles from './precos.module.css';
import Cabecalho from '../../components/Cabecalho';
import Reveal from '../../components/home/Reveal';
import HeroEntrance from '../../components/home/HeroEntrance';
import PricingPlans from '../../components/home/PricingPlans';
import CountUp from '../../components/home/CountUp';
import { Bell, Layers, Calculator, CreditCard, RefreshCw, Clock } from 'lucide-react';

const archivo = Archivo({
    subsets: ['latin'],
    axes: ['wdth'],
    variable: '--font-archivo',
    display: 'swap',
});
const plexMono = IBM_Plex_Mono({
    subsets: ['latin'],
    weight: ['400', '600'],
    variable: '--font-mono',
    display: 'swap',
});

export const metadata = {
    title: 'Planos e preços | Slabwise',
    description: 'Ver o preço da carta é grátis. O Pro libera alertas, simulador de graduação e coleção sem limite.',
};

const garantias = [
    {
        Icone: CreditCard,
        titulo: 'Sem cartão pra começar',
        texto: 'O plano Grátis não pede nenhum dado de pagamento.',
    },
    {
        Icone: RefreshCw,
        titulo: 'Cancele quando quiser',
        texto: 'Sem multa e sem fidelidade, direto na sua conta.',
    },
    {
        Icone: Clock,
        titulo: 'Preço atualizado',
        texto: 'Os valores são renovados várias vezes ao dia.',
    },
]

const comparativo = [
    {
        grupo: 'Preços',
        linhas: [
            { recurso: 'Busca de preço', gratis: 'Sem limite', pro: 'Sem limite' },
            { recurso: 'Preço convertido em real', gratis: true, pro: true },
            { recurso: 'Histórico de preços', gratis: '30 dias', pro: 'Completo' },
        ],
    },
    {
        grupo: 'Coleção',
        linhas: [
            { recurso: 'Cartas na coleção', gratis: 'Até 100', pro: 'Sem limite' },
            { recurso: 'Valor total da coleção', gratis: true, pro: true },
        ],
    },
    {
        grupo: 'Ferramentas',
        linhas: [
            { recurso: 'Alertas de variação de preço', gratis: false, pro: true },
            { recurso: 'Simulador de graduação (PSA)', gratis: false, pro: true },
        ],
    },
];

const perguntas = [
    {
        p: 'Preciso de cartão pra usar o plano grátis?',
        r: 'Não. Você busca preços, vê o histórico de 30 dias e monta a coleção sem informar nenhum dado de pagamento.',
    },
    {
        p: 'De onde vêm os preços?',
        r: 'Da TCGplayer e da Cardmarket (via TCGdex), convertidos para real com a cotação do dia. São preços de carta sem graduar, em estado Near Mint.',
    },
    {
        p: 'Posso cancelar o Pro quando quiser?',
        r: 'Pode. Você continua com o Pro até o fim do período já pago e depois volta para o plano Grátis, sem perder a coleção.',
    },
    {
        p: 'O que acontece com a coleção se eu voltar pro Grátis?',
        r: 'Nada é apagado. Só não dá para adicionar novas cartas enquanto você estiver acima do limite de 100.',
    },
    {
        p: 'O simulador garante o resultado da graduação?',
        r: 'Não. Ele faz a conta com taxa, frete e imposto em real, mas a nota que a carta tira é decisão da empresa que gradua. Os preços são estimativas e não são recomendação de investimento.',
    },
];

function Celula({ valor }) {
    if (valor === true) return <span className={styles.sim}>Incluído</span>;
    if (valor === false) return <span className={styles.nao}>—</span>;
    return valor;
}

export default function Precos() {
    return (
        <div className={`${base.page} ${archivo.variable} ${plexMono.variable}`}>
            <Cabecalho ativo="precos" />

            <main>
                {/* Faixa amarela */}
                <section className={styles.band}>
                    <HeroEntrance className={styles.bandInner}>
                        <p className={base.eyebrow}>Planos e preços</p>
                        <h1 className={styles.title}>
                            Ver preço é de graça.
                            <br />O resto, R$ 9,90.
                        </h1>
                        <p className={styles.lead}>
                            Sem pegadinha: o plano Grátis resolve o básico pra sempre. O Pro é pra
                            quem coleciona sério e quer alertas, coleção sem limite e simulador de
                            graduação.
                        </p>
                    </HeroEntrance>
                </section>

                {/* Planos */}
                <section className={base.section}>
                    <Reveal className={`${base.sectionInner} ${styles.centered}`}>
                        <PricingPlans base={base} />
                        <ul className={styles.trust} data-reveal>
                            {garantias.map(({ Icone, titulo, texto }) => (
                                <li key={titulo}>
                                    <Icone size={22} aria-hidden="true" />
                                    <div>
                                        <strong>{titulo}</strong>
                                        <span>{texto}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </Reveal>
                </section>

                {/* Pro na prática */}
                <section className={`${base.section} ${styles.showcase}`}>
                    <Reveal className={`${base.sectionInner} ${styles.centered}`}>
                        <p className={base.eyebrowDark}>O Pro na prática</p>
                        <h2 className={base.sectionTitle}>O que muda quando você assina</h2>
                        <p className={base.sectionLead}>
                            Exemplos ilustrativos, com valores de mentira, pra você ver como cada
                            ferramenta funciona.
                        </p>
                        <div className={styles.showGrid}>
                            <article className={styles.showCard} data-reveal>
                                <span className={styles.showIcon}>
                                    <Bell size={20} aria-hidden="true" />
                                </span>
                                <h3>Alertas de preço</h3>
                                <p>Defina um valor e a gente avisa quando a carta chegar lá.</p>
                                <div className={styles.mock}>
                                    <div className={styles.alert}>
                                        <b>Umbreon VMAX</b>
                                        <span className={styles.up}>▲ 8% hoje</span>
                                        <i>agora R$ 11.465</i>
                                    </div>
                                    <div className={styles.alert}>
                                        <b>Charizard ex</b>
                                        <span className={styles.down}>▼ 5% hoje</span>
                                        <i>agora R$ 410</i>
                                    </div>
                                </div>
                            </article>

                            <article className={styles.showCard} data-reveal>
                                <span className={styles.showIcon}>
                                    <Layers size={20} aria-hidden="true" />
                                </span>
                                <h3>Coleção sem limite</h3>
                                <p>Cadastre todas as cartas e acompanhe quanto o conjunto vale.</p>
                                <div className={styles.mock}>
                                    <span className={styles.mockLabel}>VALOR DA COLEÇÃO</span>
                                    <strong className={styles.mockBig}>
                                        <CountUp value={18430} prefix="R$ " />
                                    </strong>
                                    <div className={styles.bars} aria-hidden="true">
                                        {[30, 38, 34, 48, 52, 49, 64, 72].map((h, i) => (
                                            <i key={i} style={{ height: `${h}%` }} />
                                        ))}
                                    </div>
                                </div>
                            </article>

                            <article className={styles.showCard} data-reveal>
                                <span className={styles.showIcon}>
                                    <Calculator size={20} aria-hidden="true" />
                                </span>
                                <h3>Simulador de graduação</h3>
                                <p>Taxa, frete e imposto em real pra saber se compensa mandar.</p>
                                <div className={styles.mock}>
                                    <div className={styles.mockRow}>
                                        <span>Valor em PSA 10</span>
                                        <b>R$ 1.450</b>
                                    </div>
                                    <div className={styles.mockRow}>
                                        <span>Custos</span>
                                        <b>− R$ 375</b>
                                    </div>
                                    <div className={`${styles.mockRow} ${styles.mockTotal}`}>
                                        <span>Ganho</span>
                                        <b>+ R$ 765</b>
                                    </div>
                                </div>
                            </article>
                        </div>
                    </Reveal>
                </section>

                {/* Comparativo */}
                <section className={base.section}>
                    <Reveal className={`${base.sectionInner} ${styles.centered}`}>
                        <h2 className={base.sectionTitle}>Compare os planos</h2>
                        <div className={styles.tableWrap} data-reveal>
                            <table className={styles.table}>
                                <caption className={base.srOnly}>
                                    Comparativo entre os planos Grátis e Pro
                                </caption>
                                <thead>
                                    <tr>
                                        <th scope="col">Recurso</th>
                                        <th scope="col">Grátis</th>
                                        <th scope="col" className={styles.colPro}>
                                            Pro
                                        </th>
                                    </tr>
                                </thead>
                                {comparativo.map((g) => (
                                    <tbody key={g.grupo}>
                                        <tr className={styles.groupRow}>
                                            <th scope="colgroup" colSpan={3}>
                                                {g.grupo}
                                            </th>
                                        </tr>
                                        {g.linhas.map((l) => (
                                            <tr key={l.recurso}>
                                                <th scope="row">{l.recurso}</th>
                                                <td>
                                                    <Celula valor={l.gratis} />
                                                </td>
                                                <td className={styles.colPro}>
                                                    <Celula valor={l.pro} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                ))}
                            </table>
                        </div>
                    </Reveal>
                </section>

                {/* Perguntas */}
                <section className={`${base.section}`}>
                    <Reveal className={`${base.sectionInner} ${styles.centered}`}>
                        <p className={styles.faqEyebrow}>Dúvidas</p>
                        <h2 className={`${base.sectionTitle}`}>Perguntas frequentes</h2>
                        <div className={styles.faq}>
                            {perguntas.map((item) => (
                                <details key={item.p} className={styles.faqItem} data-reveal>
                                    <summary>{item.p}</summary>
                                    <p>{item.r}</p>
                                </details>
                            ))}
                        </div>
                    </Reveal>
                </section>

                {/* CTA final */}
                <section className={styles.cta}>
                    <div className={styles.ctaInner}>
                        <h2>Comece pelo grátis.</h2>
                        <p>Procure uma carta agora e veja quanto ela vale em real.</p>
                        <Link href="/busca" className={base.buttonDark}>
                            Buscar uma carta
                        </Link>
                    </div>
                </section>
            </main>

            <footer className={base.footer}>
                <div className={base.footerInner}>
                    <span className={base.logo}>
                        <span className={base.logoMark} aria-hidden="true" />
                        slabwise
                    </span>
                    <p>
                        Slabwise é um projeto independente e não tem relação com Nintendo,
                        Creatures, GAME FREAK ou The Pokémon Company. Os preços são estimativas de
                        mercado e não são recomendação de investimento.
                    </p>
                </div>
            </footer>
        </div>
    );
}
