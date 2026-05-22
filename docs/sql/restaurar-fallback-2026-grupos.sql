insert into public.grupos (
  id,
  slug,
  nome,
  faixa_etaria,
  descricao,
  objetivo_ano,
  equipe,
  convite_final,
  ordem,
  categoria
)
values
(
  'gimvi-adolescentes',
  'gimvi-adolescentes',
  'GimVi Adolescentes',
  'Adolescentes até 15 anos',
  'Grupo inter-paroquial missionário de Villaregia Adolescentes',
  'A espiritualidade cristã se junta aos tempos de hoje, com todos os desafios e alegrias. Ver Jesus na nossa vida.',
  ARRAY['Marco (31 996822184)', 'Rosyelen', 'José Roberto']::text[],
  'Venha fazer parte do GimVi Adolescentes e caminhar juntos para um crescimento humano e espiritual!',
  1,
  'grupo'
),
(
  'nova-constelacao',
  'nova-constelacao',
  'Nova Constelação',
  '10–13 anos',
  'Grupo inter-religioso preadolescente para crescer na amizade e valores humanos',
  'Potencializar e canalizar as próprias energias para fazer a diferença neste mundo',
  ARRAY['P. Siro Paulo (31993873137)', 'Rosemeire (31986807411)', 'Alice', 'Vitória (31985187506)', 'Ana Clara']::text[],
  'Se você é um preadolescente que deseja caminhar no bem e para o bem, venha participar do nosso grupo!',
  2,
  'grupo'
),
(
  'gimvi-jovens',
  'gimvi-jovens',
  'GimVi Jovens',
  '16–30 anos',
  'Grupo inter-paroquial missionário de Villaregia Jovens',
  'Autoconhecimento, conhecimento e prática do bem.',
  ARRAY['P. Siro Opportuni', 'Roberta', 'Rodrigo e Nathalia']::text[],
  'Jovem! Você deseja uma caminhada cristã, descobrir a si mesmo e praticar o bem? Participe do GimVi Jovens!',
  3,
  'grupo'
),
(
  'gimca-1',
  'gimca-1',
  'Gimca 1',
  'Noivos próximos ao casamento e casais com até 10 anos de vida juntos',
  'Grupo interparoquial missionário de casais, que se reúne uma vez ao mês, para juntos refletirem sobre a vida do casal à luz que Deus sonhou para eles.',
  'Num ambiente de fraternidade, com a ajuda uns dos outros, nos apoiarmos para viver a plenitude de nossa vocação: o matrimônio!',
  ARRAY['P. Hernando (3195143578)', 'Denise e Josemar']::text[],
  'Convidamos vocês a caminharem conosco nesse ano.',
  4,
  'grupo'
),
(
  'gimca-2',
  'gimca-2',
  'Gimca 2',
  'Casais com mais de 10 anos de matrimônio ou convivência',
  'Grupo interparoquial missionário de casais que deseja caminhar rumo uma vida cristã mais profunda e da pratica do bem',
  'Autoconhecimento, conhecimento e pratica do bem',
  ARRAY['Márcia (3171755909)', 'Nina']::text[],
  'Venha participar ao nosso grupo!',
  5,
  'grupo'
),
(
  'gimvi-criancas',
  'gimvi-criancas',
  'GimVi  Crianças e Pre-Adolescentes',
  '6 - 12 anos',
  'Grupo interparoquial missionário de Villaregia crianças',
  '',
  ARRAY['Michele Rocha', 'Isabela', 'Sonia']::text[],
  '',
  6,
  'grupo'
),
(
  'gam',
  'gam',
  'GAM',
  'Adultos a partir de 55 anos',
  'Grupo missionario Adultos',
  'Autoconhecimento, conhecimento e pratica do bem',
  ARRAY['Angélica (3197645306)']::text[],
  'Venha participar ao nosso grupo!',
  7,
  'grupo'
),
(
  'grupo-trilhas',
  'grupo-trilhas',
  'Grupo Trilhas',
  '30 ~',
  'Grupo de formação humano-cristã para o autoconhecimento, conhecimento e pratica do bem',
  'Autoconhecimento, conhecimento e pratica do bem',
  ARRAY['Erika']::text[],
  'Venha participar ao grupo Trilhas!',
  8,
  'grupo'
)
on conflict (id) do update set
  slug = excluded.slug,
  nome = excluded.nome,
  faixa_etaria = excluded.faixa_etaria,
  descricao = excluded.descricao,
  objetivo_ano = excluded.objetivo_ano,
  equipe = excluded.equipe,
  convite_final = excluded.convite_final,
  ordem = excluded.ordem,
  categoria = excluded.categoria;
