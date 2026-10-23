// app/conta/PokemonFavorito.jsx
// Escolher o Pokémon favorito: busca por nome ou número e grade com a foto de cada um.
// A lista vem do servidor (PokeAPI); aqui só filtra e guarda a escolha num campo escondido.
"use client";

import { useState } from "react";
import base from "../page.module.css";
import area from "../../components/area/area.module.css";
import styles from "./conta.module.css";

const POR_PAGINA = 48; // evita carregar as 1025 fotos de uma vez

const foto = (id) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;

export default function PokemonFavorito({ pokemons, atual, acao }) {
  const [escolhido, setEscolhido] = useState(atual ?? null);
  const [busca, setBusca] = useState("");
  const [limite, setLimite] = useState(POR_PAGINA);

  const termo = busca.trim().toLowerCase();
  const filtrados = termo
    ? pokemons.filter((p) => p.nome.toLowerCase().includes(termo) || String(p.id) === termo)
    : pokemons;
  const nomeEscolhido = pokemons.find((p) => p.id === escolhido)?.nome;

  return (
    <form action={acao} className={area.caixa}>
      <h2 className={area.subtitulo}>Pokémon favorito</h2>

      <div className={styles.escolhido}>
        {escolhido ? (
          <>
            <img src={foto(escolhido)} alt="" width={96} height={96} />
            <div>
              <strong>{nomeEscolhido}</strong>
              <span className={area.ajuda}>Nº {escolhido} na Pokédex</span>
            </div>
          </>
        ) : (
          <span className={area.ajuda}>Nenhum escolhido ainda.</span>
        )}
      </div>
      <input type="hidden" name="pokemon" value={escolhido ?? ""} />

      <div className={area.campo}>
        <label htmlFor="busca-pokemon">Buscar por nome ou número</label>
        <input
          id="busca-pokemon"
          type="search"
          value={busca}
          onChange={(e) => {
            setBusca(e.target.value);
            setLimite(POR_PAGINA);
          }}
          placeholder="Ex.: Pikachu ou 25"
          autoComplete="off"
        />
      </div>

      {filtrados.length === 0 ? (
        <p className={area.texto}>Nenhum Pokémon com esse nome.</p>
      ) : (
        <ul className={styles.grade}>
          {filtrados.slice(0, limite).map((p) => (
            <li key={p.id}>
              <button
                type="button"
                className={styles.pokemon}
                aria-pressed={p.id === escolhido}
                onClick={() => setEscolhido(p.id)}
              >
                <img src={foto(p.id)} alt="" width={96} height={96} loading="lazy" />
                <span>{p.nome}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {filtrados.length > limite && (
        <div className={area.botoes}>
          <button type="button" className={base.buttonOutline} onClick={() => setLimite(limite + POR_PAGINA)}>
            Mostrar mais
          </button>
        </div>
      )}

      <div className={area.botoes}>
        <button type="submit" className={base.buttonDark}>
          Salvar favorito
        </button>
        {escolhido && (
          <button type="button" className={base.buttonOutline} onClick={() => setEscolhido(null)}>
            Tirar favorito
          </button>
        )}
      </div>
    </form>
  );
}
