// web/pages/api/eventos/ordenar.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "../../../lib/supabaseClient";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== "POST") {
        return res.status(405).json({ erro: "Método não permitido" });
    }

    const { ordem } = req.body;

    for (const item of ordem) {
        await supabase
            .from("eventos")
            .update({ ordem: item.ordem })
            .eq("id", item.id);
    }

    return res.status(200).json({ sucesso: true });
}