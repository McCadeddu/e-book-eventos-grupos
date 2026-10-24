# Proteção anual das alterações de encontros

As APIs de grupos e eventos já exigiam o ano, mas `/api/encontros` ainda
aceitava POST/PUT/DELETE sem `anoPastoral`. A ausência desse campo contornava
a conferência do ano do registro. O PUT também repassava campos adicionais
diretamente para a atualização no banco.

Agora a API autentica, valida a entrada e exige um ano configurado em
`ebook_edicoes` antes de acessar os encontros. Ausência de ano, tipos inválidos
e campos desconhecidos retornam 400; falha na consulta da edição retorna 503.
Editar/excluir um encontro de outro ano continua retornando 409. As mutações
também mantêm o filtro do ano no comando enviado ao banco.

`lib/validacao-encontros.ts` centraliza a lista de campos permitidos. O ano é
metadado da requisição e não uma coluna do encontro. IDs e textos são validados;
visibilidade e nível aceitam somente os valores definidos; presença no calendário
exige booleano real. Tipos históricos de encontros continuam aceitos como texto.
Intervalos que terminam no ano seguinte continuam permitidos.

Uma atualização parcial de encontro organizativo também conserva
`mostrar_no_anual=false`, mesmo sem reenviar `nivel`. A API consulta o nível atual
antes de montar a atualização.

Após salvar, backup e revalidação usam o mesmo retorno com aviso que os demais
cadastros. Uma falha posterior de backup/cache não transforma uma gravação
concluída em erro de salvamento. A revalidação fica restrita ao ano alterado;
as rotas sem ano acompanham somente a edição publicada.

Validação: 37 testes automatizados, TypeScript, lint dos módulos alterados e
build de produção. As novas requisições reais de conferência foram inválidas
por construção (sem ano ou ano 2099 não configurado) e retornaram 400; não foram
usadas gravações, exclusões ou edições de encontros reais para testar.
Não houve migração nem mudança de permissões ou dados financeiros.
