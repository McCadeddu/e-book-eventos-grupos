# Ativação e desativação por edição

O painel administrativo oferece “Desativar em ANO” para grupos e eventos.
A ação confirma o ano e preserva os conteúdos e encontros. A seção
“Cadastros inativos em ANO” permite reativá-los com os textos daquela edição.
Reativar conserva a visibilidade anterior: eventos internos continuam internos.

O campo `ativo` e a RPC anual já estavam implantados. Esta etapa não exige
migração, cópia de datas, exclusão ou mudança de permissões. As ações usam PUT
nas APIs autenticadas existentes com `{ id, anoPastoral, ativo }`, conservando
backup automático e revalidação dos capítulos/calendário do ano afetado.

A leitura administrativa conserva os encontros e separa cadastros ativos dos
inativos. A leitura pública recebe exclusivamente os ativos e seus encontros
autorizados; as listas administrativas de inativos não entram nas props públicas.
Desativar um grupo não desativa eventos compartilhados que também envolvam
outros grupos. Excluir um cadastro continua sendo global, com botão explicitamente
nomeado “Excluir de todos os anos”; slug e ordem também continuam globais.

Validação automatizada: 34 testes, incluindo desativação e reativação de ambos
os setores, preservação de 2026 e dos encontros, nomes anuais na recuperação,
ausência de dados inativos em páginas públicas e ações com rótulos acessíveis.
Os testes de escrita usam clientes simulados, sem modificar cadastros reais.
O build e a conferência HTTP usam as leituras reais, sem alternar a ativação de
grupos ou eventos da comunidade para testar a interface.
