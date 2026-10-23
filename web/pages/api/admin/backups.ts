import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "../../../lib/adminAuth";
import { getSupabaseAdminClient } from "../../../lib/supabaseAdmin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    res.setHeader("Cache-Control", "no-store");
    if (!requireAdmin(req, res)) return;
    if (req.method !== "GET") {
        res.setHeader("Allow", "GET");
        return res.status(405).json({ erro: "Metodo nao permitido." });
    }

    try {
        const client = getSupabaseAdminClient();
        const { data, error } = await client.from("admin_backups")
            .select("id, created_at, resumo")
            .order("created_at", { ascending: false }).limit(10);
        if (error) throw error;
        return res.status(200).json({ sucesso: true, backups: data });
    } catch {
        return res.status(503).json({
            sucesso: false,
            erro: "Nao foi possivel consultar backups. Confira SUPABASE_SERVICE_ROLE_KEY no servidor e execute o SQL atualizado de admin_backups.",
        });
    }
}
