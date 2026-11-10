# CineMatch — Your taste. Your next story.

Plataforma de descoberta, recomendação e organização de filmes e séries.
Stack: **Next.js 14 (App Router) · Tailwind CSS · Supabase (Postgres + Auth) · TMDB API**.

## O que está pronto nesta fase (Base + núcleo)

| Área | Situação |
|---|---|
| Identidade visual (logo, tema escuro com dourado, animações, skeletons) | Pronto |
| Página inicial (hero, populares, lançamentos, mais bem avaliados, joias escondidas, franquias) | Pronto |
| Onboarding em 6 etapas + perfil cinematográfico gerado (editável depois) | Pronto |
| Recomendação personalizada **com explicação** ("Você gostou de X…") | Pronto |
| Busca com sugestões ao digitar (filmes, séries, pessoas) | Pronto |
| Filtros combináveis + ordenação (inclui "relevância para o meu perfil") | Pronto* |
| Página do título: notas por fonte, sinopse, trailer YouTube, elenco, temporadas, onde assistir (BR), resenhas de usuários TMDB com aviso de spoiler, semelhantes | Pronto |
| Biblioteca (quero assistir, assistindo, assistido, abandonei, favoritos, avaliações) | Pronto |
| Perfil e estatísticas (filmes, séries, horas, nota média, gênero top, evolução mensal) | Pronto |
| Login, cadastro, logout, recuperação e redefinição de senha | Pronto |
| Franquias: lista + página com ordem de lançamento | Pronto |

\* O TMDB não permite filtrar por quantidade de temporadas/episódios, duração média de episódio nem status "em hiato".
Esses filtros dependem de dados que a API não oferece na busca; ficam para a fase 2 (com cache próprio).
Idioma/país/duração/classificação só valem na exploração sem texto de busca (limitação da busca do TMDB).

## Fase 2 (ainda NÃO implementado)

Central de séries com marcação de episódios (a tabela `episode_progress` já existe), listas personalizadas
(tabelas `lists`/`list_items` já existem), área "Descubra" (indeciso, roleta, comparador, "se você gostou de X"),
ordem cronológica e linha do tempo das franquias (o TMDB só fornece ordem de lançamento), resenhas
editoriais, painel administrativo, avatar, notificações, "mais populares entre gostos semelhantes".

## Notas sobre dados e fontes

- **TMDB**: fonte principal. Atribuição obrigatória já está no rodapé.
- **IMDb**: o site **não** tem API pública. A nota IMDb aparece **somente** se você configurar `OMDB_API_KEY`
  (OMDb, serviço com chave própria). Sem a chave, a página mostra "Não disponível" — nada é inventado.
- **Onde assistir**: vem do endpoint `watch/providers` do TMDB (dados JustWatch, Brasil). Exige a atribuição ao JustWatch (já no rodapé e na página).
- **Trailers**: só aparecem quando o TMDB tem um vídeo do YouTube cadastrado para o título.
- **Franquias**: usam coleções do TMDB (IDs em `src/lib/franchises.ts`). Marvel e DC não existem como coleção única no TMDB, então não estão incluídas.

## Como rodar

1. **Instale**: `npm install`
2. **Supabase**: crie um projeto em supabase.com → SQL Editor → cole e execute `supabase/schema.sql`.
   Em *Authentication → URL Configuration*, defina o Site URL (ex.: `http://localhost:3000`) e adicione `.../auth/callback` em Redirect URLs.
3. **TMDB**: crie conta em themoviedb.org → Configurações → API → copie o *Token de Leitura da API*.
4. **Variáveis**: copie `.env.example` para `.env.local` e preencha.
5. `npm run dev` → http://localhost:3000

## Deploy na Vercel

1. Suba o projeto para um repositório no GitHub.
2. Na Vercel: *Add New → Project* → importe o repositório (framework Next.js é detectado sozinho).
3. Em *Settings → Environment Variables*, cadastre as mesmas variáveis do `.env.example`
   (`NEXT_PUBLIC_SITE_URL` = URL final, ex.: `https://cinematch.vercel.app`).
4. No Supabase, atualize o Site URL e as Redirect URLs com o domínio da Vercel.
5. Deploy.

## Segurança

- Chaves do TMDB/OMDb ficam só no servidor (sem prefixo `NEXT_PUBLIC`).
- Todas as tabelas têm RLS: cada usuário lê e grava apenas os próprios dados.
- Rotas `/biblioteca`, `/perfil` e `/onboarding` exigem login (middleware).

## Estrutura

```
src/app            páginas, rotas de API e server actions
src/components     Navbar, Hero, Row, PosterCard, Onboarding, etc.
src/lib            tmdb.ts (API + cache), recommend.ts (motor), genres.ts, supabase/
supabase/schema.sql  tabelas, trigger de perfil e políticas RLS
```
