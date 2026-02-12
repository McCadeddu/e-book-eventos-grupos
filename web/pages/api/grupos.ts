// web/pages/api/grupos.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "../../lib/supabaseClient";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    // ===== EDITAR GRUPO =====
    if (req.method === "PUT") {
        const {
            id,
            slug,
            nome,
            faixa_etaria,
            descricao,
            objetivo_ano,
            equipe,
            convite_final,
        } = req.body;

        if (!id) {
            return res.status(400).json({ erro: "ID ausente" });
        }

        const { error } = await supabase
            .from("grupos")
            .update({
                slug,
                nome,
                faixa_etaria,
                descricao,
                objetivo_ano,
                equipe,
                convite_final,
            })
            .eq("id", id);

        if (error) {
            console.error(error);
            return res.status(500).json({ erro: error.message });
        }

        await res.revalidate("/livro/calendario");
        await res.revalidate("/livro");
        await res.revalidate("/admin/grupos");

        return res.status(200).json({ sucesso: true });
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

        await res.revalidate("/livro/calendario");
        await res.revalidate("/livro");
        await res.revalidate("/admin/grupos");

        return res.status(200).json({ sucesso: true });
    }

    return res.status(405).json({ erro: "Método não permitido" });
}