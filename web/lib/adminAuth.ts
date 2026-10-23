import type { NextApiRequest, NextApiResponse } from "next";
import type { IncomingMessage } from "http";
import { createHmac, timingSafeEqual } from "crypto";

export const ADMIN_AUTH_COOKIE = "adminAuth";
const SESSION_DURATION_SECONDS = 60 * 60 * 12;

function toBase64Url(value: string) {
    return Buffer.from(value, "utf-8")
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padding = (4 - (normalized.length % 4 || 4)) % 4;
    return Buffer.from(normalized + "=".repeat(padding), "base64").toString("utf-8");
}

function sign(payload: string, secret: string) {
    return createHmac("sha256", secret).update(payload).digest("base64url");
}

function parseCookies(req: Pick<IncomingMessage, "headers">) {
    const header = req.headers.cookie;

    if (!header) {
        return {};
    }

    return header.split(";").reduce<Record<string, string>>((acc, item) => {
        const [rawName, ...rest] = item.trim().split("=");

        if (!rawName) {
            return acc;
        }

        try {
            acc[rawName] = decodeURIComponent(rest.join("="));
        } catch {
            // A malformed cookie must not interrupt authentication checks.
        }
        return acc;
    }, {});
}

export function getAdminConfig() {
    return {
        adminEmail: process.env.ADMIN_EMAIL?.trim().toLowerCase() ?? "",
        adminPassword: process.env.ADMIN_PASSWORD ?? "",
        sessionSecret: process.env.ADMIN_SESSION_SECRET ?? "",
    };
}

export function createAdminSession(email: string, secret: string) {
    const expiresAt = Date.now() + SESSION_DURATION_SECONDS * 1000;
    const payload = toBase64Url(
        JSON.stringify({
            email: email.trim().toLowerCase(),
            exp: expiresAt,
        })
    );
    const signature = sign(payload, secret);
    return `${payload}.${signature}`;
}

export function verifyAdminSessionToken(token: string, secret: string) {
    if (!token || !secret) {
        return false;
    }

    const [payload, signature, extra] = token.split(".");

    if (!payload || !signature || extra !== undefined) {
        return false;
    }

    const expectedSignature = sign(payload, secret);
    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (
        signatureBuffer.length !== expectedBuffer.length ||
        !timingSafeEqual(signatureBuffer, expectedBuffer)
    ) {
        return false;
    }

    try {
        const decoded = JSON.parse(fromBase64Url(payload)) as { exp?: number };
        return typeof decoded.exp === "number" && Number.isFinite(decoded.exp) && decoded.exp > Date.now();
    } catch {
        return false;
    }
}

export function isAdminAuthenticated(req: Pick<IncomingMessage, "headers">) {
    const { sessionSecret } = getAdminConfig();
    const cookies = parseCookies(req);
    const token = cookies[ADMIN_AUTH_COOKIE];
    return verifyAdminSessionToken(token, sessionSecret);
}

export function requireAdmin(req: NextApiRequest, res: NextApiResponse) {
    if (!isAdminAuthenticated(req)) {
        res.status(401).json({ erro: "Autenticação administrativa inválida." });
        return false;
    }

    return true;
}

export function buildAdminSessionCookie(token: string) {
    const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
    return `${ADMIN_AUTH_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DURATION_SECONDS}${secure}`;
}

export function buildAdminLogoutCookie() {
    const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
    return `${ADMIN_AUTH_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}
