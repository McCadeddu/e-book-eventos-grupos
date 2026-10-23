import { getSupabaseAdminClient } from "./supabaseAdmin";
import { aplicarGrupoEdicao, aplicarEventoEdicao, type GrupoEdicao, type EventoEdicao } from "./edicao-publicacao";
import { pertenceAoAno } from "./ebook-config";
import type { Grupo, Encontro } from "./types";
import type { Evento } from "./eventos-types";

/** Server-only data access. Never return this unfiltered result to public pages. */
export async function carregarConteudoAnual(ano: number) {
    const client = getSupabaseAdminClient();
    const resultados = await Promise.all([
        client.from("grupos").select("*").order("ordem", { ascending: true }),
        client.from("eventos").select("*").order("ordem", { ascending: true }),
        client.from("grupo_edicoes").select("*").eq("ano", ano),
        client.from("evento_edicoes").select("*").eq("ano", ano),
        client.from("encontros").select("*").gte("data_inicio", `${ano}-01-01`)
            .lt("data_inicio", `${ano + 1}-01-01`).order("data_inicio", { ascending: true }),
    ]);
    if (resultados.some((r) => r.error)) {
        throw new Error("Não foi possível carregar a edição anual. Confira a infraestrutura do ano selecionado.");
    }
    return {
        grupos: aplicarGrupoEdicao((resultados[0].data ?? []) as Grupo[], (resultados[2].data ?? []) as GrupoEdicao[]),
        eventos: aplicarEventoEdicao((resultados[1].data ?? []) as Evento[], (resultados[3].data ?? []) as EventoEdicao[]),
        encontros: (resultados[4].data ?? []) as Encontro[],
    };
}

/** Filter before serialization; internal event/meeting data never enters public props. */
export function filtrarConteudoPublico(ano: number, conteudo: Awaited<ReturnType<typeof carregarConteudoAnual>>) {
    const selecionar = <T extends object>(registro: T, campos: ReadonlyArray<keyof T>): T =>
        Object.fromEntries(campos.filter(k => registro[k] !== undefined).map(k => [k, registro[k]])) as T;
    const grupos = conteudo.grupos.map(g => selecionar(g,
        ["id", "slug", "nome", "faixa_etaria", "descricao", "objetivo_ano", "equipe", "convite_final", "ordem", "categoria"]));
    const eventos = conteudo.eventos.filter((e) => e.visibilidade === "publico").map(e => selecionar(e,
        ["id", "titulo", "faixa_etaria", "descricao", "equipe", "objetivo_ano", "convite", "grupos_envolvidos", "todos_os_grupos", "visibilidade"]));
    const eventosIds = new Set(eventos.map((e) => e.id));
    const gruposIds = new Set(conteudo.grupos.map((g) => g.id));
    const encontros = conteudo.encontros.filter((e) =>
        e.visibilidade === "publico" && pertenceAoAno(e.data_inicio, ano) &&
        (e.evento_id ? eventosIds.has(e.evento_id) : gruposIds.has(e.grupo_id))
    ).map(e => selecionar(e, ["id", "grupo_id", "evento_id", "data_inicio", "data_fim", "data_legivel", "horario", "titulo", "descricao", "local", "tipo", "visibilidade", "nivel", "mostrar_no_anual"]));
    return { grupos, eventos, encontros };
}

export async function carregarConteudoPublicoAnual(ano: number) {
    return filtrarConteudoPublico(ano, await carregarConteudoAnual(ano));
}
