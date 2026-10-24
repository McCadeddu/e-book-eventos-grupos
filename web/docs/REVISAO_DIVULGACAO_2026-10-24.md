# Revisão das informações antes de divulgar

A visão geral administrativa mostra a quantidade de encontros com informações
a conferir e permite combinar esse filtro com busca, mês e presença no calendário
público. “Limpar filtros” e a troca de ano também reiniciam o filtro de revisão.

Os avisos editoriais são centralizados em `pendenciasDoEncontro`: data ausente
ou inválida, término inválido/anterior ao início, local vazio e horário vazio.
Texto composto somente de espaços conta como vazio. Intervalos que cruzam o fim
do ano e horários escritos livremente continuam aceitos. Título, descrição e data
legível não são tratados como obrigatórios. “Data legível ausente” foi retirado
dos alertas antigos porque o formulário apresenta esse campo como opcional.

Visibilidade interna, encontro organizativo e cadastro inativo continuam sendo
situações de publicação, separadas dos avisos de preenchimento na visão geral.
“Sem avisos” significa somente ausência desses problemas de preenchimento; não
certifica prontidão pastoral, ausência de conflitos ou autorização para publicar.
Os avisos não bloqueiam cadastro, alteram registros ou mudam a publicação.

O componente reutilizável `AvisosEncontro` aparece também na prévia e na tela do
cartaz. No PDF, `acoes=false` exclui os avisos do HTML exportado. No cartaz, os
avisos ficam fora do elemento capturado por `cartazRef`; não entram no PNG.

Validação: 45 testes automatizados, TypeScript, lint dos arquivos alterados e
build de produção de 68 páginas. Os testes cobrem campos opcionais, visibilidade
interna, espaços em branco, datas inválidas, intervalo entre anos, filtros
combinados e exclusão dos avisos no conteúdo exportável.

Na interface local, a revisão encontrou 9 de 129 encontros de 2026 com avisos.
A prévia de um encontro sem horário exibiu o aviso correto; a área exportável do
cartaz permaneceu sem o aviso. A edição de 2027 continuou com zero encontros e
zero avisos. Os registros foram apenas consultados; nenhum foi editado, publicado,
excluído ou completado automaticamente. Não houve migração, alteração de
permissões, nova dependência ou mudança de dados financeiros.
