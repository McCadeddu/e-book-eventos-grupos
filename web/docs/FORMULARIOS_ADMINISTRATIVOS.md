# Formulários administrativos consolidados

## Um formulário por tipo de cadastro

O painel `/admin/grupos?ano=2027` concentra a edição pastoral. Há três
implementações, cada uma reutilizada para criar e editar:

| Cadastro | Componente |
| --- | --- |
| Grupo | `components/admin/FormularioGrupo.tsx` |
| Evento ou retiro | `components/admin/FormularioEvento.tsx` |
| Encontro de grupo ou evento | `components/admin/FormularioEncontro.tsx` |

Os estilos de formulário e o tratamento de envio são compartilhados. As
requisições POST/PUT passam por `lib/admin-cadastros.ts`, incluindo falhas de
conexão, respostas inválidas e erros do servidor.

Login e edição da publicação anual continuam em suas telas próprias: são
operações diferentes dos cadastros de grupos, eventos e encontros.

## Compatibilidade com os endereços anteriores

As rotas abaixo permanecem autenticadas, mas encaminham ao formulário do painel
anual em vez de manter outra implementação de campos e regras:

- `/grupos/novo`
- `/grupos/[slug]`
- `/grupos/[slug]/editar`
- `/grupos/[slug]/novo-encontro`
- `/grupos/[slug]/editar-encontro/[id]`
- `/admin/eventos`
- `/admin/eventos/novo`
- `/admin/eventos/editar/[id]`
- `/admin/eventos/[id]/novo-encontro`
- `/admin/eventos/[id]/editar-encontro/[encontroId]`

O parâmetro `ano` é preservado. Para editar um encontro já existente, sem ano
explícito, usa-se o ano real da sua data de início. Uma tentativa de abrir o
encontro com outro ano explícito é recusada.

Os parâmetros `form` e `id` do painel abrem o editor solicitado pelos endereços
de compatibilidade. Cancelar remove essa solicitação da URL.

## Encontros compartilhados

Um encontro de evento pode aparecer na agenda de vários grupos por vínculo.
Isso é apresentação do mesmo registro, não outro cadastro. Ao editar por um
desses grupos, o painel abre somente o editor do evento responsável, com os
campos de nível e presença no calendário anual. O editor não se repete em cada
grupo que participa do evento.

Valores de tipo já armazenados por formulários antigos são mantidos como opção
ao editar; não são silenciosamente substituídos pelo primeiro item da seleção.

## Verificação dos dados e limites

A consulta somente de leitura examinou 8 grupos, 10 eventos e 129 encontros.
Não encontrou slugs de grupo repetidos, títulos normalizados de evento repetidos
ou encontros com a mesma combinação de responsável, datas, horário e título.
Essa comparação não substitui a revisão pastoral de registros parecidos.

Há, por exemplo, dois lançamentos semelhantes do aniversário da CMV em
06/09/2026, com horários distintos (9h–13h e 9h–16h). Foram preservados: a decisão
sobre serem atividades diferentes ou duplicação editorial exige revisão pastoral.

Nenhum registro foi excluído, mesclado ou regravado nesta consolidação. O ano
2027 continua sem encontros e os 129 encontros de 2026 foram preservados.
Os cadastros de grupos e eventos ainda são compartilhados entre os anos.

Validação automatizada: `node --test scripts/test-admin-security.cjs`.

Também foram conferidos na interface os três formulários, o cancelamento sem
gravação, a abertura de um único editor de evento a partir de um grupo participante
e o encaminhamento de `/grupos/novo?ano=2027` ao painel anual.


## Divulgação e retorno das ações — 23/10/2026

- Cada encontro oferece “Prévia / PDF / Cartaz” no painel, inclusive quando
  aparece entre os encontros de um grupo participante de um evento.
- Prévia e cartaz leem o registro atual do Supabase, com autenticação no servidor,
  e identificam o grupo ou evento responsável. O retorno preserva o ano e a seção.
- O PDF individual exige sessão administrativa e reutiliza o cartão da prévia.
  O Chromium recebe HTML com texto escapado e JavaScript desativado: não navega
  para URLs, não recebe cookies e não depende de uma porta local fixa.
- Exclusão, ordenação e visibilidade conferem o status HTTP e a confirmação da
  API. Em caso de falha, a tela informa o erro; novas ações ficam bloqueadas
  durante a requisição. Não houve exclusões nem alterações de dados nos testes.
- A área de PDFs explica o caminho para os PDFs individuais. Livro completo e
  capítulos por grupo continuam pendentes; não são apresentados como disponíveis.

Validação: 19 testes automatizados, TypeScript e lint dos arquivos alterados.
Prévia e cartaz responderam 200 para encontros de grupo e evento; PDFs reais
retornaram 200 com assinatura PDF e acesso anônimo retornou 401. A exportação PNG
teve seu botão acionado na interface, mas o arquivo baixado não foi confirmado
no sistema de arquivos. Não houve migrações ou publicação.
