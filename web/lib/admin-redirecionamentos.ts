import type { GetServerSidePropsContext, GetServerSidePropsResult } from "next";
import { getSupabaseAdminClient } from "./supabaseAdmin";
import { carregarEdicoesEbook } from "./ebook-config";
import { lerAnoPastoral } from "./ano-pastoral";

export type DestinoCadastro = "grupo" | "grupo-novo" | "grupo-editar" | "encontro-grupo-novo" |
    "eventos" | "evento-novo" | "evento-editar" | "encontro-evento-novo" |
    "encontro-editar-grupo" | "encontro-editar-evento";

/** Legacy URLs keep working, but every pastoral edit happens in the annual panel. */
export async function redirecionarCadastro(
    context: GetServerSidePropsContext,
    destino: DestinoCadastro
): Promise<GetServerSidePropsResult<Record<string, never>>> {
    const client = getSupabaseAdminClient();
    const colecao = await carregarEdicoesEbook(client);
    let ano = context.query.ano === undefined ? colecao.anoEmPreparacao : lerAnoPastoral(context.query.ano);
    let form: string = destino;
    let id: string | undefined;
    let ancora = "";

    if (destino.startsWith("encontro-editar-")) {
        const encontroId = destino === "encontro-editar-evento" ? context.params?.encontroId : context.params?.id;
        if (typeof encontroId !== "string") return { notFound: true };
        const { data, error } = await client.from("encontros")
            .select("id, data_inicio, evento_id, grupo_id").eq("id", encontroId).maybeSingle();
        if (error) throw new Error("Não foi possível localizar o encontro.");
        if (!data) return { notFound: true };
        if (destino === "encontro-editar-evento" && data.evento_id !== context.params?.id) return { notFound: true };
        const anoEncontro = lerAnoPastoral(data.data_inicio?.slice(0, 4));
        if (context.query.ano !== undefined && ano !== anoEncontro) return { notFound: true };
        ano = anoEncontro;
        form = "encontro-editar";
        id = data.id;
        if (data.evento_id) ancora = `evento-${data.evento_id}`;
    } else if (["grupo", "grupo-editar", "encontro-grupo-novo"].includes(destino)) {
        const slug = context.params?.slug;
        if (typeof slug !== "string") return { notFound: true };
        const { data, error } = await client.from("grupos").select("id, slug").eq("slug", slug).maybeSingle();
        if (error) throw new Error("Não foi possível localizar o grupo.");
        if (!data) return { notFound: true };
        id = data.id;
        ancora = `grupo-${data.slug}`;
    } else if (["evento-editar", "encontro-evento-novo"].includes(destino)) {
        const eventoId = context.params?.id;
        if (typeof eventoId !== "string") return { notFound: true };
        const { data, error } = await client.from("eventos").select("id").eq("id", eventoId).maybeSingle();
        if (error) throw new Error("Não foi possível localizar o evento.");
        if (!data) return { notFound: true };
        id = data.id;
        ancora = `evento-${data.id}`;
    }

    if (!ano || !colecao.edicoes.some((edicao) => edicao.ano === ano)) return { notFound: true };
    const query = new URLSearchParams({ ano: String(ano) });
    if (destino !== "grupo" && destino !== "eventos") query.set("form", form);
    if (id) query.set("id", id);
    if (destino === "eventos") ancora = "eventos";
    return {
        redirect: {
            destination: `/admin/grupos?${query}${ancora ? `#${encodeURIComponent(ancora)}` : ""}`,
            permanent: false,
        },
    };
}
