// app/conta/PerfilTopo.jsx
// Topo do perfil: faixa com o Pokémon favorito, card da pessoa (avatar, números e atalhos)
// e as últimas cartas da coleção. Só mostra dados; quem busca tudo é a página.
import Link from "next/link";
import Image from "next/image";
import { iniciais } from "../../components/Cabecalho";
import { formatarReais } from "../../lib/tcgdex";
import { fotoPokemon } from "../../lib/pokeapi";
import BotaoImagem from "./BotaoImagem";
import base from "../page.module.css";
import styles from "./conta.module.css";

const MESES = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

function membroDesde(data) {
  if (!data) return null;
  const d = new Date(data);
  return `${MESES[d.getMonth()]} de ${d.getFullYear()}`;
}

export default function PerfilTopo({
  usuario,
  nomePokemon,
  colecao,
  acaoImagem,
}) {
  const pro = usuario.plano === "pro";
  const { resumo, itens, cartas } = colecao;
  const desde = membroDesde(usuario.criado_em);

  // Até 24 cartas da coleção (a lista já vem da mais nova pra mais velha), uma por carta
  const vistas = new Set();
  const recentes = itens
    .filter(
      (i) =>
        cartas[i.carta_id] && !vistas.has(i.carta_id) && vistas.add(i.carta_id),
    )
    .slice(0, 24);

  return (
    <section className={styles.perfilTopo} aria-label="Seu perfil">
      <div
        className={styles.banner}
        style={
          usuario.banner_url
            ? { backgroundImage: `url(${usuario.banner_url})` }
            : undefined
        }
      >
        {/* Com banner enviado, o Pokémon sai pra não cobrir a imagem */}
        {usuario.pokemon_favorito && !usuario.banner_url && (
          <>
            <img
              className={styles.bannerPokemon}
              src={fotoPokemon(usuario.pokemon_favorito)}
              alt=""
              width={280}
              height={280}
            />
            <span className={styles.bannerFavorito}>
              Favorito: {nomePokemon ?? `Nº ${usuario.pokemon_favorito}`}
            </span>
          </>
        )}
        {acaoImagem && (
          <BotaoImagem
            tipo="banner"
            rotulo="banner"
            acao={acaoImagem}
            temImagem={Boolean(usuario.banner_url)}
            className={styles.botaoBanner}
          />
        )}
        <ul className={styles.bannerInfo}>
          {desde && <li>Membro desde {desde}</li>}
          <li>{pro ? "Plano Pro" : "Plano Grátis"}</li>
        </ul>
      </div>

      <div className={styles.perfilCorpo}>
        <div className={styles.cartaoPerfil}>
          <div className={styles.avatarArea}>
            <span className={styles.avatarGrande} aria-hidden="true">
              {usuario.foto_url ? (
                <img src={usuario.foto_url} alt="" width={96} height={96} />
              ) : usuario.pokemon_favorito ? (
                <img
                  src={fotoPokemon(usuario.pokemon_favorito)}
                  alt=""
                  width={96}
                  height={96}
                />
              ) : (
                iniciais(usuario.nome)
              )}
            </span>
            {acaoImagem && (
              <BotaoImagem
                tipo="avatar"
                rotulo="foto de perfil"
                acao={acaoImagem}
                temImagem={Boolean(usuario.foto_url)}
                className={styles.botaoAvatar}
              />
            )}
          </div>
          <h1 className={styles.nomePerfil}>{usuario.nome}</h1>
          <span className={pro ? styles.seloPerfilPro : styles.seloPerfil}>
            {pro ? "PRO" : "GRÁTIS"}
          </span>

          <dl className={styles.numeros}>
            <div>
              <dd>{resumo.totalCartas}</dd>
              <dt>Cartas</dt>
            </div>
            <div>
              <dd>{formatarReais(resumo.valorTotal)}</dd>
              <dt>Valor estimado</dt>
            </div>
          </dl>

          <div className={styles.atalhos}>
            <Link href="/colecao" className={base.buttonDark}>
              Minha coleção
            </Link>
            {!pro && (
              <Link href="/assinar" className={base.buttonOutline}>
                Assinar o Pro
              </Link>
            )}
          </div>
        </div>

        <div className={styles.recentes}>
          <div className={styles.sobre}>
            <h2 className={styles.tituloBloco}>Sobre</h2>
            <p>
              {resumo.distintas > 0
                ? `Colecionador${desde ? ` desde ${desde}` : ""}, com ${resumo.distintas} ${resumo.distintas === 1 ? "carta diferente" : "cartas diferentes"} na coleção.`
                : "Ainda sem cartas na coleção. Adicione a primeira pela página da carta."}
            </p>
          </div>
          <div className={styles.tituloLinha}>
            <h2 className={styles.tituloBloco}>Minha coleção</h2>
            {resumo.distintas > recentes.length && (
              <Link href="/colecao">Ver as {resumo.distintas} cartas</Link>
            )}
          </div>
          {recentes.length === 0 ? (
            <p className={styles.vazio}>
              Sua coleção está vazia.{" "}
              <Link href="/precos">Procure uma carta</Link> e adicione a
              primeira.
            </p>
          ) : (
            <ul className={styles.recentesGrade}>
              {recentes.map((i) => {
                const c = cartas[i.carta_id];
                return (
                  <li key={i.id}>
                    <Link
                      href={`/carta/${i.carta_id}`}
                      className={styles.recente}
                    >
                      <Image
                        src={c.images.small}
                        alt=""
                        width={245}
                        height={337}
                      />
                      <strong>{c.name}</strong>
                      <span>
                        {i.quantidade > 1 ? `${i.quantidade}× · ` : ""}
                        {c.preco?.valor
                          ? formatarReais(c.preco.valor)
                          : "Sem preço"}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
