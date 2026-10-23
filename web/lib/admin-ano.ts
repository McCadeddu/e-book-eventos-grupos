import { getSupabaseAdminClient } from "./supabaseAdmin";
import { carregarEdicoesEbook } from "./ebook-config";
import { getGruposOrdenados } from "./db/grupos";
import { getEventos } from "./db/eventos";
import { lerAnoPastoral } from "./ano-pastoral";
import type { Encontro } from "./types";

/** Empty years remain empty: never substitute meetings from a local fallback. */
export async function carregarAgendaAdministrativa(anoSolicitado: unknown) {
    const client = getSupabaseAdminClient();
    const colecao = await carregarEdicoesEbook(client);
    const anos = colecao.edicoes.map((edicao) => edicao.ano).sort((a, b) => a - b);
    const ano = lerAnoPastoral(anoSolicitado === undefined ? colecao.anoEmPreparacao : anoSolicitado);

    if (!ano || !anos.includes(ano)) return null;

    const [grupos, eventos, resposta] = await Promise.all([
        getGruposOrdenados(),
        getEventos(),
        client.from("encontros").select("*")
            .gte("data_inicio", `${ano}-01-01`)
            .lt("data_inicio", `${ano + 1}-01-01`)
            .order("data_inicio", { ascending: true }),
    ]);

    if (resposta.error) throw new Error("Não foi possível carregar os encontros do ano selecionado.");

    return {
        ano, anos, anoPublicado: colecao.anoPublicado,
        grupos, eventos, encontros: (resposta.data ?? []) as Encontro[],
    };
}
