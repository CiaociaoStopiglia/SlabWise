// app/colecao/page.jsx
// Minha coleção (endereço: /colecao). Só pra quem tá logado, dentro da área logada.
//
// Organização da tela:
//   topo     → título + botão "Adicionar carta" (abre a janela de busca)
//   painel   → quanto a coleção vale hoje, lado a lado com o gráfico de como esse valor andou
//   cartas   → a coleção em si, com ordenação
// Coleção vazia: no lugar do painel e das cartas, um convite pra adicionar a primeira.
import Link from "next/link";
import { redirect } from "next/navigation";
import { usuarioAtual } from "../../lib/auth";
import { escolherPeriodo, historicoDaColecao, registrarValorColecao } from "../../lib/historico";
import AreaLogada from "../../components/area/AreaLogada";
import { carregarColecao } from "./dados";
import AdicionarCarta from "./AdicionarCarta";
import Painel from "./Painel";
import ListaCartas, { ORDENS, ordenarCartas } from "./ListaCartas";
import styles from "./colecao.module.css";

export const metadata = { title: "Minha coleção | Slabbit" };

const SUGESTOES = ["Charizard", "Umbreon", "Pikachu", "Gengar", "Mewtwo", "Rayquaza"];

export default async function Colecao({ searchParams }) {
  const usuario = await usuarioAtual();
  if (!usuario) redirect("/entrar?voltar=/colecao");

  const { periodo: periodoId = "", ordem: ordemPedida = "", adicionar } = await searchParams;
  const ordem = ORDENS[ordemPedida] ? ordemPedida : "valor";
  const gratis = usuario.plano !== "pro";

  const { itens, cartas, bancoFora, resumo } = await carregarColecao(usuario.id);
  const vazia = !bancoFora && itens.length === 0;

  // Foto do valor de hoje, pro gráfico de evolução. Coleção vazia não entra.
  if (!bancoFora && itens.length > 0) {
    await registrarValorColecao(usuario.id, resumo.valorTotal, resumo.investido);
  }
  const periodo = escolherPeriodo(periodoId);
  const bloqueado = periodo.pro && gratis;
  const historico = itens.length > 0 && !bloqueado ? await historicoDaColecao(usuario.id, periodo.dias) : [];

  // Links mantêm o período e a ordem escolhidos
  const link = (mudanca) => {
    const p = new URLSearchParams({ periodo: periodo.id, ordem, ...mudanca });
    return `/colecao?${p.toString()}`;
  };

  return (
    <AreaLogada
      usuario={usuario}
      ativo="colecao"
      titulo="Minha coleção"
      acoes={
        !vazia && <AdicionarCarta abrirAgora={adicionar !== undefined} termoInicial={adicionar ?? ""} />
      }
    >
      {bancoFora && (
        <p className={styles.muted}>Não conseguimos abrir sua coleção agora. Tente de novo em alguns segundos.</p>
      )}

      {vazia && (
        <section className={styles.vazia}>
          <h2>Comece sua coleção</h2>
          <p>
            Adicione suas cartas e veja quanto elas valem hoje, somadas, em real. Se anotar quanto pagou, a gente mostra
            se você está no lucro.
          </p>
          <AdicionarCarta
            variante="grande"
            abrirAgora={adicionar !== undefined}
            termoInicial={adicionar ?? ""}
          />
          <div className={styles.vaziaAtalhos}>
            <span>Ou comece por uma das mais procuradas:</span>
            <ul className={styles.chips}>
              {SUGESTOES.map((s) => (
                <li key={s}>
                  <Link href={`/colecao?adicionar=${encodeURIComponent(s)}`}>{s}</Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {!bancoFora && !vazia && (
        <>
          <Painel
            resumo={resumo}
            gratis={gratis}
            grafico={{
              titulo: "Evolução do valor",
              pontos: historico,
              periodo: periodo.id,
              linkPeriodo: (id) => link({ periodo: id }),
              bloqueado,
              gratis,
              comInvestido: resumo.investido > 0,
              idTitulo: "evolucao",
            }}
          />

          <ListaCartas
            itens={ordenarCartas(itens, cartas, ordem)}
            cartas={cartas}
            ordem={ordem}
            totalCartas={resumo.totalCartas}
            linkOrdem={(id) => link({ ordem: id })}
          />
        </>
      )}
    </AreaLogada>
  );
}
