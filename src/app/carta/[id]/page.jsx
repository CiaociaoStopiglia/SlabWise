// app/carta/[id]/page.jsx
// Página de uma carta (endereço: /carta/base1-4): foto, preço em real, histórico, alerta e todas as informações.

import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Bell } from "lucide-react";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import { usuarioAtual } from "../../../lib/auth";
import { buscarDetalhesDaCarta, cotacaoDoDia, formatarReais } from "../../../lib/tcgdex";
import Cabecalho from "../../../components/Cabecalho";
import GraficoHistorico from "../../../components/GraficoHistorico";
import CampoDinheiro from "../../../components/CampoDinheiro";
import { escolherPeriodo, historicoDaCarta, registrarPreco } from "../../../lib/historico";
import { criarAlerta } from "../../alertas/actions";
import FormularioAdicionar from "../../colecao/FormularioAdicionar";
import base from "../../page.module.css";
import styles from "./carta.module.css";
import CartaBrilhante from "../../../components/CartaBrilhante";

const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-archivo", display: "swap" });
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-mono",
  display: "swap",
});

const NOMES_VERSAO = {
  normal: "Normal",
  holofoil: "Holo",
  holo: "Holo",
  "reverse-holofoil": "Reverse holo",
  reverse: "Reverse holo",
  "1stEditionHolofoil": "1ª edição holo",
  "1stEdition": "1ª edição",
  unlimitedHolofoil: "Holo (unlimited)",
  unlimited: "Unlimited",
};

export async function generateMetadata({ params }) {
  const { id } = await params;
  const carta = await buscarDetalhesDaCarta(decodeURIComponent(id));
  return { title: carta ? `${carta.name} · ${carta.set} | Slabbit` : "Carta | Slabbit" };
}

function Variacao({ valor }) {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return null;
  const subiu = valor >= 0;
  return (
    <span className={subiu ? styles.alta : styles.baixa}>
      {subiu ? "▲" : "▼"} {Math.abs(valor).toFixed(0)}% em relação à média de 30 dias
    </span>
  );
}

function Ficha({ itens }) {
  const lista = itens.filter(([, valor]) => valor !== null && valor !== undefined && valor !== "");
  return (
    <dl className={styles.ficha}>
      {lista.map(([rotulo, valor]) => (
        <div key={rotulo}>
          <dt>{rotulo}</dt>
          <dd>{valor}</dd>
        </div>
      ))}
    </dl>
  );
}

