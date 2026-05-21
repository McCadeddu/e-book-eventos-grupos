const fs = require("fs");
const path = require("path");

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

function sqlBoolean(valor) {
    return valor ? "true" : "false";
}

function montarSqlGrupos() {
    const grupos = lerJson("grupos(nãousado).json").grupos ?? [];

    const valores = grupos.map((grupo, index) => {
        return `(
  ${sqlTexto(grupo.id)},
  ${sqlTexto(grupo.slug)},
  ${sqlTexto(grupo.nome)},
  ${sqlTexto(grupo.faixa_etaria ?? "")},
  ${sqlTexto(grupo.descricao ?? "")},
  ${sqlTexto(grupo.objetivo_ano ?? "")},
  ${sqlJson(Array.isArray(grupo.equipe) ? grupo.equipe : [])},
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

function montarSqlEncontros() {
    const encontros = (lerJson("encontros(nãousado).json").encontros ?? [])
        .filter(
            (encontro) =>
                typeof encontro.data_inicio === "string" &&
                encontro.data_inicio.trim() !== "" &&
                encontro.grupo_id
        );

    const valores = encontros.map((encontro) => {
        return `(
  ${sqlTexto(encontro.id)},
  ${sqlTexto(encontro.grupo_id)},
  ${sqlTexto(encontro.evento_id ?? null)},
  ${sqlTexto(encontro.tipo ?? "encontro_regular")},
  ${sqlTexto(encontro.data_inicio)},
  ${sqlTexto(encontro.data_fim ?? null)},
  ${sqlTexto(encontro.data_legivel ?? null)},
  ${sqlTexto(encontro.horario ?? null)},
  ${sqlTexto(encontro.local ?? null)},
  ${sqlTexto(encontro.titulo ?? null)},
  ${sqlTexto(encontro.descricao ?? null)},
  ${sqlTexto(encontro.visibilidade ?? "publico")},
  ${sqlTexto(encontro.nivel ?? "evento")},
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

function main() {
    const saida = path.join(
        process.cwd(),
        "..",
        "docs",
        "sql",
        "restaurar-fallback-2026.sql"
    );

    const conteudo = `-- Restauracao gerada automaticamente a partir dos backups locais
-- Data: ${new Date().toISOString()}
begin;

${montarSqlGrupos()}

${montarSqlEncontros()}

commit;
`;

    fs.writeFileSync(saida, conteudo, "utf-8");
    console.log(saida);
}

main();
