# Preparar a agenda de 2027

Abra `/admin/grupos` após entrar na administração. O painel usa por padrão o
ano em preparação configurado nas edições (atualmente 2027). Também é possível
abrir `/admin/grupos?ano=2027` ou escolher outro ano na seleção "Ano de trabalho".

Os grupos, eventos e retiros continuam disponíveis, mas a lista de encontros
é consultada somente para o ano selecionado. Um ano vazio permanece vazio;
nenhum encontro de 2026 é copiado, apagado ou usado como fallback de 2027.

Abra o grupo ou evento e use "Novo encontro". O formulário começa sem datas e
aceita início no ano escolhido. O término pode avançar para o ano seguinte, mas
não pode ser anterior ao início. O ano selecionado permanece após salvar e
voltar para a posição do grupo/evento.

O painel envia o ano de trabalho à API, que verifica se o encontro pertence a
esse ano antes de editar ou excluir. O histórico de encontros de 2026 pode ser
consultado selecionando 2026. O ano publicado não é trocado por essa seleção.

## Limites atuais

- Nomes, textos, equipes, ordem e exclusão dos cadastros de grupos/eventos são
  compartilhados entre os anos. A seleção atual separa as datas, não cria cópias
  anuais desses cadastros. Não excluir um grupo/evento para limpar um ano.
- O controle por ano foi aplicado ao painel geral e seus formulários integrados.
  Os antigos endereços individuais agora encaminham ao formulário correspondente
  nesse painel. Ao editar um encontro existente, seu ano real é respeitado.
- As mudanças estão no código local; não houve publicação na Vercel ou alteração
  de registros nesta preparação. A segurança RLS segue como etapa pendente.

Na consulta somente de leitura que motivou esta etapa havia 129 encontros em
2026 e nenhum em 2027. Não foi necessário limpar ou alterar datas no banco.
