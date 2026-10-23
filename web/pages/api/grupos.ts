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
        return salvarCadastroAnualApi("grupos", req, res, supabase);
    }
    // ===== EXCLUIR GRUPO =====
    if (req.method === "DELETE") {
        const { grupoId } = req.body;

        if (!grupoId) {
            return res.status(400).json({ erro: "grupoId ausente" });
        }

        const { error: erroEncontros } = await supabase
            .from("encontros")
            .delete()
            .eq("grupo_id", grupoId);

        if (erroEncontros) {
            return res.status(500).json({ erro: erroEncontros.message });
        }

        const { error: erroGrupo } = await supabase
            .from("grupos")
            .delete()
            .eq("id", grupoId);

        if (erroGrupo) {
            return res.status(500).json({ erro: erroGrupo.message });
        }

        await salvarBackupAutomatico({
            entidade: "grupos",
            acao: "excluir",
            referenciaId: grupoId,
        });

        const colecao = await carregarEdicoesEbook(supabase);
        for (const edicao of colecao.edicoes) await revalidarEdicaoAnual(res, edicao.ano);

        return res.status(200).json({ sucesso: true });
    }

    return res.status(405).json({ erro: "Método não permitido" });
}
