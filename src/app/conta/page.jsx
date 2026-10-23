// app/conta/page.jsx
// Conta (endereço: /conta). Área logada: nome, senha e excluir conta.
import { redirect } from "next/navigation";
import { usuarioAtual } from "../../lib/auth";
import AreaLogada from "../../components/area/AreaLogada";
import {
  alterarSenha,
  atualizarNome,
  excluirConta,
  gerarHistoricoDev,
  mudarPlanoDev,
  salvarImagemPerfil,
  salvarPokemonFavorito,
} from "./actions";
import PokemonFavorito from "./PokemonFavorito";
import PerfilTopo from "./PerfilTopo";
import { cloudinaryLigado } from "../../lib/cloudinary";
import { carregarColecao } from "../colecao/dados";
import { listarPokemons } from "../../lib/pokeapi";
import base from "../page.module.css";
import styles from "../../components/area/area.module.css";
import conta from "./conta.module.css";

export const metadata = { title: "Conta | Slabbit" };

export default async function Conta({ searchParams }) {
  const usuario = await usuarioAtual();
  if (!usuario) redirect("/entrar?voltar=/conta");

  const [pokemons, colecao] = await Promise.all([
    listarPokemons(),
    carregarColecao(usuario.id),
  ]);
  const nomePokemon = pokemons?.find(
    (p) => p.id === usuario.pokemon_favorito,
  )?.nome;

  return (
    <AreaLogada usuario={usuario} ativo="conta" cheia>
      <PerfilTopo
        usuario={usuario}
        nomePokemon={nomePokemon}
        colecao={colecao}
        acaoImagem={cloudinaryLigado() ? salvarImagemPerfil : null}
      />

      <div className={conta.formularios}>
        <form action={atualizarNome} className={styles.caixa}>
          <h2 className={styles.subtitulo}>Seus dados</h2>
          <div className={styles.campos}>
            <div className={styles.campo}>
              <label htmlFor="nome">Nome</label>
              <input
                id="nome"
                name="nome"
                defaultValue={usuario.nome}
                maxLength={80}
                required
                autoComplete="name"
              />
            </div>
            <div className={styles.campo}>
              <label htmlFor="email">E-mail</label>
              <input
                id="email"
                type="email"
                value={usuario.email}
                readOnly
                aria-describedby="email-ajuda"
              />
              <span id="email-ajuda" className={styles.ajuda}>
                Pra trocar o e-mail, fale com a gente.
              </span>
            </div>
          </div>
          <div className={styles.botoes}>
            <button type="submit" className={base.buttonDark}>
              Salvar dados
            </button>
          </div>
        </form>

        {pokemons ? (
          <PokemonFavorito
            pokemons={pokemons}
            atual={usuario.pokemon_favorito}
            acao={salvarPokemonFavorito}
          />
        ) : (
          <div className={styles.caixa}>
            <h2 className={styles.subtitulo}>Pokémon favorito</h2>
            <p className={styles.texto}>
              Não conseguimos carregar a lista de Pokémon agora. Tente de novo
              daqui a pouco.
            </p>
          </div>
        )}

        <form action={alterarSenha} className={styles.caixa}>
          <h2 className={styles.subtitulo}>Senha</h2>
          <div className={styles.campo}>
            <label htmlFor="senha_atual">Senha atual</label>
            <input
              id="senha_atual"
              name="senha_atual"
              type="password"
              required
              autoComplete="current-password"
            />
          </div>
          <div className={styles.campos}>
            <div className={styles.campo}>
              <label htmlFor="senha_nova">Nova senha</label>
              <input
                id="senha_nova"
                name="senha_nova"
                type="password"
                minLength={8}
                required
                autoComplete="new-password"
                aria-describedby="senha-regra"
              />
              <span id="senha-regra" className={styles.ajuda}>
                Pelo menos 8 caracteres.
              </span>
            </div>
            <div className={styles.campo}>
              <label htmlFor="senha_repetida">Repita a nova senha</label>
              <input
                id="senha_repetida"
                name="senha_repetida"
                type="password"
                required
                autoComplete="new-password"
              />
            </div>
          </div>
          <div className={styles.botoes}>
            <button type="submit" className={base.buttonDark}>
              Alterar senha
            </button>
          </div>
        </form>

        {/* Só aparece no "npm run dev": atalhos pra testar sem pagamento */}
        {process.env.NODE_ENV === "development" && (
          <div className={`${styles.caixa} ${styles.dev}`}>
            <h2 className={styles.subtitulo}>Modo desenvolvimento</h2>
            <p className={styles.texto}>
              Só aparece rodando no seu computador. Seu plano agora:{" "}
              <strong>{usuario.plano === "pro" ? "Pro" : "Grátis"}</strong>.
            </p>
            <div className={styles.botoes}>
              <form action={mudarPlanoDev}>
                <input
                  type="hidden"
                  name="plano"
                  value={usuario.plano === "pro" ? "gratis" : "pro"}
                />
                <button type="submit" className={base.buttonDark}>
                  {usuario.plano === "pro"
                    ? "Voltar pro Grátis"
                    : "Virar Pro (30 dias)"}
                </button>
              </form>
              <form action={gerarHistoricoDev}>
                <button type="submit" className={base.buttonOutline}>
                  Criar histórico de teste
                </button>
              </form>
            </div>
            <p className={styles.ajuda}>
              O histórico de teste cria 90 dias de valores pra sua coleção e
              pras cartas que estão nela. Adicione cartas antes.
            </p>
          </div>
        )}

        <form action={excluirConta} className={styles.caixa}>
          <h2 className={styles.subtitulo}>Excluir conta</h2>
          <p className={styles.texto}>
            Apaga sua coleção, alertas e simulações. Não dá pra desfazer.
          </p>
          <div className={styles.campo}>
            <label htmlFor="senha_exclusao">
              Digite sua senha pra confirmar
            </label>
            <input
              id="senha_exclusao"
              name="senha"
              type="password"
              required
              autoComplete="current-password"
            />
          </div>
          <div className={styles.botoes}>
            <button
              type="submit"
              className={`${base.buttonOutline} ${styles.perigo}`}
            >
              Excluir minha conta
            </button>
          </div>
        </form>
      </div>
    </AreaLogada>
  );
}
