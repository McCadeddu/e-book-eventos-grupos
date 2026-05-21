import type { NextApiRequest, NextApiResponse } from "next";
import { randomUUID } from "crypto";
import { EBOOK_ASSETS_BUCKET, getSupabaseAdminClient } from "../../../lib/supabaseAdmin";
import { requireAdmin } from "../../../lib/adminAuth";

const MAX_UPLOAD_BYTES = 6 * 1024 * 1024;
const MIME_EXTENSION: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/svg+xml": "svg",
};

function inferExtension(fileName: string, mimeType: string) {
    const normalizedName = fileName.trim().toLowerCase();
    const fromName = normalizedName.split(".").pop();

    if (fromName && fromName !== normalizedName) {
        return fromName.replace(/[^a-z0-9]/g, "");
    }

    return MIME_EXTENSION[mimeType] ?? "bin";
}

function parseDataUrl(dataUrl: string) {
    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);

    if (!match) {
        throw new Error("Formato de imagem invalido.");
    }

    return {
        mimeType: match[1],
        buffer: Buffer.from(match[2], "base64"),
    };
}

export const config = {
    api: {
        bodyParser: {
            sizeLimit: "10mb",
        },
    },
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (!requireAdmin(req, res)) {
        return;
    }

    if (req.method !== "POST") {
        return res.status(405).json({ erro: "Metodo nao permitido." });
    }

    try {
        const ano = Number(req.body?.ano);
        const tipo = String(req.body?.tipo || "").trim().toLowerCase();
        const fileName = String(req.body?.fileName || "").trim();
        const dataUrl = String(req.body?.dataUrl || "");

        if (!Number.isInteger(ano) || ano < 2020) {
            return res.status(400).json({ erro: "Ano invalido para o upload." });
        }

        if (tipo !== "logo" && tipo !== "capa") {
            return res.status(400).json({ erro: "Tipo de asset invalido." });
        }

        if (!fileName || !dataUrl) {
            return res.status(400).json({ erro: "Arquivo nao enviado." });
        }

        const { mimeType, buffer } = parseDataUrl(dataUrl);

        if (!Object.keys(MIME_EXTENSION).includes(mimeType)) {
            return res.status(400).json({
                erro: "Formato nao suportado. Use PNG, JPG, WEBP ou SVG.",
            });
        }

        if (buffer.byteLength > MAX_UPLOAD_BYTES) {
            return res.status(400).json({
                erro: "A imagem excede o limite de 6 MB.",
            });
        }

        const client = getSupabaseAdminClient();
        const extension = inferExtension(fileName, mimeType);
        const path = `edicoes/${ano}/${tipo}-${Date.now()}-${randomUUID()}.${extension}`;

        const { error } = await client.storage
            .from(EBOOK_ASSETS_BUCKET)
            .upload(path, buffer, {
                contentType: mimeType,
                upsert: false,
            });

        if (error) {
            return res.status(500).json({
                erro: "Nao foi possivel enviar a imagem para o Supabase Storage.",
                detalhe: error.message,
            });
        }

        const { data } = client.storage.from(EBOOK_ASSETS_BUCKET).getPublicUrl(path);
        return res.status(200).json({
            sucesso: true,
            url: data.publicUrl,
            path,
        });
    } catch (error) {
        const mensagem =
            error instanceof Error
                ? error.message
                : "Nao foi possivel processar o upload da imagem.";

        return res.status(503).json({ erro: mensagem });
    }
}
