// app/assinar/page.jsx
// Assinar o Pro (endereço: /assinar): escolhe mensal ou anual e Pix ou cartão,
// depois segue pra página de pagamento do gateway (ainda não ligado, veja actions.js).
import Link from "next/link";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import { Bell, Calculator, LayoutGrid, LineChart, ShieldCheck, Sparkles } from "lucide-react";
import { usuarioAtual } from "../../lib/auth";
import Cabecalho from "../../components/Cabecalho";
import { iniciarAssinatura } from "./actions";
import base from "../page.module.css";
import styles from "./assinar.module.css";

const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-archivo", display: "swap" });
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata = { title: "Assinar o Pro | Slabbit" };

const PRECOS = {
  mensal: { rotulo: "Mensal", valor: "R$ 9,90", nota: "por mês · cancele quando quiser" },
  anual: { rotulo: "Anual", valor: "R$ 99", nota: "por ano · sai R$ 8,25 por mês", selo: "2 meses grátis" },
};
// O que o Pro libera: ícone, título curto e uma linha explicando
const BENEFICIOS = [
  { Icone: LayoutGrid, titulo: "Coleção sem limite", texto: "Guarde quantas cartas quiser (o Grátis vai até 100)." },
  { Icone: LineChart, titulo: "Histórico completo", texto: "Preço das cartas e valor da coleção desde o começo." },
  { Icone: Bell, titulo: "Alertas de preço", texto: "Um e-mail quando a carta cair ou subir até o seu alvo." },
  { Icone: Calculator, titulo: "Simulações salvas", texto: "Guarde cada simulação e compare antes de montar o lote." },
];

export default async function Assinar({ searchParams }) {
  const usuario = await usuarioAtual();
  const { periodo = "mensal", metodo = "pix" } = await searchParams;
  const escolhido = periodo === "anual" ? "anual" : "mensal";

  return (
    <div className={`${base.page} ${archivo.variable} ${plexMono.variable}`}>
      <Cabecalho ativo="planos" />

      <main className={styles.corpo}>
        <div className={styles.topo}>
          <p className={base.eyebrow}>Assinar o Pro</p>
          <h1 className={styles.titulo}>Pra quem coleciona sério</h1>
        </div>

        {usuario?.plano === "pro" ? (
          <div className={styles.caixa}>
            <h2 className={styles.h2}>Você já é Pro</h2>
            <p>
              Veja os detalhes em <Link href="/assinatura">Plano e cobrança</Link>.
            </p>
          </div>
        ) : (
          <div className={styles.grade}>
            <form action={iniciarAssinatura} className={styles.formulario}>
              <fieldset className={styles.caixa}>
                <legend className={styles.h2}>
                  <span className={styles.passo}>1</span> Escolha o período
                </legend>
                <div className={styles.opcoes}>
                  {Object.entries(PRECOS).map(([id, p]) => (
                    <label key={id} className={styles.opcao}>
                      <input type="radio" name="periodo" value={id} defaultChecked={id === escolhido} />
                      <span className={styles.opcaoNome}>
                        {p.rotulo}
                        {p.selo && <small className={styles.selo}>{p.selo}</small>}
                      </span>
                      <strong className={styles.opcaoValor}>{p.valor}</strong>
                      <span className={styles.opcaoNota}>{p.nota}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset className={styles.caixa}>
                <legend className={styles.h2}>
                  <span className={styles.passo}>2</span> Forma de pagamento
                </legend>
                <div className={styles.opcoes}>
                  <label className={styles.opcao}>
                    <input type="radio" name="metodo" value="pix" defaultChecked={metodo !== "cartao"} />
                    <span className={styles.opcaoNome}>Pix</span>
                    <span className={styles.opcaoNota}>Confirmação na hora. A gente avisa antes de cada renovação.</span>
                  </label>
                  <label className={styles.opcao}>
                    <input type="radio" name="metodo" value="cartao" defaultChecked={metodo === "cartao"} />
                    <span className={styles.opcaoNome}>Cartão de crédito</span>
                    <span className={styles.opcaoNota}>Renova sozinho. Os dados do cartão ficam com o gateway, não com a gente.</span>
                  </label>
                </div>
              </fieldset>

              {usuario ? (
                <button type="submit" className={`${base.buttonDark} ${styles.enviar}`}>
                  Continuar para o pagamento
                </button>
              ) : (
                <Link href="/entrar?voltar=/assinar" className={`${base.buttonDark} ${styles.enviar}`}>
                  Entrar pra assinar
                </Link>
              )}
            </form>

            <aside className={styles.resumo} aria-labelledby="resumo">
              <div>
                <p className={styles.resumoSelo}>Plano Pro</p>
                <h2 id="resumo" className={styles.resumoTitulo}>
                  O que vem no Pro
                </h2>
              </div>

              <ul className={styles.beneficios}>
                {BENEFICIOS.map(({ Icone, titulo, texto }) => (
                  <li key={titulo}>
                    <span className={styles.beneficioIcone} aria-hidden="true">
                      <Icone size={18} strokeWidth={2.4} />
                    </span>
                    <span>
                      <strong>{titulo}</strong>
                      <small>{texto}</small>
                    </span>
                  </li>
                ))}
              </ul>

              <ul className={styles.notas}>
                <li>
                  <Sparkles size={16} aria-hidden="true" />
                  <span>
                    <strong>Simular continua grátis.</strong> O Pro só guarda as simulações pra você comparar.
                  </span>
                </li>
                <li>
                  <ShieldCheck size={16} aria-hidden="true" />
                  <span>
                    <strong>7 dias pra desistir.</strong> Cancelou nesse prazo, recebe tudo de volta. Depois, vale a
                    partir da próxima cobrança.
                  </span>
                </li>
              </ul>
            </aside>
          </div>
        )}
      </main>

      <footer className={base.footer}>
        <div className={base.footerInner}>
          <span className={base.logo}>
            <span className={base.logoMark} aria-hidden="true" />
            slabbit
          </span>
          <p>
            Slabbit é um projeto independente e não tem relação com Nintendo, Creatures, GAME FREAK ou The Pokémon
            Company. Os preços são estimativas de mercado e não são recomendação de investimento.
          </p>
        </div>
      </footer>
    </div>
  );
}