export default async function Carta({ params, searchParams }) {
  const { id: idBruto } = await params;
  const { periodo: periodoId = "" } = await searchParams;
  const id = decodeURIComponent(idBruto);

  const [cotacao, usuario] = await Promise.all([cotacaoDoDia(), usuarioAtual()]);
  const carta = await buscarDetalhesDaCarta(id, cotacao);
  if (!carta) notFound();

  const caminho = `/carta/${encodeURIComponent(id)}`;
  const temBatalha = carta.ataques.length > 0 || carta.habilidades.length > 0;

  // Histórico: guarda o preço de hoje e lê os dias anteriores. O Grátis vê 30 dias.
  const pro = usuario?.plano === "pro";
  if (carta.preco) await registrarPreco(carta.id, carta.preco.valor);
  const periodo = escolherPeriodo(periodoId);
  const bloqueado = periodo.pro && !pro;
  const historico = bloqueado ? [] : await historicoDaCarta(carta.id, periodo.dias);

  return (
    <div className={`${base.page} ${archivo.variable} ${plexMono.variable}`}>
      <Cabecalho ativo="precos" />

      <main>
        <section className={styles.band}>
          <div className={styles.bandInner}>
            <nav className={styles.migalhas} aria-label="Você está em">
              <Link href="/precos">Preços</Link>
              <span aria-hidden="true">/</span>
              <Link href={`/precos?q=${encodeURIComponent(carta.name)}`}>{carta.name}</Link>
            </nav>
            <h1 className={styles.title}>{carta.name}</h1>
            <p className={styles.subtitulo}>
              {carta.set} · #{carta.number}
              {carta.rarity ? ` · ${carta.rarity}` : ""}
            </p>
          </div>
        </section>

        <section className={styles.corpo}>
          <div className={styles.corpoInner}>
            <div className={styles.foto}>
              <CartaBrilhante valor={carta.preco?.valor} className={styles.fotoCarta}>
                <Image
                  src={carta.images.large}
                  alt={`Carta ${carta.name} · ${carta.set} ${carta.number}`}
                  width={600}
                  height={825}
                  priority
                  className={styles.fotoImg}
                />
              </CartaBrilhante>
            </div>

            <div className={styles.lado}>
              {/* Preço */}
              <section className={styles.caixa} aria-labelledby="preco">
                <h2 id="preco" className={styles.h2}>
                  Preço hoje
                </h2>
                {carta.preco ? (
                  <>
                    <p className={styles.preco}>{formatarReais(carta.preco.valor)}</p>
                    <p className={styles.fonte}>Preço de mercado, sem graduar · {carta.preco.fonte}</p>
                    <Variacao valor={carta.preco.variacao30} />
                  </>
                ) : (
                  <p className={styles.fonte}>Essa carta está sem preço na base no momento.</p>
                )}

                {carta.versoes.length > 0 && (
                  <table className={styles.tabela}>
                    <caption>Por versão (TCGplayer)</caption>
                    <thead>
                      <tr>
                        <th scope="col">Versão</th>
                        <th scope="col">Mínimo</th>
                        <th scope="col">Mercado</th>
                        <th scope="col">Máximo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {carta.versoes.map((v) => (
                        <tr key={v.nome}>
                          <th scope="row">{NOMES_VERSAO[v.nome] ?? v.nome}</th>
                          <td>{v.minimo ? formatarReais(v.minimo) : "—"}</td>
                          <td>{formatarReais(v.mercado)}</td>
                          <td>{v.maximo ? formatarReais(v.maximo) : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {carta.cardmarket && (
                  <table className={styles.tabela}>
                    <caption>Europa (Cardmarket)</caption>
                    <tbody>
                      <tr>
                        <th scope="row">Tendência</th>
                        <td>{formatarReais(carta.cardmarket.tendencia)}</td>
                      </tr>
                      {carta.cardmarket.media7 && (
                        <tr>
                          <th scope="row">Média de 7 dias</th>
                          <td>{formatarReais(carta.cardmarket.media7)}</td>
                        </tr>
                      )}
                      {carta.cardmarket.media30 && (
                        <tr>
                          <th scope="row">Média de 30 dias</th>
                          <td>{formatarReais(carta.cardmarket.media30)}</td>
                        </tr>
                      )}
                      {carta.cardmarket.minimo && (
                        <tr>
                          <th scope="row">Menor anúncio</th>
                          <td>{formatarReais(carta.cardmarket.minimo)}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </section>

              {/* Adicionar à coleção */}
              <section className={styles.caixa} aria-labelledby="colecao">
                <h2 id="colecao" className={styles.h2}>
                  Sua coleção
                </h2>
                {usuario ? (
                  <FormularioAdicionar carta={carta} voltar={caminho} aberto />
                ) : (
                  <>
                    <p className={styles.fonte}>Entre na sua conta pra guardar essa carta e acompanhar quanto ela vale.</p>
                    <Link href={`/entrar?voltar=${encodeURIComponent(caminho)}`} className={base.buttonDark}>
                      Entrar para adicionar
                    </Link>
                  </>
                )}
                <Link href={`/graduar?carta=${encodeURIComponent(carta.id)}`} className={styles.link}>
                  Vale graduar? →
                </Link>
              </section>
            </div>
          </div>
        </section>

        {/* Histórico de preço + alerta */}
        <section className={styles.infos} id="historico">
          <div className={styles.extraInner}>
            <GraficoHistorico
              titulo="Histórico de preço"
              descricao="Preço em real, sem graduar. A gente registra um valor por dia."
              pontos={historico}
              periodo={periodo.id}
              linkPeriodo={(p) => `${caminho}?periodo=${p}#historico`}
              bloqueado={bloqueado}
              gratis={!pro}
              idTitulo="historico-titulo"
            />

            {/* Alerta de preço: à esquerda o que é, à direita o que dá pra fazer */}
            <section id="alerta" className={styles.alerta} aria-labelledby="alerta-titulo">
              <div className={styles.alertaInfo}>
                <span className={styles.alertaIcone} aria-hidden="true">
                  <Bell size={22} strokeWidth={2.4} />
                </span>
                <div>
                  <p className={styles.alertaSelo}>
                    Alerta de preço <span>PRO</span>
                  </p>
                  <h2 id="alerta-titulo" className={styles.alertaTitulo}>
                    Avisa quando mexer
                  </h2>
                  <p className={styles.alertaTexto}>
                    Escolha um preço-alvo. Quando {carta.name} cruzar esse valor em real, você recebe um e-mail no
                    mesmo dia.
                  </p>
                </div>
              </div>

              <div className={styles.alertaAcao}>
                {pro ? (
                  <form action={criarAlerta} className={styles.alertaForm}>
                    <input type="hidden" name="carta_id" value={carta.id} />
                    <input type="hidden" name="voltar" value={caminho} />
                    <fieldset className={styles.direcoes}>
                      <legend>Me avise quando o preço</legend>
                      <label>
                        <input type="radio" name="direcao" value="abaixo" defaultChecked />
                        <span>cair abaixo de</span>
                      </label>
                      <label>
                        <input type="radio" name="direcao" value="acima" />
                        <span>subir acima de</span>
                      </label>
                    </fieldset>
                    <label htmlFor="preco_alvo" className={styles.alvoRotulo}>
                      Preço-alvo
                    </label>
                    <div className={styles.alvo}>
                      <span aria-hidden="true">R$</span>
                      <CampoDinheiro
                        id="preco_alvo"
                        name="preco_alvo"
                        required
                        placeholder={carta.preco ? formatarReais(carta.preco.valor).replace("R$", "").trim() : "1.000"}
                      />
                    </div>
                    {carta.preco && (
                      <p className={styles.alvoHoje}>Hoje ela vale {formatarReais(carta.preco.valor)}.</p>
                    )}
                    <button type="submit" className={base.buttonDark}>
                      Criar alerta
                    </button>
                    <Link href="/alertas" className={styles.link}>
                      Ver meus alertas →
                    </Link>
                  </form>
                ) : (
                  <>
                    {/* Exemplo de como fica o alerta, pra pessoa entender antes de assinar */}
                    <div className={styles.alertaExemplo} aria-hidden="true">
                      <span className={styles.alertaExemploSelo}>EXEMPLO</span>
                      <strong>{carta.name}</strong>
                      <span>
                        Quando cair abaixo de{" "}
                        <b>{carta.preco ? formatarReais(Math.round((carta.preco.valor * 0.9) / 10) * 10) : "R$ 1.000"}</b>
                      </span>
                    </div>
                    {usuario ? (
                      <Link href="/assinar" className={base.buttonDark}>
                        Assinar o Pro
                      </Link>
                    ) : (
                      <Link href={`/entrar?voltar=${encodeURIComponent(caminho)}`} className={base.buttonDark}>
                        Entrar para criar alerta
                      </Link>
                    )}
                    <p className={styles.alertaNota}>
                      {usuario ? "Alertas fazem parte do Pro: R$ 9,90/mês ou R$ 99/ano." : "Alertas são do plano Pro."}
                    </p>
                  </>
                )}
              </div>
            </section>
          </div>
        </section>

        <section className={styles.infos}>
          <div className={styles.infosInner}>
            <h2 className={styles.h2}>Sobre a carta</h2>
            <Ficha
              itens={[
                ["Tipo de carta", carta.categoria],
                ["Estágio", carta.estagio],
                ["Evolui de", carta.evoluiDe],
                ["HP", carta.hp],
                ["Tipo", carta.tipos.length ? carta.tipos.join(", ") : null],
                ["Recuo", carta.recuo !== null ? `${carta.recuo}` : null],
                ["Coleção", carta.set],
                ["Número", carta.number],
                ["Raridade", carta.rarity],
                ["Ilustrador", carta.ilustrador],
                ["Marca de regulação", carta.marca],
                [
                  "Formato",
                  carta.legal
                    ? [carta.legal.standard && "Standard", carta.legal.expanded && "Expandido"].filter(Boolean).join(" e ") ||
                      "Fora de formato"
                    : null,
                ],
              ]}
            />

            {carta.efeito && <p className={styles.texto}>{carta.efeito}</p>}

            {temBatalha && (
              <>
                <h2 className={styles.h2}>Habilidades e ataques</h2>
                <ul className={styles.golpes}>
                  {carta.habilidades.map((h) => (
                    <li key={h.nome}>
                      <strong>
                        {h.tipo ? `${h.tipo}: ` : ""}
                        {h.nome}
                      </strong>
                      {h.efeito && <p>{h.efeito}</p>}
                    </li>
                  ))}
                  {carta.ataques.map((a) => (
                    <li key={a.nome}>
                      <strong>
                        {a.nome}
                        {a.dano ? <span className={styles.dano}>{a.dano}</span> : null}
                      </strong>
                      {a.custo.length > 0 && <small>Energia: {a.custo.join(", ")}</small>}
                      {a.efeito && <p>{a.efeito}</p>}
                    </li>
                  ))}
                </ul>
              </>
            )}

            {(carta.fraquezas.length > 0 || carta.resistencias.length > 0) && (
              <Ficha
                itens={[
                  ["Fraqueza", carta.fraquezas.map((f) => `${f.tipo}${f.valor ? ` ${f.valor}` : ""}`).join(", ")],
                  ["Resistência", carta.resistencias.map((f) => `${f.tipo}${f.valor ? ` ${f.valor}` : ""}`).join(", ")],
                ]}
              />
            )}

            {carta.descricao && <p className={styles.descricao}>“{carta.descricao}”</p>}

            <p className={base.sourceNote}>
              Dados da TCGdex. Preços da TCGplayer e da Cardmarket, convertidos pela cotação do dia (dólar a{" "}
              {formatarReais(cotacao.usd)}). Preço de carta sem graduar. Não é recomendação de investimento.
            </p>
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
            Slabbit é um projeto independente e não tem relação com Nintendo, Creatures, GAME FREAK ou The Pokémon
            Company. Os preços são estimativas de mercado e não são recomendação de investimento.
          </p>
        </div>
      </footer>
    </div>
  );
}
