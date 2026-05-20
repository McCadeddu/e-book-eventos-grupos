import type { NextApiRequest, NextApiResponse } from "next";
import {
    buildAdminSessionCookie,
    createAdminSession,
    getAdminConfig,
} from "../../../lib/adminAuth";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({
            sucesso: false,
            erro: "Método não permitido",
        });
    }

    const { email, password } = req.body;
    const { adminEmail, adminPassword, sessionSecret } = getAdminConfig();

    if (!adminPassword || !sessionSecret) {
        return res.status(500).json({
            sucesso: false,
            erro: "Autenticação administrativa não configurada no ambiente.",
        });
    }

    const normalizedEmail =
        typeof email === "string" ? email.trim().toLowerCase() : "";
    const normalizedPassword =
        typeof password === "string" ? password : "";

    const emailPermitido = adminEmail
        ? normalizedEmail === adminEmail
        : normalizedEmail.endsWith("@villaregia.org");

    if (!emailPermitido || normalizedPassword !== adminPassword) {
        return res.status(401).json({
            sucesso: false,
            erro: "E-mail ou senha inválidos.",
        });
    }

    const token = createAdminSession(normalizedEmail, sessionSecret);
    res.setHeader("Set-Cookie", buildAdminSessionCookie(token));

    return res.status(200).json({ sucesso: true });
}
