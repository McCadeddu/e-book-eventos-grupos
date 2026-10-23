# Guia de Administração do App

## Finalidade
Este guia ajuda a administrar o aplicativo pastoral no dia a dia, manter o e-book público íntegro e preparar a evolução futura para um app `Villaregia.BH`.

## Rotina de uso
1. Entrar na área administrativa.
2. Revisar grupos, encontros e eventos.
3. Confirmar se o conteúdo público está consistente.
4. Publicar somente depois da verificação.

## Áreas principais
- `/admin`:
  painel principal da PASCOM.
- `/admin/grupos`:
  organização geral dos grupos, encontros e eventos.
- `/livro`:
  capa pública do e-book.
- `/livro/calendario`:
  calendário anual público partilhado com os grupos.

## Configuração da autenticação administrativa
Definir no Vercel e no ambiente local:

- `ADMIN_EMAIL`:
  e-mail administrativo principal.
- `ADMIN_PASSWORD`:
  senha administrativa da equipe.
- `ADMIN_SESSION_SECRET`:
  chave longa e secreta para assinar a sessão.

Sem essas variáveis, a nova autenticação administrativa não funciona corretamente.

## Como administrar grupos
1. Abrir `/admin/grupos`.
2. Usar `Novo grupo` para cadastrar um grupo.
3. Preencher nome, faixa etária, descrição, equipe, objetivo do ano e convite final.
4. Editar ou excluir o grupo conforme necessário.

## Como administrar encontros
1. Dentro de cada grupo, usar `Novo encontro`.
2. Informar data, horário, local e título com atenção.
3. Editar encontros sempre que houver mudança pastoral.
4. Excluir apenas o que realmente não será usado.

## Como administrar eventos
1. Criar eventos na área administrativa de eventos.
2. Definir quais grupos participam.
3. Marcar corretamente os encontros do evento.
4. Manter visíveis no anual apenas os encontros que devem aparecer no e-book público.

## Verificação antes de publicar
Rodar no diretório `web`:

```bash
npm run verify:public-data
```

Esse comando confirma se existem grupos e encontros suficientes para o e-book público não sair vazio.

## Publicação segura
Rodar no diretório `web`:

```bash
npm run build:verified
```

Se tudo estiver certo:

```bash
npm run publish
```

## Encerrar a sessão
- No painel `/admin`, usar o botão `Sair da area administrativa`.
- Isso limpa a sessão atual no navegador.

## Quando não publicar
- Quando `verify:public-data` falhar.
- Quando o Supabase estiver fora do ar.
- Quando o calendário público estiver vazio sem motivo pastoral.
- Quando houver dúvida sobre datas, grupos ou visibilidade.

## Problemas comuns
- E-book vazio:
  conferir variáveis do Supabase no Vercel e dados nas tabelas `grupos`, `encontros` e `eventos`.
- Grupo não aparece:
  conferir se o cadastro foi salvo e se a ordem do grupo existe.
- Evento não aparece no calendário:
  conferir `nivel`, `mostrar_no_anual` e `data_inicio`.

## Caminho para Google Play
Hoje o projeto é uma aplicação web em Next.js. Para publicar no Google Play, o caminho mais seguro é:

1. estabilizar totalmente a versão web;
2. consolidar autenticação, administração e publicação;
3. transformar o site em PWA bem feito;
4. depois empacotar o app Android com Capacitor.

## O que falta antes da Play Store
- autenticação administrativa com perfis, recuperação e gestão de acesso;
- layout responsivo melhor em celular;
- navegação pensada para uso móvel;
- identidade visual mais completa do `Villaregia.BH`;
- notificações, notícias e iniciativas da comunidade;
- política de privacidade e suporte ao usuário.

## Evolução recomendada
- Fase 1:
  estabilizar agenda, grupos, encontros e eventos.
- Fase 2:
  criar módulo de notícias, comunicados e iniciativas.
- Fase 3:
  adaptar a interface para experiência mobile.
- Fase 4:
  gerar PWA e empacotar Android.
- Fase 5:
  publicar na Google Play.
