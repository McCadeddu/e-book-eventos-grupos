insert into public.eventos (
  id,
  titulo,
  faixa_etaria,
  descricao,
  equipe,
  grupos_envolvidos,
  todos_os_grupos,
  objetivo_ano,
  convite,
  visibilidade
)
values
(
  '6f6ac7f4-7c5c-4a79-9f9d-2b2fd3d0a101',
  'Afetividade Jovens',
  '14 - 20 anos',
  'Retiro de afetividade para os jovens',
  ARRAY['Lavínia e Adolfo']::text[],
  ARRAY['gimvi-adolescentes', 'gimvi-jovens']::text[],
  false,
  'Descobrir a beleza de ser amados, amoráveis e puros aos olhos de Deus e da humanidade',
  '',
  'publico'
),
(
  'd0c22f65-2453-4b5f-8300-f91f1dcff102',
  'Jeshuá',
  '16 - 27 anos',
  'Retiro para jovens',
  ARRAY['Roberta', 'Marilene', 'Yasmin e Gustavo', 'Diego e Mariana', 'Magna', 'Maria Fernanda']::text[],
  ARRAY['gimvi-jovens']::text[],
  false,
  'Experiência transformativa do Amor de Deus',
  'Experimente quanto é bom ser filhos de Deus que salva!',
  'publico'
),
(
  '3b33e0bb-2cb8-4d31-bf95-f6c2cb4ab103',
  'Grand Prix Formula 1',
  '12 - 15 anos',
  'Retiro de encontro profundo com Deus',
  ARRAY['Kátia e Leonardo', 'Cristiane', 'Isabela', 'Fernanda', 'Fernando e Fábia', 'Marilene']::text[],
  ARRAY['gimvi-adolescentes']::text[],
  false,
  '',
  '',
  'publico'
),
(
  '0f0aa7de-a88e-4761-8f57-b7a211c9d104',
  'CANÁ',
  'Casais',
  'Retiro para casais',
  ARRAY['Catarina e Sérgio', 'Patrícia', 'Vanir', 'Meire e Deiverson', 'Adriana']::text[],
  ARRAY['gimca-1', 'gimca-2']::text[],
  false,
  '',
  'Participe ao nosso retiro para casais!',
  'publico'
),
(
  '1c250f5d-83f9-4473-b94a-ef6dfeef3105',
  'AREIA OU  ROCHA',
  'Casais',
  'Retiro para casais',
  ARRAY['Nádia e Paulo', 'Fernando e Eliane', 'Esenclever e Ana Paula', 'Márcia']::text[],
  ARRAY['gimca-1', 'gimca-2']::text[],
  false,
  '',
  'Participe do nosso encontro!',
  'publico'
),
(
  'fb334ac3-53d1-456a-8108-3d526511f106',
  'AFETIVIDADE  CASAIS',
  'Casais',
  'Retiro de afetividade para casais',
  ARRAY['P. Hernando', 'Harley', 'Karine', 'Nádia e Paulo', 'Liliane', 'Lincon']::text[],
  ARRAY['gimca-1', 'gimca-2']::text[],
  false,
  '',
  'Participe do nosso encontro!',
  'publico'
),
(
  '727bb9b1-3d38-49fb-a184-7f116f954107',
  'EMAÚS',
  'Adultos',
  'Retiro de espiritualidade e renovação da própria vida profunda ',
  ARRAY['Maria e Wilson']::text[],
  ARRAY['gam', 'grupo-trilhas']::text[],
  false,
  'Sentir o amor de Deus na própria vida',
  'Participe do retiro!',
  'publico'
),
(
  '5c0e6f63-3298-4f25-b754-4d3c88f7e201',
  'Aniversário da Comunidade',
  '',
  'Celebração do aniversário da Comunidade Missionária de Villaregia.',
  ARRAY[]::text[],
  ARRAY['gimvi-jovens', 'gimca-1', 'gimvi-adolescentes', 'gimca-2', 'gam']::text[],
  false,
  '',
  'Encontro com a presidente da Comunidade Missionária de Villaregia, Briseida.',
  'publico'
)
on conflict (id) do update set
  titulo = excluded.titulo,
  faixa_etaria = excluded.faixa_etaria,
  descricao = excluded.descricao,
  equipe = excluded.equipe,
  grupos_envolvidos = excluded.grupos_envolvidos,
  todos_os_grupos = excluded.todos_os_grupos,
  objetivo_ano = excluded.objetivo_ano,
  convite = excluded.convite,
  visibilidade = excluded.visibilidade;
