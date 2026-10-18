'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import { Check, Minus, Sparkles } from 'lucide-react';
import styles from '../../app/precos/precos.module.css';

const PRO_MENSAL = 9.9;
const PRO_ANUAL = 99;

const brl = (n) => `R$ ${n.toFixed(2).replace('.', ',')}`;

const planos = [
    {
        id: 'gratis',
        nome: 'Grátis',
        para: 'Pra quem quer saber quanto a carta vale.',
        cta: 'Começar grátis',
        grupos: [
            {
                titulo: 'Preços',
                itens: [
                    { t: 'Busca de preço sem limite', ok: true },
                    { t: 'Preço convertido em real', ok: true },
                    { t: 'Histórico de 30 dias', ok: true },
                    { t: 'Histórico completo', ok: false },
                ],
            },
            {
                titulo: 'Coleção',
                itens: [
                    { t: 'Até 100 cartas', ok: true },
                    { t: 'Valor total em real', ok: true },
                    { t: 'Cartas sem limite', ok: false },
                ],
            },
            {
                titulo: 'Ferramentas',
                itens: [
                    { t: 'Alertas de variação de preço', ok: false },
                    { t: 'Simulador de graduação (PSA)', ok: false },
                ],
            },
        ],
    },
    {
        id: 'pro',
        nome: 'Pro',
        para: 'Pra quem coleciona sério e decide com número.',
        cta: 'Assinar o Pro',
        destaque: true,
        grupos: [
            {
                titulo: 'Preços',
                itens: [
                    { t: 'Busca de preço sem limite', ok: true },
                    { t: 'Preço convertido em real', ok: true },
                    { t: 'Histórico de 30 dias', ok: true },
                    { t: 'Histórico completo', ok: true },
                ],
            },
            {
                titulo: 'Coleção',
                itens: [
                    { t: 'Cartas sem limite', ok: true },
                    { t: 'Valor total em real', ok: true },
                ],
            },
            {
                titulo: 'Ferramentas',
                itens: [
                    { t: 'Alertas quando o preço mudar', ok: true },
                    { t: 'Simulador de graduação (PSA)', ok: true },
                ],
            },
        ],
    },
];

export default function PricingPlans({ base }) {
    const [anual, setAnual] = useState(true);

    return (
        <div>
            <LayoutGroup>
                <div className={styles.toggle} role="group" aria-label="Periodicidade da cobrança">
                    {[
                        { v: false, rotulo: 'Mensal' },
                        { v: true, rotulo: 'Anual', selo: '2 meses grátis' },
                    ].map((o) => (
                        <button
                            key={o.rotulo}
                            type="button"
                            aria-pressed={anual === o.v}
                            onClick={() => setAnual(o.v)}
                            className={styles.toggleBtn}>
                            {anual === o.v && (
                                <motion.span
                                    layoutId="toggle-pill"
                                    className={styles.togglePill}
                                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                                />
                            )}
                            <span className={styles.toggleLabel}>{o.rotulo}</span>
                            {o.selo && <small className={styles.toggleSeal}>{o.selo}</small>}
                        </button>
                    ))}
                </div>
            </LayoutGroup>

            <div className={styles.planGrid}>
                {planos.map((plano) => {
                    const pro = plano.id === 'pro';
                    const preco = !pro ? 'R$ 0' : anual ? brl(PRO_ANUAL / 12) : brl(PRO_MENSAL);
                    const nota = !pro
                        ? 'pra sempre'
                        : anual
                          ? `por mês · cobrado ${brl(PRO_ANUAL).replace(',00', '')} por ano`
                          : 'por mês · cancele quando quiser';
                    return (
                        <motion.article
                            key={plano.id}
                            data-reveal
                            whileHover={{ y: -4 }}
                            className={`${styles.planCard} ${pro ? styles.planCardPro : ''}`}>
                            {pro && (
                                <span className={styles.badge}>
                                    <Sparkles size={14} aria-hidden="true" /> Mais escolhido
                                </span>
                            )}
                            <h2 className={styles.planName}>{plano.nome}</h2>
                            <p className={styles.planFor}>{plano.para}</p>

                            <div className={styles.priceBlock}>
                                <AnimatePresence mode="wait" initial={false}>
                                    <motion.strong
                                        key={preco}
                                        className={styles.priceValue}
                                        initial={{ opacity: 0, y: 14 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -14 }}
                                        transition={{ duration: 0.18 }}>
                                        {preco}
                                    </motion.strong>
                                </AnimatePresence>
                                <span className={styles.priceNote}>{nota}</span>
                                {pro && anual && (
                                    <span className={styles.saving}>
                                        Você economiza {brl(PRO_MENSAL * 12 - PRO_ANUAL)} no ano
                                    </span>
                                )}
                            </div>

                            <Link
                                href="/entrar"
                                className={pro ? base.buttonDark : base.buttonOutline}>
                                {plano.cta}
                            </Link>

                            <div className={styles.featureGroups}>
                                {plano.grupos.map((g) => (
                                    <div key={g.titulo}>
                                        <h3 className={styles.groupTitle}>{g.titulo}</h3>
                                        <ul className={styles.featureList}>
                                            {g.itens.map((i) => (
                                                <li key={i.t} className={i.ok ? '' : styles.off}>
                                                    {i.ok ? (
                                                        <Check size={18} strokeWidth={3} aria-hidden="true" />
                                                    ) : (
                                                        <Minus size={18} aria-hidden="true" />
                                                    )}
                                                    <span>
                                                        {i.t}
                                                        {!i.ok && <span className={base.srOnly}> (não incluído)</span>}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </motion.article>
                    );
                })}
            </div>
        </div>
    );
}
