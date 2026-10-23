import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminClient } from "../../lib/adminApi";
import { salvarBackupAutomatico } from "../../lib/adminBackup";
import { salvarCadastroAnualApi } from "../../lib/admin-edicoes";
import { carregarEdicoesEbook } from "../../lib/ebook-config";
import { revalidarEdicaoAnual } from "../../lib/revalidacao-anual";

export const config = { maxDuration: 60 };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const supabase = requireAdminClient(req, res);
    if (!supabase) return;
    if (req.method === "POST" || req.method === "PUT") {
        return salvarCadastroAnualApi("eventos", req, res, supabase);
    }
    /* =====================================================
       EXCLUIR EVENTO
    ===================================================== */
    if (req.method === "DELETE") {

        const { id } = req.body;

        if (!id) {
            return res.status(400).json({ erro: "ID ausente" });
        }

        const { error } = await supabase
            .from("eventos")
            .delete()
            .eq("id", id);

        if (error) {
            console.error(error);
            return res.status(500).json({ erro: error.message });
        }

        await salvarBackupAutomatico({
            entidade: "eventos",
            acao: "excluir",
            referenciaId: id,
        });

        const colecao = await carregarEdicoesEbook(supabase);
        for (const edicao of colecao.edicoes) await revalidarEdicaoAnual(res, edicao.ano);

        return res.status(200).json({ sucesso: true });
    }

    return res.status(405).json({ erro: "Método não permitido" });
}
