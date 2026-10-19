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
- `src/app/precos/`: preço das cartas em real (`/precos?q=...`), ordenação por preço/nome (`/busca` só redireciona pra cá)
- `src/app/graduar/`: simulador "Vale graduar?" (`page.jsx` servidor, `Calculadora.jsx` cliente, `psa.js` com níveis/preços/checklist/chances)
- `src/app/carta/[id]/`: página de cada carta (`/carta/base1-4`): foto, preço por versão, Cardmarket, ficha, ataques, botão de adicionar à coleção (usa `colecao/FormularioAdicionar.jsx`)
- `src/app/planos/`: planos Grátis e Pro
- Área logada (exige login, moldura com menu lateral em `src/components/area/AreaLogada.jsx`):
  - `src/app/colecao/`: Minha coleção (busca, adicionar, quantidade, remover, evolução do valor; Server Actions em `actions.js`, listas de estado/graduação em `opcoes.js`)
  - `src/app/alertas/`: alertas de preço (Pro); o alerta é criado na página da carta
  - `src/app/simulacoes/`: simulações salvas (Pro); o botão de salvar fica no simulador
  - `src/app/assinatura/`: plano e cobrança
  - `src/app/conta/`: nome, senha e excluir conta
- `src/app/assinar/`: checkout do Pro (mensal/anual, Pix/cartão); o gateway ainda não está ligado
- `src/app/entrar/`: login/cadastro (`actions.js` são Server Actions)
- `src/components/Cabecalho.jsx`: topo comum a todas as páginas (mostra Entrar ou o botão Minha área; dentro da área, nome + Sair)
- `src/components/GraficoHistorico.jsx`: gráfico de linha em SVG (histórico da carta e valor da coleção); período por `?periodo=30d|6m|1a|tudo`, Grátis só vê 30 dias
- `src/lib/historico.js`: grava e lê `historico_precos` e `valor_colecao` (uma foto por dia, quando a página é aberta)
- `src/components/home/`: componentes de animação/UI (Reveal, CountUp, TiltStage, CardCarousel, PricingPlans, HeroEntrance, SmoothScroll)
- `src/lib/tcgdex.js`: dados de cartas (TCGdex) e câmbio (AwesomeAPI → ExchangeRate-API → cotação reserva)
- `src/lib/db.js`: pool do Postgres; `src/lib/auth.js`: sessões e senhas
- `src/db/schema.sql`: schema completo do banco; `src/db/migracoes/`: scripts pra atualizar um banco já criado

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

- `DATABASE_URL=postgres://slabwise_app:SENHA@localhost:5432/slabwise` (opcional em desenvolvimento: sem ele, o `npm run dev` sobe um Postgres embutido, o PGlite, na pasta `.banco-local`, e cria as tabelas sozinho pelo `schema.sql`; apagar a pasta zera o banco. Em produção é obrigatório)
- `AWESOMEAPI_KEY` (opcional, aumenta o limite de consultas de câmbio)
- `DB_VIA_HTTPS=1` (opcional, só com banco no Neon): usa `@neondatabase/serverless` pela porta 443 em vez do `pg`, para redes que bloqueiam a 5432
- Em desenvolvimento, a página `/conta` tem a caixa "Modo desenvolvimento" (só com `NODE_ENV=development`): virar Pro/Grátis e criar histórico de teste, sem pagamento.
- `CARTAS_OFFLINE=1` (opcional): troca a TCGdex por cartas de mentira em `src/lib/cartasOffline.js`: ~20 fixas e, pra qualquer outro nome buscado, 3 versões inventadas com id `off-<nome>-<1..3>` (preços inventados, foto desenhada em `/carta-offline/[id]/[arquivo]`), para redes que bloqueiam sites de Pokémon. Câmbio continua real

O banco é criado rodando `src/db/schema.sql` no pgAdmin (Postgres 15+, usa `citext` e `nulls not distinct`). Troque a senha do role `slabwise_app` antes.

## Pendências conhecidas

- Recuperação de senha (`recuperacoes_senha`) tem tabela, mas não tem tela/ação nem envio de e-mail.
- Pagamento do plano Pro não está implementado: `/assinar` só escolhe período e forma de pagamento; falta o gateway em `src/app/assinar/actions.js` e o webhook que grava `plano`/`pro_ate`.
- Alertas são criados e listados, mas ninguém dispara ainda: falta o job que compara preços e manda e-mail.
- Plano: simulador de graduação é grátis; salvar simulações é Pro.
- `package.json` ainda tem autores, descrição e homepage do template Codeverse.
- `src/components/Nome-do-componente.*` é resto do template.
- Chances de nota do simulador são estimativas, não dados reais de população PSA.
