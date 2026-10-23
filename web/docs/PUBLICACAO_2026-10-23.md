# Publicação das melhorias administrativas — 23/10/2026

## Escopo

Administração anual com 2027 sem datas, formulários unificados, rotas antigas
compatíveis, autenticação antes das consultas privadas, tratamento de falhas
nas ações e prévia/cartaz/PDF individual ligados aos registros atuais.

## Configuração de produção

A variável SUPABASE_SERVICE_ROLE_KEY foi adicionada como segredo na Vercel.
ADMIN_EMAIL, ADMIN_PASSWORD e ADMIN_SESSION_SECRET de produção foram preservados.
As credenciais locais não necessariamente coincidem com as de produção.
Nenhuma migração, política RLS ou registro pastoral foi alterado na publicação.
A correção das permissões do banco continua sendo uma etapa separada.

## PDF na Vercel

O build remoto não disponibilizava o navegador do Puppeteer. Foi incluído
@sparticuz/chromium 143.0.4, fixado no lockfile, com os binários Linux rastreados
somente para a função /api/pdf/encontro. O desenvolvimento local continua usando
o navegador do Puppeteer. A função exige sessão, recebe dados autenticados do
banco, desativa JavaScript no cartão e fecha o navegador ao concluir ou falhar.
Referência do pacote: https://github.com/Sparticuz/chromium

## Validação

- 20 testes automatizados, TypeScript e lint sem erros.
- Compilação de produção isolada, sem interromper o servidor local.
- 39 arquivos JavaScript públicos examinados sem as credenciais locais privadas.
- Páginas privadas de grupos e prévia de encontros ausentes do pré-render estático.
- Versão isolada na Vercel validada com segredo de sessão exclusivo de teste,
  sem trocar as credenciais oficiais: livro 200; administração sem sessão 307;
  administração autenticada 200; 2027 com 0 encontros e 2026 com 129 encontros;
  prévia e cartaz 200; PDF autenticado 200 com assinatura PDF; PDF anônimo 401.
- A versão pública deve utilizar as variáveis normais do projeto, sem o segredo
  exclusivo da versão de validação.

Arquivos .env, credenciais, node_modules e a pasta pessoal de backups não fazem
parte do código publicado. Exportação integral do livro e revisão de RLS
permanecem pendentes.
