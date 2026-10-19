import Image from 'next/image';
import Link from 'next/link';
import { Archivo, IBM_Plex_Mono } from 'next/font/google';
import base from '../page.module.css'; // cores, header, rodapé e botões da home
import styles from './app.module.css';
import Cabecalho from '../../components/Cabecalho';
import Reveal from '../../components/home/Reveal';
import HeroEntrance from '../../components/home/HeroEntrance';
import { Search, Calculator, Layers, Bell } from 'lucide-react';

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
    title: 'App | Slabbit',
    description: 'O Slabbit no seu celular: preço das cartas em real, simulador de graduação e sua coleção no bolso.',
};

// O app ainda não está publicado nas lojas. Quando estiver, é só trocar o "#" pelo link da loja.
const LOJAS = [
    { href: '#', img: '/app/app-store.png', alt: 'Baixar na App Store', largura: 952, altura: 283 },
    { href: '#', img: '/app/google-play.png', alt: 'Disponível no Google Play', largura: 666, altura: 198 },
];

const recursos = [
    {
        Icone: Search,
        titulo: 'Preço na hora',
        texto: 'Digite o nome da carta e veja quanto ela vale em real, com o câmbio do dia.',
    },
    {
        Icone: Calculator,
        titulo: 'Vale graduar?',
        texto: 'Faça a conta da PSA com taxa, frete e imposto direto do celular.',
    },
    {
        Icone: Layers,
        titulo: 'Coleção no bolso',
        texto: 'A mesma coleção do site, sincronizada. Cadastrou lá, aparece aqui.',
    },
    {
        Icone: Bell,
        titulo: 'Alertas de preço',
        texto: 'No Pro, o celular avisa quando a carta que você quer chega no preço.',
    },
];

function BotoesLojas() {
    return (
        <div className={styles.lojas}>
            {LOJAS.map((l) => (
                <a key={l.alt} href={l.href} className={styles.loja}>
                    <Image src={l.img} alt={l.alt} width={l.largura} height={l.altura} />
                </a>
            ))}
        </div>
    );
}

export default function App() {
    return (
        <div className={`${base.page} ${archivo.variable} ${plexMono.variable}`}>
            <Cabecalho ativo="app" />

            <main>
                {/* Faixa amarela com o celular */}
                <section className={styles.band}>
                    <div className={styles.bandInner}>
                        <HeroEntrance className={styles.texto}>
                            <p className={base.eyebrow}>App Slabbit</p>
                            <h1 className={styles.title}>
                                Sua coleção
                                <br />
                                no bolso.
                            </h1>
                            <p className={styles.lead}>
                                Tá na feira, na loja ou no grupo de troca? Abre o app e descobre na
                                hora quanto a carta vale em real. Grátis pra iPhone e Android.
                            </p>
                            <BotoesLojas />
                        </HeroEntrance>

                        {/* Moldura de celular feita em CSS em volta do print do app */}
                        <div className={styles.palco}>
                            <div className={styles.celular}>
                                <span className={styles.ilha} aria-hidden="true" />
                                <Image
                                    src="/app/print.png"
                                    alt="Tela inicial do app Slabbit com busca de carta, câmbio do dia e a carta mais valiosa"
                                    width={750}
                                    height={1624}
                                    className={styles.tela}
                                    priority
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* O que tem no app */}
                <section className={base.section}>
                    <Reveal className={`${base.sectionInner} ${styles.centered}`}>
                        <p className={base.eyebrowDark}>O que tem no app</p>
                        <h2 className={base.sectionTitle}>Tudo do site, cabendo na mão</h2>
                        <ul className={styles.grade}>
                            {recursos.map(({ Icone, titulo, texto }) => (
                                <li key={titulo} className={styles.recurso} data-reveal>
                                    <span className={styles.icone}>
                                        <Icone size={20} aria-hidden="true" />
                                    </span>
                                    <h3>{titulo}</h3>
                                    <p>{texto}</p>
                                </li>
                            ))}
                        </ul>
                    </Reveal>
                </section>

                {/* CTA final */}
                <section className={styles.cta}>
                    <div className={styles.ctaInner}>
                        <h2>Baixe agora. É grátis.</h2>
                        <p>Ou, se preferir, continue pelo navegador mesmo.</p>
                        <BotoesLojas />
                        <Link href="/precos" className={styles.ctaLink}>
                            Buscar uma carta no site →
                        </Link>
                    </div>
                </section>
            </main>

            <footer className={base.footer}>
                <div className={base.footerInner}>
                    <span className={base.logo}>
                        <span className={base.logoMark} aria-hidden="true" />
                        slabbit
                    </span>
                    <p>
                        Slabbit é um projeto independente e não tem relação com Nintendo,
                        Creatures, GAME FREAK ou The Pokémon Company. Os preços são estimativas de
                        mercado e não são recomendação de investimento. Apple e App Store são marcas
                        da Apple Inc. Google Play é marca da Google LLC.
                    </p>
                </div>
            </footer>
        </div>
    );
}
