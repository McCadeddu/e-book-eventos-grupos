const fs = require("fs");
const path = require("path");

const EVENTOS_PROMOVIDOS = {
    "afetividade-jovens": {
        eventId: "6f6ac7f4-7c5c-4a79-9f9d-2b2fd3d0a101",
        tipo: "retiro",
        grupos_envolvidos: ["gimvi-adolescentes", "gimvi-jovens"],
    },
    jeshua: {
        eventId: "d0c22f65-2453-4b5f-8300-f91f1dcff102",
        tipo: "retiro",
        grupos_envolvidos: ["gimvi-jovens"],
    },
    "grand-prix-formula-1": {
        eventId: "3b33e0bb-2cb8-4d31-bf95-f6c2cb4ab103",
        tipo: "retiro",
        grupos_envolvidos: ["gimvi-adolescentes"],
    },
    cana: {
        eventId: "0f0aa7de-a88e-4761-8f57-b7a211c9d104",
        tipo: "retiro",
        grupos_envolvidos: ["gimca-1", "gimca-2"],
    },
    "areia-ou-rocha": {
        eventId: "1c250f5d-83f9-4473-b94a-ef6dfeef3105",
        tipo: "retiro",
        grupos_envolvidos: ["gimca-1", "gimca-2"],
    },
    "afetividade-casais": {
        eventId: "fb334ac3-53d1-456a-8108-3d526511f106",
        tipo: "retiro",
        grupos_envolvidos: ["gimca-1", "gimca-2"],
    },
    emaus: {
        eventId: "727bb9b1-3d38-49fb-a184-7f116f954107",
        tipo: "retiro",
        grupos_envolvidos: ["gam", "grupo-trilhas"],
    },
};

const EVENTO_ANIVERSARIO_DA_COMUNIDADE_ID =
    "5c0e6f63-3298-4f25-b754-4d3c88f7e201";

function lerJson(nomeArquivo) {
    const caminho = path.join(process.cwd(), "..", "data", nomeArquivo);
    return JSON.parse(fs.readFileSync(caminho, "utf-8"));
}

function sqlTexto(valor) {
    if (valor === null || valor === undefined) {
        return "null";
    }

    return `'${String(valor).replace(/'/g, "''")}'`;
}

function sqlJson(valor) {
    return `${sqlTexto(JSON.stringify(valor ?? []))}::jsonb`;
}

function sqlTextArray(valor) {
    const itens = Array.isArray(valor) ? valor : [];
    return `ARRAY[${itens.map((item) => sqlTexto(item)).join(", ")}]::text[]`;
}

function sqlBoolean(valor) {
    return valor ? "true" : "false";
}

function lerGrupos() {
    return lerJson("grupos(nãousado).json").grupos ?? [];
}

function lerEncontros() {
    return lerJson("encontros(nãousado).json").encontros ?? [];
}

function lerEventosArquivo() {
    return (lerJson("eventos-2026.json").eventos ?? []).filter(
        (evento) => evento.visibilidade === "publico"
    );
}

function ehEncontroDoAniversarioDaCmv(encontro) {
    return (
        encontro.data_inicio === "2026-09-06" &&
        typeof encontro.titulo === "string" &&
        encontro.titulo.includes("Aniversário da CMV")
    );
}

function resolverEventoEspecialDoEncontro(encontro) {
    if (encontro.grupo_id && EVENTOS_PROMOVIDOS[encontro.grupo_id]) {
        return {
            eventId: EVENTOS_PROMOVIDOS[encontro.grupo_id].eventId,
            nivel: "evento",
        };
    }

    if (ehEncontroDoAniversarioDaCmv(encontro)) {
        return {
            eventId: EVENTO_ANIVERSARIO_DA_COMUNIDADE_ID,
            nivel: "evento",
        };
    }

    return null;
}

function montarSqlGrupos() {
    const grupos = lerGrupos().filter(
        (grupo) => !EVENTOS_PROMOVIDOS[grupo.id]
    );

    const valores = grupos.map((grupo, index) => {
        return `(
  ${sqlTexto(grupo.id)},
  ${sqlTexto(grupo.slug)},
  ${sqlTexto(grupo.nome)},
  ${sqlTexto(grupo.faixa_etaria ?? "")},
  ${sqlTexto(grupo.descricao ?? "")},
  ${sqlTexto(grupo.objetivo_ano ?? "")},
  ${sqlTextArray(Array.isArray(grupo.equipe) ? grupo.equipe : [])},
  ${sqlTexto(grupo.convite_final ?? "")},
  ${grupo.ordem ?? index + 1},
  ${sqlTexto(grupo.categoria ?? "grupo")}
)`;
    });

    return `insert into public.grupos (
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
${valores.join(",\n")}
on conflict (id) do update set
  slug = excluded.slug,
  nome = excluded.nome,
  faixa_etaria = excluded.faixa_etaria,
  descricao = excluded.descricao,
  objetivo_ano = excluded.objetivo_ano,
  equipe = excluded.equipe,
  convite_final = excluded.convite_final,
  ordem = excluded.ordem,
  categoria = excluded.categoria;`;
}

