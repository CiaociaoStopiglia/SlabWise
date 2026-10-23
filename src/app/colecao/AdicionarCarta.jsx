// app/colecao/AdicionarCarta.jsx
// Botão "Adicionar carta" + janela em dois passos:
//   1. busca (digita e os resultados aparecem sozinhos, sem recarregar a página)
//   2. detalhes da carta escolhida (quantidade, estado, quanto pagou) e Salvar
// A busca usa /api/cartas. Salvar usa a mesma Server Action de sempre (adicionarCarta).
"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeft, Plus, Search, X } from "lucide-react";
import { adicionarCarta } from "./actions";
import { Campos } from "./FormularioAdicionar";
import base from "../page.module.css";
import styles from "./colecao.module.css";

const reais = (v) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: v < 100 ? 2 : 0,
    maximumFractionDigits: v < 100 ? 2 : 0,
  }).format(v);

const VAZIO = { carregando: false, cartas: [], total: 0, erro: false, buscou: false };

/**
 * abrirAgora: abre a janela assim que a página carrega (vem de /colecao?adicionar=...)
 * termoInicial: já começa buscando esse nome (ex.: os atalhos "Charizard", "Umbreon")
 * variante: "principal" (botão preto) ou "grande" (botão do estado vazio)
 */
export default function AdicionarCarta({ abrirAgora = false, termoInicial = "", variante = "principal" }) {
  const janela = useRef(null);
  const campo = useRef(null);
  const tituloId = useId();
  const [termo, setTermo] = useState(termoInicial);
  const [busca, setBusca] = useState(VAZIO);
  const [escolhida, setEscolhida] = useState(null);

  function abrir() {
    setEscolhida(null);
    janela.current?.showModal();
    requestAnimationFrame(() => campo.current?.focus());
  }

  function fechar() {
    janela.current?.close();
  }

  // Abre sozinha quando a página pede (?adicionar=)
  useEffect(() => {
    if (abrirAgora) {
      janela.current?.showModal();
      requestAnimationFrame(() => campo.current?.focus());
    }
  }, [abrirAgora]);

  // Busca enquanto digita, esperando a pessoa parar por 350 ms
  useEffect(() => {
    const q = termo.trim();
    if (q.length < 2) {
      setBusca(VAZIO);
      return;
    }
    const controle = new AbortController();
    setBusca((b) => ({ ...b, carregando: true }));
    const espera = setTimeout(async () => {
      try {
        const r = await fetch(`/api/cartas?q=${encodeURIComponent(q)}`, { signal: controle.signal });
        const d = await r.json();
        setBusca({ carregando: false, cartas: d.cartas, total: d.total, erro: d.erro, buscou: true });
      } catch (e) {
        if (e.name !== "AbortError") setBusca({ ...VAZIO, erro: true, buscou: true });
      }
    }, 350);
    return () => {
      clearTimeout(espera);
      controle.abort();
    };
  }, [termo]);

  return (
    <>
      <button
        type="button"
        onClick={abrir}
        className={`${base.buttonDark} ${variante === "grande" ? styles.botaoAdicionarGrande : styles.botaoAdicionar}`}
      >
        <Plus size={18} strokeWidth={3} aria-hidden="true" />
        {variante === "grande" ? "Adicionar minha primeira carta" : "Adicionar carta"}
      </button>

      {/* biome-ignore lint/a11y/useKeyWithClickEvents: pelo teclado, o Esc já fecha o <dialog>; o clique é só no fundo escuro */}
      <dialog
        ref={janela}
        className={`${styles.addJanela} ${styles.janelaBusca}`}
        aria-labelledby={tituloId}
        onClick={(e) => {
          if (e.target === e.currentTarget) fechar();
        }}
        onClose={() => {
          // Tira o ?adicionar= do endereço, pra janela não reabrir ao recarregar
          if (window.location.search.includes("adicionar")) window.history.replaceState(null, "", "/colecao");
        }}
      >
        <div className={styles.janelaTopo}>
          {escolhida ? (
            <button type="button" className={styles.janelaVoltar} onClick={() => setEscolhida(null)}>
              <ArrowLeft size={18} aria-hidden="true" /> Voltar pra busca
            </button>
          ) : (
            <h2 id={tituloId} className={styles.janelaTitulo}>
              Adicionar carta
            </h2>
          )}
          <button type="button" className={styles.janelaFechar} onClick={fechar} aria-label="Fechar">
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {/* Passo 1: busca */}
        {!escolhida && (
          <div className={styles.passoBusca}>
            <label htmlFor={`${tituloId}-busca`} className={base.srOnly}>
              Nome ou número da carta
            </label>
            <div className={styles.campoBusca}>
              <Search size={18} aria-hidden="true" />
              <input
                ref={campo}
                id={`${tituloId}-busca`}
                type="search"
                value={termo}
                onChange={(e) => setTermo(e.target.value)}
                placeholder="Nome ou número, ex.: Charizard 4/102"
                autoComplete="off"
              />
            </div>

            <div className={styles.resultados} aria-live="polite">
              {termo.trim().length < 2 && (
                <p className={styles.resultadosAviso}>Use o nome em inglês. O número do canto da carta ajuda a achar a versão certa.</p>
              )}
              {busca.carregando && (
                <ul className={styles.listaResultados} aria-hidden="true">
                  {[1, 2, 3, 4].map((n) => (
                    <li key={n} className={styles.resultadoEsqueleto}>
                      <span />
                      <span />
                    </li>
                  ))}
                </ul>
              )}
              {!busca.carregando && busca.erro && (
                <p className={styles.resultadosAviso}>Não conseguimos consultar as cartas agora. Tente de novo.</p>
              )}
              {!busca.carregando && busca.buscou && !busca.erro && busca.cartas.length === 0 && (
                <p className={styles.resultadosAviso}>Nenhuma carta encontrada. Confira a grafia ou tente só o nome.</p>
              )}
              {!busca.carregando && busca.cartas.length > 0 && (
                <>
                  <p className={styles.resultadosConta}>
                    {busca.total > busca.cartas.length
                      ? `${busca.cartas.length} de ${busca.total} cartas · refine a busca pra ver outras`
                      : `${busca.total} ${busca.total === 1 ? "carta" : "cartas"}`}
                  </p>
                  <ul className={styles.listaResultados}>
                    {busca.cartas.map((c) => (
                      <li key={c.id}>
                        <button type="button" className={styles.resultado} onClick={() => setEscolhida(c)}>
                          {c.imagem ? (
                            <Image src={c.imagem} alt="" width={245} height={337} className={styles.resultadoFoto} />
                          ) : (
                            <span className={styles.resultadoFoto} />
                          )}
                          <span className={styles.resultadoInfo}>
                            <strong>{c.name}</strong>
                            <small>
                              {c.set ? `${c.set} · ` : ""}#{c.number}
                            </small>
                          </span>
                          <span className={styles.resultadoPreco}>{c.preco ? reais(c.preco) : "sem preço"}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
        )}

        {/* Passo 2: detalhes da carta escolhida */}
        {escolhida && (
          <form action={adicionarCarta} onSubmit={fechar} className={`${styles.addForm} ${styles.passoDetalhes}`}>
            <div className={styles.addTopo}>
              {escolhida.imagem && (
                <Image src={escolhida.imagem} alt="" width={245} height={337} className={styles.addFoto} />
              )}
              <div>
                <p className={styles.addKicker}>{escolhida.preco ? `Hoje: ${reais(escolhida.preco)}` : "Sem preço hoje"}</p>
                <h3 className={styles.addTitulo}>{escolhida.name}</h3>
                <p className={styles.addMeta}>
                  {escolhida.set ? `${escolhida.set} · ` : ""}#{escolhida.number}
                </p>
              </div>
            </div>
            <Campos carta={escolhida} voltar="/colecao" />
            <div className={styles.addAcoes}>
              <button type="button" className={base.buttonOutline} onClick={fechar}>
                Cancelar
              </button>
              <button type="submit" className={base.buttonDark}>
                Salvar na coleção
              </button>
            </div>
          </form>
        )}
      </dialog>
    </>
  );
}
