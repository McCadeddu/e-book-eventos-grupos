import { getSupabaseAdminClient } from "./supabaseAdmin";

export type DadosDivulgacao = {
    encontro: {
        id: string;
        grupo_id: string | null;
        evento_id: string | null;
        tipo: string | null;
        data_inicio: string | null;
        data_fim: string | null;
        data_legivel: string | null;
        titulo: string | null;
        horario: string | null;
        local: string | null;
    };
    grupo: { id: string; nome: string };
    voltarHref: string;
};

/** Read the current record, including internal meetings, only after admin authentication. */
export async function carregarDivulgacaoEncontro(id: string): Promise<DadosDivulgacao | null> {
    const client = getSupabaseAdminClient();
    const { data: encontro, error } = await client.from("encontros")
        .select("id, grupo_id, evento_id, tipo, data_inicio, data_fim, data_legivel, titulo, horario, local")
        .eq("id", id).maybeSingle();
    if (error) throw new Error("Não foi possível carregar o encontro para divulgação.");
    if (!encontro) return null;

    const evento = Boolean(encontro.evento_id);
    const parentId = encontro.evento_id || encontro.grupo_id;
    if (!parentId) return null;
    const { data: responsavel, error: parentError } = evento
        ? await client.from("eventos").select("id, titulo").eq("id", parentId).maybeSingle()
        : await client.from("grupos").select("id, nome, slug").eq("id", parentId).maybeSingle();
    if (parentError) throw new Error("Não foi possível carregar o responsável pelo encontro.");
    if (!responsavel) return null;

    const ano = encontro.data_inicio?.slice(0, 4);
    const query = ano && /^\d{4}$/.test(ano) ? `?ano=${ano}` : "";
    const parent = responsavel as { id: string; titulo?: string; nome?: string; slug?: string };
    const ancora = evento ? `evento-${parent.id}` : `grupo-${parent.slug}`;
    return {
        encontro,
        grupo: { id: parent.id, nome: (evento ? parent.titulo : parent.nome) || "Encontro pastoral" },
        voltarHref: `/admin/grupos${query}#${encodeURIComponent(ancora)}`,
    };
}