function montarSqlEventos() {
    const grupos = lerGrupos();
    const eventosPromovidos = Object.entries(EVENTOS_PROMOVIDOS).map(
        ([grupoId, config]) => {
            const grupo = grupos.find((item) => item.id === grupoId);

            if (!grupo) {
                throw new Error(`Grupo-base do evento ${grupoId} não encontrado.`);
            }

            return `(
  ${sqlTexto(config.eventId)},
  ${sqlTexto(grupo.nome)},
  ${sqlTexto(grupo.faixa_etaria ?? "")},
  ${sqlTexto(grupo.descricao ?? "")},
  ${sqlTextArray(Array.isArray(grupo.equipe) ? grupo.equipe : [])},
  ${sqlTextArray(config.grupos_envolvidos ?? [])},
  false,
  ${sqlTexto(grupo.objetivo_ano ?? "")},
  ${sqlTexto(grupo.convite_final ?? "")},
  'publico'
)`;
        }
    );

    const eventosDoArquivo = lerEventosArquivo().map((evento) => `(
  ${sqlTexto(evento.id)},
  ${sqlTexto(evento.titulo ?? "")},
  ${sqlTexto(evento.faixa_etaria ?? "")},
  ${sqlTexto(evento.descricao ?? "")},
  ${sqlTextArray(Array.isArray(evento.responsaveis) ? evento.responsaveis : [])},
  ${sqlTextArray(Array.isArray(evento.grupos_envolvidos) ? evento.grupos_envolvidos : [])},
  ${sqlBoolean(!!evento.todos_os_grupos)},
  ${sqlTexto(evento.objetivo_ano ?? "")},
  ${sqlTexto(evento.observacoes ?? "")},
  ${sqlTexto(evento.visibilidade ?? "publico")}
)`);

    const valores = [...eventosPromovidos, ...eventosDoArquivo];

    return `insert into public.eventos (
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
${valores.join(",\n")}
on conflict (id) do update set
  titulo = excluded.titulo,
  faixa_etaria = excluded.faixa_etaria,
  descricao = excluded.descricao,
  equipe = excluded.equipe,
  grupos_envolvidos = excluded.grupos_envolvidos,
  todos_os_grupos = excluded.todos_os_grupos,
  objetivo_ano = excluded.objetivo_ano,
  convite = excluded.convite,
  visibilidade = excluded.visibilidade;`;
}

function montarSqlEncontros() {
    const encontros = lerEncontros()
        .filter(
            (encontro) =>
                typeof encontro.data_inicio === "string" &&
                encontro.data_inicio.trim() !== ""
        );

    const valores = encontros.map((encontro) => {
        const eventoEspecial = resolverEventoEspecialDoEncontro(encontro);
        const grupoId = eventoEspecial ? null : encontro.grupo_id;
        const eventoId = eventoEspecial
            ? eventoEspecial.eventId
            : encontro.evento_id ?? null;

        return `(
  ${sqlTexto(encontro.id)},
  ${sqlTexto(grupoId)},
  ${sqlTexto(eventoId)},
  ${sqlTexto(encontro.tipo ?? "encontro_regular")},
  ${sqlTexto(encontro.data_inicio)},
  ${sqlTexto(encontro.data_fim ?? null)},
  ${sqlTexto(encontro.data_legivel ?? null)},
  ${sqlTexto(encontro.horario ?? null)},
  ${sqlTexto(encontro.local ?? null)},
  ${sqlTexto(encontro.titulo ?? null)},
  ${sqlTexto(encontro.descricao ?? null)},
  ${sqlTexto(encontro.visibilidade ?? "publico")},
  ${sqlTexto(eventoEspecial?.nivel ?? encontro.nivel ?? "evento")},
  ${sqlBoolean(
      typeof encontro.mostrar_no_anual === "boolean"
          ? encontro.mostrar_no_anual
          : true
  )}
)`;
    });

    return `insert into public.encontros (
  id,
  grupo_id,
  evento_id,
  tipo,
  data_inicio,
  data_fim,
  data_legivel,
  horario,
  local,
  titulo,
  descricao,
  visibilidade,
  nivel,
  mostrar_no_anual
)
values
${valores.join(",\n")}
on conflict (id) do update set
  grupo_id = excluded.grupo_id,
  evento_id = excluded.evento_id,
  tipo = excluded.tipo,
  data_inicio = excluded.data_inicio,
  data_fim = excluded.data_fim,
  data_legivel = excluded.data_legivel,
  horario = excluded.horario,
  local = excluded.local,
  titulo = excluded.titulo,
  descricao = excluded.descricao,
  visibilidade = excluded.visibilidade,
  nivel = excluded.nivel,
  mostrar_no_anual = excluded.mostrar_no_anual;`;
}

