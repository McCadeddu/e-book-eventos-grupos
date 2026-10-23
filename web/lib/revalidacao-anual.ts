import type { NextApiResponse } from "next";
import { getSupabaseAdminClient } from "./supabaseAdmin";
import { carregarEdicoesEbook } from "./ebook-config";

/** All chapters contain shared indexes. Saving one record invalidates the year's public edition. */
export async function revalidarEdicaoAnual(res: NextApiResponse, ano: number): Promise<boolean> {
    try {
        const client = getSupabaseAdminClient();
        const [grupos, eventos, colecao] = await Promise.all([
            client.from("grupos").select("slug"), client.from("eventos").select("id"), carregarEdicoesEbook(client),
        ]);
        if (grupos.error || eventos.error) return false;
        const paths = [`/livro/edicao/${ano}`, `/livro/edicao/${ano}/calendario`,
            ...(grupos.data ?? []).map(g => `/livro/edicao/${ano}/grupo/${g.slug}`),
            ...(eventos.data ?? []).map(e => `/livro/edicao/${ano}/evento/${e.id}`)];
        if (ano === colecao.anoPublicado) paths.push("/livro", "/livro/calendario",
            ...(grupos.data ?? []).map(g => `/livro/${g.slug}`),
            ...(eventos.data ?? []).map(e => `/livro/evento/${e.id}`));
        let sucesso = true;
        for (let i = 0; i < paths.length; i += 4) {
            const resultados = await Promise.allSettled(paths.slice(i, i + 4).map(p => res.revalidate(p)));
            if (resultados.some(r => r.status === "rejected")) sucesso = false;
        }
        return sucesso;
    } catch { return false; }
}
