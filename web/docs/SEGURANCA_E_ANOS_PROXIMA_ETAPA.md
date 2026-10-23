# Próxima etapa: segurança do banco e conteúdos anuais

## Estado confirmado em 23/10/2026

As verificações usaram requisições HEAD ou consultas com limite zero: nenhum
payload de backup ou conteúdo de encontro interno foi baixado.

- Servidor: 8 grupos, 10 eventos, 129 encontros e 26 backups.
- Chave pública: 2 encontros internos acessíveis e 26 backups acessíveis.
- Isso confirma exposição de leitura; permissões de escrita não foram testadas
  por mutações. A configuração exata de RLS e grants ainda depende do SQL Editor.
- `evento_edicoes` existe, contém zero linhas e tem as colunas esperadas.
- `grupo_edicoes` retornou PGRST205 (tabela ausente do schema cache). Não assumir
  que existe; conferir o catálogo no diagnóstico SQL antes de qualquer migração.
- O leitor público já aplica os overrides anuais, mas o administrador continua
  editando os cadastros globais. Uma mudança de texto feita em 2027 pode afetar 2026.

## Correção prioritária

1. Entrar no SQL Editor do projeto e executar integralmente
   `docs/sql/diagnostico-seguranca-consolidado.sql`. É um único SELECT que retorna
   uma linha com tabelas, colunas, restrições, privilégios efetivos e políticas.
   Não contém dados pastorais, payloads nem chaves.
2. Conferir `service_role` com BYPASSRLS e grants reais. A administração em
   produção já usa essa chave no servidor após autenticar o administrador.
3. Aplicar `docs/sql/proteger-backups-administrativos.sql`: operação transacional
   limitada a RLS e grants de `admin_backups`. Preserva os registros e permite
   SELECT/INSERT/DELETE ao servidor para listagem, criação e retenção de backups.
   O script cancela se detectar privilégios públicos herdados remanescentes.
4. Executar `npm run audit:database-access` em `web`. A leitura pública de backups
   deve ficar bloqueada (401/403 ou zero linhas sob RLS), enquanto o servidor
   deve continuar contando os mesmos 26 backups. Não criar backups de teste no banco real.
5. Com o diagnóstico, preparar a política de encontros. Ela deve ocultar encontros
   internos e encontros de eventos internos, preservar a leitura pública autorizada
   e bloquear escrita por anon/authenticated. Verificar os leitores que ainda usam
   fallback JSON antes de mudar essas regras, para não republicar dados antigos.

Não executar `publicacao-anual.sql` sem revisão: a versão local contém DISABLE
ROW LEVEL SECURITY. O arquivo é trabalho anterior e não foi alterado nesta etapa.
Não usar scripts antigos que concedam escrita anônima para contornar falhas.

## Separação dos conteúdos por ano

| Conteúdo | Tratamento proposto |
| --- | --- |
| Identidade e slug | Manter na entidade principal. |
| Nome, faixa etária e descrição | Oferecer override anual, mantendo o original quando não houver override. |
| Objetivo anual, equipe e convite | Gravar no cadastro da edição selecionada. |
| Participação dos grupos, visibilidade e ativo do evento | Aplicar no contexto da edição anual; o leitor público já possui esses overrides. |
| Datas, horários e locais | Continuar pertencendo aos encontros, filtrados por ano. |
| Exclusão de grupo/evento | Continuar claramente identificada como operação global até haver desativação anual. |

Ordem de implementação:

1. Confirmar esquema, tipos, políticas e backup recuperável; versionar migração
   aditiva para a tabela ausente, com RLS habilitada desde a criação.
2. Preservar a apresentação de 2026 em registros de edição antes de ativar novos
   caminhos de escrita. A criação de 2027 não deve copiar encontros ou datas.
3. Reutilizar os mesmos formulários; enviar o ano e salvar os conteúdos anuais
   na edição correspondente. Sem infraestrutura válida, recusar a gravação anual
   com mensagem clara, sem retornar silenciosamente à edição global.
4. Carregar os overrides no painel e revalidar os capítulos e calendários afetados.
5. Testar com clientes simulados: editar 2027 não altera 2026, campos vazios
   permanecem vazios, ausência de override herda o original, edição inativa fica
   oculta e o ano sem encontros permanece vazio.
6. Validar em ambiente separado antes de aplicar migração ou publicar.

## Correção local dos leitores públicos

Os leitores públicos de grupos, eventos e encontros deixaram de substituir erros
ou resultados vazios pelos arquivos históricos de 2026. Grupos ausentes retornam
null; coleções vazias permanecem vazias; erros de permissão/consulta interrompem a
geração da página. As datas derivadas de eventos sem encontros também ficam vazias.
Os leitores de encontros públicos filtram explicitamente visibilidade = publico.
O caminho administrativo e seus arquivos antigos não foram removidos nesta etapa.

Essas mudanças não revogam o acesso direto ao banco. Em ISR, uma falha pode manter
uma página pública previamente gerada; a atualização do cache deve fazer parte da
validação após a correção SQL. Não foi criado um modo de emergência que ignore RLS.
Os testes incluem listas vazias, grupo removido, acesso negado e ausência de datas.

## Limites desta etapa

Após a entrada do responsável no SQL Editor, o diagnóstico confirmou RLS
inativa em grupos, eventos, encontros e backups, nenhum policy cadastrado, e
privilégios públicos de escrita nas tabelas examinadas. O catálogo confirmou a
ausência de grupo_edicoes e BYPASSRLS ativo em service_role. O diagnóstico sem
registros foi salvo em docs/sql/diagnostico-seguranca-2026-10-23.json.

A proteção específica de admin_backups foi aplicada e validada: leitura anônima
401; servidor com 26 backups preservados. A etapa das demais tabelas está
versionada em docs/sql/proteger-tabelas-pastorais.sql e depende da publicação dos
leitores públicos sem fallback. Não foram modificados registros pastorais.
O comando de auditoria usa somente leitura e não certifica permissões de escrita;
essas permissões são verificadas pelo diagnóstico do catálogo.
