/* eslint-disable @typescript-eslint/no-require-imports -- Standalone CommonJS CLI, not a bundled application module. */
// Read-only checks. Never downloads backup payloads, writes records or probes writes.
function avaliarLeituraPublica(resultado) {
    if ([401, 403].includes(resultado.status)) return "bloqueado";
    if (!resultado.error && resultado.status === 200 && Number.isInteger(resultado.count)) {
        return resultado.count === 0 ? "bloqueado" : "exposto";
    }
    return "inconclusivo";
}

async function main() {
    require("@next/env").loadEnvConfig(process.cwd(), true);
    const { createClient } = require("@supabase/supabase-js");
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serverKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !anonKey || !serverKey) throw new Error("Configure as variáveis locais do Supabase antes da verificação.");
    const options = { auth: { persistSession: false, autoRefreshToken: false } };
    const anon = createClient(url, anonKey, options);
    const admin = createClient(url, serverKey, options);
    let falhas = 0;

    for (const tabela of ["admin_backups", "encontros"]) {
        let consulta = anon.from(tabela).select("id", { head: true, count: "exact" });
        if (tabela === "encontros") consulta = consulta.eq("visibilidade", "interno");
        const resultado = await consulta;
        const acesso = avaliarLeituraPublica(resultado);
        console.log(JSON.stringify({ teste: tabela === "encontros" ? "encontros_internos_anonimos" : "backups_anonimos",
            acesso, status: resultado.status, registros_acessiveis: resultado.count }));
        if (acesso !== "bloqueado") falhas++;
    }

    // Inaccessible public data must remain available to the authenticated server.
    for (const tabela of ["grupos", "eventos", "encontros", "admin_backups"]) {
        const resultado = await admin.from(tabela).select("id", { head: true, count: "exact" });
        const disponivel = !resultado.error && resultado.status === 200 && Number.isInteger(resultado.count);
        console.log(JSON.stringify({ teste: `servidor_${tabela}`, disponivel, status: resultado.status,
            registros: resultado.count }));
        if (!disponivel) falhas++;
    }
    console.log("Somente leitura. Políticas e permissões de escrita exigem o diagnóstico SQL; não foram testadas com mutações.");
    process.exitCode = falhas ? 1 : 0;
}

module.exports = { avaliarLeituraPublica };
if (require.main === module) main().catch(() => {
    console.error("Não foi possível concluir a verificação de acesso. Nenhuma credencial será exibida.");
    process.exitCode = 1;
});
