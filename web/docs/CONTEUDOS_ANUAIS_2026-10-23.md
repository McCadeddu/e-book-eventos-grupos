# Conteúdos anuais: implantação e verificação

## Comportamento

O painel único `/admin/grupos?ano=2027` usa os mesmos formulários completos
para criar e editar grupos e eventos. Nome/título, descrição, faixa etária,
objetivo, equipe, convite e participação/visibilidade dos eventos são gravados
na edição selecionada. Limpar um campo conserva o valor vazio nessa edição.
As datas continuam exclusivamente nos encontros, filtrados pelo ano de início.

Atualização em 24/10: os controles de desativação e reativação por ano estão
descritos em [ATIVACAO_ANUAL_2026-10-24.md](ATIVACAO_ANUAL_2026-10-24.md).

Identidade, slug e ordem continuam globais. Excluir um grupo ou evento continua
sendo uma operação global, explicitamente indicada na confirmação. A desativação
anual é suportada nos dados, mas ainda não possui um controle próprio na interface.
Cadastros criados agora ficam inativos nas outras edições já configuradas.
Novos anos configurados posteriormente herdam o cadastro base quando não houver
override; devem passar por preparação editorial antes de publicação.

## Banco

Foi aplicado `docs/sql/conteudos-anuais.sql` no SQL Editor. A migração cria
`grupo_edicoes`, preserva `evento_edicoes` e congela o conteúdo original nas
edições existentes com `ON CONFLICT DO NOTHING`: 8 grupos e 10 eventos em cada
ano, 2026 e 2027. Não copia nem modifica encontros.

A função transacional `pascom_salvar_cadastro_anual` grava somente a edição
solicitada. Criações incluem identidade e edições na mesma transação. Escrita
direta e execução da função não são concedidas a anon/authenticated. As duas
tabelas de edição usam RLS e não têm leitura pública direta; o servidor fornece
somente campos e registros aprovados para publicação.

Antes da aplicação, a migração e `docs/sql/testar-conteudos-anuais.sql` foram
executados juntos em uma transação com `SET LOCAL ROLE service_role` e ROLLBACK.
O teste real confirmou edição isolada de 2027, campos vazios, criação inativa
em 2026, rejeição de ano não configurado e ausência de execução pública da RPC.
Todos os registros de teste foram desfeitos.

Hashes SHA-256 antes/depois confirmaram preservação integral dos 8 grupos,
10 eventos, 129 encontros e dos metadados dos 26 backups existentes. Após essa
conferência foi criado um checkpoint real: o total passou para 27 backups.
Backups versão 3 incluem também grupo_edicoes, evento_edicoes, ebook_edicoes
e ebook_estado. A retenção existente de 120 backups permanece em vigor.

## Leitura e cache

`lib/conteudo-anual.ts` reúne cinco consultas paralelas, aplica as edições e
separa a leitura administrativa da publicação. A publicação usa uma lista
explícita de campos e exclui encontros internos, eventos internos e encontros
sem proprietário público ativo. Erros não retomam dados históricos em JSON.

Calendários e capítulos atuais/anuais compartilham `lib/livro-ano.ts`.
Encontros organizativos aparecem uma vez nos grupos envolvidos, sem serem
tratados como encontros oficiais no capítulo do evento ou calendário anual.
Novos slugs públicos usam fallback blocking. As páginas usam ISR de 60 segundos;
a gravação também revalida os índices, calendários e capítulos do ano afetado.
Rotas sem ano são revalidadas quando a edição editada é a publicada.

## Validação

- 32 testes automatizados em `scripts/test-admin-security.cjs` passaram.
- TypeScript e ESLint dos módulos/formulários novos ou adaptados passaram.
- Build isolado de produção: 68 páginas geradas, sem interromper o dev local.
- 171 arquivos públicos gerados examinados: nenhum segredo ou encontro interno.
- HTTP local: painel 2026 com 129 encontros; painel/calendário/capítulos de 2027
  com zero encontros; calendário publicado com 120 encontros elegíveis.
- APIs recusaram PUT sem ano com HTTP 400, sem gravação.
- Auditoria real somente de leitura: backups e ambas as tabelas de edições
  retornam 401 para anon; encontros internos retornam zero linhas.

O Pix não foi alterado. Exportação anual completa PDF/EPUB e desativação anual
na interface continuam como etapas futuras.
