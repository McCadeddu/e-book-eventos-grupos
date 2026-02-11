// /web/pages/api/grupos/ordenar.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "../../../lib/supabaseClient";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== "POST") {
        return res.status(405).json({ sucesso: false });
    }

    const { ordem } = req.body as {
        ordem: { id: string; ordem: number }[];
    };

    if (!Array.isArray(ordem)) {
        return res.status(400).json({ sucesso: false });
    }

    const updates = ordem.map((g) =>
        supabase.from("grupos").update({ ordem: g.ordem }).eq("id", g.id)
    );

    const results = await Promise.all(updates);

    const erro = results.find((r) => r.error);
    if (erro) {
        console.error(erro.error);
        return res.status(500).json({ sucesso: false });
    }

    return res.status(200).json({ sucesso: true });
}
