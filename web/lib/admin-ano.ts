import { getSupabaseAdminClient } from "./supabaseAdmin";
import { carregarEdicoesEbook } from "./ebook-config";
import { carregarConteudoAnual } from "./conteudo-anual";
import { lerAnoPastoral } from "./ano-pastoral";

/** Empty years remain empty: never substitute meetings from a local fallback. */
export async function carregarAgendaAdministrativa(anoSolicitado: unknown) {
    const client = getSupabaseAdminClient();
    const colecao = await carregarEdicoesEbook(client);
    const anos = colecao.edicoes.map((edicao) => edicao.ano).sort((a, b) => a - b);
    const ano = lerAnoPastoral(anoSolicitado === undefined ? colecao.anoEmPreparacao : anoSolicitado);

    if (!ano || !anos.includes(ano)) return null;

    const conteudo = await carregarConteudoAnual(ano);
    return { ano, anos, anoPublicado: colecao.anoPublicado, ...conteudo };
}
