// web/pages/api/grupos.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "../../lib/supabaseClient";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    // ===== EXCLUIR GRUPO =====
    if (req.method === "DELETE") {
        const { grupoId } = req.body;

        if (!grupoId) {
            return res.status(400).json({ erro: "grupoId ausente" });
        }

        // 1️⃣ excluir encontros do grupo
        const { error: erroEncontros } = await supabase
            .from("encontros")
            .delete()
            .eq("grupo_id", grupoId);

        if (erroEncontros) {
            console.error(erroEncontros);
            return res.status(500).json({ erro: erroEncontros.message });
        }

        // 2️⃣ excluir o grupo
        const { error: erroGrupo } = await supabase
            .from("grupos")
            .delete()
            .eq("id", grupoId);

        if (erroGrupo) {
            console.error(erroGrupo);
            return res.status(500).json({ erro: erroGrupo.message });
        }

        // 🔁 revalidação
        await res.revalidate("/livro/calendario");
        await res.revalidate("/admin/grupos");

        return res.status(200).json({ sucesso: true });
    }

    return res.status(405).json({ erro: "Método não permitido" });
}
