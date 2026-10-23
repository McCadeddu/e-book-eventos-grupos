import chromium from "@sparticuz/chromium";
import type { LaunchOptions } from "puppeteer";

/** Vercel functions need a bundled Linux browser; local development uses Puppeteer's browser. */
export async function opcoesNavegadorPdf(): Promise<LaunchOptions> {
    if (process.env.VERCEL === "1" && process.platform === "linux") {
        return {
            args: chromium.args,
            executablePath: await chromium.executablePath(),
            headless: "shell",
            timeout: 20000,
        };
    }
    return { timeout: 20000 };
}
