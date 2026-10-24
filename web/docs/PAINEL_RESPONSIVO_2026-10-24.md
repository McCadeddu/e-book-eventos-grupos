# Painel administrativo em telas pequenas

A adaptação cobre `/admin/grupos`, usando um CSS Module isolado. Até 800 px,
o painel passa para uma coluna e oferece um seletor nativo para navegar até um
grupo, evento ou retiro. A seleção abre o cartão e move o foco para seu botão;
não chama APIs de escrita. No computador, o índice lateral continua disponível.

Os cabeçalhos dos cartões permitem quebra de linha; no celular, suas ações
ficam em duas colunas. Botões, seletores e campos de texto têm altura mínima de
44 px. Campos em telas pequenas usam fonte de 16 px, e o foco por teclado ganha
contorno visível. Os formulários completos e seus handlers são os mesmos.
Reordenação por “Subir/Descer” continua disponível nos cartões do celular.
As operações anuais e globais conservam seus rótulos e confirmações existentes.

Na medição anterior, uma janela de 390 px tinha documento de 506 px, com
rolagem lateral. Após a adaptação, o documento ficou dentro da janela em:

| Janela | Documento | Conferência |
| --- | --- | --- |
| 320 px | 305 px | Formulário de evento aberto, sem rolagem lateral. |
| 390 px | 375 px | Formulário de grupo aberto, botões >=44 px e campos de 16 px. |
| 768 px | 753 px | Navegação móvel disponível, sem rolagem lateral. |
| 1280 px | 1265 px | Índice lateral visível; seletor móvel oculto. |

A diferença de 15 px corresponde à barra vertical no navegador de teste.
Os atalhos foram conferidos com um grupo e um evento de 2027. Seus formulários
foram abertos e cancelados sem gravação; 2027 permaneceu sem encontros.
A dimensão temporária de teste foi removida ao terminar a conferência.

Validação: 45 testes existentes, TypeScript, lint do painel e build de 68 páginas.
O carregador dos testes reconhece CSS Modules com nomes de classe opacos; o CSS
real é validado pelo build do Next.js e pela conferência visual no navegador.
Não houve migração, alteração de APIs, registros, permissões ou dados financeiros.
