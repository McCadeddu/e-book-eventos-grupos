# Segurança — etapa 1

## Proteção implementada no código

- O middleware exige sessão administrativa em `/grupos/...` e `/admin/...`.
- As cinco páginas de gestão de grupos verificam a sessão no servidor antes de
  consultar dados. A página de detalhes deixou de gerar arquivos estáticos com
  encontros internos e passou a usar `getServerSideProps`.
- As respostas dessas páginas usam `Cache-Control: private, no-store, max-age=0`.
- Cookies malformados são rejeitados sem interromper a requisição.
- Os caminhos públicos `/livro/...` e o Pix não foram alterados.

Teste local, sem banco: `node --test scripts/test-admin-security.cjs`, em `web`.

## Verificação online somente de leitura

Em 21/10/2026, uma requisição HEAD com a chave pública para encontros com
`visibilidade=eq.interno` retornou HTTP 200 e contagem 2. Nenhum registro foi
baixado ou modificado. Isso confirma leitura anônima de encontros internos;
não identifica sozinho quais grants/políticas permitem o acesso. A descrição
OpenAPI retornou 401, sem permitir confirmar privilégios de escrita.

Na verificação inicial, o ambiente local não tinha `SUPABASE_SERVICE_ROLE_KEY`
nem `ADMIN_SESSION_SECRET`. Nenhum valor de credencial foi exposto.
A configuração da Vercel não foi consultada.

## Continuação em 23/10/2026

- A chave administrativa configurada pelo responsável foi validada somente com
  consultas de leitura de grupos, eventos, encontros e backups.
- O segredo de sessão local foi gerado com 32 bytes aleatórios em `.env.local`,
  sem exibir seu valor. As credenciais de login são escolhidas pelo responsável.
- As APIs de grupos, eventos, encontros, ordenação, movimentação e edições agora
  obtêm um cliente administrativo somente após autenticar a requisição. Falta
  de configuração retorna 503, sem recorrer à chave pública.
- As consultas administrativas de grupos, eventos e encontros usam o cliente
  administrativo; as consultas do livro público continuam com a chave pública.
- Os seis carregadores de páginas administrativas de grupos/eventos em `/admin`
  também passaram a verificar a sessão no servidor, antes do acesso ao banco.
- Os testes usam clientes simulados e não criam nem alteram registros reais.
- Nenhuma política RLS, permissão, dado de produção ou configuração da Vercel
  foi alterada. Ainda é necessário obter os resultados do diagnóstico SQL para
  elaborar a migração de segurança compatível com o esquema real.

### Validação desta continuação

- Sete testes automatizados passaram: validação de sessões, bloqueio antes das
  consultas, onze páginas protegidas, indisponibilidade do cliente administrativo,
  separação entre clientes público/administrativo, sete APIs e middleware.
- TypeScript e o build de produção concluíram sem erros. O build ainda emite
  avisos de fallback para consultas vazias, comportamento anterior a esta etapa.
- O manifesto de pré-renderização não contém páginas estáticas de `/grupos/...`.
- Não foram encontrados a chave administrativa, a senha ou o segredo local nos
  39 arquivos públicos JavaScript/JSON/map examinados.
- No servidor de produção local, o login com as credenciais configuradas passou.
  As páginas administrativas e as APIs de leitura de backups e edições responderam
  200 com sessão. Sem sessão, páginas e dados JSON privados redirecionaram ao login
  e as sete APIs responderam 401. O livro e o calendário públicos responderam 200.
- Escritas foram verificadas com clientes simulados; nenhum cadastro real foi
  criado, editado ou excluído durante os testes.

## Sequência necessária para corrigir o banco sem interromper a administração

1. Conferir backup recuperável e obter o diagnóstico real de permissões usando
   `docs/sql/diagnostico-seguranca.sql` no SQL Editor. O arquivo contém somente SELECTs.
2. Configurar `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_SESSION_SECRET`, `ADMIN_EMAIL` e
   `ADMIN_PASSWORD` no servidor de publicação. A chave e o segredo já estão
   preparados localmente; isso não configura a Vercel automaticamente. Nunca usar
   prefixo `NEXT_PUBLIC_` na chave administrativa.
3. Publicar e validar a preparação do cliente administrativo feita nesta etapa,
   antes de revogar as permissões das quais o deploy anterior depende.
4. Com o esquema e as políticas confirmados, preparar uma migração versionada
   para remover escrita anônima e permitir leitura apenas do conteúdo público,
   incluindo a visibilidade do evento responsável e o estado da edição anual.
5. Validar em homologação: leitura pública do livro, bloqueio de encontros
   internos, escrita anônima bloqueada e cadastro/edição/exclusão autenticados.
6. Publicar o código e aplicar a migração na ordem validada. Confirmar que o
   deploy deixou de gerar os antigos arquivos estáticos de `/grupos/...`.

Nenhuma mudança de banco ou publicação foi executada nesta etapa. A correção
local das páginas não elimina o acesso direto ao Supabase; a etapa de banco
continua necessária. Não executar o SQL de restauração que concede escrita
ao papel `anon` como forma de corrigir erros de acesso.
