# Slabbit

Site em português que mostra o **preço de cartas Pokémon em reais**, calcula se **vale a pena graduar** a carta na PSA e guarda a **coleção** de cada colecionador.

O problema que resolve: os preços das cartas estão em dólar ou euro, e quem coleciona no Brasil ainda precisa somar taxa da PSA, frete, imposto e risco da nota. O Slabbit junta tudo isso em reais, numa página só.

## O que o site faz

| Página | Rota | O que tem |
| --- | --- | --- |
| Home | `/` | Apresentação, cartas em destaque com preço em real, carrossel, planos |
| Preços | `/precos?q=charizard` | Pesquisa por nome, preço em R$, variação em 30 dias, ordenação por maior/menor preço ou nome |
| Vale graduar? | `/graduar` | Simulador: escolha a carta, marque o estado (centralização, cantos, bordas, superfície) e veja custo total, chance de cada nota (PSA 10/9/8/7-) e o veredito |
| Carta | `/carta/base1-4` | Página de cada carta: foto grande, preço em R$ por versão (TCGplayer e Cardmarket), HP, tipo, ataques, fraqueza, ilustrador, e botão para adicionar à coleção |
| Planos | `/planos` | Grátis x Pro, alternância mensal/anual, tabela comparativa |
| Minha coleção | `/colecao` | Só logado: valor total em R$, resultado (lucro/prejuízo), busca para adicionar carta (quantidade, estado, graduação, quanto pagou), editar quantidade e remover |
| Entrar | `/entrar` | Cadastro e login |

### Planos

- **Grátis**: ver preços, simulador e até 100 cartas na coleção.
- **Pro**: alertas, simulações salvas e coleção sem limite.

## O que a gente fez

1. **Base**: projeto Next.js 16 (App Router) + React 19 a partir de um template didático do Codeverse.
2. **Home**: landing com animações (GSAP, Motion, Lenis, Embla), contador animado, carrossel e card 3D com inclinação.
3. **Dados de cartas** (`src/lib/tcgdex.js`): integração com a TCGdex (dados, imagens, preços TCGplayer em USD e Cardmarket em EUR) e conversão para reais com a cotação do dia. Tem cache, timeout de 6 s, câmbio com três camadas de fallback (AwesomeAPI, ExchangeRate-API, valor reserva) e correção para redes brasileiras com IPv6 quebrado.
4. **Preços das cartas** (`/precos`): página de busca com tratamento de erro, sugestões e ordenação.
5. **Simulador de graduação**: níveis de serviço da PSA (de Value Bulk a Walk Through), nível automático pelo valor da carta, frete em grupo ou sozinho, imposto editável, checklist de estado que vira chance de cada nota, e estimativa de data de volta. Regras em `src/app/graduar/psa.js`.
6. **Página de preços**: planos com alternância mensal/anual, garantias e comparativo.
7. **Banco de dados** (PostgreSQL, `src/db/schema.sql`): tabelas `usuarios`, `sessoes`, `recuperacoes_senha`, `colecao` e `simulacoes`; trigger que limita o plano Grátis a 100 cartas; usuário de banco sem privilégio de superusuário para o site.
8. **Contas e login** (`src/lib/auth.js`, `src/app/entrar/`): cadastro e login com senha em bcrypt, sessão por cookie `httpOnly` (no banco só vai o hash do token), mensagem de erro igual para e-mail inexistente e senha errada, redirecionamento seguro após entrar.
9. **Minha coleção** (`src/app/colecao/`): soma o valor atual das cartas em reais, calcula resultado quando você informa quanto pagou, soma a quantidade se a mesma carta (mesmo estado e graduação) for adicionada de novo, e respeita o limite de 100 cartas do plano Grátis.
10. **Cabeçalho único** para todas as páginas, que mostra "Entrar" ou "Olá, Nome" com selo PRO e botão Sair.

## Stack

Next.js 16, React 19 (com React Compiler), CSS Modules, Tailwind 4, Ant Design, GSAP, Motion, Anime.js, Lenis, Embla, Lucide, react-hot-toast, PostgreSQL (`pg`), bcryptjs, Biome.

## Como rodar

```bash
npm install
```

Crie o arquivo `.env.local`:

```
DATABASE_URL=postgres://slabwise_app:SUA_SENHA@localhost:5432/slabwise
AWESOMEAPI_KEY=   # opcional
```

Crie o banco `slabwise` no PostgreSQL 15+ e rode o conteúdo de `src/db/schema.sql` (troque a senha do role `slabwise_app` antes). Depois:

```bash
npm run dev      # http://localhost:3000
npm run lint     # Biome
npm run format
```

Sem banco, o site abre normalmente; só cadastro e login ficam indisponíveis.

## Estrutura

```
src/
  app/
    page.jsx            home
    busca/              busca de cartas
    graduar/            simulador (Calculadora.jsx, psa.js)
    precos/             planos
    entrar/             login e cadastro (Server Actions)
  components/
    Cabecalho.jsx
    home/               componentes de animação e planos
  lib/
    tcgdex.js           cartas e câmbio
    db.js               conexão Postgres
    auth.js             senhas e sessões
  db/schema.sql
```

## Próximos passos

- Salvar simulações e recuperar senha (tabelas prontas, falta a interface).
- Cobrança do plano Pro e alertas de preço.
- Trocar descrição, autores e homepage do template Codeverse em `package.json`, e remover `Nome-do-componente`.
- Calibrar as chances de nota com dados reais de população da PSA.
