# CLAUDE.md

Contexto do projeto para o Claude. Visão geral e histórico completo estão no [README.md](README.md).

## O que é

**Slabbit**: site em português (pt-BR) que mostra o preço de cartas Pokémon em **reais**, simula se **vale a pena graduar** a carta na PSA e guarda a coleção do usuário. Público: colecionadores brasileiros.

## Stack

- Next.js 16 (App Router) + React 19, React Compiler ligado (`babel-plugin-react-compiler`)
- JavaScript (`.js`/`.jsx`, sem TypeScript); alias de imports em `jsconfig.json`
- CSS Modules por página (`*.module.css`); Tailwind 4 e Ant Design (`AntdRegistry`) estão instalados, mas o visual é quase todo CSS Modules
- Animação: GSAP, Motion, Anime.js, Lenis (scroll suave), Embla (carrossel)
- Postgres via `pg` (sem ORM); senhas com `bcryptjs`
- Lint/format: Biome (`npm run lint`, `npm run format`), indentação de 2 espaços
- Dev: `npm run dev`

## Estrutura

- `src/app/page.jsx`: home (landing)
- `src/app/busca/`: busca de cartas (`/busca?q=...`), ordenação por preço/nome
- `src/app/graduar/`: simulador "Vale graduar?" (`page.jsx` servidor, `Calculadora.jsx` cliente, `psa.js` com níveis/preços/checklist/chances)
- `src/app/precos/`: planos Grátis e Pro
- `src/app/entrar/`: login/cadastro (`actions.js` são Server Actions)
- `src/components/Cabecalho.jsx`: topo comum a todas as páginas (mostra Entrar ou nome + Sair)
- `src/components/home/`: componentes de animação/UI (Reveal, CountUp, TiltStage, CardCarousel, PricingPlans, HeroEntrance, SmoothScroll)
- `src/lib/tcgdex.js`: dados de cartas (TCGdex) e câmbio (AwesomeAPI → ExchangeRate-API → cotação reserva)
- `src/lib/db.js`: pool do Postgres; `src/lib/auth.js`: sessões e senhas
- `src/db/schema.sql`: schema completo do banco

## Convenções

- Nomes de variáveis, funções, tabelas e comentários em **português**; textos da interface em pt-BR, tom direto e informal.
- Comentários explicam o "porquê" em linguagem simples (o projeto é didático).
- Páginas de servidor buscam dados; interação vai em componentes `"use client"` separados.
- Páginas novas reutilizam `Cabecalho`, as fontes (Archivo + IBM Plex Mono) e `page.module.css` como base de cores/rodapé/botões.
- SQL sempre parametrizado (`$1`, `$2`), nunca concatenado.

## Decisões importantes

- **Auth própria, sem biblioteca**: bcrypt (custo 12) + token aleatório em cookie `httpOnly`; no banco fica só o SHA-256 do token. Login compara com hash falso quando o e-mail não existe (evita enumerar contas). `usuarioAtual()` devolve `null` se o banco cair, então o site segue funcionando.
- Redirecionamento pós-login só para caminhos internos (`destinoSeguro`).
- Imagens: `unoptimized: true` em `next.config.mjs` porque o otimizador do Next dava timeout com `assets.tcgdex.net`.
- `dns.setDefaultResultOrder("ipv4first")` em `tcgdex.js` porque redes brasileiras anunciam IPv6 sem completar conexão.
- Chamadas externas têm timeout de 6 s e cache do Next (cartas 6 h, câmbio 1 h); falha devolve `null` em vez de quebrar a página.
- Limite do plano Grátis (100 cartas) é imposto por **trigger no banco**, não só no código.
- Valores do simulador (níveis PSA, frete, tabela de chances) são estimativas centralizadas em `src/app/graduar/psa.js`; ajuste lá.

## Ambiente

`.env.local` (não versionado):

- `DATABASE_URL=postgres://slabwise_app:SENHA@localhost:5432/slabwise` (obrigatório para login/conta)
- `AWESOMEAPI_KEY` (opcional, aumenta o limite de consultas de câmbio)

O banco é criado rodando `src/db/schema.sql` no pgAdmin (Postgres 15+, usa `citext` e `nulls not distinct`). Troque a senha do role `slabwise_app` antes.

## Pendências conhecidas

- A rota `/colecao` aparece no cabeçalho, mas **ainda não existe** (tabela `colecao` já está no banco).
- Salvar simulações (`simulacoes`) e recuperação de senha (`recuperacoes_senha`) têm tabela, mas não têm tela/ação.
- Pagamento do plano Pro não está implementado (`plano`/`pro_ate` só existem no banco).
- `package.json` ainda tem autores, descrição e homepage do template Codeverse.
- `src/components/Nome-do-componente.*` é resto do template.
- Chances de nota do simulador são estimativas, não dados reais de população PSA.
