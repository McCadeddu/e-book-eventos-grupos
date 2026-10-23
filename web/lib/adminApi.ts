import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "./adminAuth";
import { getSupabaseAdminClient } from "./supabaseAdmin";

/** Never construct a privileged database client before authenticating the request. */
export function requireAdminClient(req: NextApiRequest, res: NextApiResponse) {
    res.setHeader("Cache-Control", "private, no-store, max-age=0");
    if (!requireAdmin(req, res)) return null;

    try {
        return getSupabaseAdminClient();
    } catch {
        res.status(503).json({
            erro: "Acesso administrativo ao banco não configurado no servidor.",
        });
        return null;
    }
}