function montarSqlEncontrosEmPartes(tamanhoParte = 25) {
    const encontros = lerEncontros()
        .filter(
            (encontro) =>
                typeof encontro.data_inicio === "string" &&
                encontro.data_inicio.trim() !== ""
        );

    const statements = encontros.map((encontro) => {
        const eventoEspecial = resolverEventoEspecialDoEncontro(encontro);
        const grupoId = eventoEspecial ? null : encontro.grupo_id;
        const eventoId = eventoEspecial
            ? eventoEspecial.eventId
            : encontro.evento_id ?? null;

        return `insert into public.encontros (
  id,
  grupo_id,
  evento_id,
  tipo,
  data_inicio,
  data_fim,
  data_legivel,
  horario,
  local,
  titulo,
  descricao,
  visibilidade,
  nivel,
  mostrar_no_anual
)
values (
  ${sqlTexto(encontro.id)},
  ${sqlTexto(grupoId)},
  ${sqlTexto(eventoId)},
  ${sqlTexto(encontro.tipo ?? "encontro_regular")},
  ${sqlTexto(encontro.data_inicio)},
  ${sqlTexto(encontro.data_fim ?? null)},
  ${sqlTexto(encontro.data_legivel ?? null)},
  ${sqlTexto(encontro.horario ?? null)},
  ${sqlTexto(encontro.local ?? null)},
  ${sqlTexto(encontro.titulo ?? null)},
  ${sqlTexto(encontro.descricao ?? null)},
  ${sqlTexto(encontro.visibilidade ?? "publico")},
  ${sqlTexto(eventoEspecial?.nivel ?? encontro.nivel ?? "evento")},
  ${sqlBoolean(
      typeof encontro.mostrar_no_anual === "boolean"
          ? encontro.mostrar_no_anual
          : true
  )}
)
on conflict (id) do update set
  grupo_id = excluded.grupo_id,
  evento_id = excluded.evento_id,
  tipo = excluded.tipo,
  data_inicio = excluded.data_inicio,
  data_fim = excluded.data_fim,
  data_legivel = excluded.data_legivel,
  horario = excluded.horario,
  local = excluded.local,
  titulo = excluded.titulo,
  descricao = excluded.descricao,
  visibilidade = excluded.visibilidade,
  nivel = excluded.nivel,
  mostrar_no_anual = excluded.mostrar_no_anual;`;
    });

    const partes = [];

    for (let i = 0; i < statements.length; i += tamanhoParte) {
        const bloco = statements.slice(i, i + tamanhoParte);
        partes.push(bloco.join("\n\n"));
    }

    return partes;
}

function montarSqlLimpezaGruposPromovidos() {
    const ids = Object.keys(EVENTOS_PROMOVIDOS).map(sqlTexto).join(", ");

    return `delete from public.grupos
where id in (${ids});`;
}

function main() {
    const pastaSql = path.join(process.cwd(), "..", "docs", "sql");
    const saida = path.join(
        pastaSql,
        "restaurar-fallback-2026.sql"
    );
    const saidaGrupos = path.join(
        pastaSql,
        "restaurar-fallback-2026-grupos.sql"
    );
    const saidaEventos = path.join(
        pastaSql,
        "restaurar-fallback-2026-eventos.sql"
    );
    const saidaEncontros = path.join(
        pastaSql,
        "restaurar-fallback-2026-encontros.sql"
    );
    const saidaLimpeza = path.join(
        pastaSql,
        "restaurar-fallback-2026-limpeza.sql"
    );

    const sqlGrupos = `${montarSqlGrupos()}\n`;
    const sqlEventos = `${montarSqlEventos()}\n`;
    const sqlEncontros = `${montarSqlEncontros()}\n`;
    const sqlLimpeza = `${montarSqlLimpezaGruposPromovidos()}\n`;
    const sqlEncontrosPartes = montarSqlEncontrosEmPartes();

    const conteudo = `-- Restauracao gerada automaticamente a partir dos backups locais
-- Data: ${new Date().toISOString()}
begin;

${sqlGrupos}
${sqlEventos}
${sqlEncontros}
${sqlLimpeza}
commit;
`;

    fs.writeFileSync(saida, conteudo, "utf-8");
    fs.writeFileSync(saidaGrupos, sqlGrupos, "utf-8");
    fs.writeFileSync(saidaEventos, sqlEventos, "utf-8");
    fs.writeFileSync(saidaEncontros, sqlEncontros, "utf-8");
    fs.writeFileSync(saidaLimpeza, sqlLimpeza, "utf-8");
    sqlEncontrosPartes.forEach((parte, index) => {
        fs.writeFileSync(
            path.join(
                pastaSql,
                `restaurar-fallback-2026-encontros-parte-${String(
                    index + 1
                ).padStart(2, "0")}.sql`
            ),
            `${parte}\n`,
            "utf-8"
        );
    });
    console.log(saida);
}

main();
