import type { NextApiRequest, NextApiResponse } from "next";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import puppeteer, { type Browser } from "puppeteer";
import { requireAdmin } from "../../../lib/adminAuth";
import { carregarDivulgacaoEncontro } from "../../../lib/admin-divulgacao";
import CartaoEncontro from "../../../components/admin/CartaoEncontro";
import { opcoesNavegadorPdf } from "../../../lib/pdf-browser";

export const config = { maxDuration: 60 };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    res.setHeader("Cache-Control", "private, no-store, max-age=0");
    if (!requireAdmin(req, res)) return;
    if (req.method !== "GET") {
        res.setHeader("Allow", "GET");
        return res.status(405).json({ erro: "Método não permitido." });
    }
    const { id } = req.query;
    if (typeof id !== "string" || !/^[\w-]{1,100}$/.test(id)) {
        return res.status(400).json({ erro: "ID do encontro inválido." });
    }

    let browser: Browser | undefined;
    try {
        const dados = await carregarDivulgacaoEncontro(id);
        if (!dados) return res.status(404).json({ erro: "Encontro não encontrado." });
        // Render authenticated data directly, without navigating to an external or protected URL.
        const card = renderToStaticMarkup(createElement(CartaoEncontro, { ...dados, acoes: false }));
        browser = await puppeteer.launch(await opcoesNavegadorPdf());
        const page = await browser.newPage();
        await page.setJavaScriptEnabled(false);
        await page.setContent(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Encontro pastoral</title><style>body{margin:0}main{min-height:0!important;padding:0!important}section{box-shadow:none!important;max-width:100%}</style></head><body>${card}</body></html>`, {
            waitUntil: "load", timeout: 15000,
        });
        const pdf = await page.pdf({
            format: "A4", printBackground: true,
            margin: { top: "20mm", bottom: "20mm", left: "15mm", right: "15mm" },
        });
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="panfleto-${id}.pdf"`);
        return res.send(Buffer.from(pdf));
    } catch {
        return res.status(500).json({ erro: "Não foi possível gerar o PDF. Tente novamente." });
    } finally {
        if (browser) await browser.close().catch(() => undefined);
    }
}
