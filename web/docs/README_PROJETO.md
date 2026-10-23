# Projeto PASCOM – Planejamento Pastoral

## Finalidade
Aplicativo web para transformar a vida pastoral (encontros e eventos)
em uma Agenda Anual partilhável, permitindo:

- organização da agenda pastoral
- planejamento comunicativo
- partilha com toda a comunidade
- geração de agenda interativa e e-book anual (PDF / HTML)

## Stack técnica
- Next.js (Pages Router)
- TypeScript
- API Routes internas
- Geração de PDF e HTML

## Estrutura principal
- /pages → interface e rotas
- /pages/api → backend
- /lib → regras de negócio
- /scripts → migrações e tarefas técnicas
- /docs → documentação do projeto

## Estado atual
Sistema em uso, com dados reais e histórico.
Projeto vivo, pensado para atualização contínua ao longo do ano
e reutilização anual (2026, 2027, ...).

## Publicação segura
- O e-book público depende do Supabase para grupos, encontros e eventos.
- Antes de publicar, rode `npm run verify:public-data` para confirmar que o conteúdo público não está vazio.
- Para validar e gerar build com segurança, use `npm run build:verified`.
- Para publicar mudanças gerais do aplicativo, use `npm run publish`.
- Para publicar somente ajustes visuais do e-book público, use `npm run publish:content`.
- Se a verificação falhar, não publique: primeiro confirme as variáveis do Supabase e os dados nas tabelas `grupos`, `encontros` e `eventos`.
