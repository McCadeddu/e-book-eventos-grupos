const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

function carregarEnvLocal() {
    const caminho = path.join(process.cwd(), ".env.local");

    if (!fs.existsSync(caminho)) {
        return;
    }

    const linhas = fs.readFileSync(caminho, "utf-8").split(/\r?\n/);

    for (const linha of linhas) {
        const conteudo = linha.trim();

        if (!conteudo || conteudo.startsWith("#")) {
            continue;
        }

        const indice = conteudo.indexOf("=");

        if (indice === -1) {
            continue;
        }

        const chave = conteudo.slice(0, indice).trim();
        const valor = conteudo.slice(indice + 1).trim();

        if (!process.env[chave]) {
            process.env[chave] = valor;
        }
    }
}

carregarEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
    console.error(
        "Faltam as variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
    process.exit(1);
}

const supabase = createClient(url, anonKey);

async function contarTabela(tabela, filtro) {
    let query = supabase
        .from(tabela)
        .select("*", { count: "exact", head: true });

    if (typeof filtro === "function") {
        query = filtro(query);
    }

    const { count, error } = await query;

    if (error) {
        throw new Error(`${tabela}: ${error.message}`);
    }

    return count ?? 0;
}

async function main() {
    const grupos = await contarTabela("grupos");
    const eventos = await contarTabela("eventos");
    const encontros = await contarTabela(
        "encontros",
        (query) => query.not("data_inicio", "is", null)
    );
    const encontrosPublicosEvento = await contarTabela(
        "encontros",
        (query) =>
            query
                .not("data_inicio", "is", null)
                .eq("nivel", "evento")
                .eq("mostrar_no_anual", true)
    );

    console.log("Diagnóstico do conteúdo público:");
    console.log(`- grupos: ${grupos}`);
    console.log(`- eventos: ${eventos}`);
    console.log(`- encontros com data: ${encontros}`);
    console.log(
        `- encontros de evento visíveis no anual: ${encontrosPublicosEvento}`
    );

    if (grupos === 0) {
        throw new Error("Nenhum grupo encontrado. O e-book público ficará vazio.");
    }

    if (encontros === 0) {
        throw new Error(
            "Nenhum encontro com data foi encontrado. O calendário público ficará vazio."
        );
    }

    console.log("Conteúdo público mínimo validado com sucesso.");
}

main().catch((error) => {
    console.error("Falha na verificação do conteúdo público.");
    console.error(error.message);
    process.exit(1);
});
