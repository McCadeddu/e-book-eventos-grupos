# Visão geral administrativa dos encontros

No painel anual, a seção expansível “Visão geral dos encontros de ANO” reúne
os encontros em ordem de data, uma vez por ID, incluindo encontros compartilhados.
Não acrescenta formulários, consultas ao banco ou rotas de escrita.

É possível combinar busca (nome do responsável, título, local e horário), mês
de início e presença no calendário público. A busca ignora maiúsculas e acentos.
“Limpar filtros” restaura a listagem completa. Mudar de ano limpa os filtros.
Intervalos que cruzam o fim do ano permanecem no ano/mês da data de início.

A situação considera o cadastro ativo, a visibilidade do encontro e a do evento.
Internos, encontros organizativos e cadastros inativos não são apresentados
como integrantes do calendário anual. A regra de nível/presença anual é a mesma
função pura usada pelo calendário público, preservando o comportamento existente.
Os inativos conservam seus nomes anuais e podem ser encontrados na revisão;
a edição exige reativar o responsável. Vínculos ausentes são identificados.

“Editar encontro” abre o formulário já existente no grupo/evento responsável,
sem recarregar a página ou perder os filtros. A lista não oferece ações de
exclusão ou troca de visibilidade. Quando o ano está vazio, informa isso sem
substituir os registros por datas de outra edição.

Validação: 40 testes automatizados, TypeScript, lint e build de 68 páginas.
Testes incluem deduplicação, ordenação, filtros combinados, acentos, ano correto,
campos escapados e diferenciação de responsáveis internos/inativos.
Na interface local, 2026 mostrou 129 encontros; o filtro anual mostrou 120,
igual ao calendário público. A busca “jovens” em março retornou quatro encontros;
editar abriu um único formulário de 2026, cancelado sem gravação. Não houve
alteração de cadastros, encontros, banco, permissões ou dados financeiros.
